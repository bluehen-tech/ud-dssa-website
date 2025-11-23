# Data Science Student Association @ UD Website

> Home of the Data Science Student Association @ UD: amplifying student visibility, connecting industry partners, attracting donations, hosting transformative events, and showcasing our tech stack built with a modern Next.js architecture.

## Overview

The official platform for the Data Science Student Association @ UD (UD-DSSA). We showcase member profiles, facilitate donations, market our services, and organize meaningful workshops and networking events to build the next generation of data scientists and raise the profile of UD's data science community.

**Student-Friendly Design**: This project is intentionally built to be simple and accessible for student contributors. All content is managed through easy-to-edit TypeScript files, making it perfect for students rotating in and out of the project.

## Project Structure

```
ud-dssa-website/
├── public/               # Static assets
│   └── images/           # Image assets
├── src/                  # Source code
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   │   ├── submit-form/    # Form submission endpoint
│   │   │   ├── unsubscribe/    # Unsubscribe endpoint
│   │   │   └── email-list/     # Email list retrieval
│   │   ├── auth/         # Authentication routes
│   │   │   └── callback/ # Auth callback route (server-side)
│   │   ├── login/        # Login page
│   │   ├── opportunities/ # Opportunities page (public with prompt)
│   │   ├── officers/     # Officers page (protected)
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout with AuthProvider
│   │   └── page.tsx      # Home page with contact form
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   │   ├── Header.tsx    # Header with auth state
│   │   │   └── Footer.tsx
│   │   ├── ContactForm.tsx    # Main contact form
│   │   └── UnsubscribeForm.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx    # Centralized auth state
│   ├── data/             # Content data (easy to edit!)
│   │   ├── clubs.ts      # Data science clubs
│   │   ├── opportunities.ts   # Opportunities listings
│   │   └── submissions.json   # Legacy form submissions
│   ├── lib/              # Utility libraries
│   │   ├── supabase-browser.ts  # Browser Supabase client
│   │   └── session-utils.ts     # Session validation
│   └── types/            # TypeScript type definitions
│       ├── contact.ts    # Contact form types
│       └── opportunity.ts # Opportunity types
├── docs/                 # Documentation
│   ├── AUTH_IMPLEMENTATION_SUMMARY.md
│   ├── TROUBLESHOOTING_AUTH.md
│   └── SUPABASE_SETUP.md
├── supabase/             # Supabase SQL scripts
│   ├── MUST_RUN_THIS.sql
│   └── fix_profiles_rls.sql
├── scripts/              # Utility scripts
│   └── migrate-to-supabase.js
├── middleware.ts         # Next.js middleware for route protection
├── .next/                # Next.js build output
├── node_modules/         # Dependencies
├── package.json          # Project configuration
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── .env.local            # Environment variables (not in git)
```

## Tech Stack

- **Framework**: Next.js 14 with TypeScript and App Router
- **Styling**: Tailwind CSS
- **Content Management**: Static TypeScript files (student-friendly!)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Magic Links
- **Form Handling**: Built-in Next.js API routes with Supabase integration
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Environment variables configured (see below)

### Setup

```bash
# Clone this repository
git clone https://github.com/your-org/ud-dssa-website.git

# Install dependencies
cd ud-dssa-website
npm install

# Create environment variables file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Get these from: Supabase Dashboard → Settings → API

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Supabase Setup

Before using authentication features, you need to configure Supabase:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL scripts in `supabase/MUST_RUN_THIS.sql` to set up the profiles table and RLS policies
3. Configure redirect URLs in Supabase Dashboard → Authentication → URL Configuration:
   - Add `http://localhost:3000/login` for development
   - Add your production URLs when deploying
4. Update `.env.local` with your Supabase URL and anon key

See `docs/SUPABASE_SETUP.md` for detailed instructions.

## Content Management

This project uses a **student-friendly approach** to content management. Content is stored in simple TypeScript files that are easy to edit:

### Managing Data Science Clubs
Edit `src/data/clubs.ts` to add or update available clubs for student selection in the contact form.

### Benefits of This Approach
- ✅ **No CMS learning curve** - Just edit TypeScript files
- ✅ **Version controlled** - All changes tracked in Git
- ✅ **Student-friendly** - Easy for new contributors to understand
- ✅ **Fast development** - Minimal setup required

## Form Submission Management

The website uses **Supabase** for reliable form submission storage and management:

### How It Works
- **Form submissions** are stored in Supabase PostgreSQL database
- **Real-time data** - no waiting for GitHub Actions or file updates
- **Unsubscribe functionality** built-in with dedicated form
- **Email list API** provides clean data for email campaigns
- **Secure access** through Supabase dashboard

### For Students with Supabase Access
- View all form submissions in the Supabase dashboard
- See submission status and user types
- Full audit trail with timestamps
- No manual data entry required

### API Endpoints
- `GET /api/email-list` - Retrieve active email list (excludes unsubscribed)
- `POST /api/submit-form` - Handle contact form submissions (saves to Supabase)
- `POST /api/unsubscribe` - Handle unsubscribe requests

### Contact Form Features
- **Dual user types**: UD Grad Students vs Industry/Academic Friends
- **Conditional fields**: Different questions based on user type
- **Club selection**: Students can select from available data science clubs
- **Real-time validation**: Immediate feedback on form errors
- **Success messaging**: Clear confirmation after submission

## Deployment

### Vercel Deployment

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. **Configure environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
4. Deploy the project
5. **Update Supabase redirect URLs**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your production URLs:
     - `https://your-app.vercel.app/login`
     - `https://bluehen-dssa.org/login` (if using custom domain)

### Post-Deployment Checklist
- ✅ Test authentication with @udel.edu email
- ✅ Verify magic link email delivery
- ✅ Test sign out functionality
- ✅ Verify protected routes redirect to login
- ✅ Test contact form submissions
- ✅ Check that admin status displays correctly

### Environment Variables

Required in `.env.local` (development) and Vercel (production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Settings → API

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test form submissions and email list functionality
4. Submit a pull request with clear description
5. Request review from at least one team member

### For New Student Contributors
- **No complex setup required** - just clone, run `npm install`, and configure `.env.local`
- **Content editing** - modify files in `src/data/` directory
- **Form testing** - use the contact form on the home page
- **Submission access** - view submissions in Supabase dashboard
- **Authentication testing** - use @udel.edu email for sign-in testing
- **Documentation** - comprehensive guides in `/docs` folder

### Authentication Features
- **Magic Link Sign-In**: Users sign in with their @udel.edu email
- **Admin Roles**: Designated users have admin privileges
- **Protected Routes**: `/officers` requires authentication
- **Session Management**: 4-hour session duration with auto-refresh
- **Domain Validation**: Only @udel.edu emails are allowed

#### Magic Link Email Delivery
Magic link emails are sent via an SMTP server using the **bluehen-dssa.org** domain name through the **RESEND** email service. RESEND provides a free tier with up to **100 emails per day**, which is sufficient for our authentication needs. This ensures reliable email delivery and professional branding for all authentication emails.

See `docs/AUTH_IMPLEMENTATION_SUMMARY.md` for technical details.

## Contact

For questions or support, contact:
- UD-DSSA: dsi-info@udel.edu

## License

[MIT License](LICENSE)
