import { ImageOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared";

type ProductImageProps = {
  name: string;
  slug: string;
  imageUrl: string | null;
  className?: string;
};

export function ProductImage({
  name,
  slug,
  imageUrl,
  className,
}: ProductImageProps) {
  const [stage, setStage] = useState<"remote" | "local" | "none">(
    imageUrl ? "remote" : "local",
  );

  if (stage === "none") {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center bg-muted",
          className,
        )}
      >
        <ImageOff
          aria-hidden="true"
          className="size-10 text-muted-foreground"
        />
      </div>
    );
  }

  const src =
    stage === "remote" && imageUrl ? imageUrl : `/products/${slug}.jpg`;

  return (
    <img
      src={src}
      alt={name}
      className={cn("aspect-video w-full bg-muted object-contain", className)}
      onError={() => setStage(stage === "remote" ? "local" : "none")}
    />
  );
}
