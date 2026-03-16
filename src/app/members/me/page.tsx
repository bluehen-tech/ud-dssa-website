'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase-browser';
import type { MemberPortfolio, MemberRole, PortfolioStatus } from '@/types/member';

const PROFILE_PHOTO_BUCKET = 'member-portfolio-photos';
const RESUME_BUCKET = 'member-resumes';
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const ROLES: MemberRole[] = ['officer', 'member', 'alumni'];
const URL_FIELDS = ['linkedin', 'github', 'website'] as const;
const DRAFT_STORAGE_KEY_PREFIX = 'member_portfolio_draft_';

interface ExperienceForm {
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  location: string;
  responsibilities: string;
  achievements: string;
}

interface ProjectForm {
  title: string;
  description: string;
  technologies: string;
  githubUrl: string;
  liveUrl: string;
}

interface EducationForm {
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  fieldOfStudy: string;
  location: string;
  gpa: string;
  honors: string;
}

interface AchievementForm {
  title: string;
  type: 'achievement' | 'certification';
  organization: string;
  date: string;
  description: string;
  link: string;
}

interface PortfolioResponse {
  success: boolean;
  message?: string;
  portfolio: {
    id: string;
    user_id: string;
    status: PortfolioStatus;
    rejection_reason: string | null;
    submitted_at: string | null;
    resume_path?: string | null;
    resume_filename?: string | null;
    resume_updated_at?: string | null;
    resume_mime?: string | null;
    resume_size?: number | null;
    resume_public?: boolean | null;
    display?: MemberPortfolio;
    [key: string]: unknown;
  } | null;
}

interface FormState {
  name: string;
  role: MemberRole;
  position: string;
  tagline: string;
  major: string;
  graduation_date: string;
  bio: string;
  profile_image_url: string;
  linkedin: string;
  github: string;
  website: string;
  skills: string;
  education: EducationForm[];
  experience: ExperienceForm[];
  projects: ProjectForm[];
  achievements: AchievementForm[];
  leadership_activities: string;
  coursework: string;
  tools_languages: string;
  tools_ml_data: string;
  tools_bi_analytics: string;
  tools_cloud_devops: string;
  career_roles: string;
  career_domains: string;
  career_locations: string;
  career_employment_types: string;
  availability_start_term: string;
  availability_internship_season: string;
  availability_timezone: string;
  portfolio_highlights: string;
  contact_preferred_method: string;
  contact_allow_public_email: boolean;
  contact_allow_public_resume: boolean;
  resume_path: string;
  resume_filename: string;
  resume_updated_at: string;
  resume_mime: string;
  resume_size: string;
}

const blankExperience = (): ExperienceForm => ({
  title: '',
  organization: '',
  startDate: '',
  endDate: '',
  location: '',
  responsibilities: '',
  achievements: '',
});

const blankProject = (): ProjectForm => ({
  title: '',
  description: '',
  technologies: '',
  githubUrl: '',
  liveUrl: '',
});

const blankEducation = (): EducationForm => ({
  degree: '',
  institution: '',
  startYear: '',
  endYear: '',
  fieldOfStudy: '',
  location: '',
  gpa: '',
  honors: '',
});

const blankAchievement = (): AchievementForm => ({
  title: '',
  type: 'achievement',
  organization: '',
  date: '',
  description: '',
  link: '',
});

const initialFormState: FormState = {
  name: '',
  role: 'member',
  position: '',
  tagline: '',
  major: '',
  graduation_date: '',
  bio: '',
  profile_image_url: '',
  linkedin: '',
  github: '',
  website: '',
  skills: '',
  education: [blankEducation()],
  experience: [blankExperience()],
  projects: [blankProject()],
  achievements: [blankAchievement()],
  leadership_activities: '',
  coursework: '',
  tools_languages: '',
  tools_ml_data: '',
  tools_bi_analytics: '',
  tools_cloud_devops: '',
  career_roles: '',
  career_domains: '',
  career_locations: '',
  career_employment_types: '',
  availability_start_term: '',
  availability_internship_season: '',
  availability_timezone: '',
  portfolio_highlights: '',
  contact_preferred_method: '',
  contact_allow_public_email: false,
  contact_allow_public_resume: true,
  resume_path: '',
  resume_filename: '',
  resume_updated_at: '',
  resume_mime: '',
  resume_size: '',
};

