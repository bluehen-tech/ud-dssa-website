export interface Club {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'social' | 'professional' | 'research';
}

export const dataScienceClubs: Club[] = [
  {
    id: '1',
    name: 'UD Data Science Student Association (UDSSA)',
    description: 'Showcases our graduate talent, fosters cross-disciplinary learning, and builds a vibrant data science community through collaboration and industry partnerships',
    category: 'technical'
  },
  {
    id: '2',
    name: 'Bioinformatics Student Association (BISA)',
    description: 'Bringing together students studying or interested in the field of bioinformatics',
    category: 'technical'
  },
  {
    id: '3',
    name: 'Business Analytics & Information Management Club (BAIM)',
    description: 'BAIM GSA connects students who are interested in business analytics and its application in business.',
    category: 'technical'
  },
  {
    id: '4',
    name: 'MBA Student Association (MBASA)',
    description: 'Enhance the educational, social and professional development of MBA students within the Alfred Lerner College of Business and Economics',
    category: 'professional'
  },
  {
    id: '5',
    name: 'YOUR CLUB - Email dsi-info@udel.edu',
    description: 'Email us to have your club added to the list.',
    category: 'professional'
  },
];
