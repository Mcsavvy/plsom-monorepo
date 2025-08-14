export interface ClassResponse {
  id: number;
  course_id: number;
  course: {
    id: number;
    name: string;
    description: string;
    program_type: 'certificate' | 'diploma';
    module_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    lecturer?: {
      id: number;
      first_name: string;
      last_name: string;
      title?: string | null;
      email: string;
      role: 'admin' | 'lecturer' | 'student';
      whatsapp_number: string;
      profile_picture?: string | null;
      is_setup_complete: boolean;
      is_active: boolean;
    } | null;
    total_classes: number;
    active_classes_count: number;
  };
  lecturer_id: number;
  lecturer: {
    id: number;
    first_name: string;
    last_name: string;
    title?: string | null;
    email: string;
    role: 'admin' | 'lecturer' | 'student';
    whatsapp_number: string;
    profile_picture?: string | null;
    is_setup_complete: boolean;
    is_active: boolean;
  };
  cohort_id: number;
  cohort: {
    id: number;
    name: string;
    program_type: 'certificate' | 'diploma';
    is_active: boolean;
    start_date: string;
    end_date?: string | null;
    enrolled_students_count: number;
  };
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  zoom_join_url?: string | null;
  recording_url?: string | null;
  password_for_recording?: string | null;
  attendance_count: number;
  is_past: boolean;
  can_join: boolean;
}

export interface Class {
  id: number;
  course: {
    id: number;
    name: string;
    description: string;
    programType: 'certificate' | 'diploma';
    moduleCount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
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
      role: 'admin' | 'lecturer' | 'student';
      whatsappNumber: string;
      isSetupComplete: boolean;
      isActive: boolean;
    } | null;
    totalClasses: number;
    activeClassesCount: number;
  };
  lecturer: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    displayName: string;
    title?: string | null;
    email: string;
    profilePicture?: string | null;
    initials: string;
    role: 'admin' | 'lecturer' | 'student';
    whatsappNumber: string;
    isSetupComplete: boolean;
    isActive: boolean;
  };
  cohort: {
    id: number;
    name: string;
    programType: 'certificate' | 'diploma';
    isActive: boolean;
    startDate: string;
    endDate?: string | null;
    enrolledStudentsCount: number;
  };
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  zoomJoinUrl?: string | null;
  recordingUrl?: string | null;
  passwordForRecording?: string | null;
  attendanceCount: number;
  isPast: boolean;
  canJoin: boolean;
  // Computed properties
  status: 'upcoming' | 'ongoing' | 'completed';
  statusText: string;
  formattedDateTime: string;
  formattedDuration: string;
}

export interface ClassCreateRequest {
  course_id: number;
  lecturer_id?: number;
  cohort_id: number;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  zoom_join_url?: string | null;
  recording_url?: string | null;
  password_for_recording?: string | null;
}

export interface ClassUpdateRequest {
  course_id?: number;
  lecturer_id?: number;
  cohort_id?: number;
  title?: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  zoom_join_url?: string | null;
  recording_url?: string | null;
  password_for_recording?: string | null;
}

export interface ClassListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClassResponse[];
}

// For clone operation - excludes meeting/zoom related fields
export interface ClassCloneRequest {
  course_id?: number;
  lecturer_id?: number;
  cohort_id?: number;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
}
