-- Add new columns to existing profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS short_term_goals TEXT,
ADD COLUMN IF NOT EXISTS long_term_goals TEXT,
ADD COLUMN IF NOT EXISTS current_challenges TEXT,
ADD COLUMN IF NOT EXISTS emotional_baseline TEXT,
ADD COLUMN IF NOT EXISTS mentor_style TEXT DEFAULT 'balanced';

-- Conversations table (sessions)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;

CREATE POLICY "select_own_conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_conversations" ON conversations FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_messages" ON messages;
DROP POLICY IF EXISTS "insert_own_messages" ON messages;
DROP POLICY IF EXISTS "delete_own_messages" ON messages;

CREATE POLICY "select_own_messages" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_messages" ON messages FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_goals" ON goals;
DROP POLICY IF EXISTS "insert_own_goals" ON goals;
DROP POLICY IF EXISTS "update_own_goals" ON goals;
DROP POLICY IF EXISTS "delete_own_goals" ON goals;

CREATE POLICY "select_own_goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_goals" ON goals FOR DELETE USING (auth.uid() = user_id);