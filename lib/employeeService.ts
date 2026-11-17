import { supabase } from "./supabase";

export interface Employee {
  id: string;
  name: string;
  email: string;
  designation: string;
  department?: string;
  employee_id?: string;
  avatar_url?: string;
  phone_number?: string;
  blood_group?: string;
  nid_number?: string;
  date_of_birth?: string;
  gender?: string;
  present_address?: string;
  permanent_address?: string;
}

// Get all employees from database
export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching employees:", error.message);
    return [];
  }

  return data || [];
}

// Create new employee account (Auth + Initial Record)
export async function createEmployeeAccount(
  email: string,
  pass: string,
  name: string,
  designation: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: name,
        role: "employee",
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error("User creation failed!");

  // Insert into employees table with UUID linking auth.users(id)
  const { error: insertError } = await supabase.from("employees").insert([
    {
      id: data.user.id,
      name,
      email,
      designation,
    },
  ]);

  if (insertError) throw insertError;

  return data;
}