function buildPreviewPortfolio(formData: FormState, existingId: string | null, userEmail?: string): MemberPortfolio {
  const experience = formData.experience
    .map((item) => ({
      title: item.title.trim(),
      organization: item.organization.trim(),
      startDate: item.startDate.trim(),
      endDate: item.endDate.trim() || undefined,
      location: item.location.trim() || undefined,
      responsibilities: splitLines(item.responsibilities),
      achievements: splitLines(item.achievements),
    }))
    .filter((item) => item.title && item.organization);

  const education = formData.education
    .map((item) => ({
      degree: item.degree.trim(),
      institution: item.institution.trim(),
      startYear: item.startYear ? Number(item.startYear) : 0,
      endYear: item.endYear ? Number(item.endYear) : 0,
      fieldOfStudy: item.fieldOfStudy.trim() || undefined,
      location: item.location.trim() || undefined,
      gpa: item.gpa ? Number(item.gpa) : undefined,
      honors: splitLines(item.honors),
    }))
    .filter((item) => item.degree && item.institution && item.startYear && item.endYear);

  const projects = formData.projects
    .map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
      technologies: splitLines(item.technologies),
      githubUrl: item.githubUrl.trim() || undefined,
      liveUrl: item.liveUrl.trim() || undefined,
    }))
    .filter((item) => item.title && item.description);

  const achievements = formData.achievements
    .map((item) => ({
      title: item.title.trim(),
      type: item.type,
      organization: item.organization.trim() || undefined,
      date: item.date.trim() || undefined,
      description: item.description.trim() || undefined,
      link: item.link.trim() || undefined,
    }))
    .filter((item) => item.title);

  return {
    id: existingId || 'preview',
    role: formData.role,
    position: formData.position.trim() || undefined,
    name: formData.name.trim() || 'Untitled',
    email: userEmail || '',
    bio: formData.bio.trim(),
    tagline: formData.tagline.trim() || undefined,
    major: formData.major.trim() || undefined,
    graduationDate: formData.graduation_date.trim() || undefined,
    profileImageUrl: formData.profile_image_url.trim() || undefined,
    resumeUrl: formData.resume_path ? getResumePublicUrlFromPath(formData.resume_path) : undefined,
    resumeFileName: formData.resume_filename || undefined,
    resumeUploadedAt: formData.resume_updated_at || undefined,
    skills: splitLines(formData.skills).length ? [{ items: splitLines(formData.skills) }] : [],
    experience,
    education,
    projects,
    leadershipActivities: splitLines(formData.leadership_activities),
    coursework: splitLines(formData.coursework),
    toolsStack: {
      languages: splitLines(formData.tools_languages),
      mlData: splitLines(formData.tools_ml_data),
      biAnalytics: splitLines(formData.tools_bi_analytics),
      cloudDevOps: splitLines(formData.tools_cloud_devops),
    },
    careerInterests: {
      roles: splitLines(formData.career_roles),
      domains: splitLines(formData.career_domains),
      locations: splitLines(formData.career_locations),
      employmentTypes: splitLines(formData.career_employment_types),
    },
    availability: {
      startTerm: formData.availability_start_term.trim() || undefined,
      internshipSeason: formData.availability_internship_season.trim() || undefined,
      timezone: formData.availability_timezone.trim() || undefined,
    },
    portfolioHighlights: splitLines(formData.portfolio_highlights),
    contactPreferences: {
      preferredMethod: formData.contact_preferred_method.trim() || undefined,
      allowPublicEmail: formData.contact_allow_public_email,
      allowPublicResume: formData.contact_allow_public_resume,
    },
    links: {
      linkedin: formData.linkedin.trim() || undefined,
      github: formData.github.trim() || undefined,
      website: formData.website.trim() || undefined,
      email: formData.contact_allow_public_email ? userEmail || undefined : undefined,
    },
    achievements,
    interests: [],
  };
}

function PreviewCard({ portfolio }: { portfolio: MemberPortfolio }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <div className="flex flex-col items-center text-center mb-6">
        {portfolio.profileImageUrl ? (
          <img src={portfolio.profileImageUrl} alt={portfolio.name} className="w-28 h-28 rounded-full object-cover mb-4" />
        ) : (
          <div className="w-28 h-28 rounded-full bg-blue-100 text-blue-primary font-bold text-4xl flex items-center justify-center mb-4">
            {portfolio.name?.charAt(0)?.toUpperCase() || 'M'}
          </div>
        )}
        <h2 className="text-3xl font-bold text-blue-primary">{portfolio.name}</h2>
        {portfolio.position && <p className="text-lg text-gray-700 mt-1">{portfolio.position}</p>}
        {portfolio.tagline && <p className="text-gray-600 mt-2">{portfolio.tagline}</p>}
      </div>

      {portfolio.bio && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{portfolio.bio}</p>
        </section>
      )}

      {portfolio.skills && portfolio.skills.length > 0 && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {portfolio.skills.flatMap((group, i) =>
              (group.items || []).map((skill, j) => (
                <span key={`${i}-${j}`} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                  {skill}
                </span>
              ))
            )}
          </div>
        </section>
      )}

      {portfolio.projects && portfolio.projects.length > 0 && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Projects</h3>
          <div className="space-y-3">
            {portfolio.projects.map((project, index) => (
              <div key={`${project.title}-${index}`} className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900">{project.title}</p>
                <p className="text-sm text-gray-700 mt-1">{project.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {portfolio.links && (portfolio.links.linkedin || portfolio.links.github || portfolio.links.website) && (
        <section className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect</h3>
          <div className="flex flex-wrap gap-4">
            {portfolio.links.linkedin && <span className="text-blue-600">LinkedIn</span>}
            {portfolio.links.github && <span className="text-gray-800">GitHub</span>}
            {portfolio.links.website && <span className="text-blue-600">Website</span>}
          </div>
        </section>
      )}
    </div>
  );
}

function splitLines(input: string) {
  return input
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function getDraftKey(userId: string) {
  return `${DRAFT_STORAGE_KEY_PREFIX}${userId}`;
}

function getResumePublicUrlFromPath(path: string | null | undefined) {
  if (!path) return '#';
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return '#';
  return `${baseUrl}/storage/v1/object/public/${RESUME_BUCKET}/${path}`;
}

function loadLocalDraft(userId: string): FormState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getDraftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { formData?: FormState };
    return parsed?.formData ?? null;
  } catch {
    return null;
  }
}

function saveLocalDraft(userId: string, formData: FormState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getDraftKey(userId),
      JSON.stringify({ formData, updatedAt: new Date().toISOString() })
    );
  } catch {
    // ignore local storage failures
  }
}

