export type ParsedDevBillingArgs = {
  slug?: string;
  plan?: string;
  status?: string;
  event?: string;
  owner?: string;
  stripeStatus?: string;
};

export function parseDevBillingArgs(argv: string[]): ParsedDevBillingArgs {
  const result: ParsedDevBillingArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--slug" && argv[index + 1]) {
      result.slug = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--plan" && argv[index + 1]) {
      result.plan = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--status" && argv[index + 1]) {
      result.status = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--event" && argv[index + 1]) {
      result.event = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--owner" && argv[index + 1]) {
      result.owner = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--slug=")) {
      result.slug = arg.slice("--slug=".length);
      continue;
    }

    if (arg.startsWith("--plan=")) {
      result.plan = arg.slice("--plan=".length);
      continue;
    }

    if (arg.startsWith("--status=")) {
      result.status = arg.slice("--status=".length);
      continue;
    }

    if (arg.startsWith("--event=")) {
      result.event = arg.slice("--event=".length);
      continue;
    }

    if (arg.startsWith("--owner=")) {
      result.owner = arg.slice("--owner=".length);
    }
  }

  return result;
}

export function requireSlug(args: ParsedDevBillingArgs): string {
  if (!args.slug?.trim()) {
    throw new Error("Missing required --slug <workspaceSlug>.");
  }
  return args.slug.trim();
}
