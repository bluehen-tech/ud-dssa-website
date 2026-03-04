import type { MemberPortfolio, MemberPortfolioRow } from '@/types/member';

const RESUME_BUCKET = 'member-resumes';

function getResumePublicUrl(path: string | null | undefined) {
  if (!path) return undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return undefined;
  return `${baseUrl}/storage/v1/object/public/${RESUME_BUCKET}/${path}`;
}

/**
 * Map a DB row (snake_case) to the frontend MemberPortfolio shape (camelCase).
 * Used for directory cards and detail views.
 */
export function dbRowToMemberPortfolio(row: MemberPortfolioRow): MemberPortfolio {
  const careerInterests = (row.career_interests as (MemberPortfolio['careerInterests'] & {
    availability?: MemberPortfolio['availability'];
    leadershipActivities?: string[];
    coursework?: string[];
  })) ?? undefined;

  const contactPrefs = (row.contact_prefs as MemberPortfolio['contactPreferences']) ?? undefined;

  return {
    id: row.id,
    role: row.role,
    position: row.position ?? undefined,
    name: row.name,
    email: row.email ?? '',
    tagline: row.tagline ?? undefined,
    major: row.major ?? undefined,
    graduationDate: row.graduation_date ?? undefined,
    bio: row.bio ?? '',
    profileImageUrl: row.profile_image_url ?? undefined,
    resumeUrl: getResumePublicUrl(row.resume_path),
    resumeFileName: row.resume_filename ?? undefined,
    resumeUploadedAt: row.resume_updated_at ?? undefined,
    skills: row.skills ?? [],
    experience: row.experience ?? undefined,
    education: row.education ?? undefined,
    projects: row.projects ?? undefined,
    leadershipActivities: careerInterests?.leadershipActivities ?? undefined,
    coursework: careerInterests?.coursework ?? undefined,
    toolsStack: (row.tech_stack as MemberPortfolio['toolsStack']) ?? undefined,
    careerInterests: careerInterests ?? undefined,
    availability: careerInterests?.availability ?? undefined,
    portfolioHighlights: row.portfolio_highlights ?? undefined,
    contactPreferences: {
      ...(contactPrefs ?? {}),
      allowPublicResume: row.resume_public ?? contactPrefs?.allowPublicResume ?? true,
    },
    links: (row.links as MemberPortfolio['links']) ?? undefined,
    achievements: row.achievements ?? undefined,
    interests: row.interests,
  };
}

/**
 * Allowed content fields for owner PATCH (no status, approved_at, approved_by, submitted_at, rejection_reason).
 */
const CONTENT_FIELDS = [
  'role',
  'position',
  'name',
  'tagline',
  'major',
  'graduation_date',
  'bio',
  'profile_image_url',
  'links',
  'skills',
  'experience',
  'education',
  'projects',
  'achievements',
  'interests',
  'tech_stack',
  'career_interests',
  'portfolio_highlights',
  'contact_prefs',
  'resume_public',
  'resume_filename',
  'resume_path',
  'resume_updated_at',
  'resume_mime',
  'resume_size',
] as const;

/**
 * Build a partial DB update object from a request body, including only content fields.
 * Used for PATCH /api/member-portfolios/me to enforce "content only" at the API layer.
 */
export function bodyToPortfolioUpdate(body: Record<string, unknown>): Partial<MemberPortfolioRow> {
  const update: Record<string, unknown> = {};
  for (const key of CONTENT_FIELDS) {
    if (body[key] !== undefined) {
      update[key] = body[key];
    }
  }
  return update as Partial<MemberPortfolioRow>;
}
