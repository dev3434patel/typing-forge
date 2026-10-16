import "./brand-wordmark.css";

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={["brand-wordmark", className].filter(Boolean).join(" ")}>
      <span>Sparow</span>
      <span className="brand-wordmark-accent">Type</span>
    </span>
  );
}
