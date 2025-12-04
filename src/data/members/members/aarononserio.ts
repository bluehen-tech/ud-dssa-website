// Template file for member portfolios
// Copy this file, rename it, and place it in the appropriate folder (officers/, members/, or alumni/)
// Then fill in your information below

import { MemberPortfolio } from '@/types/member';

export const aaron: MemberPortfolio = {
  id: 'Aaron-Onserio', // e.g., 'john-doe' - used in URL: /members/your-username
  role: 'member', // 'officer' | 'member' | 'alumni'
  position: undefined, // Only for officers: 'Technical Lead', 'President', etc.
  name: 'Aaron Onserio',
  email: 'onserioa@udel.edu',
  tagline: 'Bioinformatic, Machine Learning, Data Science and Analytics', // Optional - e.g., "Data Science Student | AI Builder"
  major: 'Bioinformatician  & Data Analyst', // Optional - e.g., "Applied Mathematics & Astrophysics"
  graduationDate: 'Graduating December 2025', // Optional - e.g., "May 2028" or "Graduating May 2028"
  bio: 'I am a Bioinformatics and Data Science graduate student at the University of Delaware, focusing on machine learning, multi-omics analysis, and deep learning for biomedical imaging. I work on projects involving U-Net–based myotube segmentation, RNA-seq differential expression analysis, drug–target interaction prediction models, and clinical data workflows. I enjoy building scalable pipelines, developing full-stack analysis tools, and applying AI to solve real-world biological and healthcare problems.',
  profileImageUrl: '/Users/mac/Desktop/Fall_2025/ud-dssa-website/src/data/members/members/image.JPG', // Optional - add image to public/images/members/
  links: {
    linkedin: 'https://www.linkedin.com/in/aaron-onserio-6a505aa4/', // Optional
    github: 'https://github.com/AaronOnserio', // Optional
    website: 'https://yourwebsite.com', // Optional
    email: 'onserioa@udel.edu', // Optional
  },
  experience: [
    // Optional - add your work experience
    {
      title: 'Graduate Researcher – Bioinformatics & Computational Biology',
      organization: 'University of Delaware',
      startDate: 'Feb 2024', // e.g., "2010" or "Jan 2024"
      endDate: 'Dec 2025', // Omit if current, or use "Present"
      current: true, // Set to true if this is your current position
      location: 'Newark, Delaware', // Optional
      responsibilities: [
        // Key Responsibilities (optional - use this OR description)
        'Develop U-Net models for automated myotube and nuclei segmentation',
        'Analyze RNA-seq, single-cell, and multi-omics datasets using R and Python',
        'Build reproducible ML pipelines for biological and clinical datasets',
      ],
      achievements: [
        // Key Achievements (optional)
        'Won Best Science Communication Award for KPMP Biomarker Pipeline',
        'Deployed automated myotube quantification web app for lab use',
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
      degree: 'M.S. in Bioinformatics & Computational Biology', // e.g., "Ph.D. in Applied Mathematics & Astrophysics"
      institution: 'University of Delaware',
      startYear: 2024,
      endYear: 2025,
      location: 'Newark, Delaware', // Optional
      current: true, // Set to true if currently enrolled
      fieldOfStudy: 'Bioinformatics, Machine Learning, Data Analysis', // Optional - e.g., "Applied Mathematics & Astrophysics"
      gpa: 3.9, // Optional - e.g., 4.0
      honors: [
        // Optional - array of honors/awards
        'KPMP Best Science Communication Award',
        'Outstanding Dissertation Award',
      ],
      relevantCoursework: [
        // Optional - array of relevant courses
        'Applied Machine Learning',
        'Data Science',
        'Machine Learning',
        'Bioinformatics',
        'Systems Biology',
        'Big Data Analytics in Healthcare',
      ],
    },
  ],
  projects: [
    // Optional - showcase your projects
    {
      title: 'RNA-seq Differential Expression Pipeline',
      description: 'Performed QC, trimming, alignment (STAR), feature counting, and DESeq2-based differential expression for multi-tissue comparison, including GO/KEGG enrichment analysis and STRING network exploration.',
      technologies: ['R', 'DESeq2', 'STAR', 'FastQC'], // Optional - array of technologies used
      githubUrl: 'https://github.com/AaronOnserio', // Optional
      liveUrl: 'https://yourproject.com', // Optional
      imageUrl: '/Users/mac/Desktop/Fall_2025/ud-dssa-website/src/data/members/members/image.JPG', // Optional
    },
  ],
  skills: [
    // Skills can be categorized OR flat list
    // Option 1: Categorized skills
    {
      category: 'Programming Languages',
      items: ['Python', 'R', 'SQL', 'Bash'],
    },
    {
      category: 'Machine Learning/Tools',
      items: ['PyTorch', 'scikit-learn', 'TensorFlow', 'Next.js', 'Docker', 'Git'],
    },
    // Option 2: Flat list (no category)
    {
      items: ['Bioinformatics', 'Python', 'Deep/Machine Learning', 'Data Analysis', 'SQL', 'Data Visualization'],
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
    'AI in Healthcare',
    'Bioinformatics',
    'Data Science',
    'Machine Learning',
    'Open Source',
    'Research',
  ],
};
