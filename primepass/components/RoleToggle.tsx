"use client";

export type AuthRole = "attendee" | "organizer";

export default function RoleToggle({ value, onChange }: { value: AuthRole; onChange: (role: AuthRole) => void }) {
  const options: { role: AuthRole; label: string }[] = [
    { role: "attendee", label: "I'm attending" },
    { role: "organizer", label: "I'm organizing" },
  ];
  return (
    <div className="flex p-1 rounded-full border border-line bg-panel">
      {options.map((o) => {
        const on = value === o.role;
        return (
          <button
            key={o.role}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.role)}
            className={`flex-1 min-h-12 rounded-full border-0 text-[15px] font-extrabold ${
              on ? "bg-orange text-ink" : "bg-transparent text-paper"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
