import { Badge } from "@/components/ui/badge";

export function DepartmentBadge({ department }: { department: string | null }) {
  if (!department) {
    return <span className="text-sm text-muted-foreground">미지정</span>;
  }

  return <Badge variant="outline">{department}</Badge>;
}
