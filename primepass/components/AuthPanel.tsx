import type { ReactNode } from "react";

/** The split-screen sign-up layout. The plum panel becomes a short banner on phones. */
export default function AuthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-wrap">
      <div className="relative overflow-hidden flex flex-col justify-end bg-plum min-h-[180px] nav:min-h-[220px] flex-[2_1_360px] p-6 nav:p-12">
        <div aria-hidden="true" className="hidden nav:block absolute right-[8%] top-[12%] w-[220px]">
          <div className="absolute top-12 left-8 w-[200px] h-[120px] rounded-md bg-orange rotate-6" />
          <div className="relative w-[210px] h-[130px] p-4 rounded-md bg-paper text-ink -rotate-[8deg]">
            <p className="m-0 font-mono text-[12px] text-muted-ink">ADMIT ONE · No. 0001</p>
            <p className="display m-0 mt-2 text-[20px] leading-[1.1]">Prime Pass</p>
            <div className="absolute left-3 right-3 bottom-8 border-b-2 border-dashed border-perf" />
          </div>
        </div>
        <p className="display relative m-0 text-[clamp(28px,3.6vw,50px)] leading-[1.05]">
          One account.
          <br />
          <span className="text-orange">Every gate.</span>
        </p>
      </div>
      <div className="flex justify-center min-w-0 flex-[3_1_420px] px-4 py-8 nav:px-8 nav:py-16">{children}</div>
    </div>
  );
}
