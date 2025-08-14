export interface StaffCourseResponse {
  id: number;
  name: string;
  description: string;
  program_type: 'certificate' | 'diploma';
  is_active: boolean;
  module_count: number;
}

export interface StaffResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  title?: string | null;
  role: 'admin' | 'lecturer';
  whatsapp_number?: string;
  profile_picture?: string | null;
  is_setup_complete: boolean;
  is_active: boolean;
  courses_taught: StaffCourseResponse[];
  total_classes: number;
}

export interface StaffCourse {
  id: number;
  name: string;
  description: string;
  programType: 'certificate' | 'diploma';
  isActive: boolean;
  moduleCount: number;
}

export interface Staff {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  role: 'admin' | 'lecturer';
  whatsappNumber?: string;
  profilePicture?: string | null;
  isSetupComplete: boolean;
  isActive: boolean;
  coursesTaught: StaffCourse[];
  totalClasses: number;
  fullName: string;
  displayName: string;
  initials: string;
}

export interface PromoteDemoteResponse {
  status: string;
}
