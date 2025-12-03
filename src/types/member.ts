export type MemberRole = 'officer' | 'member' | 'alumni';

export interface Project {
  title: string;
  description: string;
  technologies?: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
}

export interface Experience {
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  responsibilities?: string[]; // Key Responsibilities
  achievements?: string[]; // Key Achievements
  description?: string[]; // General description (fallback if responsibilities/achievements not used)
}

export interface Education {
  degree: string;
  institution: string;
  startYear: number;
  endYear: number;
  location?: string;
  current?: boolean;
  fieldOfStudy?: string; // e.g., "Applied Mathematics & Astrophysics"
  gpa?: number; // e.g., 4.0
  honors?: string[]; // e.g., ["Summa Cum Laude", "Outstanding Dissertation Award"]
  relevantCoursework?: string[]; // Array of course names
}

export interface MemberPortfolio {
  id: string;
  role: MemberRole;
  position?: string; // For officers: "Technical Lead", "President", etc.
  name: string;
  email: string;
  bio: string;
  tagline?: string; // Short description/tagline (e.g., "Applied Mathematics & Astrophysics")
  major?: string; // Field of study/major (e.g., "Applied Mathematics & Astrophysics")
  graduationDate?: string; // Formatted graduation date (e.g., "May 2028", "Graduating May 2028")
  profileImageUrl?: string;
  skills: {
    category?: string; // Optional category (if not provided, skills are flat list)
    items: string[];
  }[];
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  links?: {
    linkedin?: string;
    github?: string;
    website?: string;
    email?: string;
  };
  achievements?: {
    title: string;
    description?: string;
    date?: string;
    organization?: string; // e.g., "Cosmic Research Foundation"
    link?: string; // URL to learn more
  }[];
  interests?: string[]; // Array of interests
  graduationYear?: number; // For alumni (deprecated, use graduationDate instead)
}

