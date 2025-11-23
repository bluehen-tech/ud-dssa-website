"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Event } from '@/types/event';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function EventsPage() {
  const { session, isAdmin, isLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      alert('You must be logged in to add events');
      return;
    }

    try {
      setUploading(true);
      let flyerUrl = null;

      // Upload flyer to Supabase storage if file is selected
      if (selectedFile) {
        const fileExt = 'pdf';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `event-flyers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('events')
          .getPublicUrl(filePath);

        flyerUrl = urlData.publicUrl;
      }

      // Insert event into database
      const { error: insertError } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          event_date: new Date(formData.event_date).toISOString(),
          event_url: formData.event_url || null,
          flyer_url: flyerUrl,
          created_by: session.user.id,
        } as any);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_url: '',
      });
      setSelectedFile(null);
      setShowAddForm(false);
      
      // Refresh events list
      await fetchEvents();
      
      alert('Event added successfully!');
    } catch (error: any) {
      console.error('Error adding event:', error);
      alert(`Error adding event: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (eventId: string, flyerUrl?: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      // Delete flyer from storage if exists
      if (flyerUrl) {
        const filePath = flyerUrl.split('/').slice(-2).join('/');
        await supabase.storage
          .from('events')
          .remove([filePath]);
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
                  {isAdmin ? 'Admin' : 'Member'}
                </p>
              </div>
            )}
          </div>

          {/* Admin: Add Event Button */}
          {canManageEvents && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
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
            <h2 className="text-2xl font-bold text-blue-primary mb-4">Add New Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                  placeholder="e.g., DSSA Fall Kickoff Event"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                  placeholder="Describe the event..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.event_url}
                  onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                  placeholder="https://example.com/event-registration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Flyer (PDF, Optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  PDF files only, max 5MB
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Adding Event...' : 'Add Event'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      title: '',
                      description: '',
                      event_date: '',
                      event_url: '',
                    });
                    setSelectedFile(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
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

                  {/* Admin: Delete Button */}
                  {canManageEvents && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleDelete(event.id, event.flyer_url)}
                        className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
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

