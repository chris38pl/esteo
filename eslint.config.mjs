import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Client API must never touch the database directly. Data flows strictly
  // Prisma -> Service -> Mapper -> DTO, so importing Prisma (or the db client)
  // anywhere under client-api is forbidden.
  {
    files: ["src/server/client-api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "Client API must not import Prisma. Go through the service layer (Prisma -> Service -> Mapper -> DTO).",
            },
            {
              name: "@/db/client",
              message:
                "Client API must not access the database directly. Go through the service layer.",
            },
          ],
          patterns: [
            {
              group: ["@prisma/*", "**/db/client"],
              message:
                "Client API must not import Prisma / the db client. Go through the service layer.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
