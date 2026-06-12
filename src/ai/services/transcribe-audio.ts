export async function transcribeAudio(input: {
  audioBuffer: Buffer;
  filename: string;
  locale: "pl" | "en";
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(input.audioBuffer)], {
    type: guessMimeType(input.filename),
  });
  formData.append("file", blob, input.filename);
  formData.append("model", "gpt-4o-mini-transcribe");
  formData.append("language", input.locale);
  formData.append("response_format", "json");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Transcription failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as { text?: string };
  return (payload.text ?? "").trim();
}

function guessMimeType(filename: string): string {
  if (filename.endsWith(".webm")) return "audio/webm";
  if (filename.endsWith(".mp4") || filename.endsWith(".m4a")) return "audio/mp4";
  if (filename.endsWith(".wav")) return "audio/wav";
  if (filename.endsWith(".ogg")) return "audio/ogg";
  return "audio/webm";
}
