-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- departments, courses, units: public read
CREATE POLICY "Departments are publicly readable" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Courses are publicly readable" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Units are publicly readable" ON public.units FOR SELECT USING (true);

-- users
CREATE POLICY "Users can read own record" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- materials
CREATE POLICY "Authenticated can read approved materials" ON public.materials FOR SELECT TO authenticated USING (status = 'approved' OR uploaded_by = auth.uid());
CREATE POLICY "Authenticated can insert materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- user_courses
CREATE POLICY "Users can read own enrollments" ON public.user_courses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own enrollments" ON public.user_courses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own enrollments" ON public.user_courses FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('materials', 'materials', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Authenticated users can read materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'materials');
CREATE POLICY "Authenticated users can update materials" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'materials') WITH CHECK (bucket_id = 'materials');
