export interface UserResponse {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  profile_picture: string;
  is_setup_complete: boolean;
  whatsapp_number: string;
}

export interface UserIdentity {
  id: number;
  name: string;
  title: string;
  initials: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar: string;
  isActive: boolean;
  whatsappNumber?: string;
  isSetupComplete: boolean;
}
