"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { deleteAccountAction, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FormMessage } from "@/components/auth/form-feedback";

const initialState: ActionResult = { success: false };

export function ProfileForm({
  email,
  displayName
}: {
  email: string;
  displayName: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <div className="w-full max-w-sm space-y-8">
      <form action={formAction} className="space-y-4">
        <FormMessage success={state.success} message={state.message} />

        <div>
          <label className="mb-1 block text-sm text-white/70">Email</label>
          <Input value={email} disabled />
        </div>

        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm text-white/70">
            Display name
          </label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={displayName}
            required
            error={!!state.fieldErrors?.displayName}
          />
          <FieldError messages={state.fieldErrors?.displayName} />
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <p className="text-sm font-semibold text-red-300">Danger zone</p>
        <p className="mt-1 text-sm text-white/50">
          Deleting your account permanently removes your profile, queue, and playlists.
          This cannot be undone.
        </p>
        <form action={deleteAccountAction} className="mt-4">
          <Button type="submit" variant="danger" size="sm">
            Delete account
          </Button>
        </form>
      </div>
    </div>
  );
}
