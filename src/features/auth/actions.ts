"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { loginSchema, signupSchema } from "./schemas";

export interface AuthActionState {
  error?: string;
}

const SIGNUP_ERROR_MESSAGES: Record<string, string> = {
  user_already_exists: "이미 가입된 이메일입니다.",
  email_address_invalid: "사용할 수 없는 이메일 주소입니다.",
  weak_password: "비밀번호가 너무 약합니다. 더 길고 복잡한 비밀번호를 사용해주세요.",
  over_email_send_rate_limit: "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
  signup_disabled: "현재 회원가입이 비활성화되어 있습니다. 관리자에게 문의해주세요.",
};

function signupErrorMessage(code: string | undefined): string {
  return (code && SIGNUP_ERROR_MESSAGES[code]) ?? "회원가입 중 오류가 발생했습니다.";
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "이메일과 비밀번호를 올바르게 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const redirectTo = formData.get("redirectTo");
  revalidatePath("/", "layout");
  redirect(typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    studentId: formData.get("studentId"),
    department: formData.get("department"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        student_id: parsed.data.studentId,
        department: parsed.data.department || null,
        phone: parsed.data.phone || null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error) {
    return { error: signupErrorMessage(error.code) };
  }

  redirect("/signup/check-email");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
