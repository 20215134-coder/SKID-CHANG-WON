import type { Metadata } from "next";
import { MailCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "이메일을 확인해주세요 | FSAE ERP",
};

export default function CheckEmailPage() {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <MailCheck className="mb-2 size-10 text-primary" />
        <CardTitle>이메일을 확인해주세요</CardTitle>
        <CardDescription>
          입력하신 이메일 주소로 인증 링크를 보냈습니다. 메일함에서 링크를 클릭한 뒤, 관리자 승인이 완료되면
          이용하실 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        로컬 개발 환경에서는 Inbucket(http://127.0.0.1:54324)에서 메일을 확인할 수 있습니다.
      </CardContent>
    </Card>
  );
}
