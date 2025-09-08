export interface BaseContactForm {
  email: string;
  userType: 'ud-grad-student' | 'industry-academic-friend';
}

export interface UDGradStudentForm extends BaseContactForm {
  userType: 'ud-grad-student';
  major: string;
  selectedClubs: string[];
  graduationMonth: string;
  graduationYear: string;
}

export interface IndustryAcademicForm extends BaseContactForm {
  userType: 'industry-academic-friend';
  affiliation: string;
  jobTitle: string;
  notes?: string;
}

export type ContactFormData = UDGradStudentForm | IndustryAcademicForm;

export interface FormSubmissionResult {
  success: boolean;
  message: string;
  data?: ContactFormData;
}
