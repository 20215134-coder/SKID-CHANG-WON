import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Ban, Hourglass } from "lucide-react";

import { logout } from "@/features/auth/actions";
import { getCurrentProfile } from "@/services/profile-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "계정 상태 | SKID",
};

export default async function AccountStatusPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.status === "active") redirect("/dashboard");

  const isPending = profile.status === "pending";

  return (
    <Card>
      <CardHeader className="items-center text-center">
        {isPending ? (
          <Hourglass className="mb-2 size-10 text-primary" />
        ) : (
          <Ban className="mb-2 size-10 text-destructive" />
        )}
        <CardTitle>{isPending ? "관리자 승인 대기 중입니다" : "비활성화된 계정입니다"}</CardTitle>
        <CardDescription>
          {isPending
            ? "가입 신청이 접수되었습니다. 관리자가 승인하면 서비스를 이용하실 수 있습니다."
            : "관리자에 의해 계정 접근이 제한되었습니다. 문의사항은 관리자에게 연락해주세요."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <form action={logout}>
          <Button type="submit" variant="outline">
            로그아웃
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
