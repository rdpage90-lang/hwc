import { z } from "zod";

export const createDriverSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  nickname: z.string().trim().max(40).optional().nullable(),
  carColour: z.string().trim().min(1, "Car colour is required").max(30),
  avatarUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  // Set when this driver is linked to a real login account (spec: "link to
  // users so you can click through to a user's name, or manually enter if
  // they aren't a user"). Left out/null for freeform, account-less drivers.
  userId: z.string().cuid().optional().nullable(),
});

export const createChampionshipSchema = z.object({
  name: z.string().trim().min(1, "Championship name is required").max(120),
  year: z.coerce.number().int().min(1950).max(2200),
  numberOfRaces: z.coerce.number().int().min(1).max(52).default(8),
  driverIds: z.array(z.string().cuid()).min(0),
  newDrivers: z.array(createDriverSchema).default([]),
  tracks: z.array(z.string().trim().max(80)).default([]),
  pointsSystem: z.record(z.string(), z.coerce.number().int().min(0)).optional(),
});

export const addDriverToChampionshipSchema = z.object({
  driverId: z.string().cuid().optional(),
  newDriver: createDriverSchema.optional(),
});

const resultEntrySchema = z.object({
  driverId: z.string().cuid(),
  resultStatus: z.enum(["FINISHED", "DNF", "DNS"]),
  finishingPosition: z.number().int().min(1).nullable(),
});

export const submitRaceResultsSchema = z.object({
  results: z.array(resultEntrySchema).min(1),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "PLAYER"]).default("PLAYER"),
});

export type CreateChampionshipInput = z.infer<typeof createChampionshipSchema>;
export type SubmitRaceResultsInput = z.infer<typeof submitRaceResultsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
