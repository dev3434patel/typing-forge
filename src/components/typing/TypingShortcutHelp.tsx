import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";

export function TypingShortcutHelp({ children }: { children: ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const details = detailsRef.current;
    const panel = details?.querySelector<HTMLElement>(".typing-shortcut-panel");
    const toolbar = details?.closest<HTMLElement>(".live-keyboard-toolbar");
    if (!details || !panel || !toolbar) return;

    const placePanel = () => {
      if (!details.open || !details.isConnected) return;
      const visualViewport = window.visualViewport;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const inset = 8;
      const gap = 8;
      const topLimit = viewportTop + inset;
      const bottomLimit = viewportTop + viewportHeight - inset;

      // The existing right/width rules keep the panel within its toolbar.
      // Only the vertical placement needs to follow scrolling and soft keyboards.
      panel.style.maxHeight = `${Math.max(0, viewportHeight - inset * 2)}px`;
      panel.style.bottom = "auto";
      const toolbarBounds = toolbar.getBoundingClientRect();
      const panelHeight = panel.getBoundingClientRect().height;
      const above = toolbarBounds.top - gap - panelHeight;
      const below = toolbarBounds.bottom + gap;
      const fitsAbove = above >= topLimit;
      const fitsBelow = below + panelHeight <= bottomLimit;
      const moreSpaceAbove =
        toolbarBounds.top - gap - topLimit >=
        bottomLimit - toolbarBounds.bottom - gap;
      const preferredTop = fitsAbove
        ? above
        : fitsBelow
          ? below
          : moreSpaceAbove
            ? above
            : below;
      const boundedTop = Math.max(
        topLimit,
        Math.min(preferredTop, bottomLimit - panelHeight),
      );
      panel.style.top = `${boundedTop - toolbarBounds.top}px`;
    };

    placePanel();
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", placePanel, {
      capture: true,
      passive: true,
    });
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", placePanel, { passive: true });
    visualViewport?.addEventListener("scroll", placePanel, { passive: true });
    return () => {
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", placePanel, true);
      visualViewport?.removeEventListener("resize", placePanel);
      visualViewport?.removeEventListener("scroll", placePanel);
      panel.style.removeProperty("top");
      panel.style.removeProperty("bottom");
      panel.style.removeProperty("max-height");
    };
  }, [open, children]);

  return (
    <details
      ref={detailsRef}
      className="typing-shortcut-help"
      onToggle={(event) => setOpen(event.currentTarget.open)}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.currentTarget.open = false;
        setOpen(false);
        event.currentTarget.querySelector("summary")?.focus();
      }}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
          event.currentTarget.open = false;
          setOpen(false);
        }
      }}
    >
      <summary
        className="forge-icon-button"
        aria-label="Typing shortcuts"
        title="Typing shortcuts"
      >
        <CircleHelp size={17} aria-hidden="true" />
      </summary>
      <div className="typing-shortcut-panel" tabIndex={-1}>
        {children}
      </div>
    </details>
  );
}
