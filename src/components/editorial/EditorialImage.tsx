import { useEffect, useState } from "react";

interface EditorialImageProps {
  /** Desktop / default source */
  src: string;
  /** Optional distinct mobile source (used below 768px) */
  mobileSrc?: string;
  alt: string;
  objectPositionDesktop?: string;
  objectPositionTablet?: string;
  objectPositionMobile?: string;
  /** CSS aspect-ratio strings, e.g. "4 / 5". Omit both to fill the parent. */
  aspectRatioDesktop?: string;
  aspectRatioMobile?: string;
  priority?: boolean;
  /** Optional overlay element rendered above the image */
  overlay?: React.ReactNode;
  className?: string;
  imgClassName?: string;
  width?: number;
  height?: number;
}

type Breakpoint = "mobile" | "tablet" | "desktop";

const read = (): Breakpoint => {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia("(min-width: 1024px)").matches) return "desktop";
  if (window.matchMedia("(min-width: 768px)").matches) return "tablet";
  return "mobile";
};

/**
 * Editorial image with per-breakpoint focal points and aspect ratios.
 * Every portrait gets its own focal values — never a blanket `center`.
 */
export const EditorialImage = ({
  src,
  mobileSrc,
  alt,
  objectPositionDesktop = "50% 50%",
  objectPositionTablet,
  objectPositionMobile,
  aspectRatioDesktop,
  aspectRatioMobile,
  priority = false,
  overlay,
  className = "",
  imgClassName = "",
  width,
  height,
}: EditorialImageProps) => {
  const [bp, setBp] = useState<Breakpoint>(read);

  useEffect(() => {
    const onResize = () => setBp(read());
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const objectPosition =
    bp === "mobile"
      ? objectPositionMobile ?? objectPositionTablet ?? objectPositionDesktop
      : bp === "tablet"
        ? objectPositionTablet ?? objectPositionDesktop
        : objectPositionDesktop;

  const aspectRatio =
    bp === "mobile" ? aspectRatioMobile ?? aspectRatioDesktop : aspectRatioDesktop;

  return (
    <div className={`relative overflow-hidden bg-cola-surface ${className}`} style={{ aspectRatio }}>
      <picture>
        {mobileSrc && <source media="(min-width: 768px)" srcSet={src} />}
        <img
          src={mobileSrc ?? src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
          style={{ objectPosition }}
        />
      </picture>
      {overlay}
    </div>
  );
};
