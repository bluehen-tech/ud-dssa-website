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
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   └── layout/       # Layout components
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   └── data/             # Content data (easy to edit!)
│       ├── team.ts       # Team member information
│       ├── events.ts     # Event listings
│       ├── services.ts   # Service offerings
│       └── index.ts      # Data exports
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

### Benefits of This Approach
- ✅ **No CMS learning curve** - Just edit TypeScript files
- ✅ **Version controlled** - All changes tracked in Git
- ✅ **No external dependencies** - No need for Sanity accounts or API keys
- ✅ **Student-friendly** - Easy for new contributors to understand
- ✅ **Fast development** - No need to set up external services

## Vercel Deployment

To deploy this project to Vercel:

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI: `npm install -g vercel`
3. Run `vercel login` and follow the prompts
4. From the project root, run `vercel` to deploy
5. Deploy! No environment variables needed for this simplified setup.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request with clear description
4. Request review from at least one team member

## Contact

For questions or support, contact:
- UDSSA: dsi-info@udel.edu

## License

[MIT License](LICENSE)
