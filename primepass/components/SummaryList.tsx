/** A paper card of label and value rows split by dashed lines, like the pricing card on the homepage. */
export default function SummaryList({
  heading,
  rows,
}: {
  heading: string;
  rows: { label: string; value: string; strong?: boolean }[];
}) {
  return (
    <div className="p-6 rounded-[14px] bg-paper text-ink text-[15px]">
      <p className="m-0 mb-3 font-mono text-[14px] text-muted-ink">{heading}</p>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex flex-wrap justify-between gap-x-4 gap-y-1 py-3 ${
            i < rows.length - 1 ? "border-b-2 border-dashed border-perf" : ""
          }`}
        >
          <span className="font-extrabold">{row.label}</span>
          <span className={`font-mono ${row.strong ? "text-[20px]" : ""}`}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
