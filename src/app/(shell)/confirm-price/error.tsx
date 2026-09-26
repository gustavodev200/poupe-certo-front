"use client";

import { QueryError } from "@/components/query-error";

export default function ConfirmPriceError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <div className="mx-auto max-w-md px-6 py-6">
      <QueryError error={undefined} onRetry={reset} />
    </div>
  );
}
