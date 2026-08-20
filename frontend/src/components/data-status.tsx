import { ShieldCheck } from "lucide-react";

export function DataStatus({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <span
      className={
        compact
          ? "data-status data-status-compact"
          : "data-status"
      }
      title="Imported from Wellyura v1 and queued for verification"
    >
      <ShieldCheck size={14} />
      {compact
        ? "Verification pending"
        : "Migrated data \u00b7 verification in progress"}
    </span>
  );
}
