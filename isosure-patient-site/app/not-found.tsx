import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="serif text-4xl">This page is not on the shelf</h1>
      <p className="mt-3 text-ink-soft">The compound or page you asked for is not in this prototype.</p>
      <Link href="/catalog" className="mt-5 inline-block text-leaf underline underline-offset-4">
        Return to the catalog
      </Link>
    </div>
  );
}
