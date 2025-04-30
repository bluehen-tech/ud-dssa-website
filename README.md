# UD Data Science Student Association Website

> Home of the UD Data Science Student Association: amplifying student visibility, connecting industry partners, attracting donations, hosting transformative events, and showcasing our tech stack built with a modern Next.js architecture.

## Overview

The official platform for the University of Delaware Data Science Student Association (UDSSA). We showcase member profiles, facilitate donations, market our services, and organize meaningful workshops and networking events to build the next generation of data scientists and raise the profile of UD's data science community.

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
│   └── lib/              # Utility functions
│       └── sanity/       # Sanity.io integration
│           ├── client.ts
│           ├── queries.ts
│           ├── sanity.utils.ts
│           └── types.ts
├── sanity-studio/        # Sanity Studio (CMS)
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
- **Content Management**: Sanity.io
- **Deployment**: Vercel

## Getting Started

```bash
# Clone this repository
git clone https://github.com/your-org/ud-dssa-website.git

# Install dependencies
cd ud-dssa-website
npm install

# Set up environment variables
# Create a .env.local file with your Sanity credentials
cp .env.example .env.local
# Edit .env.local with your Sanity project ID and dataset

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Sanity.io Setup

This project uses Sanity.io as a headless CMS. To set up Sanity:

1. Create a Sanity account at [sanity.io](https://www.sanity.io/)
2. Create a new project in Sanity
3. Get your project ID from the Sanity dashboard
4. Add your project ID to the `.env.local` file:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2023-05-03
```

5. Run the Sanity Studio locally:

```bash
cd sanity-studio
npm install
npm run dev
```

6. Access the Sanity Studio at [http://localhost:3333](http://localhost:3333)
7. Create content in Sanity Studio that matches the schemas defined in the project

## Vercel Deployment

To deploy this project to Vercel:

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI: `npm install -g vercel`
3. Run `vercel login` and follow the prompts
4. From the project root, run `vercel` to deploy
5. Set up environment variables in the Vercel dashboard:
   - NEXT_PUBLIC_SANITY_PROJECT_ID
   - NEXT_PUBLIC_SANITY_DATASET
   - NEXT_PUBLIC_SANITY_API_VERSION

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
