"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center px-6">
      <h1 className="text-3xl font-bold">אירעה שגיאה</h1>
      <p className="mt-3 text-muted">נסו לרענן את העמוד. אם הבעיה נמשכת, חזרו מאוחר יותר.</p>
      <button type="button" className="mt-6 text-primary" onClick={reset}>
        ניסיון נוסף
      </button>
    </div>
  );
}
