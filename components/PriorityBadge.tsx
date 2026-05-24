import { PRIORITY_META } from "@/lib/risk-visual";

type Priority = keyof typeof PRIORITY_META;

interface PriorityBadgeProps {
  priority: Priority;
  showTitle?: boolean;
  className?: string;
}

export function PriorityBadge({
  priority,
  showTitle = false,
  className = "",
}: PriorityBadgeProps) {
  const meta = PRIORITY_META[priority];

  return (
    <span
      title={meta.title}
      className={`inline-flex flex-col rounded-lg border px-2 py-1 text-xs font-bold ${meta.className} ${className}`}
    >
      <span>{meta.label}</span>
      {showTitle && (
        <span className="mt-0.5 text-[10px] font-normal leading-tight opacity-90">
          {meta.title}
        </span>
      )}
    </span>
  );
}
