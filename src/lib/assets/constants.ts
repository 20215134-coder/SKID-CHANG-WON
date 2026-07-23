import type { AssetCondition } from "@/types/database.types";

export const ASSET_CONDITIONS: AssetCondition[] = ["excellent", "good", "fair", "poor", "out_of_service"];

export const ASSET_CONDITION_LABELS: Record<AssetCondition, string> = {
  excellent: "우수",
  good: "양호",
  fair: "보통",
  poor: "불량",
  out_of_service: "사용불가",
};
