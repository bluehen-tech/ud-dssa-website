'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { Event } from '@/types/event';
import EventFeedbackForm from '@/components/EventFeedbackForm';

export default function FeedbackPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setEvent(data as Event);
      }
      setLoading(false);
    }

    if (slug) fetchEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Event Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find a feedback form for this event. It may have
            been removed or the link may be incorrect.
          </p>
          <Link
            href="/events"
            className="inline-block px-6 py-3 bg-blue-primary text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
          >
            View All Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 bg-gradient-to-b from-gray-50 to-white">
      <EventFeedbackForm event={event} />
    </div>
  );
}
