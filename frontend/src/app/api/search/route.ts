import { parseSearchResponse } from "@/lib/search";

const SEARCH_URL = "http://localhost:8000/search";
const TIMEOUT_MS = 120_000;

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Send a JSON body with a query." },
      { status: 400 },
    );
  }

  const query =
    payload &&
    typeof payload === "object" &&
    "query" in payload &&
    typeof payload.query === "string"
      ? payload.query.trim()
      : "";

  if (!query) {
    return Response.json(
      { error: "Enter a question before sending." },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const raw = await upstream.text();
    let data: unknown = null;

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        return Response.json(
          {
            error:
              "The search service returned a response that was not valid JSON.",
          },
          { status: 502 },
        );
      }
    }

    if (!upstream.ok) {
      return Response.json(
        { error: upstreamError(data, upstream.status) },
        { status: upstream.status },
      );
    }

    const parsed = parseSearchResponse(data);
    if (!parsed) {
      return Response.json(
        { error: "The search service returned an unexpected response." },
        { status: 502 },
      );
    }

    return Response.json(parsed);
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    return Response.json(
      {
        error: timedOut
          ? "The search service took too long to respond."
          : "Could not reach the search service at http://localhost:8000/search.",
      },
      { status: 502 },
    );
  }
}

function upstreamError(value: unknown, status: number): string {
  if (value && typeof value === "object" && "detail" in value) {
    const detail = value.detail;
    if (typeof detail === "string" && detail.trim()) return detail.trim();
  }

  if (value && typeof value === "object" && "error" in value) {
    const error = value.error;
    if (typeof error === "string" && error.trim()) return error.trim();
  }

  return `The search service returned status ${status}.`;
}
