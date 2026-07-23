import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { BOM_CATEGORIES } from "@/lib/bom/constants";
import { listWorkJournals } from "@/services/work-journal-service";
import { CreateWorkJournalButton } from "@/components/work-journal/create-work-journal-button";
import { WorkJournalCard } from "@/components/work-journal/work-journal-card";
import { JournalFilters } from "@/components/journal/journal-filters";
import type { BomCategory } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Work Journal | SKID",
};

export default async function WorkJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  await requireUser();
  const { category, search } = await searchParams;

  const selectedCategory = category && BOM_CATEGORIES.includes(category as BomCategory) ? (category as BomCategory) : undefined;

  const journals = await listWorkJournals({ engineeringCategory: selectedCategory, search });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Work Journal</h2>
          <p className="text-sm text-muted-foreground">제작 및 조립 작업 내역을 기록합니다.</p>
        </div>
        <CreateWorkJournalButton />
      </div>

      <JournalFilters searchPlaceholder="제목 검색" />

      {journals.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 작업일지가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {journals.map((journal) => (
            <WorkJournalCard key={journal.id} journal={journal} />
          ))}
        </div>
      )}
    </div>
  );
}
