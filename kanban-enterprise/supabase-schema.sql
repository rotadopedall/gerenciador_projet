-- ============================================================
-- OpsKanban Enterprise — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('administrador', 'gestor', 'supervisor', 'tecnico', 'visualizador');
CREATE TYPE task_status AS ENUM ('backlog', 'aberto', 'triagem', 'atribuido', 'em_andamento', 'aguardando_cliente', 'aguardando_terceiros', 'validacao', 'concluido', 'cancelado');
CREATE TYPE task_priority AS ENUM ('baixa', 'normal', 'alta', 'critica');
CREATE TYPE task_criticality AS ENUM ('baixa', 'media', 'alta', 'critica');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'tecnico',
  avatar_url TEXT,
  team_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from profiles to teams
ALTER TABLE profiles ADD CONSTRAINT profiles_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seq_id SERIAL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status task_status NOT NULL DEFAULT 'backlog',
  priority task_priority NOT NULL DEFAULT 'normal',
  criticality task_criticality NOT NULL DEFAULT 'media',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  sla_hours INTEGER DEFAULT 24,
  sla_deadline TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TASK COMMENTS
-- ============================================================
CREATE TABLE task_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TASK HISTORY
-- ============================================================
CREATE TABLE task_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- HANDLE NEW USER (auto-create profile on signup)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tecnico')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Profiles: users can view all active profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles: users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profiles: admins can do everything"
  ON profiles FOR ALL
  USING (get_user_role(auth.uid()) = 'administrador');

-- TEAMS policies
CREATE POLICY "Teams: authenticated users can view"
  ON teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Teams: admins and gestors can manage"
  ON teams FOR ALL
  USING (get_user_role(auth.uid()) IN ('administrador', 'gestor'));

-- TASKS policies
CREATE POLICY "Tasks: authenticated users can view"
  ON tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Tasks: gestors and above can create"
  ON tasks FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('administrador', 'gestor', 'supervisor'));

CREATE POLICY "Tasks: gestors and above can update"
  ON tasks FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('administrador', 'gestor', 'supervisor')
    OR assignee_id = auth.uid());

CREATE POLICY "Tasks: admins and gestors can delete"
  ON tasks FOR DELETE
  USING (get_user_role(auth.uid()) IN ('administrador', 'gestor'));

-- TASK COMMENTS policies
CREATE POLICY "Comments: authenticated users can view"
  ON task_comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Comments: authenticated users can insert"
  ON task_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' 
    AND get_user_role(auth.uid()) != 'visualizador');

CREATE POLICY "Comments: authors can update/delete"
  ON task_comments FOR UPDATE
  USING (author_id = auth.uid());

-- TASK HISTORY policies
CREATE POLICY "History: authenticated users can view"
  ON task_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "History: system can insert"
  ON task_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE task_history;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;

-- ============================================================
-- SEED DATA (optional demo)
-- ============================================================
-- After creating your first user via Auth, run:
-- UPDATE profiles SET role = 'administrador' WHERE email = 'your@email.com';
