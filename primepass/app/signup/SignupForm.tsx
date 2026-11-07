"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import RoleToggle, { type AuthRole } from "@/components/RoleToggle";
import { homeFor } from "@/lib/hooks";
import { normalizePhone, PHONE_ERROR } from "@/lib/phone";
import { safeNext } from "@/lib/safeNext";
import { signUp, StoreError } from "@/lib/store";

type Errors = Partial<Record<"fullName" | "email" | "phone" | "orgName" | "password" | "form", string>>;

export default function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [role, setRole] = useState<AuthRole>(params.get("role") === "organizer" ? "organizer" : "attendee");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+254 ");
  const [orgName, setOrgName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function clearError(key: keyof Errors) {
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found: Errors = {};
    if (!fullName.trim()) found.fullName = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = "Enter an email so we can send your tickets.";
    if (!normalizePhone(phone)) found.phone = PHONE_ERROR;
    if (role === "organizer" && !orgName.trim()) found.orgName = "Enter your organization or club name.";
    if (!password) found.password = "Choose a password.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const user = await signUp({ fullName, email, phone, password, role, orgName });
      router.push(next ?? homeFor(user.role));
    } catch (err) {
      setErrors({ form: err instanceof StoreError ? err.message : "Something went wrong. Please try again." });
    }
  }

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4 w-full max-w-[440px]">
      <div>
        <h1 className="m-0 text-[28px] font-extrabold">Create your account</h1>
        <p className="m-0 mt-2 text-muted">
          Already have one? <Link href={loginHref}>Sign in</Link>
        </p>
      </div>

      <RoleToggle value={role} onChange={setRole} />

      <Field id="name" label="Full name" error={errors.fullName}>
        <input
          id="name"
          className={errors.fullName ? "field field-bad" : "field"}
          autoComplete="name"
          value={fullName}
          aria-describedby={errors.fullName ? "name-error" : undefined}
          onChange={(e) => {
            setFullName(e.target.value);
            clearError("fullName");
          }}
        />
      </Field>

      <Field id="email" label="Email" error={errors.email}>
        <input
          id="email"
          type="email"
          className={errors.email ? "field field-bad" : "field"}
          autoComplete="email"
          value={email}
          aria-describedby={errors.email ? "email-error" : undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
        />
      </Field>

      <Field id="tel" label="Phone (for M-Pesa)" error={errors.phone}>
        <input
          id="tel"
          type="tel"
          className={`${errors.phone ? "field field-bad" : "field"} font-mono`}
          autoComplete="tel"
          value={phone}
          aria-describedby={errors.phone ? "tel-error" : undefined}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError("phone");
          }}
        />
      </Field>

      {role === "organizer" && (
        <div className="enter">
          <Field id="org" label="Organization or club name" error={errors.orgName}>
            <input
              id="org"
              className={errors.orgName ? "field field-bad" : "field"}
              autoComplete="organization"
              value={orgName}
              aria-describedby={errors.orgName ? "org-error" : undefined}
              onChange={(e) => {
            setOrgName(e.target.value);
            clearError("orgName");
          }}
            />
            <p className="field-help">We check every organizer before their first event goes live.</p>
          </Field>
        </div>
      )}

      <Field id="pw" label="Password" error={errors.password}>
        <div className="relative">
          <input
            id="pw"
            type={showPw ? "text" : "password"}
            className={`${errors.password ? "field field-bad" : "field"} pr-24`}
            autoComplete="new-password"
            value={password}
            aria-describedby={errors.password ? "pw-error" : "pw-help"}
            onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
          }}
          />
          <button
            type="button"
            className="absolute right-1 top-1 h-11 min-w-16 border-0 bg-transparent text-peach text-[14px] font-extrabold"
            aria-pressed={showPw}
            onClick={() => setShowPw((v) => !v)}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        <p id="pw-help" className="field-help">
          Demo mode: your password is not stored.
        </p>
      </Field>

      {errors.form && (
        <p role="alert" className="enter field-error">
          {errors.form}
        </p>
      )}

      <button type="submit" className="btn btn-cta min-h-14 mt-1 text-[17px]">
        {role === "attendee" ? "Create account" : "Apply as organizer"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="enter field-error">
          {error}
        </p>
      )}
    </div>
  );
}
