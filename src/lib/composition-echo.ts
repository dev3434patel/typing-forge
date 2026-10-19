/**
 * A browser may follow compositionend with one final input carrying the same
 * committed text. Only explicit composition input types prove that ownership;
 * an identical insertText may be the user's next virtual-keyboard character.
 * Elapsed time and the presence of a hardware keydown do not establish intent.
 */
export class CompositionEchoGuard {
  private pending: string | null = null;

  remember(text: string): void {
    this.pending = text ? text.normalize("NFC") : null;
  }

  reset(): void {
    this.pending = null;
  }

  /** The next input consumes the marker, including an independent mobile edit. */
  consume(text: string, inputType: string): boolean {
    const compositionOwned = inputType === "insertCompositionText" || inputType === "insertFromComposition";
    const echo = compositionOwned && this.pending !== null && text.normalize("NFC") === this.pending;
    this.pending = null;
    return echo;
  }
}
