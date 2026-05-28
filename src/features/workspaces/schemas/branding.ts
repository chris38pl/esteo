import { z } from "zod";

export const workspaceBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().min(1).optional(),
  accentColor: z.string().min(1).optional(),
});

export type WorkspaceBranding = z.infer<typeof workspaceBrandingSchema>;
