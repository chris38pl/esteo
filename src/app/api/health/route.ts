import { NextResponse } from "next/server";

import { prisma } from "@/db/client";
import { isDatabaseUnavailable } from "@/lib/database/is-database-unavailable";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ database: "ok" });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      console.error(
        JSON.stringify({
          event: "health_check_failed",
          errorName: error instanceof Error ? error.name : undefined,
        }),
      );
    }

    return NextResponse.json({ database: "unreachable" }, { status: 503 });
  }
}
