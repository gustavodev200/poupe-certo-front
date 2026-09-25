import { ScanBarcode } from "lucide-react";

import { cn } from "@/lib/utils";

const sizes = {
  sm: { box: "size-8 rounded-lg", icon: "size-[18px]", text: "text-lg" },
  md: { box: "size-9 rounded-lg", icon: "size-5", text: "text-xl" },
} as const;

export function Logo({
  size = "sm",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
          s.box
        )}
      >
        <ScanBarcode className={s.icon} />
      </div>
      <span className={cn("font-bold tracking-tight", s.text)}>
        Poupe Certo
      </span>
    </div>
  );
}
