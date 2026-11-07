"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { STUDENT } from "@/lib/site";
import { resetDemo } from "@/lib/store";

export default function Footer() {
  const isHome = usePathname() === "/";
  const router = useRouter();
  const [done, setDone] = useState(false);

  return (
    <footer className="noprint gutter border-t border-line py-8 text-[14px] leading-relaxed text-muted">
      <div className="flex flex-col gap-4">
        {isHome && (
          <div>
            <p className="display m-0 text-[16px] text-paper">Prime Pass</p>
            <p className="m-0 mt-1">
              {STUDENT.name} · {STUDENT.admission}
            </p>
          </div>
        )}
        <p className="m-0">
          Prime Pass · Built by {STUDENT.name} · {STUDENT.admission} · Student project demo, sample events, no real
          tickets sold
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost text-[14px]"
            onClick={async () => {
              await resetDemo();
              setDone(true);
              window.setTimeout(() => setDone(false), 4000);
              router.push("/");
            }}
          >
            Reset demo data
          </button>
          <span role="status">{done ? "Demo data reset." : ""}</span>
        </div>
      </div>
    </footer>
  );
}
