import { NextResponse } from "next/server";

import { prisma } from "@/db/client";
import { isDatabaseUnavailable } from "@/lib/database/is-database-unavailable";
import { getReferralCouponId } from "@/features/referrals/server/referral-checkout-discount";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const body: { database: string; referralCouponConfigured?: boolean } = {
      database: "ok",
    };

    if (process.env.VERCEL_ENV === "preview") {
      body.referralCouponConfigured = Boolean(getReferralCouponId());
    }

    return NextResponse.json(body);
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
