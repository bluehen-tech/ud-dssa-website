"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/types/event';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import EventForm, {
  EMPTY_EVENT_FORM,
  generateSlug,
  toDateTimeLocal,
  type EventFormValues,
  type FlyerChange,
} from '@/components/EventForm';

const DRIP_STAGES = {
  "save-the-date": {
    label: "Save the Date",
    extras: "This is an early save-the-date announcement. Keep it brief and exciting -- just the title, date, and a teaser.",
  },
  "full-details": {
    label: "Full Details",
    extras: "This is the full event announcement with all details.",
  },
  "reminder": {
    label: "Reminder",
    extras: "This is a reminder email for an upcoming event. Create urgency -- the event is soon!",
  },
  "last-chance": {
    label: "Last Chance",
    extras: "This is a last-chance/day-of email. Strong urgency, FOMO, final call to attend.",
  },
} as const;

type DripStage = keyof typeof DRIP_STAGES;

function buildComposeUrl(event: Event, stage: DripStage): string {
  const dateFormatted = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const params = new URLSearchParams({
    mode: 'ai_draft',
    emailType: 'event',
    topic: event.title,
    details: `${event.description}\n\nDate/Time: ${dateFormatted}`,
    audience: 'DSSA members and UD students',
    stage,
    ...(event.event_url ? { cta: event.event_url } : {}),
  });

  return `/email?${params.toString()}`;
}

/** Storage path ("event-flyers/<file>.pdf") from a flyer's public URL. */
function flyerPathFromUrl(flyerUrl: string): string {
  return flyerUrl.split('/').slice(-2).join('/');
}

