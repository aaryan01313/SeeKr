"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
  type SetStateAction,
} from "react";
import {
  AlertCircle,
  GraduationCap,
  LoaderCircle,
  Plus,
  Send,
} from "lucide-react";
import { SourcesPanel } from "@/components/sources-panel";
import {
  parseSearchResponse,
  readErrorMessage,
  type SearchResponse,
} from "@/lib/search";

import { Playfair_Display } from "next/font/google";
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "900"], style: ["normal", "italic"] });

type UserMessage = {
  id: string;
  role: "user";
  content: string;
};

type AssistantMessage = {
  id: string;
  role: "assistant";
} & SearchResponse;

type ErrorMessage = {
  id: string;
  role: "error";
  content: string;
  query: string;
};

type ChatMessage = UserMessage | AssistantMessage | ErrorMessage;
type Status = "idle" | "loading";

const SAMPLE_QUESTIONS = [
  "Where is the CSS box model explained?",
  "In which video do we set up the VS Code environment?",
  "Find the timestamp for semantic HTML tags.",
];

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const fieldId = useId();
  const loading = status === "loading";

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const ask = useCallback(async (query: string) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");

    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        appendError(
          setMessages,
          readErrorMessage(
            payload,
            "Could not complete that search.",
          ),
          query,
        );
        return;
      }

      const parsed = parseSearchResponse(payload);
      if (!parsed) {
        appendError(
          setMessages,
          "The search service returned an unexpected response.",
          query,
        );
        return;
      }

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", ...parsed },
      ]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      appendError(
        setMessages,
        "Could not reach the search service. Confirm it is running, then try again.",
        query,
      );
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setStatus("idle");
      }
    }
  }, []);

  function submitQuery(query: string) {
    const next = query.trim();
    if (!next || loading) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: next },
    ]);
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    void ask(next);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuery(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function retry(messageId: string, query: string) {
    if (loading) return;
    setMessages((current) => current.filter((message) => message.id !== messageId));
    void ask(query);
  }
 
  function resetConversation() {
    requestRef.current?.abort();
    requestRef.current = null;
    setMessages([]);
    setDraft("");
    setStatus("idle");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    textareaRef.current?.focus();
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="relative shrink-0 border-b border-white/10 bg-graphite/90 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sunshine text-graphite">
              <GraduationCap className="size-4" aria-hidden />
            </span>
            <h1 className="truncate text-sm font-semibold tracking-tight text-cloud">
              SeeKr
            </h1>
          </div>

          {messages.length > 0 ? (
            <button
              type="button"
              onClick={resetConversation}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium tracking-wide text-cloud transition-colors hover:border-sunshine/50 hover:text-sunshine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunshine"
            >
              <Plus className="size-3.5" aria-hidden />
              New search
            </button>
          ) : null}
        </div>
        {loading ? <div className="loading-bar absolute inset-x-0 bottom-0" /> : null}
      </header>

      <div
        ref={scrollerRef}
        className="transcript min-h-0 flex-1 overflow-y-auto"
        aria-live="polite"
        aria-busy={loading}
      >
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-8 text-left sm:px-6">
          {messages.length === 0 ? (
            <EmptyState disabled={loading} onSelect={submitQuery} />
          ) : (
            <ol className="flex flex-col gap-8">
              {messages.map((message) => (
                <li key={message.id}>
                  {message.role === "user" ? (
                    <UserTurn content={message.content} />
                  ) : null}
                  {message.role === "assistant" ? (
                    <AssistantTurn message={message} />
                  ) : null}
                  {message.role === "error" ? (
                    <ErrorTurn
                      message={message}
                      disabled={loading}
                      onRetry={() => retry(message.id, message.query)}
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          )}

          {loading ? <LoadingTurn /> : null}
        </div>
      </div>

      <div className="composer-safe shrink-0 border-t border-white/10 bg-graphite">
        <form
          onSubmit={onSubmit}
          className="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6"
        >
          <label htmlFor={fieldId} className="sr-only">
            Search the lectures
          </label>
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-graphite-raised p-2 focus-within:border-sunshine/60 focus-within:ring-2 focus-within:ring-sunshine/30">
            <textarea
              ref={textareaRef}
              id={fieldId}
              rows={1}
              value={draft}
              placeholder="Ask what you're looking for"
              autoComplete="off"
              enterKeyHint="send"
              disabled={loading}
              onChange={(event) => {
                setDraft(event.target.value);
                resizeTextarea(event.target);
              }}
              onKeyDown={onKeyDown}
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-cloud outline-none placeholder:text-cloud-muted disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || draft.trim().length === 0}
              aria-label="Send message"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sunshine px-3.5 text-sm font-semibold text-graphite transition-colors hover:bg-[#e0b40f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunshine focus-visible:ring-offset-2 focus-visible:ring-offset-graphite disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
            >
              <Send className="size-4" aria-hidden />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="px-1 pt-2.5 pb-4 text-xs tracking-wide text-cloud-muted">
            Enter to send. Shift + Enter for a new line.
          </p>
        </form>
      </div>
    </div>
  );
}

function EmptyState({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (query: string) => void;
}) {
  return (
    <div className="w-full max-w-2xl py-8 text-left">
      <h1 className={`${playfair.className} text-6xl font-black italic tracking-normal text-sunshine drop-shadow-sm sm:text-7xl`}>
        SeeKr.
      </h1>
      <h2 className="mt-6 text-2xl font-medium tracking-tight text-cloud sm:text-3xl">
        Find exact videos and timestamps.
      </h2>
      <p className="mt-5 text-base leading-7 text-cloud-muted">
        Search through lecture transcripts instantly. Enter a query to find the exact video and timestamp for any topic without scrubbing through hours of lectures.
      </p>
      <ul className="mt-10 flex flex-col gap-3">
        {SAMPLE_QUESTIONS.map((question) => (
          <li key={question}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(question)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left text-sm leading-6 text-cloud transition-colors hover:border-sunshine/40 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunshine disabled:opacity-50"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserTurn({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-cloud-muted">
        You
      </p>
      <div className="max-w-[min(32rem,85%)] rounded-2xl rounded-br-md bg-graphite-bubble px-4 py-3 text-[15px] leading-6 text-cloud">
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}

function AssistantTurn({ message }: { message: AssistantMessage }) {
  return (
    <article className="border-l-2 border-sunshine pl-4">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-cloud-muted">
        Result
      </p>
      {message.answer.trim() ? (
        <AnswerText answer={message.answer} />
      ) : (
        <p className="text-sm text-cloud-muted">
          The search returned an empty answer.
        </p>
      )}
      <p className="mt-3 text-xs tracking-wide text-cloud-muted">
        <span className="font-medium uppercase tracking-[0.16em]">Model</span>
        <span className="px-2 text-white/25" aria-hidden>
          /
        </span>
        <span className="font-mono text-cloud">{message.model}</span>
      </p>
      <SourcesPanel sources={message.sources} />
    </article>
  );
}

function AnswerText({ answer }: { answer: string }) {
  const paragraphs = answer
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="max-w-[68ch] text-[15.5px] leading-7 whitespace-pre-wrap text-cloud"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function LoadingTurn() {
  return (
    <div className="mt-8 border-l-2 border-sunshine/50 pl-4" role="status">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-cloud-muted">
        SeeKr.
      </p>
      <div className="flex items-center gap-3">
        <LoaderCircle
          className="size-4 animate-spin text-sunshine motion-reduce:animate-none"
          aria-hidden
        />
        <p className="text-sm tracking-wide text-cloud">Searching the lectures...</p>
      </div>
    </div>
  );
}

function ErrorTurn({
  message,
  disabled,
  onRetry,
}: {
  message: ErrorMessage;
  disabled: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="max-w-xl rounded-xl border border-white/10 bg-graphite-raised px-4 py-3.5"
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-sunshine" aria-hidden />
        <div>
          <p className="text-sm font-medium text-cloud">Answer unavailable</p>
          <p className="mt-1 text-sm leading-6 text-cloud-muted">{message.content}</p>
          <button
            type="button"
            onClick={onRetry}
            disabled={disabled}
            className="mt-3 rounded-lg border border-sunshine/40 px-3 py-1.5 text-xs font-medium tracking-wide text-sunshine transition-colors hover:bg-sunshine hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunshine disabled:opacity-40"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function appendError(
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  content: string,
  query: string,
) {
  setMessages((current) => [
    ...current,
    { id: crypto.randomUUID(), role: "error", content, query },
  ]);
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "0px";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}