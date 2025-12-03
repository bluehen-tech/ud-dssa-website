// Template file for member portfolios
// Copy this file, rename it, and place it in the appropriate folder (officers/, members/, or alumni/)
// Then fill in your information below

import { MemberPortfolio } from '@/types/member';

export const OnaAkano: MemberPortfolio = {
  id: 'OnaAkano', // e.g., 'john-doe' - used in URL: /members/your-username
  role: 'member | student', // 'officer' | 'member' | 'alumni'
  position: undefined, // Only for officers: 'Technical Lead', 'President', etc.
  name: 'Ibukunoluwa Onaolapo Akano',
  email: 'ona@udel.edu',
  tagline: 'Aspiring Bioinformatician and Physician', // Optional - e.g., "Data Science Student | AI Builder"
  major: 'Bioinformatics Data Science', // Optional - e.g., "Applied Mathematics & Astrophysics"
  graduationDate: 'Expected date May 2026', // Optional - e.g., "May 2028" or "Graduating May 2028"
  bio: 'I am an aspiring physician currently obtaining a masters degree in bioinformatics data science to build skills in clinical informatics necessarry for utilizing databases and software to analyze, interpret and discover life-changing information from research to improve patient outcomes and the lives of individuals on a poulation level',
  profileImageUrl: '/images/members/your-image.jpg', // Optional - add image to public/images/members/
  links: {
    linkedin: 'http://www.linkedin.com/in/ibukunoakano', // Optional
    github: 'https://github.com/4onaolapoakano-design', // Optional
    website: 'https://yourwebsite.com', // Optional
    email: 'ona@udel.edu', // Optional
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
      degree: 'M.S. in Bioinformatics & Data Science', // e.g., "Ph.D. in Applied Mathematics & Astrophysics"
      institution: 'University of Delaware',
      startYear: 2024,
      endYear: 2026,
      location: 'Newark, Delaware', // Optional
      current: true, // Set to true if currently enrolled
      fieldOfStudy: 'Bioinformatics, Computational Biology, Systems Biology', // Optional - e.g., "Applied Mathematics & Astrophysics"
      gpa: 4.0, // Optional - e.g., 4.0
      honors: [
        // Optional - array of honors/awards
        'Consecutive 4.0 GPA',
        'NSF I-Corps Propelus Fellow - HemoGenX Project',
        'Best Graduating Student in the department of Natural and Environmental Sciences'
              ],
      relevantCoursework: [
        // Optional - array of relevant courses
        'Systems Biology - RNA-seq, Proteomics, Metagenomics',
        'Molecular Ecology - Genome Assembly, eDNA, Population Genomics',
        'Statistical Modeling in R - Logistic Regression, Survival Analysis,',
        'Programming for Data Science - Pandas, NumPy, Machine Learning Foundations',
        'Ethics in Biomedical Research & AI - Belmont, Menlo, Algorithmic Fairness',
        'High-Performance Computing - BioMix Cluster Workflows'
        'Data Science',
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
