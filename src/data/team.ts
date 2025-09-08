export interface TeamMember {
  id: string;
  name: string;
  role: string;
  year: string;
  major: string;
  bio: string;
  skills: string[];
  linkedin?: string;
  github?: string;
  email?: string;
  image?: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'President',
    year: 'Senior',
    major: 'Computer Science',
    bio: 'Passionate about machine learning and data visualization. Leading UDSSA to new heights.',
    skills: ['Python', 'R', 'Machine Learning', 'Data Visualization'],
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    email: 'johndoe@udel.edu'
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'Vice President',
    year: 'Junior',
    major: 'Data Science',
    bio: 'Specializing in statistical analysis and big data processing. Always eager to learn new technologies.',
    skills: ['Statistics', 'SQL', 'Tableau', 'Big Data'],
    linkedin: 'https://linkedin.com/in/janesmith',
    github: 'https://github.com/janesmith',
    email: 'janesmith@udel.edu'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    role: 'Treasurer',
    year: 'Senior',
    major: 'Mathematics',
    bio: 'Focusing on mathematical modeling and optimization. Enjoys mentoring new members.',
    skills: ['Mathematical Modeling', 'Optimization', 'Python', 'MATLAB'],
    linkedin: 'https://linkedin.com/in/mikejohnson',
    email: 'mikejohnson@udel.edu'
  }
];
