import { prisma } from "@/db/client";

export async function resolveUserEmailsByIds(
  userIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => Boolean(id)))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, email: true },
  });

  return new Map(users.map((user) => [user.id, user.email]));
}
