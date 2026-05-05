export type UserRole = 'student' | 'tutor' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  bio: string;
  expertise: string[];
  whatsapp_number: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  type: 'pdf' | 'book' | 'project' | 'notes' | 'other';
  category: string;
  price: number;
  file_url: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  condition: 'new' | 'good' | 'fair' | 'poor';
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface WantedItem {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'open' | 'fulfilled' | 'closed';
  created_at: string;
  updated_at: string;
  requester?: Profile;
}

export interface TutorSession {
  id: string;
  tutor_id: string;
  title: string;
  description: string;
  topics: string[];
  hourly_rate: number;
  status: 'pending' | 'approved' | 'rejected';
  availability: string;
  created_at: string;
  updated_at: string;
  tutor?: Profile;
}

export interface Chat {
  id: string;
  participant_one: string;
  participant_two: string;
  material_id: string | null;
  last_message: string;
  last_message_at: string;
  created_at: string;
  other_user?: Profile;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'material_approved' | 'material_rejected' | 'new_material' | 'new_message' | 'wanted_match' | 'tutor_approved' | 'general';
  is_read: boolean;
  link: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  buyer_id: string;
  material_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  material?: Material;
}

export interface TutorRequest {
  id: string;
  user_id: string;
  bio: string;
  expertise: string[];
  whatsapp_number: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}
