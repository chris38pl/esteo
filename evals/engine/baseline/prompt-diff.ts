export type PromptBlock = {
  heading: string;
  body: string;
};

export function splitPromptBlocks(prompt: string): PromptBlock[] {
  const lines = prompt.split("\n");
  const blocks: PromptBlock[] = [];
  let currentHeading = "(preamble)";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentLines.length > 0 || currentHeading !== "(preamble)") {
        blocks.push({
          heading: currentHeading,
          body: currentLines.join("\n").trim(),
        });
      }
      currentHeading = line.slice(3).trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  blocks.push({
    heading: currentHeading,
    body: currentLines.join("\n").trim(),
  });

  return blocks.filter((b) => b.heading || b.body);
}

export function diffPromptBlocks(
  before: string,
  after: string,
): string[] {
  const beforeBlocks = new Map(
    splitPromptBlocks(before).map((b) => [b.heading, b.body]),
  );
  const afterBlocks = new Map(
    splitPromptBlocks(after).map((b) => [b.heading, b.body]),
  );

  const lines: string[] = [];
  const allHeadings = new Set([...beforeBlocks.keys(), ...afterBlocks.keys()]);

  for (const heading of allHeadings) {
    const b = beforeBlocks.get(heading);
    const a = afterBlocks.get(heading);
    if (b === undefined && a !== undefined) {
      lines.push(`+ ## ${heading}`);
    } else if (b !== undefined && a === undefined) {
      lines.push(`- ## ${heading}`);
    } else if (b !== a) {
      lines.push(`~ ## ${heading} (content changed)`);
    }
  }

  return lines;
}

export function formatPromptDiff(
  baselineVersion: string,
  currentVersion: string,
  canonicalScenario: string,
  before: string,
  after: string,
): string {
  const changes = diffPromptBlocks(before, after);
  const header = [
    `Prompt Diff: ${baselineVersion} → ${currentVersion}`,
    `Canonical scenario: ${canonicalScenario}`,
    "",
  ];

  if (changes.length === 0) {
    return [...header, "(no block-level changes)"].join("\n");
  }

  return [...header, ...changes].join("\n");
}
