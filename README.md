# BlueHen.tech

> Home of the UD Data Science Student Association: amplifying student visibility, connecting industry partners, attracting donations, hosting transformative events, and showcasing our tech stack built with a modern composable/headless architecture.

## Overview

The official platform for the University of Delaware Data Science Student Association (UDSSA) and DSI Fellows. We showcase member profiles, facilitate donations, market our services, and organize meaningful workshops and networking events to build the next generation of data scientists.

## Purpose

- **Member Portfolios**: Showcase student skills and projects
- **Donation Management**: Support our activities through easy donation options
- **Service Marketing**: Highlight data science services offered by our members and organization
- **Event Broadcasting**: Promote workshops and networking events

## Tech Stack

### Web Platform
- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Content Management**: Sanity.io
- **Version Control**: GitHub
- **Deployment**: Vercel
- **Payment Processing**: Stripe
- **Authentication**: NextAuth.js
- **Email Marketing**: MailerLite
- **Forms**: React Hook Form

### Data Science Methods
- **Next-Gen AI**: Teaching computers to understand text, images, and speech together like humans do
- **Advanced Data Visualization**: Creating interactive and insightful visualizations that reveal hidden patterns in complex data
- **Smart Prediction**: Building systems that can make accurate forecasts with minimal data or exceptionally large datasets
- **Cause-and-Effect Analysis**: Using AI to understand what truly drives outcomes, not just correlations
- **Automated Discovery**: Teaching algorithms to find patterns humans might miss in massive datasets
- **Computer Vision+**: Training models to not just see objects but understand context and relationships
- **AI That Explains Itself**: Creating transparent models that can justify their recommendations

## Contributing to bluehen.tech Development

### Getting Started

```bash
# Clone this repository
git clone https://github.com/udssa/bluehen.tech.git

# Install dependencies
cd bluehen.tech
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the development server
npm run dev
```

### Content Management

Content is managed through Sanity Studio:

```bash
# Navigate to Sanity directory
cd sanity

# Run Sanity Studio locally
npm run dev
```

## Maintenance Guidelines

- **Code Structure**: Feature-based organization with clear separation of concerns
- **Versioning**: Semantic versioning for releases
- **Documentation**: Maintain inline code documentation and update wiki for major changes
- **Onboarding**: Each semester, senior members train incoming developers
- **Handoff**: Annual review and knowledge transfer process

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
