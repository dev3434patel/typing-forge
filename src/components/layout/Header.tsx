import { forwardRef } from "react";
import {
  Keyboard,
  BarChart3,
  Trophy,
  User,
  Swords,
  GraduationCap,
  Settings2,
  Command,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
const items = [
  { href: "/", label: "Test", icon: Keyboard },
  { href: "/learn", label: "Learn", icon: GraduationCap },
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
  return (
    <header ref={ref} className="border-b border-border" {...props}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-20 gap-4">
        <Link
          to="/"
          aria-label="Typing Forge home"
          className="flex items-center gap-3 shrink-0"
        >
          <span className="text-primary">
            <Keyboard size={28} strokeWidth={1.7} />
          </span>
          <span className="font-semibold text-lg tracking-tight">
            typing
            <span className="text-muted-foreground font-normal">forge</span>
            <span className="text-primary">.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="hidden lg:flex gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/"}
              className={({ isActive }) =>
                cn("forge-chip", isActive && "text-primary bg-primary/10")
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
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
        className="lg:hidden flex overflow-x-auto gap-1 px-4 pb-3 scrollbar-hide"
      >
        {items.map(({ href, label, icon: Icon }) => (
          <NavLink
            key={href}
            end={href === "/"}
            to={href}
            className={({ isActive }) =>
              cn(
                "forge-chip shrink-0",
                isActive && "text-primary bg-primary/10",
              )
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
});
Header.displayName = "Header";
