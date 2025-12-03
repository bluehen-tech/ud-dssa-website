// Template file for member portfolios
// Copy this file, rename it, and place it in the appropriate folder (officers/, members/, or alumni/)
// Then fill in your information below

import { MemberPortfolio } from '@/types/member';

export const yourName: MemberPortfolio = {
  id: 'your-username', // e.g., 'john-doe' - used in URL: /members/your-username
  role: 'member', // 'officer' | 'member' | 'alumni'
  position: undefined, // Only for officers: 'Technical Lead', 'President', etc.
  name: 'Your Full Name',
  email: 'your.email@udel.edu',
  tagline: 'Your short tagline or title', // Optional - e.g., "Data Science Student | AI Builder"
  major: 'Your Major or Field of Study', // Optional - e.g., "Applied Mathematics & Astrophysics"
  graduationDate: 'Graduating May 2028', // Optional - e.g., "May 2028" or "Graduating May 2028"
  bio: 'Write a brief bio about yourself, your interests, and what you\'re working on. This will appear in the "About" section of your portfolio.',
  profileImageUrl: '/images/members/your-image.jpg', // Optional - add image to public/images/members/
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
      startDate: 'Jan 2024', // e.g., "2010" or "Jan 2024"
      endDate: 'Dec 2024', // Omit if current, or use "Present"
      current: false, // Set to true if this is your current position
      location: 'City, State', // Optional
      responsibilities: [
        // Key Responsibilities (optional - use this OR description)
        'Responsibility 1',
        'Responsibility 2',
        'Responsibility 3',
      ],
      achievements: [
        // Key Achievements (optional)
        'Achievement 1',
        'Achievement 2',
      ],
      // OR use description for general text:
      // description: [
      //   'General description point 1',
      //   'General description point 2',
      // ],
    },
  ],
  education: [
    // Optional - add your education
    {
      degree: 'Degree Name', // e.g., "Ph.D. in Applied Mathematics & Astrophysics"
      institution: 'University Name',
      startYear: 2020,
      endYear: 2024,
      location: 'City, State', // Optional
      current: false, // Set to true if currently enrolled
      fieldOfStudy: 'Your Field of Study', // Optional - e.g., "Applied Mathematics & Astrophysics"
      gpa: 4.0, // Optional - e.g., 4.0
      honors: [
        // Optional - array of honors/awards
        'Summa Cum Laude',
        'Outstanding Dissertation Award',
      ],
      relevantCoursework: [
        // Optional - array of relevant courses
        'Advanced Quantum Mechanics',
        'Data Science',
        'Machine Learning',
      ],
    },
  ],
  projects: [
    // Optional - showcase your projects
    {
      title: 'Project Name',
      description: 'Brief description of what the project does and what you built. This should explain the project\'s purpose and your contributions.',
      technologies: ['Technology 1', 'Technology 2', 'Technology 3'], // Optional - array of technologies used
      githubUrl: 'https://github.com/yourusername/project', // Optional
      liveUrl: 'https://yourproject.com', // Optional
      imageUrl: '/images/members/projects/project-image.jpg', // Optional
    },
  ],
  skills: [
    // Skills can be categorized OR flat list
    // Option 1: Categorized skills
    {
      category: 'Programming Languages',
      items: ['Python', 'JavaScript', 'SQL'],
    },
    {
      category: 'Frameworks/Tools',
      items: ['React', 'Next.js', 'Docker'],
    },
    // Option 2: Flat list (no category)
    {
      items: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
    },
  ],
  achievements: [
    // Optional - highlight your achievements
    {
      title: 'Achievement Title', // e.g., "Infinity Gauntlet Research Award"
      description: 'Brief description of the achievement', // Optional
      date: '2018', // Optional - e.g., "2018" or "May 2018"
      organization: 'Organization Name', // Optional - e.g., "Cosmic Research Foundation"
      link: 'https://example.com/award', // Optional - URL to learn more
    },
  ],
  interests: [
    // Optional - array of interests
    'Data Science',
    'Machine Learning',
    'Open Source',
    'Research',
  ],
};
