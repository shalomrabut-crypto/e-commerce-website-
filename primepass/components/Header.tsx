"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/hooks";
import { logOut } from "@/lib/store";
import type { Role } from "@/lib/types";
import Logo from "./Logo";

type Item = { href: string; label: string; active: (path: string, hash: string) => boolean };

const PUBLIC_ITEMS: Item[] = [
  { href: "/events", label: "Events", active: (p) => p.startsWith("/events") },
  { href: "/#organizers", label: "For organizers", active: (p, h) => p === "/" && h === "#organizers" },
  { href: "/how-it-works", label: "How it works", active: (p) => p === "/how-it-works" },
];

const ROLE_ITEMS: Record<Role, Item> = {
  attendee: { href: "/tickets", label: "My Tickets", active: (p) => p.startsWith("/tickets") },
  organizer: { href: "/organizer", label: "Dashboard", active: (p) => p === "/organizer" },
  admin: { href: "/admin", label: "Admin", active: (p) => p === "/admin" },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);

  // Close the menu and clear the section highlight when the route changes.
  useEffect(() => {
    setOpen(false);
    setHash(window.location.hash);
  }, [pathname]);

  const items = user ? [...PUBLIC_ITEMS, ROLE_ITEMS[user.role]] : PUBLIC_ITEMS;

  const links = items.map((item) => {
    const active = item.active(pathname, hash);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`tab text-[15px] lg:text-[16px] ${active ? "on" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          setHash(item.href.includes("#") ? `#${item.href.split("#")[1]}` : "");
          setOpen(false);
        }}
      >
        {item.label}
      </Link>
    );
  });

  const account = loading ? null : user ? (
    <button
      type="button"
      className="btn btn-ghost px-4 lg:px-6"
      onClick={async () => {
        await logOut();
        setOpen(false);
        router.push("/");
      }}
    >
      Log out
    </button>
  ) : (
    <Link href="/login" className="btn btn-ghost px-4 lg:px-6" onClick={() => setOpen(false)}>
      Sign in
    </Link>
  );

  return (
    <header className="noprint px-4 lg:px-8 xl:px-12 sticky top-0 z-20 border-b border-line bg-ink/92">
      <div className="flex items-center justify-between gap-4 py-3">
        <Logo onClick={() => setHash("")} />

        <nav aria-label="Main" className="hidden nav:flex items-center gap-3 lg:gap-6">
          {links}
          {account}
        </nav>

        <button
          type="button"
          className="btn btn-ghost nav:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Main" className="enter nav:hidden flex flex-col items-start gap-2 pb-4">
          {user && <p className="m-0 text-[14px] text-muted">Signed in as {user.fullName}</p>}
          {links}
          {account}
        </nav>
      )}
    </header>
  );
}
