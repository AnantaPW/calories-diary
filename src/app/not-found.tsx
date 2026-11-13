import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted">This address doesn&apos;t match any page in the diary.</p>
      <Link href="/" className="btn-primary mt-4">
        Back to today
      </Link>
    </div>
  );
}
