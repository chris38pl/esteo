import { defineConfig } from "@trigger.dev/sdk";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { puppeteer } from "@trigger.dev/build/extensions/puppeteer";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_qoakmklufatitghsdkqt",
  dirs: ["./src/trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    external: ["uploadthing", "sharp", "puppeteer-core"],
    extensions: [
      additionalFiles({
        files: ["public/images/pdf/**", "public/fonts/pdf/**"],
      }),
      prismaExtension({ schema: "prisma/schema.prisma", mode: "legacy" }),
      puppeteer(),
    ],
  },
});
