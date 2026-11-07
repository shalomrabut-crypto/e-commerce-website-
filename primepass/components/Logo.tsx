import Link from "next/link";

export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-3 min-h-11 no-underline text-paper hover:text-paper"
    >
      <span aria-hidden="true" className="relative block w-[30px] h-[22px] rounded-[4px] bg-orange">
        <span className="absolute left-1/2 -top-0.5 -ml-[4.5px] size-[9px] rounded-full bg-ink" />
        <span className="absolute left-1/2 -bottom-0.5 -ml-[4.5px] size-[9px] rounded-full bg-ink" />
      </span>
      <span className="display text-[19px] tracking-[0.5px]">Prime Pass</span>
    </Link>
  );
}
