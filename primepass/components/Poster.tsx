import Image from "next/image";

/** Event poster. Uploaded posters are data URLs, which skip the image optimizer. */
export default function Poster({
  src,
  alt,
  sizes,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.startsWith("data:")}
      className={`object-cover ${className}`}
    />
  );
}

const SEED_ALT: Record<string, string> = {
  "/images/ed-crowd.jpg": "Crowd with raised hands under stage lights",
  "/images/cb-spotlight.jpg": "Singer in a single spotlight beam",
  "/images/hero-hearts.jpg": "Guitarist on stage behind raised hands making a heart",
};

const SEED_POSITION: Record<string, string> = {
  "/images/ed-crowd.jpg": "object-[50%_60%]",
  "/images/cb-spotlight.jpg": "object-[50%_55%]",
};

export function posterAlt(src: string, title: string): string {
  return SEED_ALT[src] ?? `Poster for ${title}`;
}

export function posterPosition(src: string): string {
  return SEED_POSITION[src] ?? "object-center";
}
