export type Source = {
  title: string;
  number: string | number;
  start: number;
  end: number;
  text: string;
};

export type SearchResponse = {
  answer: string;
  model: string;
  sources: Source[];
};

export function parseSearchResponse(value: unknown): SearchResponse | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.answer !== "string") return null;

  const model =
    typeof record.model === "string" && record.model.trim()
      ? record.model.trim()
      : "Unspecified";

  if (!Array.isArray(record.sources)) return null;

  const sources: Source[] = [];
  for (const item of record.sources) {
    const source = parseSource(item);
    if (!source) return null;
    sources.push(source);
  }

  return { answer: record.answer, model, sources };
}

function parseSource(value: unknown): Source | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string" || !record.title.trim()) return null;

  const number = record.number;
  if (typeof number !== "string" && typeof number !== "number") return null;

  const start = typeof record.start === "number" ? record.start : Number(record.start);
  const end = typeof record.end === "number" ? record.end : Number(record.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

  const text = typeof record.text === "string" ? record.text.trim() : "";

  return {
    title: record.title.trim(),
    number,
    start,
    end,
    text,
  };
}

export function readErrorMessage(value: unknown, fallback: string): string {
  if (!value || typeof value !== "object" || !("error" in value)) return fallback;
  const error = value.error;
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallback;
}
