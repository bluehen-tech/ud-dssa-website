import { Opportunity } from '@/types/opportunity';

export const sampleOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Data Science Intern',
    organization: 'Tech Company Inc.',
    type: 'internship',
    description: 'Summer internship opportunity for data science students. Work on real-world projects using machine learning and data analytics.',
    requirements: [
      'Currently enrolled in data science or related program',
      'Experience with Python and SQL',
      'Strong analytical skills'
    ],
    location: 'Remote / Hybrid',
    remote: true,
    applicationUrl: 'https://example.com/apply',
    contactEmail: 'careers@techcompany.com',
    postedDate: '2024-01-15',
    deadline: '2024-03-01',
    tags: ['Python', 'Machine Learning', 'SQL', 'Remote']
  },
  {
    id: '2',
    title: 'Research Assistant - Data Visualization',
    organization: 'UD Research Lab',
    type: 'research',
    description: 'Part-time research assistant position focusing on data visualization techniques for scientific publications.',
    requirements: [
      'Graduate student preferred',
      'Experience with data visualization tools (D3.js, Tableau, etc.)',
      'Strong attention to detail'
    ],
    location: 'Newark, DE',
    remote: false,
    contactEmail: 'research@udel.edu',
    postedDate: '2024-01-20',
    tags: ['Research', 'Data Visualization', 'D3.js']
  },
  {
    id: '3',
    title: 'Open Source Project Contributor',
    organization: 'Data Science Community',
    type: 'project',
    description: 'Contribute to open-source data science tools and libraries. Great for building your portfolio and gaining experience.',
    requirements: [
      'Interest in open-source development',
      'Basic programming skills',
      'Willingness to learn and collaborate'
    ],
    location: 'Remote',
    remote: true,
    applicationUrl: 'https://github.com/datascience/project',
    postedDate: '2024-01-10',
    tags: ['Open Source', 'GitHub', 'Collaboration']
  },
  {
    id: '4',
    title: 'Data Analyst Position',
    organization: 'Analytics Firm',
    type: 'job',
    description: 'Full-time data analyst position for recent graduates. Analyze business metrics and create actionable insights.',
    requirements: [
      'Bachelor\'s degree in data science, statistics, or related field',
      '2+ years experience with data analysis',
      'Proficiency in R or Python',
      'Strong communication skills'
    ],
    location: 'Wilmington, DE',
    remote: false,
    applicationUrl: 'https://example.com/jobs/analyst',
    postedDate: '2024-01-18',
    deadline: '2024-02-15',
    tags: ['Full-time', 'R', 'Python', 'Business Analytics']
  }
];

