import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ContactSyncResponse, ContactSourceMetadata } from '@/types/contact';

interface FormSubmission {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  major: string | null;
  selected_clubs: string[] | null;
  graduation_month: string | null;
  graduation_year: string | null;
  affiliation: string | null;
  job_title: string | null;
  notes: string | null;
  status: string;
  submitted_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  raw_user_meta_data: {
    full_name?: string;
  } | null;
  created_at: string;
}

interface ExistingContact {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  major: string | null;
  graduation_month: string | null;
  graduation_year: string | null;
  affiliation: string | null;
  job_title: string | null;
  clubs: string[] | null;
  is_officer: boolean;
  status: string;
  source: string | null;
  source_metadata: ContactSourceMetadata | null;
  notes: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse<ContactSyncResponse>> {
  try {
    const supabase = createClient();

    // Verify the user is authenticated and is an admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        synced: 0,
        created: 0,
        updated: 0,
        errors: ['Not authenticated']
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_flag')
      .eq('id', session.user.id)
      .single();

    if (!profile?.admin_flag) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required',
        synced: 0,
        created: 0,
        updated: 0,
        errors: ['Not authorized']
      }, { status: 403 });
    }

    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    // Step 1: Fetch all form submissions
    const { data: formSubmissions, error: formError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('status', 'active');

    if (formError) {
      errors.push(`Error fetching form submissions: ${formError.message}`);
    }

    // Step 2: Fetch all existing contacts for comparison
    const { data: existingContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*');

    if (contactsError) {
      errors.push(`Error fetching existing contacts: ${contactsError.message}`);
    }

    // Create a map of existing contacts by email for quick lookup
    const contactsByEmail = new Map<string, ExistingContact>();
    if (existingContacts) {
      for (const contact of existingContacts) {
        contactsByEmail.set(contact.email.toLowerCase(), contact);
      }
    }

    // Step 3: Process form submissions
    const processedEmails = new Set<string>();
    
    if (formSubmissions) {
      for (const submission of formSubmissions as FormSubmission[]) {
        const email = submission.email.toLowerCase();
        processedEmails.add(email);

        const existing = contactsByEmail.get(email);
        const now = new Date().toISOString();

        // Build source metadata
        const newSourceMetadata: ContactSourceMetadata = {
          form_submission_ids: existing?.source_metadata?.form_submission_ids 
            ? [...new Set([...existing.source_metadata.form_submission_ids, submission.id])]
            : [submission.id],
          auth_user_id: existing?.source_metadata?.auth_user_id,
          sources: existing?.source_metadata?.sources 
            ? [...new Set([...existing.source_metadata.sources, 'form_submission'])]
            : ['form_submission'],
          last_synced: now
        };

        // Merge clubs
        const mergedClubs = [
          ...new Set([
            ...(existing?.clubs || []),
            ...(submission.selected_clubs || [])
          ])
        ];

        if (existing) {
          // Update existing contact - merge data (prefer non-null incoming values)
          // Use email for the update since it's unique and we might not have a valid ID
          const { error: updateError } = await supabase
            .from('contacts')
            .update({
              full_name: submission.full_name || existing.full_name,
              user_type: submission.user_type || existing.user_type,
              major: submission.major || existing.major,
              graduation_month: submission.graduation_month || existing.graduation_month,
              graduation_year: submission.graduation_year || existing.graduation_year,
              affiliation: submission.affiliation || existing.affiliation,
              job_title: submission.job_title || existing.job_title,
              clubs: mergedClubs.length > 0 ? mergedClubs : null,
              notes: submission.notes || existing.notes,
              source_metadata: newSourceMetadata,
              updated_at: now
            })
            .eq('email', email);

          if (updateError) {
            errors.push(`Error updating contact ${email}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          // Insert new contact
          const { error: insertError } = await supabase
            .from('contacts')
            .insert({
              email: submission.email,
              full_name: submission.full_name,
              user_type: submission.user_type,
              major: submission.major,
              graduation_month: submission.graduation_month,
              graduation_year: submission.graduation_year,
              affiliation: submission.affiliation,
              job_title: submission.job_title,
              clubs: submission.selected_clubs,
              notes: submission.notes,
              status: 'subscribed',
              source: 'form_submission',
              source_metadata: newSourceMetadata,
              is_officer: false
            });

          if (insertError) {
            errors.push(`Error inserting contact ${email}: ${insertError.message}`);
          } else {
            created++;
            // Mark this email as existing so auth.users sync knows it was just created
            contactsByEmail.set(email, {
              id: 'newly-created', // Placeholder - we use email for updates anyway
              email: submission.email,
              full_name: submission.full_name,
              user_type: submission.user_type,
              major: submission.major,
              graduation_month: submission.graduation_month,
              graduation_year: submission.graduation_year,
              affiliation: submission.affiliation,
              job_title: submission.job_title,
              clubs: submission.selected_clubs,
              is_officer: false,
              status: 'subscribed',
              source: 'form_submission',
              source_metadata: newSourceMetadata,
              notes: submission.notes
            });
          }
        }
      }
    }

    // Step 4: Fetch auth.users via profiles table (since we can't directly query auth.users)
    // We'll use the profiles table which has a reference to auth.users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, admin_flag');

    if (profilesError) {
      errors.push(`Error fetching profiles: ${profilesError.message}`);
    }

    // Process auth users (from profiles)
    if (profiles) {
      for (const profile of profiles) {
        if (!profile.email) continue;
        
        const email = profile.email.toLowerCase();
        const existing = contactsByEmail.get(email);
        const now = new Date().toISOString();

        // Build source metadata
        const newSourceMetadata: ContactSourceMetadata = {
          form_submission_ids: existing?.source_metadata?.form_submission_ids,
          auth_user_id: profile.id,
          sources: existing?.source_metadata?.sources 
            ? [...new Set([...existing.source_metadata.sources, 'auth_user'])]
            : ['auth_user'],
          last_synced: now
        };

        if (existing) {
          // Update existing contact with auth user info
          const { error: updateError } = await supabase
            .from('contacts')
            .update({
              is_officer: profile.admin_flag || existing.is_officer,
              source_metadata: newSourceMetadata,
              updated_at: now
            })
            .eq('email', email);

          if (updateError) {
            errors.push(`Error updating contact from auth ${email}: ${updateError.message}`);
          } else if (!processedEmails.has(email)) {
            // Only count as updated if not already counted from form submissions
            updated++;
          }
        } else {
          // Insert new contact from auth user
          const { error: insertError } = await supabase
            .from('contacts')
            .insert({
              email: profile.email,
              is_officer: profile.admin_flag || false,
              status: 'subscribed',
              source: 'auth_user',
              source_metadata: newSourceMetadata
            });

          if (insertError) {
            errors.push(`Error inserting contact from auth ${email}: ${insertError.message}`);
          } else {
            created++;
          }
        }
      }
    }

    const synced = created + updated;

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0 
        ? `Successfully synced ${synced} contacts (${created} created, ${updated} updated)`
        : `Synced with ${errors.length} errors`,
      synced,
      created,
      updated,
      errors
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred during sync',
      synced: 0,
      created: 0,
      updated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 });
  }
}
