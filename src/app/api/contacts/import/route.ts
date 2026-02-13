import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ContactImportResponse, ContactSourceMetadata } from '@/types/contact';

// Simple CSV parser that handles basic CSV format
function parseCSV(csvText: string): string[] {
  const lines = csvText.split(/\r?\n/);
  const emails: string[] = [];
  
  // Skip header row if it looks like a header
  const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle quoted values and commas
    const parts = line.split(',');
    for (const part of parts) {
      const cleaned = part.trim().replace(/^["']|["']$/g, '').trim();
      // Basic email validation
      if (cleaned && cleaned.includes('@') && cleaned.includes('.')) {
        emails.push(cleaned.toLowerCase());
      }
    }
  }
  
  return [...new Set(emails)]; // Remove duplicates
}

export async function POST(request: NextRequest): Promise<NextResponse<ContactImportResponse>> {
  try {
    const supabase = createClient();

    // Verify the user is authenticated and is an admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        imported: 0,
        skipped: 0,
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
        imported: 0,
        skipped: 0,
        errors: ['Not authorized']
      }, { status: 403 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided',
        imported: 0,
        skipped: 0,
        errors: ['No CSV file uploaded']
      }, { status: 400 });
    }

    // Read and parse the CSV file
    const csvText = await file.text();
    const emails = parseCSV(csvText);

    if (emails.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid emails found in the CSV file',
        imported: 0,
        skipped: 0,
        errors: ['CSV file contains no valid email addresses']
      }, { status: 400 });
    }

    // Fetch existing contacts to check for duplicates
    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('email')
      .in('email', emails);

    if (fetchError) {
      return NextResponse.json({
        success: false,
        message: 'Error checking existing contacts',
        imported: 0,
        skipped: 0,
        errors: [fetchError.message]
      }, { status: 500 });
    }

    const existingEmails = new Set(
      (existingContacts || []).map(c => c.email.toLowerCase())
    );

    // Filter out existing emails
    const newEmails = emails.filter(email => !existingEmails.has(email));
    const skipped = emails.length - newEmails.length;
    const errors: string[] = [];
    let imported = 0;

    // Insert new contacts
    if (newEmails.length > 0) {
      const now = new Date().toISOString();
      const sourceMetadata: ContactSourceMetadata = {
        csv_import_date: now,
        sources: ['csv_import'],
        last_synced: now
      };

      const contactsToInsert = newEmails.map(email => ({
        email,
        status: 'subscribed' as const,
        source: 'csv_import' as const,
        source_metadata: sourceMetadata
      }));

      // Insert in batches of 100 to avoid hitting limits
      const batchSize = 100;
      for (let i = 0; i < contactsToInsert.length; i += batchSize) {
        const batch = contactsToInsert.slice(i, i + batchSize);
        const { error: insertError, data: insertedData } = await supabase
          .from('contacts')
          .insert(batch)
          .select('id');

        if (insertError) {
          errors.push(`Error inserting batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
        } else {
          imported += insertedData?.length || 0;
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? `Successfully imported ${imported} contacts (${skipped} skipped as duplicates)`
        : `Imported with ${errors.length} errors`,
      imported,
      skipped,
      errors
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred during import',
      imported: 0,
      skipped: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 });
  }
}
