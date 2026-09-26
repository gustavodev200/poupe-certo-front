"use client";

import { QueryError } from "@/components/query-error";

export default function ProductError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <QueryError error={undefined} onRetry={reset} />
    </div>
  );
}
