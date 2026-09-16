import { useEffect, ReactNode } from "react";
import "@/live/live.css";

/** Wraps every /live page: scoped styling + hard noindex. */
export default function LiveLayout({ children, title }: { children: ReactNode; title?: string }) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} · Cola Live` : "Cola Live";

    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(robots);

    return () => {
      document.title = prevTitle;
      robots.remove();
    };
  }, [title]);

  return <div className="live-root">{children}</div>;
}
