"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none">
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none">
      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function ProductSearch() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  return (
    <form action="/search" method="get" role="search" className="w-full">
      <label htmlFor="product-search" className="sr-only">
        חיפוש מוצרים
      </label>
      <input
        id="product-search"
        name="q"
        key={query}
        defaultValue={query}
        placeholder="חיפוש מוצרים"
        enterKeyHint="search"
        autoComplete="off"
        className="min-h-11 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm text-foreground"
      />
    </form>
  );
}

export function DesktopProductSearch() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function close() {
    setOpen(false);
    inputRef.current?.blur();
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!formRef.current?.contains(event.target as Node)) {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <form
      ref={formRef}
      action="/search"
      method="get"
      role="search"
      className="flex items-center"
      onSubmit={(event) => {
        const value = inputRef.current?.value.trim() ?? "";
        if (!open) {
          event.preventDefault();
          setOpen(true);
          queueMicrotask(() => inputRef.current?.focus());
          return;
        }
        if (!value) {
          event.preventDefault();
          close();
          return;
        }
        setOpen(false);
      }}
    >
      <label htmlFor="desktop-product-search" className="sr-only">
        חיפוש מוצרים
      </label>
      <div className={cn("relative", open && "me-2")}>
        <input
          ref={inputRef}
          id="desktop-product-search"
          name="q"
          key={query}
          defaultValue={query}
          placeholder="חיפוש מוצרים"
          enterKeyHint="search"
          autoComplete="off"
          tabIndex={open ? 0 : -1}
          aria-hidden={open ? undefined : true}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
          className={cn(
            "h-11 overflow-hidden rounded-[var(--radius-md)] border bg-background text-sm text-foreground transition-[width,opacity,padding] duration-300 ease-out",
            open
              ? "w-40 border-border px-3 pe-8 opacity-100"
              : "w-0 border-transparent px-0 opacity-0",
          )}
        />
        {open ? (
          <button
            type="button"
            aria-label="סגירת חיפוש"
            onClick={close}
            className="absolute inset-y-0 end-1 inline-flex w-7 items-center justify-center text-muted hover:text-foreground"
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>
      <button
        type="submit"
        aria-label="חיפוש מוצרים"
        aria-expanded={open}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-muted hover:text-primary"
      >
        <SearchIcon />
      </button>
    </form>
  );
}
