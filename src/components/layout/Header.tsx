import { forwardRef } from "react";
import {
  Keyboard,
  BarChart3,
  Trophy,
  User,
  Swords,
  GraduationCap,
  BookOpen,
  Settings2,
  Command,
  Sun,
  Moon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BrandWordmark } from "@/components/brand/BrandMark";
import { usePreferences } from "@/contexts/PreferencesContext";
import { THEMES } from "@/lib/themes";
const items = [
  { href: "/", label: "Test", icon: Keyboard, aliases: ["/typing-test"] },
  { href: "/learn", label: "Learn", icon: GraduationCap, aliases: ["/typing-practice", "/practice"] },
  { href: "/lessons", label: "Lessons", icon: BookOpen },
  { href: "/race", label: "Race", icon: Swords },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/leaderboard", label: "Rankings", icon: Trophy },
  { href: "/keyboard-lab", label: "Keyboard Lab", icon: Keyboard },
];
export const Header = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>((props, ref) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
  const active = (item: (typeof items)[number]) =>
    item.href === path ||
    item.aliases?.includes(path) ||
    (item.href !== "/" && path.startsWith(item.href + "/"));
  const { preferences, updatePreferences } = usePreferences();
  const light = THEMES.find((theme) => theme.id === preferences.theme)?.light ?? false;
  return (
    <header ref={ref} className="border-b border-border" {...props}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="max-w-7xl mx-auto px-3 min-[360px]:px-5 sm:px-8 flex items-center justify-between h-20 gap-1 sm:gap-4">
        <Link
          to="/"
          aria-label="SparowType home"
          className="flex items-center gap-1.5 min-[360px]:gap-2 shrink-0"
        >
          <BrandWordmark className="text-lg sm:text-xl" />
        </Link>
        <nav aria-label="Main navigation" className="hidden xl:flex gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-current={active(item) ? "page" : undefined}
              className={cn("forge-chip", active(item) && "text-primary bg-primary/10")}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="forge-icon-button"
            aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
            title={light ? "Switch to dark theme" : "Switch to light theme"}
            onClick={() => updatePreferences({ theme: light ? "sparow-dark" : "sparow-light" })}
          >
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            className="forge-icon-button hidden sm:flex"
            aria-label="Open command palette"
            title="Commands · Ctrl+K"
            onClick={() => window.dispatchEvent(new Event("forge:commands"))}
          >
            <Command size={18} />
          </button>
          <Link
            to="/settings"
            className="forge-icon-button"
            aria-label="Settings"
          >
            <Settings2 size={19} />
          </Link>
          <Link
            to={user ? "/profile" : "/auth"}
            aria-label={user ? "Account" : "Sign in"}
            className="forge-button-secondary !px-3"
          >
            <User size={16} />
            <span className="hidden sm:inline">
              {user ? "Account" : "Sign in"}
            </span>
          </Link>
        </div>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="xl:hidden flex overflow-x-auto gap-1 px-4 pb-3 scrollbar-hide"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            aria-current={active(item) ? "page" : undefined}
            className={cn(
              "forge-chip shrink-0",
              active(item) && "text-primary bg-primary/10",
            )}
          >
            <item.icon size={14} />
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
});
Header.displayName = "Header";
