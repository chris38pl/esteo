import "server-only";

import { prisma } from "@/db/client";
import { getStripeClient } from "@/features/billing/server/stripe-client";

export type UserBillingInvoiceItem = {
  id: string;
  number: string;
  createdAt: string;
  pdfUrl: string | null;
};

export async function getUserBillingInvoices(userId: string): Promise<UserBillingInvoiceItem[]> {
  const customers = await prisma.billingCustomer.findMany({
    where: { ownerUserId: userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });

  const stripeCustomerIds = customers
    .map((customer) => customer.stripeCustomerId)
    .filter((id): id is string => id != null);

  if (stripeCustomerIds.length === 0) {
    return [];
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return [];
  }

  try {
    const stripe = getStripeClient();
    const invoices: UserBillingInvoiceItem[] = [];

    for (const stripeCustomerId of stripeCustomerIds) {
      const { data } = await stripe.invoices.list({
        customer: stripeCustomerId,
        status: "paid",
        limit: 100,
      });

      for (const invoice of data) {
        invoices.push({
          id: invoice.id,
          number: invoice.number ?? invoice.id,
          createdAt: new Date(invoice.created * 1000).toISOString(),
          pdfUrl: invoice.invoice_pdf ?? null,
        });
      }
    }

    return invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}
