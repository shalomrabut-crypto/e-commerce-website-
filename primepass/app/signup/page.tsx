import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPanel from "@/components/AuthPanel";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthPanel>
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthPanel>
  );
}