export default function EventsPage() {
  const { session, isAdmin, hasEmailAccess, isLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStages, setSelectedStages] = useState<Record<string, DripStage>>({});

  const supabase = createClient();

  // Fetch events from Supabase
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false }) as any;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Upload a flyer to Supabase storage and return its public URL
  const uploadFlyer = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
    const filePath = `event-flyers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('events')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const removeFlyer = async (flyerUrl: string) => {
    await supabase.storage.from('events').remove([flyerPathFromUrl(flyerUrl)]);
  };

  const describeError = (error: any): string =>
    error?.code === '23505'
      ? 'That feedback URL slug is already used by another event. Choose a different slug.'
      : error?.message || 'Unknown error';

  const handleCreate = async (values: EventFormValues, flyer: FlyerChange): Promise<boolean> => {
    if (!session?.user?.id) {
      alert('You must be logged in to add events');
      return false;
    }

    let flyerUrl: string | null = null;
    try {
      if (flyer.file) {
        flyerUrl = await uploadFlyer(flyer.file);
      }

      const { error: insertError } = await supabase
        .from('events')
        .insert({
          title: values.title,
          slug: values.slug || generateSlug(values.title),
          description: values.description,
          event_date: new Date(values.event_date).toISOString(),
          event_url: values.event_url || null,
          flyer_url: flyerUrl,
          created_by: session.user.id,
        } as any);

      if (insertError) throw insertError;

      setShowAddForm(false);
      await fetchEvents();
      alert('Event added successfully!');
      return true;
    } catch (error: any) {
      console.error('Error adding event:', error);
      if (flyerUrl) await removeFlyer(flyerUrl).catch(() => undefined);
      alert(`Error adding event: ${describeError(error)}`);
      return false;
    }
  };

  // Edits are enforced server-side by the "Admins can update events" RLS policy.
  const handleUpdate = async (event: Event, values: EventFormValues, flyer: FlyerChange): Promise<boolean> => {
    let uploadedUrl: string | null = null;
    try {
      if (flyer.file) {
        uploadedUrl = await uploadFlyer(flyer.file);
      }
      const nextFlyerUrl = uploadedUrl ?? (flyer.remove ? null : event.flyer_url ?? null);

      const { data, error } = await (supabase.from('events') as any)
        .update({
          title: values.title,
          slug: values.slug || generateSlug(values.title),
          description: values.description,
          event_date: new Date(values.event_date).toISOString(),
          event_url: values.event_url || null,
          flyer_url: nextFlyerUrl,
        } as any)
        .eq('id', event.id)
        .select('id') as any;

      if (error) throw error;
      // RLS hides rows the user may not update, so "no rows" means not permitted.
      if (!data || data.length === 0) {
        throw new Error('You do not have permission to edit this event (admin access required), or it no longer exists.');
      }

      // Only delete the old flyer once the event points at its replacement.
      if (event.flyer_url && nextFlyerUrl !== event.flyer_url) {
        await removeFlyer(event.flyer_url).catch(() => undefined);
      }

      setEditingId(null);
      await fetchEvents();
      alert('Event updated successfully!');
      return true;
    } catch (error: any) {
      console.error('Error updating event:', error);
      if (uploadedUrl) await removeFlyer(uploadedUrl).catch(() => undefined);
      alert(`Error updating event: ${describeError(error)}`);
      return false;
    }
  };

  const handleDelete = async (eventId: string, flyerUrl?: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      // Delete flyer from storage if exists
      if (flyerUrl) {
        await removeFlyer(flyerUrl);
      }

      // Delete event from database
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId) as any;

      if (error) throw error;

      // Refresh events list
      await fetchEvents();
      
      alert('Event deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      alert(`Error deleting event: ${error.message}`);
    }
  };

  // Show loading state
  if (isLoading || loadingEvents) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const userEmail = session?.user?.email;
  const canManageEvents = Boolean(session && isAdmin);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-blue-primary mb-2">
                Events
              </h1>
              <p className="text-xl text-gray-600">
                Upcoming events and activities for DSSA members.
              </p>
            </div>
            {session && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Signed in as:</strong> {userEmail}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {isAdmin ? 'Admin' : hasEmailAccess ? 'Email Manager' : 'Member'}
                </p>
              </div>
            )}
          </div>

          {/* Admin: Add Event Button */}
          {canManageEvents && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setEditingId(null);
                  setShowAddForm(!showAddForm);
                }}
                className="px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
              >
                {showAddForm ? 'Cancel' : '+ Add New Event'}
              </button>
            </div>
          )}
        </div>

        {/* Admin: Add Event Form */}
        {canManageEvents && showAddForm && (
          <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
            <EventForm
              heading="Add New Event"
              submitLabel="Add Event"
              busyLabel="Adding Event..."
              initialValues={EMPTY_EVENT_FORM}
              onSubmit={handleCreate}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 mb-4">No events scheduled at this time. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-primary"
              >
                {canManageEvents && editingId === event.id ? (
                  <EventForm
                    heading="Edit Event"
                    submitLabel="Save Changes"
                    busyLabel="Saving..."
                    initialValues={{
                      title: event.title,
                      slug: event.slug || '',
                      description: event.description,
                      event_date: toDateTimeLocal(event.event_date),
                      event_url: event.event_url || '',
                    }}
                    existingFlyerUrl={event.flyer_url}
                    originalSlug={event.slug || ''}
                    onSubmit={(values, flyer) => handleUpdate(event, values, flyer)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-blue-primary mb-2">
                      {event.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{formatDate(event.event_date)}</span>
                    </div>

                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {event.flyer_url && (
                        <a
                          href={event.flyer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          View Flyer (PDF)
                        </a>
                      )}
                      
                      {event.event_url && (
                        <a
                          href={event.event_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Event Link
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Admin Controls */}
                  {canManageEvents && (
                    <div className="flex flex-col gap-3 min-w-[180px]">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Email Campaign
                        </label>
                        <select
                          value={selectedStages[event.id] || "full-details"}
                          onChange={(e) =>
                            setSelectedStages((prev) => ({
                              ...prev,
                              [event.id]: e.target.value as DripStage,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-primary focus:border-blue-primary"
                        >
                          {(Object.keys(DRIP_STAGES) as DripStage[]).map((key) => (
                            <option key={key} value={key}>
                              {DRIP_STAGES[key].label}
                            </option>
                          ))}
                        </select>
                        <Link
                          href={buildComposeUrl(
                            event,
                            selectedStages[event.id] || "full-details"
                          )}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-primary text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Compose Email
                        </Link>
                      </div>
                      {event.slug && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Feedback Form
                          </label>
                          <Link
                            href={`/feedback/${event.slug}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Feedback Link
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              const url = `${window.location.origin}/feedback/${event.slug}`;
                              navigator.clipboard.writeText(url);
                              alert(`Copied: ${url}`);
                            }}
                            className="text-xs text-gray-500 hover:text-blue-primary underline"
                          >
                            Copy URL
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingId(event.id);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-primary text-sm font-medium rounded-md hover:bg-blue-100 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id, event.flyer_url)}
                        className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="px-4 py-2 text-blue-primary hover:text-blue-800 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

