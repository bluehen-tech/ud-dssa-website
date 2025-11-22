export interface Club {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'social' | 'professional' | 'research';
}

export const dataScienceClubs: Club[] = [
  {
    id: '1',
    name: 'Data Science Student Association @ UD (UD-DSSA)',
    description: 'Showcases our graduate talent, fosters cross-disciplinary learning, and builds a vibrant data science community through collaboration and industry partnerships',
    category: 'technical'
  },
  {
    id: '999',
    name: 'ADD YOUR CLUB',
    description: 'Email us at dsi-info@udel.edu to have your club added to the list.',
    category: 'professional'
  },
];
