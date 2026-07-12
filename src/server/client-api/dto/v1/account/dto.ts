import { z } from "zod";

export const accountProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  avatarPreset: z.string().nullable(),
  avatarSource: z.enum(["CLERK", "PRESET"]),
  avatarUrl: z.string().nullable(),
});

export type AccountProfile = z.infer<typeof accountProfileSchema>;
