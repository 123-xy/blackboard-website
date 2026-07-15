"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { globalSearchAction } from "@/app/actions/dashboard-actions";

type Results = Awaited<ReturnType<typeof globalSearchAction>>;

export default function GlobalSearch({
  onSelectReservation,
  onSelectInquiry,
}: {
  onSelectReservation: (search: string) => void;
  onSelectInquiry: (search: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timeout = setTimeout(() => {
      globalSearchAction(query).then((r) => {
        setResults(r);
        setOpen(true);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) setResults(null);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasResults = results?.ok && (results.reservations.length > 0 || results.inquiries.length > 0);

  return (
    <div ref={boxRef} className="relative w-full max-w-[320px]">
      <div className="flex items-center gap-2 rounded-lg border border-card-border bg-cream-input px-3 py-2">
        <Search size={15} className="flex-none text-muted" />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search reservations, inquiries…"
          className="w-full min-w-0 bg-transparent text-sm text-heading placeholder:text-muted focus:outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults(null);
              setOpen(false);
            }}
            aria-label="Clear search"
          >
            <X size={14} className="text-muted hover:text-heading" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full max-w-[380px] rounded-lg border border-card-border bg-surface p-2 shadow-xl">
          {!results ? (
            <div className="px-3 py-4 text-center text-sm text-muted">Searching…</div>
          ) : !hasResults ? (
            <div className="px-3 py-4 text-center text-sm text-muted">No matches for &quot;{query}&quot;</div>
          ) : (
            <>
              {results.ok && results.reservations.length > 0 && (
                <div className="mb-1">
                  <div className="px-3 py-1 text-[11px] font-bold tracking-[0.5px] text-muted uppercase">Reservations</div>
                  {results.reservations.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSelectReservation(r.confirmationCode);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-cream-input"
                    >
                      <span className="text-heading">{r.customerName}</span>
                      <span className="text-xs text-muted">{r.confirmationCode}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.ok && results.inquiries.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold tracking-[0.5px] text-muted uppercase">Inquiries</div>
                  {results.inquiries.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => {
                        onSelectInquiry(i.name);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-cream-input"
                    >
                      <span className="text-heading">{i.name}</span>
                      <span className="text-xs text-muted">{i.subject}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
