
/*
  # Student Material Exchange App - Initial Schema

  ## Overview
  Full schema for a student material exchange platform with three user roles:
  students, tutors, and admins.

  ## Tables Created
  1. profiles - Extended user profiles linked to auth.users
     - role: 'student' | 'tutor' | 'admin'
     - bio, expertise, whatsapp_number, avatar_url
  2. materials - Study materials for sale/exchange
     - type: 'pdf' | 'book' | 'project' | 'notes' | 'other'
     - status: 'pending' | 'approved' | 'rejected'
     - price, file_url, category
  3. wanted_list - Materials students are looking for
     - status: 'open' | 'fulfilled'
  4. tutor_sessions - Tutor service listings
     - topics, hourly_rate, status: 'pending' | 'approved' | 'rejected'
  5. chats - Chat conversations between users
  6. messages - Individual chat messages
  7. notifications - User notifications
  8. purchases - Track material purchases
  9. tutor_requests - Requests to become tutors

  ## Security
  - RLS enabled on all tables
  - Policies enforce ownership and role-based access
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
  bio text DEFAULT '',
  expertise text[] DEFAULT '{}',
  whatsapp_number text DEFAULT '',
  avatar_url text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- MATERIALS
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL DEFAULT 'notes' CHECK (type IN ('pdf', 'book', 'project', 'notes', 'other')),
  category text NOT NULL DEFAULT 'general',
  price numeric(10,2) NOT NULL DEFAULT 0,
  file_url text DEFAULT '',
  image_url text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  condition text DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  tags text[] DEFAULT '{}',
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved materials"
  ON materials FOR SELECT
  TO authenticated
  USING (status = 'approved' OR seller_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Authenticated users can insert materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Sellers can delete own materials"
  ON materials FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- WANTED LIST
CREATE TABLE IF NOT EXISTS wanted_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'general',
  budget numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wanted_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wanted items"
  ON wanted_list FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own wanted items"
  ON wanted_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own wanted items"
  ON wanted_list FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (auth.uid() = requester_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Users can delete own wanted items"
  ON wanted_list FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id);

-- TUTOR SESSIONS (Tutor service listings)
CREATE TABLE IF NOT EXISTS tutor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  topics text[] DEFAULT '{}',
  hourly_rate numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  availability text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved tutor sessions"
  ON tutor_sessions FOR SELECT
  TO authenticated
  USING (status = 'approved' OR tutor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Tutors can insert sessions"
  ON tutor_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tutor_id AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('tutor', 'admin')));

CREATE POLICY "Tutors can update own sessions"
  ON tutor_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = tutor_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (auth.uid() = tutor_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Tutors can delete own sessions"
  ON tutor_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = tutor_id OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- CHATS
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_two uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id) ON DELETE SET NULL,
  last_message text DEFAULT '',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_one, participant_two)
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own chats"
  ON chats FOR SELECT
  TO authenticated
  USING (participant_one = auth.uid() OR participant_two = auth.uid());

CREATE POLICY "Authenticated users can insert chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (participant_one = auth.uid() OR participant_two = auth.uid());

CREATE POLICY "Participants can update own chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (participant_one = auth.uid() OR participant_two = auth.uid())
  WITH CHECK (participant_one = auth.uid() OR participant_two = auth.uid());

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = chat_id
      AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = chat_id
      AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

CREATE POLICY "Senders can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('material_approved', 'material_rejected', 'new_material', 'new_message', 'wanted_match', 'tutor_approved', 'general')),
  is_read boolean DEFAULT false,
  link text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PURCHASES
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM materials m WHERE m.id = material_id AND m.seller_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Users can insert purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- TUTOR REQUESTS (students requesting to become tutors)
CREATE TABLE IF NOT EXISTS tutor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  expertise text[] DEFAULT '{}',
  whatsapp_number text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tutor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tutor requests"
  ON tutor_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Users can insert tutor requests"
  ON tutor_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tutor requests"
  ON tutor_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_materials_seller ON materials(seller_id);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_p1 ON chats(participant_one);
CREATE INDEX IF NOT EXISTS idx_chats_p2 ON chats(participant_two);
