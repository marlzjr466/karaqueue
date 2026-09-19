"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FormMessage } from "./form-feedback";

const initialState: ActionResult = { success: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <FormMessage success={state.success} message={state.message} />

      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-white/70">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={!!state.fieldErrors?.email}
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-white/50">
        <Link href="/login" className="text-neon-blue hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
