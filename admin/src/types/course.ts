export interface CourseResponse {
  id: number;
  name: string;
  description: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
  module_count: number;
  created_at?: string;
  updated_at?: string;
  lecturer?: {
    id: number;
    first_name: string;
    last_name: string;
    title?: string | null;
    email: string;
    profile_picture?: string | null;
  } | null;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  programType: 'certificate' | 'diploma';
  isActive: boolean;
  moduleCount: number;
  createdAt?: string;
  updatedAt?: string;
  lecturer?: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    displayName: string;
    title?: string | null;
    email: string;
    profilePicture?: string | null;
    initials: string;
  } | null;
}

export interface CourseCreateRequest {
  name: string;
  description: string;
  program_type: 'certificate' | 'diploma';
  module_count: number;
  is_active?: boolean;
}

export interface CourseUpdateRequest {
  name?: string;
  description?: string;
  program_type?: 'certificate' | 'diploma';
  module_count?: number;
  is_active?: boolean;
}

export interface CourseListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CourseResponse[];
}

// For staff course assignments
export interface StaffCourseResponse {
  id: number;
  name: string;
  description: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
  module_count: number;
}

export interface StaffCourse {
  id: number;
  name: string;
  description: string;
  programType: 'certificate' | 'diploma';
  isActive: boolean;
  moduleCount: number;
}

export interface CourseAssignmentRequest {
  lecturer_id: number;
}

export interface CourseAssignmentResponse {
  status: string;
  message: string;
}
