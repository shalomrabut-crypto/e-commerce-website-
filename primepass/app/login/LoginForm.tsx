"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import RoleToggle, { type AuthRole } from "@/components/RoleToggle";
import { homeFor } from "@/lib/hooks";
import { safeNext } from "@/lib/safeNext";
import { DEMO_LOGINS } from "@/lib/seed";
import { logIn, logOut, StoreError } from "@/lib/store";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [role, setRole] = useState<AuthRole>("attendee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function enter(address: string, checkRole: boolean) {
    setError(null);
    try {
      const user = await logIn(address);
      if (checkRole && user.role !== "admin" && user.role !== role) {
        await logOut();
        setError(
          user.role === "organizer"
            ? "This email belongs to an organizer. Choose I'm organizing above."
            : "This email belongs to an attendee. Choose I'm attending above.",
        );
        return;
      }
      router.push(next ?? homeFor(user.role));
    } catch (err) {
      setError(err instanceof StoreError ? err.message : "Something went wrong. Please try again.");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    void enter(email, true);
  }

  const signupParams = new URLSearchParams();
  if (next) signupParams.set("next", next);
  if (role === "organizer") signupParams.set("role", "organizer");
  const query = signupParams.toString();

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4 w-full max-w-[440px]">
      <div>
        <h1 className="m-0 text-[28px] font-extrabold">Sign in</h1>
        <p className="m-0 mt-2 text-muted">
          New here? <Link href={`/signup${query ? `?${query}` : ""}`}>Create an account</Link>
        </p>
      </div>

      <RoleToggle
        value={role}
        onChange={(r) => {
          setRole(r);
          setError(null);
        }}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={error ? "field field-bad" : "field"}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="pw" className="label">
          Password
        </label>
        <input
          id="pw"
          type="password"
          className="field"
          autoComplete="current-password"
          aria-describedby="pw-help"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p id="pw-help" className="field-help">
          Demo mode: only the email is checked. Real auth needs a server.
        </p>
      </div>

      {error && (
        <p role="alert" className="enter field-error">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-cta min-h-14 mt-1 text-[17px]">
        Sign in
      </button>

      <div className="mt-4 pt-6 border-t-2 border-dashed border-line flex flex-col gap-3">
        <p className="m-0 font-mono text-[14px] text-peach">ONE-CLICK DEMO LOGINS</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_LOGINS.map((d) => (
            <button
              key={d.email}
              type="button"
              className="btn btn-ghost flex-1"
              aria-label={`Sign in as demo ${d.label.toLowerCase()}, ${d.email}`}
              onClick={() => void enter(d.email, false)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
