"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center px-6">
      <h1 className="text-3xl font-bold">אירעה שגיאה</h1>
      <p className="mt-3 text-muted">נסו לרענן את העמוד. אם הבעיה נמשכת, חזרו מאוחר יותר.</p>
      <button
        type="button"
        className="mt-6 min-h-11 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 font-medium"
        onClick={reset}
      >
        ניסיון נוסף
      </button>
      <Link href="/accessibility" className="text-link mt-4">
        הצהרת נגישות
      </Link>
    </main>
  );
}
