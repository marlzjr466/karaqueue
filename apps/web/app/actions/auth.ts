"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "@karaoke-queue/validation";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function signUpAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const { email, password, displayName } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${SITE_URL}/auth/callback`
    }
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "Check your inbox to confirm your email and finish signing up."
  };
}

export async function signInAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, message: "Incorrect email or password." };
  }

  const next = (formData.get("next") as string | null) || "/dashboard";
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`
  });

  // Always return success-shaped copy regardless of whether the email
  // exists, to avoid leaking which emails are registered.
  if (error) {
    return {
      success: true,
      message: "If an account exists for that email, a reset link is on its way."
    };
  }

  return {
    success: true,
    message: "If an account exists for that email, a reset link is on its way."
  };
}

export async function resetPasswordAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    return { success: false, message: error.message };
  }

  redirect("/dashboard");
}

export async function deleteAccountAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Deleting the auth.users row requires the service-role key (admin API)
  // since a user cannot delete themselves under RLS. This calls a
  // server-only helper — never exposed to the client.
  const { deleteUserAccount } = await import("@/lib/auth/delete-account");
  const { error } = await deleteUserAccount(user.id);

  if (error) {
    redirect("/profile?error=delete_failed");
  }

  await supabase.auth.signOut();
  redirect("/");
}
