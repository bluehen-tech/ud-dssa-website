import { Opportunity, OpportunityType } from '@/types/opportunity';

export interface OpportunityRecord {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  description: string;
  requirements: string[] | null;
  location: string | null;
  remote: boolean | null;
  application_url: string | null;
  contact_email: string | null;
  posted_at: string | null;
  deadline: string | null;
  tags: string[] | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

const normalizeArrayField = (value?: string[] | null): string[] | undefined => {
  if (!value || value.length === 0) return undefined;
  return value;
};

export const recordToOpportunity = (record: OpportunityRecord): Opportunity => ({
  id: record.id,
  title: record.title,
  organization: record.organization,
  type: record.type,
  description: record.description,
  requirements: normalizeArrayField(record.requirements),
  location: record.location ?? undefined,
  remote: record.remote ?? false,
  applicationUrl: record.application_url ?? undefined,
  contactEmail: record.contact_email ?? undefined,
  postedDate: record.posted_at ?? record.created_at,
  deadline: record.deadline ?? undefined,
  tags: normalizeArrayField(record.tags),
  attachmentUrl: record.attachment_url ?? undefined,
  attachmentName: record.attachment_name ?? undefined,
  attachmentPath: record.attachment_path ?? undefined,
  createdBy: record.created_by ?? undefined,
  createdAt: record.created_at,
  updatedAt: record.updated_at ?? record.created_at,
});

export const multilineFromArray = (items?: string[]): string =>
  items && items.length ? items.join('\n') : '';

export const commaListFromArray = (items?: string[]): string =>
  items && items.length ? items.join(', ') : '';

export const parseMultilineInput = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

export const parseCommaInput = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const toDatetimeLocalValue = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  const tzOffsetInMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - tzOffsetInMs);
  return localDate.toISOString().slice(0, 16);
};

export const sanitizeForFilename = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'attachment';

