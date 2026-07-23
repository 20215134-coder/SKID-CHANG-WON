"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InventoryItemOption } from "@/services/inventory-service";

export interface ConsumableEntry {
  itemId: string;
  quantity: number;
}

export function ConsumablePicker({
  items,
  entries,
  onChange,
}: {
  items: InventoryItemOption[];
  entries: ConsumableEntry[];
  onChange: (entries: ConsumableEntry[]) => void;
}) {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const itemById = new Map(items.map((item) => [item.id, item]));
  const availableItems = items.filter((item) => !entries.some((entry) => entry.itemId === item.id));

  function handleAdd() {
    const parsedQuantity = Number(quantity);
    if (!itemId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;

    onChange([...entries, { itemId, quantity: parsedQuantity }]);
    setItemId("");
    setQuantity("1");
  }

  function handleRemove(id: string) {
    onChange(entries.filter((entry) => entry.itemId !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Select value={itemId} onValueChange={(value) => setItemId(value ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="소모품 선택" />
          </SelectTrigger>
          <SelectContent>
            {availableItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.itemName} (재고 {item.currentQuantity}
                {item.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className="w-24"
        />
        <Button type="button" variant="outline" size="icon" onClick={handleAdd} disabled={!itemId} aria-label="추가">
          <Plus />
        </Button>
      </div>

      {entries.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => {
            const item = itemById.get(entry.itemId);
            return (
              <li key={entry.itemId} className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-sm">
                <span>
                  {item?.itemName ?? entry.itemId} · {entry.quantity}
                  {item?.unit}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => handleRemove(entry.itemId)}
                  aria-label="제거"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
