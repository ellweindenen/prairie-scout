/** Shown on every fake lodge so nobody mistakes it for a real listing. */
export function SampleBadge() {
  return (
    <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-rose-700">
      Sample data
    </span>
  );
}

/** Banner shown when the whole page is using the built-in sample lodges. */
export function SampleDataBanner({ source }: { source: "database" | "sample" }) {
  if (source !== "sample") return null;
  return (
    <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
      <strong>Sample data:</strong> these lodges are fake placeholders for the demo (no database
      connected). Real lodges will be added and hand-checked before launch.
    </div>
  );
}
