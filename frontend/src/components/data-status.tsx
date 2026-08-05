import { ShieldCheck } from "lucide-react";

export function DataStatus({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "data-status data-status-compact" : "data-status"} title="Imported from Wellyura v1 and queued for verification">
      <ShieldCheck size={14} />
      {compact ? "Legacy data" : "Migrated data · verification in progress"}
    </span>
  );
}
