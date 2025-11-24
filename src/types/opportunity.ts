export type OpportunityType = 'job' | 'internship' | 'project' | 'research' | 'event';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  description: string;
  requirements?: string[];
  location?: string;
  remote?: boolean;
  applicationUrl?: string;
  contactEmail?: string;
  postedDate: string;
  deadline?: string;
  tags?: string[];
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentPath?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

