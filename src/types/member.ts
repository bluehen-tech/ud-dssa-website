export type MemberRole = 'officer' | 'member' | 'alumni';

/** Status of a member portfolio in the approval workflow */
export type PortfolioStatus = 'draft' | 'pending' | 'published' | 'rejected';

/** DB row shape for member_portfolios (snake_case) */
export interface MemberPortfolioRow {
  id: string;
  user_id: string;
  role: MemberRole;
  position: string | null;
  name: string;
  email: string | null;
  tagline: string | null;
  major: string | null;
  graduation_date: string | null;
  bio: string | null;
  profile_image_url: string | null;
  links: Record<string, unknown> | null;
  skills: { category?: string; items: string[] }[] | null;
  experience: Experience[] | null;
  education: Education[] | null;
  projects: Project[] | null;
  achievements: MemberPortfolio['achievements'] | null;
  interests: string[] | null;
  tech_stack: Record<string, unknown> | null;
  career_interests: Record<string, unknown> | null;
  portfolio_highlights: string[] | null;
  contact_prefs: Record<string, unknown> | null;
  resume_filename: string | null;
  resume_path: string | null;
  resume_updated_at: string | null;
  resume_mime: string | null;
  resume_size: number | null;
  resume_public: boolean | null;
  status: PortfolioStatus;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

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
  resumeUrl?: string;
  resumeFileName?: string;
  resumeUploadedAt?: string;
  skills: {
    category?: string; // Optional category (if not provided, skills are flat list)
    items: string[];
  }[];
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  leadershipActivities?: string[];
  coursework?: string[];
  toolsStack?: {
    languages?: string[];
    mlData?: string[];
    biAnalytics?: string[];
    cloudDevOps?: string[];
  };
  careerInterests?: {
    roles?: string[];
    domains?: string[];
    locations?: string[];
    employmentTypes?: string[];
  };
  availability?: {
    startTerm?: string;
    internshipSeason?: string;
    timezone?: string;
  };
  portfolioHighlights?: string[];
  contactPreferences?: {
    preferredMethod?: string;
    allowPublicEmail?: boolean;
    allowPublicResume?: boolean;
  };
  linkHealth?: {
    linkedin?: boolean;
    github?: boolean;
    website?: boolean;
  };
  adminReviewNotes?: string;
  links?: {
    linkedin?: string;
    github?: string;
    website?: string;
    email?: string;
  };
  achievements?: {
    title: string;
    type?: 'achievement' | 'certification';
    description?: string;
    date?: string;
    organization?: string; // e.g., "Cosmic Research Foundation"
    link?: string; // URL to learn more
  }[];
  interests?: string[]; // Array of interests
  graduationYear?: number; // For alumni (deprecated, use graduationDate instead)
}

