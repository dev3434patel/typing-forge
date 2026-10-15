import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Keyboard } from "lucide-react";
export const Footer = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>((props, ref) => (
  <footer ref={ref} className="border-t border-border mt-auto" {...props}>
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap justify-between gap-4 text-xs text-muted-foreground">
      <span className="flex gap-2 items-center">
        <Keyboard size={14} /> A little practice. Lasting progress.
      </span>
      <div className="flex gap-6">
        <Link to="/about" className="hover:text-foreground">
          About & metrics
        </Link>
        <Link to="/settings" className="hover:text-foreground">
          Preferences & data
        </Link>
        <span>Typing Forge © {new Date().getFullYear()}</span>
      </div>
    </div>
  </footer>
));
Footer.displayName = "Footer";
