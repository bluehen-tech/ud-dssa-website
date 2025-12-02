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
  description: string[];
  location?: string;
}

export interface Education {
  degree: string;
  institution: string;
  startYear: number;
  endYear: number;
  location?: string;
  current?: boolean;
}

export interface MemberPortfolio {
  id: string;
  role: MemberRole;
  position?: string; // For officers: "Technical Lead", "President", etc.
  name: string;
  email: string;
  bio: string;
  tagline?: string; // Short description/tagline
  profileImageUrl?: string;
  skills: {
    category: string;
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
  }[];
  graduationYear?: number; // For alumni
}

