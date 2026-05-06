#!/usr/bin/env node

/**
 * Supabase Configuration Validator
 * 
 * Run this script to check if your Supabase configuration is correct.
 * Usage: node scripts/validate-supabase-config.js
 */

require('dotenv').config({ path: '.env.local' });

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const EXPECTED_PORT = '3001';
const EXPECTED_REDIRECT_URLS = [
  `http://localhost:${EXPECTED_PORT}/login`,
  `http://localhost:${EXPECTED_PORT}/auth/callback`,
  `http://localhost:${EXPECTED_PORT}/auth/confirm`,
];

console.log('🔍 Validating Supabase Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
let allEnvVarsPresent = true;
for (const envVar of REQUIRED_ENV_VARS) {
  const value = process.env[envVar];
  if (value) {
    if (envVar === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      console.log(`  ✅ ${envVar}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ✅ ${envVar}: ${value}`);
    }
  } else {
    console.log(`  ❌ ${envVar}: MISSING`);
    allEnvVarsPresent = false;
  }
}
console.log('');

if (!allEnvVarsPresent) {
  console.log('❌ Some environment variables are missing!');
  console.log('   Please check your .env.local file.\n');
  process.exit(1);
}

// Extract project ref from URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let projectRef = 'unknown';
try {
  const url = new URL(supabaseUrl);
  projectRef = url.hostname.split('.')[0];
} catch (e) {
  console.log('❌ Invalid SUPABASE_URL format\n');
  process.exit(1);
}

console.log(`🎯 Supabase Project: ${projectRef}`);
console.log(`   Dashboard: https://supabase.com/dashboard/project/${projectRef}\n`);

// Check required files
console.log('📁 Required Files:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/lib/supabase-browser.ts',
  'src/lib/supabase-server.ts',
  'src/lib/supabase-middleware.ts',
  'src/app/auth/confirm/route.ts',
  'src/app/login/page.tsx',
];

let allFilesPresent = true;
for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesPresent = false;
  }
}
console.log('');

if (!allFilesPresent) {
  console.log('❌ Some required files are missing!\n');
  process.exit(1);
}

// Check browser client configuration
console.log('🔧 Checking Client Configuration:');
const browserClientPath = path.join(process.cwd(), 'src/lib/supabase-browser.ts');
const browserClientContent = fs.readFileSync(browserClientPath, 'utf8');

if (browserClientContent.includes('createBrowserClient')) {
  console.log('  ✅ Using createBrowserClient (@supabase/ssr)');
} else {
  console.log('  ❌ Not using createBrowserClient - check implementation');
}

if (browserClientContent.includes("flowType: 'pkce'")) {
  console.log('  ✅ PKCE flow enabled');
} else {
  console.log('  ⚠️  PKCE flow not explicitly set (might use default)');
}
console.log('');

// Instructions for dashboard configuration
console.log('⚙️  Supabase Dashboard Configuration:');
console.log('\n  1. Go to: https://supabase.com/dashboard/project/' + projectRef);
console.log('  2. Navigate to: Authentication → URL Configuration');
console.log('  3. Set Site URL to: http://localhost:' + EXPECTED_PORT);
console.log('  4. Add these Redirect URLs:');
for (const url of EXPECTED_REDIRECT_URLS) {
  console.log(`     • ${url}`);
}
console.log('\n  5. Navigate to: Authentication → Email Templates');
console.log('  6. Update "Magic Link" template to use PKCE flow:');
console.log('     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a>');
console.log('\n  7. Save all changes and wait 1-2 minutes for propagation');
console.log('');

// Final checklist
console.log('✅ Configuration Checklist:');
console.log('   [ ] Environment variables are set');
console.log('   [ ] All required files are present');
console.log('   [ ] Supabase dashboard configured (see above)');
console.log('   [ ] Email template updated for PKCE flow');
console.log('   [ ] Waited 1-2 minutes after saving changes');
console.log('   [ ] Dev server restarted (npm run dev)');
console.log('');

console.log('🚀 If all items are checked, try signing in at:');
console.log(`   http://localhost:${EXPECTED_PORT}/login`);
console.log('');

console.log('🐛 If you still get a 500 error:');
console.log('   1. Check Supabase Dashboard → Logs → Auth Logs');
console.log('   2. Verify redirect URLs are saved correctly');
console.log('   3. Check browser console for detailed error');
console.log('   4. Make sure you haven\'t hit rate limit (3 emails/hour)');
console.log('');

console.log('✨ Configuration validation complete!');






