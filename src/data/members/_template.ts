// Template file for member portfolios
// Copy this file, rename it, and place it in the appropriate folder (officers/, members/, or alumni/)
// Then fill in your information below

import { MemberPortfolio } from '@/types/member';

export const yourName: MemberPortfolio = {
  id: 'your-username', // e.g., 'john-doe'
  role: 'member', // 'officer' | 'member' | 'alumni'
  position: undefined, // Only for officers: 'Technical Lead', 'President', etc.
  name: 'Your Full Name',
  email: 'your.email@udel.edu',
  tagline: 'Your short tagline or title', // Optional
  bio: 'Write a brief bio about yourself, your interests, and what you\'re working on...',
  profileImageUrl: '/images/members/your-image.jpg', // Optional - add image to src/images/members/
  links: {
    linkedin: 'https://www.linkedin.com/in/yourprofile/', // Optional
    github: 'https://github.com/yourusername', // Optional
    website: 'https://yourwebsite.com', // Optional
    email: 'your.email@udel.edu', // Optional
  },
  experience: [
    // Optional - add your work experience
    {
      title: 'Job Title',
      organization: 'Company Name',
      startDate: 'Jan 2024',
      endDate: 'Dec 2024', // Omit if current
      current: false, // Set to true if this is your current position
      location: 'City, State',
      description: [
        'Responsibility or achievement 1',
        'Responsibility or achievement 2',
      ],
    },
  ],
  education: [
    // Optional - add your education
    {
      degree: 'Degree Name',
      institution: 'University Name',
      startYear: 2020,
      endYear: 2024,
      location: 'City, State',
      current: false, // Set to true if currently enrolled
    },
  ],
  projects: [
    // Optional - showcase your projects
    {
      title: 'Project Name',
      description: 'Brief description of what the project does and what you built',
      technologies: ['Technology 1', 'Technology 2'],
      githubUrl: 'https://github.com/yourusername/project', // Optional
      liveUrl: 'https://yourproject.com', // Optional
      imageUrl: '/images/members/projects/project-image.jpg', // Optional
    },
  ],
  skills: [
    {
      category: 'Category Name',
      items: ['Skill 1', 'Skill 2', 'Skill 3'],
    },
  ],
  achievements: [
    // Optional - highlight your achievements
    {
      title: 'Achievement Title',
      description: 'Brief description',
      date: 'Month Year',
    },
  ],
};
