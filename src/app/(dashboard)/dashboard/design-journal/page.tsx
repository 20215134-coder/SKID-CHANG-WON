import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import { BOM_CATEGORIES } from "@/lib/bom/constants";
import { listDesignJournals } from "@/services/design-journal-service";
import { CreateDesignJournalButton } from "@/components/design-journal/create-design-journal-button";
import { DesignJournalCard } from "@/components/design-journal/design-journal-card";
import { JournalFilters } from "@/components/journal/journal-filters";
import type { BomCategory } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Design Journal | SKID",
};

export default async function DesignJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  await requireUser();
  const { category, search } = await searchParams;

  const selectedCategory = category && BOM_CATEGORIES.includes(category as BomCategory) ? (category as BomCategory) : undefined;

  const journals = await listDesignJournals({ engineeringCategory: selectedCategory, search });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Design Journal</h2>
          <p className="text-sm text-muted-foreground">설계 및 엔지니어링 히스토리를 기록합니다.</p>
        </div>
        <CreateDesignJournalButton />
      </div>

      <JournalFilters searchPlaceholder="제목 또는 태그 검색" />

      {journals.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">등록된 게시글이 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {journals.map((journal) => (
            <DesignJournalCard key={journal.id} journal={journal} />
          ))}
        </div>
      )}
    </div>
  );
}
