// API Response types (what we get from Django)
export interface StudentEnrollmentResponse {
  id: number;
  cohort: {
    id: number;
    name: string;
    program_type: 'certificate' | 'diploma';
    is_active: boolean;
    start_date: string;
    end_date?: string | null;
  };
  enrolled_at: string;
}

export interface StudentResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  title?: string | null;
  whatsapp_number?: string;
  profile_picture?: string | null;
  is_setup_complete: boolean;
  is_active: boolean;
  enrollments: StudentEnrollmentResponse[];
}

// Frontend types (what we use in components)
export interface StudentEnrollment {
  id: number;
  cohort: {
    id: number;
    name: string;
    programType: 'certificate' | 'diploma';
    isActive: boolean;
    startDate: string;
    endDate?: string | null;
  };
  enrolledAt: string;
}

export interface Student {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  title?: string;
  initials: string;
  whatsappNumber?: string;
  profilePicture?: string | null;
  isSetupComplete: boolean;
  isActive: boolean;
  status: 'active' | 'inactive' | 'pending';
  statusText: string;
  enrollments: StudentEnrollment[];
  enrollmentCount: number;
  activeEnrollmentCount: number;
  programTypes: string[];
}

// Enrollment action types
export interface EnrollmentActionRequest {
  cohort_id: number;
}

export interface EnrollmentActionResponse {
  message: string;
  student: StudentResponse;
}
