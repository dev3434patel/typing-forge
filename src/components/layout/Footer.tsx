import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { BrandWordmark } from "@/components/brand/BrandMark";
export const Footer = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>((props, ref) => (
  <footer ref={ref} className="border-t border-border mt-auto" {...props}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap justify-between gap-4 text-xs text-muted-foreground">
      <span className="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <BrandWordmark className="text-sm" /> Find your rhythm.
      </span>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <Link to="/about" className="inline-flex min-h-11 items-center hover:text-foreground">
          About & metrics
        </Link>
        <Link to="/settings" className="inline-flex min-h-11 items-center hover:text-foreground">
          Preferences & data
        </Link>
        <Link to="/touch-typing" className="inline-flex min-h-11 items-center hover:text-foreground">Touch typing guide</Link>
        <Link to="/privacy" className="inline-flex min-h-11 items-center hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="inline-flex min-h-11 items-center hover:text-foreground">Terms</Link>
        <Link to="/offline" className="inline-flex min-h-11 items-center hover:text-foreground">Offline</Link>
        <span className="py-3">SparowType © {new Date().getFullYear()}</span>
      </div>
    </div>
  </footer>
));
Footer.displayName = "Footer";
