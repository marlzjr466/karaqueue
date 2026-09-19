"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FormMessage } from "./form-feedback";

const initialState: ActionResult = { success: false };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

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

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm text-white/70">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-neon-blue hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={!!state.fieldErrors?.password}
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-white/50">
        New here?{" "}
        <Link href="/register" className="text-neon-blue hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
