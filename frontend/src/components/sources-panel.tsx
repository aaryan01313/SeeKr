"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatTimestamp, formatVideoNumber } from "@/lib/format";
import type { Source } from "@/lib/search";

export function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (sources.length === 0) {
    return (
      <p className="mt-4 text-xs tracking-wide text-cloud-muted">
        No lecture sources were returned.
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <button
        type="button"
        className="flex items-center gap-2 rounded-md py-1 text-left text-sm text-cloud transition-colors hover:text-sunshine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunshine"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <ChevronDown
          className={`size-4 shrink-0 text-sunshine transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
        <span className="font-medium">Lecture sources</span>
        <span className="font-mono text-xs text-cloud-muted">{sources.length}</span>
      </button>

      {open ? (
        <div id={panelId} className="mt-3">
          <ul className="space-y-2 md:hidden">
            {sources.map((source, index) => (
              <li
                key={sourceKey(source, index)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sunshine">
                    Video {formatVideoNumber(source.number)}
                  </p>
                  <p className="font-mono text-xs text-cloud-muted tabular-nums">
                    {formatTimestamp(source.start)} – {formatTimestamp(source.end)}
                  </p>
                </div>
                <p className="mt-2 text-sm font-medium leading-5 text-cloud">
                  {source.title}
                </p>
                {source.text ? (
                  <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-cloud-muted">
                    {source.text}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-graphite-raised md:block">
            <div className="max-h-80 overflow-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-graphite-raised text-[11px] uppercase tracking-[0.14em] text-cloud-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Video
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Title
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Timestamps
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source, index) => (
                    <tr
                      key={sourceKey(source, index)}
                      className="border-t border-white/10 align-top"
                    >
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-sunshine tabular-nums">
                        {formatVideoNumber(source.number)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-cloud">{source.title}</p>
                        {source.text ? (
                          <p className="mt-1 line-clamp-2 max-w-xl text-cloud-muted">
                            {source.text}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-cloud tabular-nums">
                        {formatTimestamp(source.start)} – {formatTimestamp(source.end)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function sourceKey(source: Source, index: number): string {
  return `${source.number}-${source.start}-${source.end}-${index}`;
}
