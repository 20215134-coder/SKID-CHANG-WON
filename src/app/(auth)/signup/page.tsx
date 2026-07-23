import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "회원가입 | FSAE ERP",
};

export default function SignupPage() {
  return <SignupForm />;
}
