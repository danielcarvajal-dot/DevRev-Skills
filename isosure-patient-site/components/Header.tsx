"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { canAccessOps, canAccessProvider, canAccessQa, homePath, staffLabel } from "@/lib/auth";
import { useStore } from "@/lib/store";

export function Header() {
  const { user, ready, unreadCount, drafts, signOut } = useStore();
  const ops = canAccessOps(user);
  const provider = canAccessProvider(user);
  const qa = canAccessQa(user);
  const rph = user?.role === "rph";
  const label = !ready || !user ? "Sign in" : staffLabel(user);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href={user ? homePath(user) : "/"} className="shrink-0">
          <img src={BRAND.logo} alt={BRAND.legalName} className="h-16 w-auto md:h-[4.5rem]" />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
          {rph ? (
            <Link href="/hub" className="hover:text-purple">
              Desk
            </Link>
          ) : null}
          {ops ? (
            <>
              <Link href="/ops" className="hover:text-purple">
                Lab
              </Link>
              <Link href="/admin/orders" className="hover:text-purple">
                Intake
              </Link>
              <Link href="/ops/inventory" className="hover:text-purple">
                Inventory
              </Link>
            </>
          ) : null}
          {provider ? (
            <>
              <Link href="/order/new" className="hover:text-purple">
                New order
              </Link>
              <Link href="/patients" className="hover:text-purple">
                Patients
              </Link>
              <Link href="/account" className="hover:text-purple">
                Orders
              </Link>
              <Link href="/account#drafts" className="hover:text-purple">
                Drafts
                {ready && drafts.length > 0 ? (
                  <span className="ml-1 rounded-full bg-purple-soft px-1.5 text-[11px] text-purple">
                    {drafts.length}
                  </span>
                ) : null}
              </Link>
              <Link href="/portal/notifications" className="hover:text-purple">
                Messages
                {ready && unreadCount > 0 ? (
                  <span className="ml-1 rounded-full bg-purple-mid px-1.5 text-[11px] text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            </>
          ) : null}
          {qa ? (
            <Link href="/qa" className="hover:text-purple">
              Quality
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={user ? homePath(user) : "/login"}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-purple"
          >
            {label}
          </Link>
          {user ? (
            <button
              type="button"
              className="rounded-lg border border-line px-3 py-1.5 text-sm"
              onClick={() => {
                signOut();
                window.location.href = "/login";
              }}
            >
              Sign out
            </button>
          ) : null}
          {provider ? (
            <Link
              href="/order/new"
              className="rounded-lg bg-purple-deep px-3 py-1.5 text-sm font-semibold text-white"
            >
              + New order
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
