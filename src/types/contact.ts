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
