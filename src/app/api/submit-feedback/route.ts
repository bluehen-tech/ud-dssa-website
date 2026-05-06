import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface FeedbackPayload {
  slug: string;
  userType: string;
  fullName: string;
  email?: string;
  rating: number;
  comments?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackPayload = await request.json();
    const { slug, userType, fullName, email, rating, comments } = body;

    if (!slug || !userType || !fullName || !rating) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields.' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { success: false, message: 'Rating must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title')
      .eq('slug', slug)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, message: 'Event not found.' },
        { status: 404 }
      );
    }

    const submissionData = {
      submission_type: 'event_feedback',
      event_id: event.id,
      event_feedback_rating: rating,
      user_type: userType,
      full_name: fullName,
      email: email || '',
      notes: comments || null,
      submitted_at: new Date().toISOString(),
      status: 'active' as const,
      major: null,
      selected_clubs: null,
      graduation_month: null,
      graduation_year: null,
      interested_in_officer: false,
      affiliation: null,
      job_title: null,
    };

    const { data, error } = await supabase
      .from('form_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to save feedback');
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      submissionId: data.id,
      eventTitle: event.title,
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
