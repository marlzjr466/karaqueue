"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FormMessage } from "./form-feedback";

const initialState: ActionResult = { success: false };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <FormMessage success={state.success} message={state.message} />

      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm text-white/70">
          Display name
        </label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          required
          error={!!state.fieldErrors?.displayName}
        />
        <FieldError messages={state.fieldErrors?.displayName} />
      </div>

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

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-white/70">
          Password
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
          Confirm password
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
        {pending ? "Creating account…" : "Start Singing"}
      </Button>

      <p className="text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link href="/login" className="text-neon-blue hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
