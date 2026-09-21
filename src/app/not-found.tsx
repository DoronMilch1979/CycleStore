import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center px-6">
      <h1 className="text-3xl font-bold">העמוד לא נמצא</h1>
      <p className="mt-3 text-muted">יתכן שהקישור שגוי או שהעמוד הוסר.</p>
      <Link href="/" className="mt-6 text-primary">
        חזרה לדף הבית
      </Link>
    </div>
  );
}
