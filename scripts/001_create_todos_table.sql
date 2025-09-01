-- Create todos table with proper structure for daily planning
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for todos
CREATE POLICY "Users can view their own todos" 
  ON public.todos FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" 
  ON public.todos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" 
  ON public.todos FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" 
  ON public.todos FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS todos_user_date_idx ON public.todos(user_id, date);
CREATE INDEX IF NOT EXISTS todos_user_completed_idx ON public.todos(user_id, completed);
