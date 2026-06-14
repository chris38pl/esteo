import { PrismaClient } from "@prisma/client";

import { seedIndustryFieldCatalog } from "./seed-industry-fields";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding platform catalog (no users/workspaces)…");

  const industryFields = await seedIndustryFieldCatalog(prisma);
  console.log(
    `  Industry fields: ${industryFields.created} created, ${industryFields.updated} updated (${industryFields.total} in repo catalog)`,
  );

  console.log("Catalog seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