function clearLocalDraft(userId: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getDraftKey(userId));
  } catch {
    // ignore local storage failures
  }
}

export default function MyPortfolioPage() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioResponse['portfolio']>(null);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadPhotoError, setUploadPhotoError] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadResumeError, setUploadResumeError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const userId = session?.user?.id;
  const status = portfolio?.status;
  const canEdit = !portfolio || status === 'draft' || status === 'rejected' || status === 'published';
  const isPublished = status === 'published';

  const previewPortfolio = useMemo(
    () => buildPreviewPortfolio(formData, portfolio?.id ?? null, session?.user?.email),
    [formData, portfolio?.id, session?.user?.email]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace('/login?redirect=/members/me');
      return;
    }
    fetchMyPortfolio();
  }, [session, authLoading, router]);

  useEffect(() => {
    if (!userId || !canEdit) return;
    saveLocalDraft(userId, formData);
  }, [formData, userId, canEdit]);

  const fetchMyPortfolio = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors({});
    try {
      const res = await fetch('/api/member-portfolios/me');
      const data: PortfolioResponse = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setPortfolio(data.portfolio);

      if (!data.portfolio) {
        const localDraft = userId ? loadLocalDraft(userId) : null;
        setFormData(localDraft ?? initialFormState);
        return;
      }

      const display = data.portfolio.display || ({} as MemberPortfolio);
      const experience = Array.isArray(display.experience) && display.experience.length > 0
        ? display.experience.map((item) => ({
            title: item.title || '',
            organization: item.organization || '',
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            location: item.location || '',
            responsibilities: (item.responsibilities || []).join('\n'),
            achievements: (item.achievements || []).join('\n'),
          }))
        : [blankExperience()];

      const education = Array.isArray(display.education) && display.education.length > 0
        ? display.education.map((item) => ({
            degree: item.degree || '',
            institution: item.institution || '',
            startYear: item.startYear ? String(item.startYear) : '',
            endYear: item.endYear ? String(item.endYear) : '',
            fieldOfStudy: item.fieldOfStudy || '',
            location: item.location || '',
            gpa: item.gpa !== undefined && item.gpa !== null ? String(item.gpa) : '',
            honors: (item.honors || []).join('\n'),
          }))
        : [blankEducation()];

      const projects = Array.isArray(display.projects) && display.projects.length > 0
        ? display.projects.map((item) => ({
            title: item.title || '',
            description: item.description || '',
            technologies: (item.technologies || []).join(', '),
            githubUrl: item.githubUrl || '',
            liveUrl: item.liveUrl || '',
          }))
        : [blankProject()];

      const achievements = Array.isArray(display.achievements) && display.achievements.length > 0
        ? display.achievements.map((item) => ({
            title: item.title || '',
            type: (item.type === 'certification' ? 'certification' : 'achievement') as AchievementForm['type'],
            organization: item.organization || '',
            date: item.date || '',
            description: item.description || '',
            link: item.link || '',
          }))
        : [blankAchievement()];

      const skillsText = Array.isArray(display.skills)
        ? display.skills.flatMap((group) => group.items || []).join(', ')
        : '';

      const serverFormData: FormState = {
        name: display.name || '',
        role: display.role || 'member',
        position: display.position || '',
        tagline: display.tagline || '',
        major: display.major || '',
        graduation_date: display.graduationDate || '',
        bio: display.bio || '',
        profile_image_url: display.profileImageUrl || '',
        linkedin: display.links?.linkedin || '',
        github: display.links?.github || '',
        website: display.links?.website || '',
        skills: skillsText,
        education,
        experience,
        projects,
        achievements,
        leadership_activities: (display.leadershipActivities || []).join('\n'),
        coursework: (display.coursework || []).join('\n'),
        tools_languages: (display.toolsStack?.languages || []).join(', '),
        tools_ml_data: (display.toolsStack?.mlData || []).join(', '),
        tools_bi_analytics: (display.toolsStack?.biAnalytics || []).join(', '),
        tools_cloud_devops: (display.toolsStack?.cloudDevOps || []).join(', '),
        career_roles: (display.careerInterests?.roles || []).join('\n'),
        career_domains: (display.careerInterests?.domains || []).join('\n'),
        career_locations: (display.careerInterests?.locations || []).join('\n'),
        career_employment_types: (display.careerInterests?.employmentTypes || []).join('\n'),
        availability_start_term: display.availability?.startTerm || '',
        availability_internship_season: display.availability?.internshipSeason || '',
        availability_timezone: display.availability?.timezone || '',
        portfolio_highlights: (display.portfolioHighlights || []).join('\n'),
        contact_preferred_method: display.contactPreferences?.preferredMethod || '',
        contact_allow_public_email: Boolean(display.contactPreferences?.allowPublicEmail),
        contact_allow_public_resume:
          data.portfolio.resume_public === false
            ? false
            : display.contactPreferences?.allowPublicResume !== false,
        resume_path: (data.portfolio.resume_path as string) || '',
        resume_filename: display.resumeFileName || (data.portfolio.resume_filename as string) || '',
        resume_updated_at: display.resumeUploadedAt || (data.portfolio.resume_updated_at as string) || '',
        resume_mime: (data.portfolio.resume_mime as string) || '',
        resume_size: data.portfolio.resume_size ? String(data.portfolio.resume_size) : '',
      };

      if (data.portfolio.status === 'pending') {
        if (userId) clearLocalDraft(userId);
        setFormData(serverFormData);
        return;
      }

      const localDraft = userId ? loadLocalDraft(userId) : null;
      setFormData(localDraft ?? serverFormData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const completionChecks = useMemo(() => {
    const skillsCount = splitLines(formData.skills).length;
    const hasExperience = formData.experience.some(
      (item) => item.title.trim() && item.organization.trim()
    );
    const hasProject = formData.projects.some(
      (item) => item.title.trim() && item.description.trim()
    );
    return [
      formData.name.trim().length > 0,
      formData.bio.trim().length > 0,
      skillsCount > 0,
      hasExperience || hasProject,
      formData.role.length > 0,
    ];
  }, [formData]);

  const completionPercent = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100
  );

  const publishReadinessError = useMemo(() => {
    if (!formData.name.trim()) return 'Name is required.';
    if (!formData.bio.trim()) return 'Bio is required.';
    if (splitLines(formData.skills).length === 0) return 'Add at least one skill.';
    const hasExperience = formData.experience.some(
      (item) => item.title.trim() && item.organization.trim()
    );
    const hasProject = formData.projects.some(
      (item) => item.title.trim() && item.description.trim()
    );
    if (!hasExperience && !hasProject) {
      return 'Add at least one complete experience or project entry.';
    }
    return null;
  }, [formData]);

  const getValidationMessage = (key: string, message: string) => {
    if (key === 'name') return message;
    if (key === 'bio') return message;
    if (key === 'linkedin') return 'LinkedIn URL is invalid. Use http:// or https://.';
    if (key === 'github') return 'GitHub URL is invalid. Use http:// or https://.';
    if (key === 'website') return 'Website URL is invalid. Use http:// or https://.';

    const projectGithubMatch = key.match(/^project_(\d+)_github$/);
    if (projectGithubMatch) return `Project #${Number(projectGithubMatch[1]) + 1}: GitHub URL is invalid.`;

    const projectLiveMatch = key.match(/^project_(\d+)_live$/);
    if (projectLiveMatch) return `Project #${Number(projectLiveMatch[1]) + 1}: Live URL is invalid.`;

    const achievementLinkMatch = key.match(/^achievement_(\d+)_link$/);
    if (achievementLinkMatch) return `Achievement #${Number(achievementLinkMatch[1]) + 1}: Reference URL is invalid.`;

    return message;
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = 'Name is required.';
    if (!formData.bio.trim()) nextErrors.bio = 'Bio is required.';

    for (const field of URL_FIELDS) {
      const value = formData[field].trim();
      if (value && !isValidUrl(value)) {
        nextErrors[field] = 'Please enter a valid URL (must start with http:// or https://).';
      }
    }

    formData.achievements.forEach((item, index) => {
      if (item.link.trim() && !isValidUrl(item.link.trim())) {
        nextErrors[`achievement_${index}_link`] = 'Please enter a valid URL (must start with http:// or https://).';
      }
    });

    formData.projects.forEach((project, index) => {
      if (project.githubUrl.trim() && !isValidUrl(project.githubUrl.trim())) {
        nextErrors[`project_${index}_github`] = 'GitHub URL is invalid.';
      }
      if (project.liveUrl.trim() && !isValidUrl(project.liveUrl.trim())) {
        nextErrors[`project_${index}_live`] = 'Live URL is invalid.';
      }
    });

    setValidationErrors(nextErrors);
    const keys = Object.keys(nextErrors);
    const firstKey = keys[0];
    return {
      isValid: keys.length === 0,
      firstError: firstKey ? getValidationMessage(firstKey, nextErrors[firstKey]) : null,
    };
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!session?.user?.id) return;

    if (!file.type.startsWith('image/')) {
      setUploadPhotoError('Please select an image file (JPG, PNG, WebP, etc).');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setUploadPhotoError('Image must be 2 MB or smaller.');
      return;
    }

    setUploadPhotoError(null);
    setUploadingPhoto(true);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const path = `${session.user.id}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(PROFILE_PHOTO_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setUploadPhotoError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path);
      setFormData((prev) => ({ ...prev, profile_image_url: data.publicUrl }));
      if (photoInputRef.current) photoInputRef.current.value = '';
    } catch (e) {
      setUploadPhotoError(e instanceof Error ? e.message : 'Failed to upload image');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadResume = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadResumeError('Only PDF, DOC, or DOCX files are allowed.');
      return;
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      setUploadResumeError('Resume must be 5 MB or smaller.');
      return;
    }

    setUploadResumeError(null);
    setUploadingResume(true);

    try {
      if (!portfolio) {
        const createRes = await fetch('/api/member-portfolios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim() || 'Untitled',
            role: formData.role,
            position: formData.position.trim() || null,
            tagline: formData.tagline.trim() || null,
            major: formData.major.trim() || null,
            graduation_date: formData.graduation_date.trim() || null,
            bio: formData.bio.trim() || null,
            profile_image_url: formData.profile_image_url.trim() || null,
            links: {
              linkedin: formData.linkedin.trim() || undefined,
              github: formData.github.trim() || undefined,
              website: formData.website.trim() || undefined,
            },
            skills: splitLines(formData.skills).length ? [{ items: splitLines(formData.skills) }] : [],
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok && createRes.status !== 409) {
          throw new Error(createData.message || 'Failed to create portfolio before resume upload');
        }
      }

      const payload = new FormData();
      payload.append('resume', file);

      const res = await fetch('/api/member-portfolios/me/resume', {
        method: 'POST',
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload resume');

      setFormData((prev) => ({
        ...prev,
        resume_path: data.resume_path || '',
        resume_filename: data.resume_filename || file.name,
        resume_updated_at: data.resume_updated_at || new Date().toISOString(),
        resume_mime: data.resume_mime || file.type,
        resume_size: data.resume_size ? String(data.resume_size) : String(file.size),
      }));

      if (!portfolio) {
        await fetchMyPortfolio();
      }

      if (resumeInputRef.current) resumeInputRef.current.value = '';
    } catch (e) {
      setUploadResumeError(e instanceof Error ? e.message : 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const removeResume = async () => {
    setUploadResumeError(null);
    setUploadingResume(true);
    try {
      const res = await fetch('/api/member-portfolios/me/resume', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove resume');
      setFormData((prev) => ({
        ...prev,
        resume_path: '',
        resume_filename: '',
        resume_updated_at: '',
        resume_mime: '',
        resume_size: '',
      }));
    } catch (e) {
      setUploadResumeError(e instanceof Error ? e.message : 'Failed to remove resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const moveItem = <T,>(items: T[], from: number, to: number) => {
    if (to < 0 || to >= items.length) return items;
    const copy = [...items];
    const [picked] = copy.splice(from, 1);
    copy.splice(to, 0, picked);
    return copy;
  };

  const buildPayload = () => {
    const skills = splitLines(formData.skills);

    const experience = formData.experience
      .map((item) => ({
        title: item.title.trim(),
        organization: item.organization.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim() || undefined,
        location: item.location.trim() || undefined,
        responsibilities: splitLines(item.responsibilities),
        achievements: splitLines(item.achievements),
      }))
      .filter((item) => item.title && item.organization);

    const education = formData.education
      .map((item) => ({
        degree: item.degree.trim(),
        institution: item.institution.trim(),
        startYear: item.startYear ? Number(item.startYear) : undefined,
        endYear: item.endYear ? Number(item.endYear) : undefined,
        fieldOfStudy: item.fieldOfStudy.trim() || undefined,
        location: item.location.trim() || undefined,
        gpa: item.gpa ? Number(item.gpa) : undefined,
        honors: splitLines(item.honors),
      }))
      .filter((item) => item.degree && item.institution);

    const projects = formData.projects
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
        technologies: splitLines(item.technologies),
        githubUrl: item.githubUrl.trim() || undefined,
        liveUrl: item.liveUrl.trim() || undefined,
      }))
      .filter((item) => item.title && item.description);

    const achievements = formData.achievements
      .map((item) => ({
        title: item.title.trim(),
        type: item.type,
        organization: item.organization.trim() || undefined,
        date: item.date.trim() || undefined,
        description: item.description.trim() || undefined,
        link: item.link.trim() || undefined,
      }))
      .filter((item) => item.title);

    const leadershipActivities = splitLines(formData.leadership_activities);
    const coursework = splitLines(formData.coursework);
    const portfolioHighlights = splitLines(formData.portfolio_highlights);

    const toolsStack = {
      languages: splitLines(formData.tools_languages),
      mlData: splitLines(formData.tools_ml_data),
      biAnalytics: splitLines(formData.tools_bi_analytics),
      cloudDevOps: splitLines(formData.tools_cloud_devops),
    };

    const careerInterests = {
      roles: splitLines(formData.career_roles),
      domains: splitLines(formData.career_domains),
      locations: splitLines(formData.career_locations),
      employmentTypes: splitLines(formData.career_employment_types),
    };

    return {
      name: formData.name.trim() || 'Untitled',
      role: formData.role,
      position: formData.position.trim() || null,
      tagline: formData.tagline.trim() || null,
      major: formData.major.trim() || null,
      graduation_date: formData.graduation_date.trim() || null,
      bio: formData.bio.trim() || null,
      profile_image_url: formData.profile_image_url.trim() || null,
      links: {
        linkedin: formData.linkedin.trim() || undefined,
        github: formData.github.trim() || undefined,
        website: formData.website.trim() || undefined,
      },
      skills: skills.length ? [{ items: skills }] : [],
      education,
      experience,
      projects,
      achievements,
      tech_stack: toolsStack,
      career_interests: {
        ...careerInterests,
        leadershipActivities,
        coursework,
        availability: {
          startTerm: formData.availability_start_term.trim() || undefined,
          internshipSeason: formData.availability_internship_season.trim() || undefined,
          timezone: formData.availability_timezone.trim() || undefined,
        },
      },
      portfolio_highlights: portfolioHighlights,
      contact_prefs: {
        preferredMethod: formData.contact_preferred_method.trim() || undefined,
        allowPublicEmail: formData.contact_allow_public_email,
      },
      resume_public: formData.contact_allow_public_resume,
      resume_path: formData.resume_path || null,
      resume_filename: formData.resume_filename || null,
      resume_updated_at: formData.resume_updated_at || null,
      resume_mime: formData.resume_mime || null,
      resume_size: formData.resume_size ? Number(formData.resume_size) : null,
    };
  };

  const savePortfolio = async (isCreate: boolean) => {
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.firstError || 'Please fix validation errors before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const endpoint = isCreate ? '/api/member-portfolios' : '/api/member-portfolios/me';
      const method = isCreate ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save portfolio');

      if (userId) clearLocalDraft(userId);

      await fetchMyPortfolio();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const requestApproval = async () => {
    if (publishReadinessError) {
      setError(publishReadinessError);
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.firstError || 'Please fix validation errors before publishing.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saveRes = await fetch('/api/member-portfolios/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.message || 'Failed to save before publishing');

      const submitRes = await fetch('/api/member-portfolios/me/request-approval', {
        method: 'POST',
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.message || 'Failed to publish portfolio');

      if (userId) clearLocalDraft(userId);

      await fetchMyPortfolio();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish portfolio');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-blue-primary">My Portfolio</h1>
          <Link href="/members" className="text-blue-primary hover:underline text-sm">
            ← Back to Members
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {portfolio?.status === 'rejected' && portfolio.rejection_reason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-medium text-red-900">Reviewer feedback</p>
            <p className="text-sm text-red-800 mt-1">{portfolio.rejection_reason}</p>
          </div>
        )}

        {portfolio && isPublished && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-medium text-green-900">Published</p>
            <p className="text-sm text-green-800 mt-1">
              Your portfolio is live and editable. Updates are visible immediately on{' '}
              <Link href="/members" className="underline">
                Members
              </Link>
              .
            </p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {portfolio ? 'Edit your portfolio' : 'Create your portfolio'}
              </h2>
              <span className="text-sm text-gray-600">{completionPercent}% complete</span>
            </div>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  !showPreview
                    ? 'bg-blue-primary text-white border-blue-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  showPreview
                    ? 'bg-blue-primary text-white border-blue-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Preview
              </button>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-primary transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            {publishReadinessError && canEdit && (
              <p className="text-xs text-amber-700 mt-2">Publish readiness: {publishReadinessError}</p>
            )}
          </div>

          {showPreview && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Live preview of how your public page will look after publishing.
              </p>
              <PreviewCard portfolio={previewPortfolio} />
            </div>
          )}

          {!showPreview && (
          <>
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
                {validationErrors.name && <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as MemberRole }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major / Field</label>
                <input
                  type="text"
                  value={formData.major}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Graduation date</label>
                <input
                  type="text"
                  value={formData.graduation_date}
                  disabled={!canEdit}
                  placeholder="e.g. May 2028"
                  onChange={(e) => setFormData((prev) => ({ ...prev, graduation_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio *</label>
              <textarea
                rows={4}
                value={formData.bio}
                disabled={!canEdit}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              {validationErrors.bio && <p className="text-xs text-red-600 mt-1">{validationErrors.bio}</p>}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Photo & Resume</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile photo</label>
              {formData.profile_image_url && (
                <img
                  src={formData.profile_image_url}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border border-gray-200 mb-2"
                />
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                disabled={!canEdit || uploadingPhoto}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadProfilePhoto(file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-primary hover:file:bg-blue-100 disabled:opacity-70"
              />
              {uploadingPhoto && <p className="text-xs text-gray-500 mt-1">Uploading photo...</p>}
              {uploadPhotoError && <p className="text-xs text-red-600 mt-1">{uploadPhotoError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF/DOC/DOCX)</label>
              {formData.resume_path ? (
                <div className="mb-2 text-sm text-gray-700">
                  <a href={portfolio?.display?.resumeUrl || getResumePublicUrlFromPath(formData.resume_path)} target="_blank" rel="noopener noreferrer" className="text-blue-primary hover:underline">
                    {formData.resume_filename || 'View uploaded resume'}
                  </a>
                  {formData.resume_updated_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded {new Date(formData.resume_updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-2">No resume uploaded yet.</p>
              )}

              <div className="flex flex-wrap gap-2">
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={!canEdit || uploadingResume}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadResume(file);
                  }}
                  className="block text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-primary hover:file:bg-blue-100 disabled:opacity-70"
                />
                {canEdit && formData.resume_path && (
                  <button
                    type="button"
                    onClick={removeResume}
                    disabled={uploadingResume}
                    className="px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
                  >
                    Remove resume
                  </button>
                )}
              </div>
              {uploadingResume && <p className="text-xs text-gray-500 mt-1">Uploading resume...</p>}
              {uploadResumeError && <p className="text-xs text-red-600 mt-1">{uploadResumeError}</p>}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
                {validationErrors.linkedin && <p className="text-xs text-red-600 mt-1">{validationErrors.linkedin}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                <input
                  type="url"
                  value={formData.github}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
                {validationErrors.github && <p className="text-xs text-red-600 mt-1">{validationErrors.github}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
                {validationErrors.website && <p className="text-xs text-red-600 mt-1">{validationErrors.website}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Skills *</h3>
            <textarea
              rows={3}
              value={formData.skills}
              disabled={!canEdit}
              placeholder="Python, SQL, Tableau, Machine Learning"
              onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
            />
            <p className="text-xs text-gray-500">Enter skills separated by commas or new lines.</p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, education: [...prev.education, blankEducation()] }))}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  + Add education
                </button>
              )}
            </div>

            {formData.education.map((edu, index) => (
              <div key={`edu-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">Education #{index + 1}</p>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, education: moveItem(prev.education, index, index - 1) }))}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, education: moveItem(prev.education, index, index + 1) }))}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        disabled={index === formData.education.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            education: prev.education.length > 1
                              ? prev.education.filter((_, idx) => idx !== index)
                              : [blankEducation()],
                          }))
                        }
                        className="px-2 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        education: prev.education.map((item, idx) =>
                          idx === index ? { ...item, degree: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        education: prev.education.map((item, idx) =>
                          idx === index ? { ...item, institution: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="number"
                    placeholder="Start year"
                    value={edu.startYear}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        education: prev.education.map((item, idx) =>
                          idx === index ? { ...item, startYear: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="number"
                    placeholder="End year"
                    value={edu.endYear}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        education: prev.education.map((item, idx) =>
                          idx === index ? { ...item, endYear: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Field of study"
                    value={edu.fieldOfStudy}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        education: prev.education.map((item, idx) =>
                          idx === index ? { ...item, fieldOfStudy: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={edu.location}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        education: prev.education.map((item, idx) =>
                          idx === index ? { ...item, location: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="GPA (optional)"
                    value={edu.gpa}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        education: prev.education.map((item, idx) =>
                          idx === index ? { ...item, gpa: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Honors / awards (one per line)"
                  value={edu.honors}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      education: prev.education.map((item, idx) =>
                        idx === index ? { ...item, honors: e.target.value } : item
                      ),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, experience: [...prev.experience, blankExperience()] }))}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  + Add experience
                </button>
              )}
            </div>

            {formData.experience.map((exp, index) => (
              <div key={`exp-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">Experience #{index + 1}</p>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, experience: moveItem(prev.experience, index, index - 1) }))}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, experience: moveItem(prev.experience, index, index + 1) }))}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        disabled={index === formData.experience.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            experience: prev.experience.length > 1
                              ? prev.experience.filter((_, idx) => idx !== index)
                              : [blankExperience()],
                          }))
                        }
                        className="px-2 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={exp.title}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        experience: prev.experience.map((item, idx) =>
                          idx === index ? { ...item, title: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="Organization"
                    value={exp.organization}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        experience: prev.experience.map((item, idx) =>
                          idx === index ? { ...item, organization: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="Start date"
                    value={exp.startDate}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        experience: prev.experience.map((item, idx) =>
                          idx === index ? { ...item, startDate: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="End date (optional)"
                    value={exp.endDate}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        experience: prev.experience.map((item, idx) =>
                          idx === index ? { ...item, endDate: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={exp.location}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      experience: prev.experience.map((item, idx) =>
                        idx === index ? { ...item, location: e.target.value } : item
                      ),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />

                <textarea
                  rows={3}
                  placeholder="Responsibilities (one per line)"
                  value={exp.responsibilities}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      experience: prev.experience.map((item, idx) =>
                        idx === index ? { ...item, responsibilities: e.target.value } : item
                      ),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />

                <textarea
                  rows={2}
                  placeholder="Achievements (one per line)"
                  value={exp.achievements}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      experience: prev.experience.map((item, idx) =>
                        idx === index ? { ...item, achievements: e.target.value } : item
                      ),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, projects: [...prev.projects, blankProject()] }))}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  + Add project
                </button>
              )}
            </div>

            {formData.projects.map((project, index) => (
              <div key={`project-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">Project #{index + 1}</p>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, projects: moveItem(prev.projects, index, index - 1) }))}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, projects: moveItem(prev.projects, index, index + 1) }))}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        disabled={index === formData.projects.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            projects: prev.projects.length > 1
                              ? prev.projects.filter((_, idx) => idx !== index)
                              : [blankProject()],
                          }))
                        }
                        className="px-2 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Project title"
                  value={project.title}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      projects: prev.projects.map((item, idx) =>
                        idx === index ? { ...item, title: e.target.value } : item
                      ),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />

                <textarea
                  rows={3}
                  placeholder="Project description"
                  value={project.description}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      projects: prev.projects.map((item, idx) =>
                        idx === index ? { ...item, description: e.target.value } : item
                      ),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />

                <input
                  type="text"
                  placeholder="Technologies (comma or newline separated)"
                  value={project.technologies}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      projects: prev.projects.map((item, idx) =>
                        idx === index ? { ...item, technologies: e.target.value } : item
                      ),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="url"
                      placeholder="GitHub URL"
                      value={project.githubUrl}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          projects: prev.projects.map((item, idx) =>
                            idx === index ? { ...item, githubUrl: e.target.value } : item
                          ),
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                    />
                    {validationErrors[`project_${index}_github`] && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors[`project_${index}_github`]}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="url"
                      placeholder="Live/demo URL"
                      value={project.liveUrl}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          projects: prev.projects.map((item, idx) =>
                            idx === index ? { ...item, liveUrl: e.target.value } : item
                          ),
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                    />
                    {validationErrors[`project_${index}_live`] && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors[`project_${index}_live`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Achievements & Certifications</h3>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, achievements: [...prev.achievements, blankAchievement()] }))}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  + Add entry
                </button>
              )}
            </div>

            {formData.achievements.map((achievement, index) => (
              <div key={`achievement-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">Entry #{index + 1}</p>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, achievements: moveItem(prev.achievements, index, index - 1) }))}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, achievements: moveItem(prev.achievements, index, index + 1) }))}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        disabled={index === formData.achievements.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            achievements: prev.achievements.length > 1
                              ? prev.achievements.filter((_, idx) => idx !== index)
                              : [blankAchievement()],
                          }))
                        }
                        className="px-2 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={achievement.title}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        achievements: prev.achievements.map((item, idx) =>
                          idx === index ? { ...item, title: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <select
                    value={achievement.type}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        achievements: prev.achievements.map((item, idx) =>
                          idx === index ? { ...item, type: e.target.value as 'achievement' | 'certification' } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  >
                    <option value="achievement">Achievement</option>
                    <option value="certification">Certification</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Organization (optional)"
                    value={achievement.organization}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        achievements: prev.achievements.map((item, idx) =>
                          idx === index ? { ...item, organization: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="Date (optional)"
                    value={achievement.date}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        achievements: prev.achievements.map((item, idx) =>
                          idx === index ? { ...item, date: e.target.value } : item
                        ),
                      }))
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Description (optional)"
                  value={achievement.description}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      achievements: prev.achievements.map((item, idx) =>
                        idx === index ? { ...item, description: e.target.value } : item
                      ),
                    }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                />

                <div>
                  <input
                    type="url"
                    placeholder="Reference URL (optional)"
                    value={achievement.link}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        achievements: prev.achievements.map((item, idx) =>
                          idx === index ? { ...item, link: e.target.value } : item
                        ),
                      }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
                  />
                  {validationErrors[`achievement_${index}_link`] && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors[`achievement_${index}_link`]}</p>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Leadership & Activities</h3>
            <textarea
              rows={4}
              value={formData.leadership_activities}
              disabled={!canEdit}
              placeholder="One activity per line"
              onChange={(e) => setFormData((prev) => ({ ...prev, leadership_activities: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Relevant Coursework</h3>
            <textarea
              rows={4}
              value={formData.coursework}
              disabled={!canEdit}
              placeholder="One course per line"
              onChange={(e) => setFormData((prev) => ({ ...prev, coursework: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tools & Tech Stack</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                rows={2}
                value={formData.tools_languages}
                disabled={!canEdit}
                placeholder="Languages (comma/newline separated)"
                onChange={(e) => setFormData((prev) => ({ ...prev, tools_languages: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <textarea
                rows={2}
                value={formData.tools_ml_data}
                disabled={!canEdit}
                placeholder="ML/Data tools"
                onChange={(e) => setFormData((prev) => ({ ...prev, tools_ml_data: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <textarea
                rows={2}
                value={formData.tools_bi_analytics}
                disabled={!canEdit}
                placeholder="BI/Analytics tools"
                onChange={(e) => setFormData((prev) => ({ ...prev, tools_bi_analytics: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <textarea
                rows={2}
                value={formData.tools_cloud_devops}
                disabled={!canEdit}
                placeholder="Cloud/DevOps tools"
                onChange={(e) => setFormData((prev) => ({ ...prev, tools_cloud_devops: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Career Interests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                rows={2}
                value={formData.career_roles}
                disabled={!canEdit}
                placeholder="Target roles (one per line)"
                onChange={(e) => setFormData((prev) => ({ ...prev, career_roles: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <textarea
                rows={2}
                value={formData.career_domains}
                disabled={!canEdit}
                placeholder="Domains/industries"
                onChange={(e) => setFormData((prev) => ({ ...prev, career_domains: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <textarea
                rows={2}
                value={formData.career_locations}
                disabled={!canEdit}
                placeholder="Preferred locations"
                onChange={(e) => setFormData((prev) => ({ ...prev, career_locations: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <textarea
                rows={2}
                value={formData.career_employment_types}
                disabled={!canEdit}
                placeholder="Employment types (Internship, Full-time, etc.)"
                onChange={(e) => setFormData((prev) => ({ ...prev, career_employment_types: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Availability</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={formData.availability_start_term}
                disabled={!canEdit}
                placeholder="Start term"
                onChange={(e) => setFormData((prev) => ({ ...prev, availability_start_term: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <input
                type="text"
                value={formData.availability_internship_season}
                disabled={!canEdit}
                placeholder="Internship season"
                onChange={(e) => setFormData((prev) => ({ ...prev, availability_internship_season: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <input
                type="text"
                value={formData.availability_timezone}
                disabled={!canEdit}
                placeholder="Timezone"
                onChange={(e) => setFormData((prev) => ({ ...prev, availability_timezone: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Highlights</h3>
            <textarea
              rows={3}
              value={formData.portfolio_highlights}
              disabled={!canEdit}
              placeholder="One highlight per line"
              onChange={(e) => setFormData((prev) => ({ ...prev, portfolio_highlights: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={formData.contact_preferred_method}
                disabled={!canEdit}
                placeholder="Preferred method (email/linkedin/etc.)"
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_preferred_method: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-50"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.contact_allow_public_email}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_allow_public_email: e.target.checked }))}
                />
                Allow public email
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.contact_allow_public_resume}
                  disabled={!canEdit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact_allow_public_resume: e.target.checked }))}
                />
                Allow public resume
              </label>
            </div>
          </section>

          </>
          )}

          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => savePortfolio(!portfolio)}
                disabled={saving || uploadingPhoto || uploadingResume}
                className="px-4 py-2 bg-blue-primary text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : portfolio ? 'Save changes' : 'Create portfolio'}
              </button>

              {portfolio && (
                <button
                  type="button"
                  onClick={requestApproval}
                  disabled={saving || uploadingPhoto || uploadingResume || Boolean(publishReadinessError)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : status === 'rejected' ? 'Republish portfolio' : 'Publish portfolio'}
                </button>
              )}
            </div>
          )}

          {portfolio && isPublished && (
            <Link href={`/members/${portfolio.id}`} className="text-sm text-blue-primary hover:underline inline-block">
              View public page →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
