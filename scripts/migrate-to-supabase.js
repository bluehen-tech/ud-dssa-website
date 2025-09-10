// Migration script to move data from submissions.json to Supabase
// Run with: node scripts/migrate-to-supabase.js

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateData() {
  try {
    // Read existing submissions.json
    const submissionsPath = path.join(__dirname, '..', 'src', 'data', 'submissions.json');
    const submissionsData = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
    
    console.log(`Found ${submissionsData.submissions.length} submissions to migrate`);
    
    // Transform data for Supabase
    const transformedSubmissions = submissionsData.submissions.map(submission => ({
      // Don't include id - let Supabase generate new UUIDs
      user_type: submission.userType,
      email: submission.email,
      full_name: submission.fullName || null,
      major: submission.major || null,
      selected_clubs: submission.selectedClubs || null,
      graduation_month: submission.graduationMonth || null,
      graduation_year: submission.graduationYear || null,
      interested_in_officer: submission.interestedInOfficer || false,
      affiliation: submission.affiliation || null,
      job_title: submission.jobTitle || null,
      notes: submission.notes || null,
      submitted_at: submission.submittedAt,
      status: submission.status || 'active'
    }));
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('form_submissions')
      .insert(transformedSubmissions);
    
    if (error) {
      console.error('Error inserting data:', error);
      return;
    }
    
    console.log('Successfully migrated all submissions to Supabase!');
    console.log('You can now safely remove the GitHub issue creation from your API route.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateData();
