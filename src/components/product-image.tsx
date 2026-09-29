import Image from "next/image";
import { Package } from "lucide-react";

import { cn } from "@/lib/utils";

// Foto do produto (Cloudinary) ou ícone genérico quando não há foto. O
// container define o tamanho via `className` (ex.: "size-14", "aspect-[1.2] w-full").
// `unoptimized`: o Cloudinary já serve a imagem otimizada e assim não gastamos
// a cota de Image Optimization da Vercel.
export function ProductImage({
  src,
  alt,
  sizes = "96px",
  className,
  iconClassName = "size-1/3",
}: Readonly<{
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  className?: string;
  iconClassName?: string;
}>) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-muted",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          className="object-contain"
        />
      ) : (
        <Package
          aria-hidden
          className={cn(
            "absolute inset-0 m-auto text-muted-foreground opacity-50",
            iconClassName
          )}
        />
      )}
    </div>
  );
}
