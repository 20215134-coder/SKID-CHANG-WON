"use server";

import { requireUser } from "@/lib/auth/require-user";
import { listAssemblies } from "@/services/assembly-service";
import { listSubsystems } from "@/services/subsystem-service";
import { listCategories, listVehicles } from "@/services/vehicle-service";

// Design Journal / Work Journal의 Vehicle → Engineering Category → Subsystem → Assembly
// 계층 선택 UI에서 공용으로 쓰는 조회 전용 헬퍼. Purchasing 모듈은 건드리지 않는다.

export async function fetchVehicleOptions() {
  await requireUser();
  return listVehicles();
}

export async function fetchCategoriesForVehicle(vehicleId: string) {
  await requireUser();
  return listCategories(vehicleId);
}

export async function fetchSubsystemsForCategory(categoryId: string) {
  await requireUser();
  return listSubsystems(categoryId);
}

export async function fetchAssembliesForSubsystem(subsystemId: string) {
  await requireUser();
  return listAssemblies(subsystemId);
}
