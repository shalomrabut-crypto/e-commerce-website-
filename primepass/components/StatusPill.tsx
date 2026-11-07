const STYLES: Record<string, string> = {
  pending: "border-2 border-dashed border-peach text-peach",
  approved: "bg-orange text-ink border-2 border-orange",
  rejected: "border-2 border-muted text-muted",
  paid: "bg-orange text-ink border-2 border-orange",
  failed: "border-2 border-muted text-muted",
};

export default function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full font-mono text-[12px] uppercase tracking-[1px] ${STYLES[status] ?? ""}`}>
      {status}
    </span>
  );
}
