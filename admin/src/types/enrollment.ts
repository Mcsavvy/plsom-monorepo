export interface EnrollmentStudentResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  profile_picture: string | null;
}

export interface EnrollmentCohortResponse {
  id: number;
  name: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  enrolled_students_count: number;
}

export interface EnrollmentResponse {
  id: number;
  student: EnrollmentStudentResponse;
  cohort: EnrollmentCohortResponse;
  enrolled_at: string;
}

export interface EnrollmentStudent {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  title?: string;
  initials: string;
  profilePicture: string;
}

export interface EnrollmentCohort {
  id: number;
  name: string;
  programType: 'certificate' | 'diploma';
  isActive: boolean;
  startDate: string;
  endDate: string | null;
}

export interface Enrollment {
  id: number;
  student: EnrollmentStudent;
  cohort: EnrollmentCohort;
  enrolledAt: string;
}
