import { NextRequest, NextResponse } from 'next/server';
import { ContactFormData } from '@/types/contact';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const formData: ContactFormData = await request.json();
    
    // Create Supabase client for server-side operation
    const supabase = createClient();
    
    // Prepare data for Supabase insertion
    const submissionData = {
      user_type: formData.userType,
      email: formData.email,
      full_name: (formData as any).fullName || null,
      major: (formData as any).major || null,
      selected_clubs: (formData as any).selectedClubs || null,
      graduation_month: (formData as any).graduationMonth || null,
      graduation_year: (formData as any).graduationYear || null,
      interested_in_officer: (formData as any).interestedInOfficer || false,
      affiliation: (formData as any).affiliation || null,
      job_title: (formData as any).jobTitle || null,
      notes: (formData as any).notes || null,
      submitted_at: new Date().toISOString(),
      status: 'active' as const
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('form_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to save form submission');
    }

    console.log('Form submission saved to Supabase:', data.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your interest! We\'ll be in touch soon.',
      submissionId: data.id
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}