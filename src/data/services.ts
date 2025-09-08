export interface Service {
  id: string;
  title: string;
  description: string;
  category: 'data-analysis' | 'visualization' | 'machine-learning' | 'consulting' | 'training';
  priceRange: 'free' | 'low-cost' | 'competitive' | 'contact-us';
  duration: string;
  deliverables: string[];
  requirements: string[];
  contactEmail: string;
  featured: boolean;
}

export const services: Service[] = [
  {
    id: '1',
    title: 'Data Analysis & Insights',
    description: 'Comprehensive data analysis using modern tools and statistical methods to extract meaningful insights from your data.',
    category: 'data-analysis',
    priceRange: 'competitive',
    duration: '2-4 weeks',
    deliverables: [
      'Data cleaning and preprocessing report',
      'Statistical analysis results',
      'Visualization dashboard',
      'Actionable recommendations'
    ],
    requirements: [
      'Clean dataset in CSV/Excel format',
      'Clear business objectives',
      'Access to relevant stakeholders'
    ],
    contactEmail: 'dsi-info@udel.edu',
    featured: true
  },
  {
    id: '2',
    title: 'Data Visualization & Dashboards',
    description: 'Create interactive dashboards and compelling visualizations to communicate your data story effectively.',
    category: 'visualization',
    priceRange: 'competitive',
    duration: '1-3 weeks',
    deliverables: [
      'Interactive dashboard (Tableau/Power BI)',
      'Custom visualizations',
      'Data storytelling presentation',
      'User training materials'
    ],
    requirements: [
      'Processed data ready for visualization',
      'Brand guidelines and design preferences',
      'Target audience definition'
    ],
    contactEmail: 'dsi-info@udel.edu',
    featured: true
  },
  {
    id: '3',
    title: 'Machine Learning Solutions',
    description: 'Develop predictive models and machine learning solutions tailored to your specific business needs.',
    category: 'machine-learning',
    priceRange: 'contact-us',
    duration: '4-8 weeks',
    deliverables: [
      'Trained ML model with documentation',
      'Model performance evaluation',
      'Implementation guide',
      'Ongoing support plan'
    ],
    requirements: [
      'Large, labeled dataset',
      'Clear prediction objectives',
      'Technical infrastructure access'
    ],
    contactEmail: 'dsi-info@udel.edu',
    featured: false
  },
  {
    id: '4',
    title: 'Data Science Training Workshops',
    description: 'Custom training workshops for your team on data science tools, techniques, and best practices.',
    category: 'training',
    priceRange: 'low-cost',
    duration: '1-2 days',
    deliverables: [
      'Customized curriculum',
      'Hands-on exercises and materials',
      'Certificate of completion',
      'Follow-up support resources'
    ],
    requirements: [
      'Team size and skill level assessment',
      'Specific learning objectives',
      'Training venue and equipment'
    ],
    contactEmail: 'dsi-info@udel.edu',
    featured: false
  }
];
