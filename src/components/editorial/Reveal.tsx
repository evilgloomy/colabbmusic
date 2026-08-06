import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}

/**
 * Scroll-triggered fade + rise. Subtle by design: 16px, 700ms, one-shot.
 */
export const Reveal = ({ children, delay = 0, as: Tag = "div", className = "" }: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(16px)",
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
};

export const Kicker = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`label text-cola-pink ${className}`}>{children}</p>
);

export const SectionTitle = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h2 className={`font-display text-section text-balance ${className}`}>{children}</h2>
);
