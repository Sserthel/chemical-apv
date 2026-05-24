import {
  riskBadgeLabel,
  riskLevelSoftColors,
  type RiskBadgeVariant,
} from "@/lib/risk-visual";

interface RiskBadgeProps {
  level: RiskBadgeVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RiskBadge({ level, size = "md", className = "" }: RiskBadgeProps) {
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : size === "lg"
        ? "px-4 py-2 text-base"
        : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${riskLevelSoftColors(level)} ${sizeClass} ${className}`}
    >
      {riskBadgeLabel(level)}
    </span>
  );
}
