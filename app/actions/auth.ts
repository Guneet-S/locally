"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(data: {
  email: string;
  password: string;
  role: string;
}): Promise<{ error: string } | undefined> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) return { error: error.message };

  redirect(data.role === "shoppee" ? "/home" : "/dashboard");
}

export async function signupAction(data: {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role: "shopper" | "shoppee";
}): Promise<{ error: string } | undefined> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) return { error: authError.message };
  if (!user) return { error: "Signup failed — try again" };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    role: data.role,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone ?? null,
  });

  if (profileError) return { error: profileError.message };

  redirect(data.role === "shoppee" ? "/location" : "/setup");
}
