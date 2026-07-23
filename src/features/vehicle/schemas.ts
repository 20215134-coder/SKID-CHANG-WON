import { z } from "zod";

export const createVehicleSchema = z.object({
  vehicleName: z.string().trim().min(1, "차량 이름을 입력해주세요."),
  competitionYear: z.coerce.number().int().min(2000).max(2100),
});

export const createSubsystemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1, "Subsystem 이름을 입력해주세요."),
});

export const updateSubsystemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Subsystem 이름을 입력해주세요."),
});

export const createAssemblySchema = z.object({
  subsystemId: z.string().uuid(),
  name: z.string().trim().min(1, "Assembly 이름을 입력해주세요."),
  description: z.string().trim().optional(),
  revision: z.string().trim().optional(),
});

export const updateAssemblySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Assembly 이름을 입력해주세요."),
  description: z.string().trim().optional(),
  revision: z.string().trim().min(1, "Revision을 입력해주세요."),
});
