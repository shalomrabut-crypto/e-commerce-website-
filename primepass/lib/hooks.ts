"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { currentUser, subscribe } from "./store";
import type { Role, User } from "./types";

/**
 * Loads data from the store and reloads it when the store changes.
 * `initial` lets a page render real content before the browser store is readable.
 */
export function useQuery<T>(load: () => Promise<T>, deps: unknown[], initial?: T) {
  const [data, setData] = useState<T | undefined>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let live = true;
    const run = () => {
      loadRef.current().then(
        (value) => {
          if (!live) return;
          setData(value);
          setError(null);
          setLoading(false);
        },
        (err: unknown) => {
          if (!live) return;
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setLoading(false);
        },
      );
    };
    run();
    const unsubscribe = subscribe(run);
    return () => {
      live = false;
      unsubscribe();
    };
    // The caller's deps decide when to reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

export function useCurrentUser() {
  const { data, loading } = useQuery(currentUser, []);
  return { user: data ?? null, loading };
}

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  if (role === "organizer") return "/organizer";
  if (role === "admin") return "/admin";
  return "/events";
}

/**
 * UI route guard. Signed-out visitors go to /login and come back afterwards.
 * Signed-in users with the wrong role go to their own home page.
 * Returns the user only once they are allowed to see the page.
 */
export function useRequireRole(...roles: Role[]): User | null {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && roles.includes(user.role);

  useEffect(() => {
    if (loading || allowed) return;
    router.replace(user ? homeFor(user.role) : `/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, allowed, user, router, pathname]);

  return allowed ? user : null;
}
