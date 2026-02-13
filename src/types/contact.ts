export interface BaseContactForm {
  email: string;
  fullName: string;
  userType: 'ud-grad-student' | 'industry-academic-friend' | 'undergraduate-student' | 'other-university-student';
}

export interface UDGradStudentForm extends BaseContactForm {
  userType: 'ud-grad-student';
  major: string;
  selectedClubs: string[];
  graduationMonth: string;
  graduationYear: string;
  interestedInOfficer?: boolean;
}

export interface IndustryAcademicForm extends BaseContactForm {
  userType: 'industry-academic-friend';
  affiliation: string;
  jobTitle: string;
  notes?: string;
}

export interface UndergraduateStudentForm extends BaseContactForm {
  userType: 'undergraduate-student';
  major: string;
  selectedClubs: string[];
  graduationMonth: string;
  graduationYear: string;
}

export interface OtherUniversityStudentForm extends BaseContactForm {
  userType: 'other-university-student';
  affiliation: string;
  major: string;
  selectedClubs: string[];
  graduationMonth: string;
  graduationYear: string;
}

export type ContactFormData = UDGradStudentForm | IndustryAcademicForm | UndergraduateStudentForm | OtherUniversityStudentForm;

export interface FormSubmissionResult {
  success: boolean;
  message: string;
  data?: ContactFormData;
}

// Contacts table types (for central contact repository)
export type ContactStatus = 'subscribed' | 'unsubscribed';
export type ContactSource = 'form_submission' | 'auth_user' | 'csv_import' | 'manual';
export type ContactUserType = 'ud-grad-student' | 'industry-academic-friend' | 'undergraduate-student' | 'other-university-student';

export interface ContactSourceMetadata {
  form_submission_ids?: string[];
  auth_user_id?: string;
  csv_import_date?: string;
  sources?: string[];
  last_synced?: string;
}

export interface Contact {
  id: string;
  email: string;
  full_name: string | null;
  user_type: ContactUserType | null;
  major: string | null;
  graduation_month: string | null;
  graduation_year: string | null;
  affiliation: string | null;
  job_title: string | null;
  clubs: string[] | null;
  is_officer: boolean;
  status: ContactStatus;
  source: ContactSource | null;
  source_metadata: ContactSourceMetadata | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactsListResponse {
  success: boolean;
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactSyncResponse {
  success: boolean;
  message: string;
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export interface ContactImportResponse {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors: string[];
}
