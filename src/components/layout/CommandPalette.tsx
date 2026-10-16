import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePreferences } from "@/contexts/PreferencesContext";
import { THEMES } from "@/lib/themes";
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { updatePreferences } = usePreferences();
  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">SparowType commands</DialogTitle>
      <DialogDescription className="sr-only">
        Search pages and themes. Use arrow keys and Enter to select.
      </DialogDescription>
      <CommandInput placeholder="Where would you like to go?" />
      <CommandList>
        <CommandEmpty>No matching commands.</CommandEmpty>
        <CommandGroup heading="Go to">
          {[
            ["Practice", "/"],
            ["Adaptive learning", "/learn"],
            ["Race", "/race"],
            ["Progress and history", "/stats"],
            ["Rankings", "/leaderboard"],
            ["Preferences", "/settings"],
            ["About & metrics", "/about"],
            ["Keyboard Lab", "/keyboard-lab"],
          ].map(([label, href]) => (
            <CommandItem key={href} onSelect={() => go(href)}>
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Theme">
          {THEMES.map((theme) => (
            <CommandItem
              key={theme.id}
              onSelect={() => {
                updatePreferences({ theme: theme.id });
                onOpenChange(false);
              }}
            >
              {theme.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
