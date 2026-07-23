"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MemberOption } from "@/services/team-service";

export function ParticipantPicker({
  members,
  selectedIds,
  onChange,
}: {
  members: MemberOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border p-1">
      {members.length === 0 ? (
        <p className="p-2 text-sm text-muted-foreground">선택 가능한 팀원이 없습니다.</p>
      ) : (
        members.map((member) => {
          const selected = selectedIds.includes(member.id);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => toggle(member.id)}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                selected && "bg-muted",
              )}
            >
              <span>{member.label}</span>
              {selected ? <Check className="size-3.5 text-primary" /> : null}
            </button>
          );
        })
      )}
    </div>
  );
}
