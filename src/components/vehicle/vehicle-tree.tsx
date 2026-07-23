"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { BOM_CATEGORY_LABELS } from "@/lib/bom/constants";
import { cn } from "@/lib/utils";
import type { TreeCategory } from "@/services/vehicle-tree-service";

function collectActiveAncestors(categories: TreeCategory[], pathname: string): Set<string> {
  const ids = new Set<string>();

  for (const category of categories) {
    let categoryActive = pathname.includes(category.id);

    for (const subsystem of category.subsystems) {
      let subsystemActive = pathname.includes(subsystem.id);

      for (const assembly of subsystem.assemblies) {
        const assemblyActive = pathname.includes(assembly.id) || assembly.parts.some((part) => pathname.includes(part.id));
        if (assemblyActive) {
          ids.add(assembly.id);
          subsystemActive = true;
        }
      }

      if (subsystemActive) {
        ids.add(subsystem.id);
        categoryActive = true;
      }
    }

    if (categoryActive) ids.add(category.id);
  }

  return ids;
}

function TreeNode({
  label,
  href,
  active,
  hasChildren,
  expanded,
  onToggle,
  depth,
  children,
}: {
  label: string;
  href: string;
  active: boolean;
  hasChildren: boolean;
  expanded: boolean;
  onToggle: () => void;
  depth: number;
  children?: ReactNode;
}) {
  return (
    <div>
      <div
        className={cn("flex items-center gap-1 rounded-md hover:bg-muted", active && "bg-muted")}
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <button
          type="button"
          onClick={onToggle}
          className={cn("flex size-5 shrink-0 items-center justify-center", !hasChildren && "invisible")}
          aria-label={expanded ? "접기" : "펼치기"}
        >
          <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
        </button>
        <Link
          href={href}
          className={cn("flex-1 truncate py-1 text-sm hover:underline", active && "font-medium text-foreground")}
        >
          {label}
        </Link>
      </div>
      {expanded && hasChildren ? <div>{children}</div> : null}
    </div>
  );
}

export function VehicleTree({ vehicleId, categories }: { vehicleId: string; categories: TreeCategory[] }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(() => collectActiveAncestors(categories, pathname));

  useEffect(() => {
    // 경로가 바뀔 때마다 활성 노드까지의 조상을 펼친 상태에 추가한다 (기존에 펼쳐둔 상태는 유지).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 라우트 변경(외부 이벤트)에 반응해 트리를 펼친다.
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of collectActiveAncestors(categories, pathname)) next.add(id);
      return next;
    });
  }, [pathname, categories]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-0.5">
      {categories.map((category) => {
        const categoryHref = `/dashboard/vehicle/${vehicleId}/categories/${category.id}`;
        return (
          <TreeNode
            key={category.id}
            label={BOM_CATEGORY_LABELS[category.name]}
            href={categoryHref}
            active={pathname === categoryHref}
            hasChildren={category.subsystems.length > 0}
            expanded={expanded.has(category.id)}
            onToggle={() => toggle(category.id)}
            depth={0}
          >
            {category.subsystems.map((subsystem) => {
              const subsystemHref = `/dashboard/vehicle/${vehicleId}/subsystems/${subsystem.id}`;
              return (
                <TreeNode
                  key={subsystem.id}
                  label={subsystem.name}
                  href={subsystemHref}
                  active={pathname === subsystemHref}
                  hasChildren={subsystem.assemblies.length > 0}
                  expanded={expanded.has(subsystem.id)}
                  onToggle={() => toggle(subsystem.id)}
                  depth={1}
                >
                  {subsystem.assemblies.map((assembly) => {
                    const assemblyHref = `/dashboard/vehicle/${vehicleId}/assemblies/${assembly.id}`;
                    return (
                      <TreeNode
                        key={assembly.id}
                        label={assembly.name}
                        href={assemblyHref}
                        active={pathname === assemblyHref}
                        hasChildren={assembly.parts.length > 0}
                        expanded={expanded.has(assembly.id)}
                        onToggle={() => toggle(assembly.id)}
                        depth={2}
                      >
                        {assembly.parts.map((part) => {
                          const partHref = `/dashboard/vehicle/${vehicleId}/parts/${part.id}`;
                          return (
                            <Link
                              key={part.id}
                              href={partHref}
                              className={cn(
                                "flex items-center truncate rounded-md py-1 pr-2 pl-[3.75rem] text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                                pathname === partHref && "bg-muted font-medium text-foreground",
                              )}
                            >
                              {part.partNumber} · {part.partName}
                            </Link>
                          );
                        })}
                      </TreeNode>
                    );
                  })}
                </TreeNode>
              );
            })}
          </TreeNode>
        );
      })}
    </div>
  );
}
