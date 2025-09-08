# UD Data Science Student Association Website

> Home of the UD Data Science Student Association: amplifying student visibility, connecting industry partners, attracting donations, hosting transformative events, and showcasing our tech stack built with a modern Next.js architecture.

## Overview

The official platform for the University of Delaware Data Science Student Association (UDSSA). We showcase member profiles, facilitate donations, market our services, and organize meaningful workshops and networking events to build the next generation of data scientists and raise the profile of UD's data science community.

**Student-Friendly Design**: This project is intentionally built to be simple and accessible for student contributors. All content is managed through easy-to-edit TypeScript files, making it perfect for students rotating in and out of the project.

## Project Structure

```
ud-dssa-website/
├── public/               # Static assets
│   └── images/           # Image assets
├── src/                  # Source code
│   ├── app/              # Next.js App Router
│   │   ├── about/        # About page
│   │   ├── contact/      # Contact page
│   │   ├── api/          # API routes
│   │   │   ├── submit-form/    # Form submission endpoint
│   │   │   ├── unsubscribe/    # Unsubscribe endpoint
│   │   │   └── email-list/     # Email list retrieval
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page with contact form
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── ContactForm.tsx    # Main contact form
│   │   └── UnsubscribeForm.tsx # Unsubscribe form
│   ├── data/             # Content data (easy to edit!)
│   │   ├── team.ts       # Team member information
│   │   ├── events.ts     # Event listings
│   │   ├── services.ts   # Service offerings
│   │   ├── clubs.ts      # Data science clubs
│   │   ├── submissions.json # Form submissions (auto-generated)
│   │   └── index.ts      # Data exports
│   └── types/            # TypeScript type definitions
│       └── contact.ts    # Contact form types
├── .next/                # Next.js build output
├── node_modules/         # Dependencies
├── package.json          # Project configuration
├── package-lock.json     # Dependency lock file
├── next.config.js        # Next.js configuration
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vercel.json           # Vercel deployment configuration
└── .env.local            # Environment variables (not in git)
```

## Tech Stack

- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Content Management**: Static TypeScript files (student-friendly!)
- **Email List Management**: GitHub-integrated JSON system
- **Form Handling**: Built-in Next.js API routes
- **Deployment**: Vercel

## Getting Started

```bash
# Clone this repository
git clone https://github.com/your-org/ud-dssa-website.git

# Install dependencies
cd ud-dssa-website
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Content Management

This project uses a **student-friendly approach** to content management. All content is stored in simple TypeScript files that are easy to edit:

### Adding Team Members
Edit `src/data/team.ts` to add or update team member information.

### Managing Events
Edit `src/data/events.ts` to add upcoming events or archive past ones.

### Updating Services
Edit `src/data/services.ts` to modify service offerings and pricing.

### Managing Data Science Clubs
Edit `src/data/clubs.ts` to add or update available clubs for student selection.

### Benefits of This Approach
- ✅ **No CMS learning curve** - Just edit TypeScript files
- ✅ **Version controlled** - All changes tracked in Git
- ✅ **No external dependencies** - No need for external CMS or API keys
- ✅ **Student-friendly** - Easy for new contributors to understand
- ✅ **Fast development** - No need to set up external services

## Email List Management

The website includes a **self-maintaining email list system** that's perfect for student organizations:

### How It Works
- **Form submissions** automatically update `src/data/submissions.json`
- **Unsubscribe functionality** built-in with dedicated form
- **Email list API** provides clean data for email campaigns
- **Private repository** ensures only authorized students can access the data

### For Students with Repository Access
- View all form submissions in `src/data/submissions.json`
- See unsubscribe status for each email address
- Full audit trail in Git history
- No manual data entry required

### API Endpoints
- `GET /api/email-list` - Retrieve active email list (excludes unsubscribed)
- `POST /api/submit-form` - Handle contact form submissions
- `POST /api/unsubscribe` - Handle unsubscribe requests

### Contact Form Features
- **Dual user types**: UD Grad Students vs Industry/Academic Friends
- **Conditional fields**: Different questions based on user type
- **Club selection**: Students can select from available data science clubs
- **Real-time validation**: Immediate feedback on form errors
- **Success messaging**: Clear confirmation after submission

## Vercel Deployment

To deploy this project to Vercel:

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI: `npm install -g vercel`
3. Run `vercel login` and follow the prompts
4. From the project root, run `vercel` to deploy
5. **Important**: Make sure your repository is set to private for data security
6. Deploy! No environment variables needed for this simplified setup.

### Post-Deployment
- Test the contact form to ensure submissions are working
- Verify the email list API endpoint is accessible
- Set up the unsubscribe page at `/unsubscribe` (optional)

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test form submissions and email list functionality
4. Submit a pull request with clear description
5. Request review from at least one team member

### For New Student Contributors
- **No complex setup required** - just clone and run `npm install`
- **Content editing** - modify files in `src/data/` directory
- **Form testing** - use the contact form on the home page
- **Email list access** - view submissions in `src/data/submissions.json`

## Contact

For questions or support, contact:
- UDSSA: dsi-info@udel.edu

## License

[MIT License](LICENSE)
