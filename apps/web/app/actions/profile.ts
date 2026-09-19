"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./auth";

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(50, "Display name is too long.")
});

export async function updateProfileAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName")
  });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) {
    return { success: false, message: "Could not update your profile. Try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true, message: "Profile updated." };
}
