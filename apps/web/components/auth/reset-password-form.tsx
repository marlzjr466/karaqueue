"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FormMessage } from "./form-feedback";

const initialState: ActionResult = { success: false };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <FormMessage success={state.success} message={state.message} />

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-white/70">
          New password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          error={!!state.fieldErrors?.password}
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm text-white/70">
          Confirm new password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={!!state.fieldErrors?.confirmPassword}
        />
        <FieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
