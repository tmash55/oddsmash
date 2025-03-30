export function SectionTransition({
  position = "bottom",
  className = "",
}: {
  position?: "top" | "bottom";
  className?: string;
}) {
  return (
    <div
      className={`absolute left-0 right-0 h-24 pointer-events-none ${
        position === "top"
          ? "top-0 bg-gradient-to-b"
          : "bottom-0 bg-gradient-to-t"
      } from-background via-background/80 to-transparent ${className}`}
    />
  );
}
