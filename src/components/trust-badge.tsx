import { Badge } from "@/components/ui/badge";
import { formatAge, trustColorVar, trustLabel, trustLevel } from "@/lib/trust";
import { cn } from "@/lib/utils";

export function TrustBadge({
  reportedAt,
  confirmations,
  className,
}: {
  reportedAt: string;
  confirmations?: number;
  className?: string;
}) {
  const level = trustLevel(reportedAt);

  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", className)}>
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: trustColorVar(level) }}
      />
      {trustLabel(level)} · {formatAge(reportedAt)}
      {confirmations !== undefined ? ` · ${confirmations} conf.` : ""}
    </Badge>
  );
}
