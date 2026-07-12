import { z } from "zod";

import { updateUserAvatarPreset } from "@/features/users/server/profile-service";
import { accountProfileSchema } from "@/server/client-api/dto/v1/account/dto";
import { toAccountProfile } from "@/server/client-api/dto/v1/account/mapper";
import { router } from "@/server/trpc/init";
import { protectedProcedure } from "@/server/trpc/procedures";

const avatarPresetSchema = z.enum([
  "accountant",
  "architect",
  "carpenter",
  "constructor",
  "electrician",
  "engineer",
]);

export const accountRouter = router({
  updateProfile: protectedProcedure
    .input(z.object({ avatarPreset: avatarPresetSchema }))
    .output(accountProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await updateUserAvatarPreset(ctx.user.id, input.avatarPreset);
      return toAccountProfile(updated);
    }),
});
