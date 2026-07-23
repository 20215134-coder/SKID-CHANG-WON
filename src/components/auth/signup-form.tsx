"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signup } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: undefined };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>
          가입 신청 후 관리자 승인이 완료되면 이용할 수 있습니다. 기본 권한은 팀원(Member)으로 부여됩니다.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">이름</Label>
            <Input id="fullName" name="fullName" type="text" placeholder="홍길동" required autoComplete="name" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="studentId">학번</Label>
            <Input id="studentId" name="studentId" type="text" placeholder="20231234" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="department">파트</Label>
            <Input id="department" name="department" type="text" placeholder="예: 파워트레인, 섀시, 전장" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">연락처</Label>
            <Input id="phone" name="phone" type="tel" placeholder="010-1234-5678" autoComplete="tel" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" placeholder="you@fsae.team" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "가입 중..." : "회원가입"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
