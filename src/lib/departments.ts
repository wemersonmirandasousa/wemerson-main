import { supabase } from '@/integrations/supabase/client';

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments' as any)
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as Department[];
}

export async function createDepartment(name: string): Promise<Department> {
  const { data, error } = await supabase
    .from('departments' as any)
    .insert({ name: name.trim() } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Department;
}

export async function updateDepartment(id: string, name: string): Promise<Department> {
  const { data, error } = await supabase
    .from('departments' as any)
    .update({ name: name.trim() } as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Department;
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase
    .from('departments' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
