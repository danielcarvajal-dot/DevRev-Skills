"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { useStore } from "@/lib/store";

export function Header() {
  const { cartCount, user, ready } = useStore();
  const isPharmacy = user?.role === "pharmacy";
  const label = !ready
    ? "Sign in"
    : user?.role === "doctor"
      ? user.practiceName
      : user?.role === "pharmacy"
        ? user.pharmacyName
        : "Sign in";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="shrink-0">
          <img src={BRAND.logo} alt={BRAND.legalName} className="h-14 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          {isPharmacy ? (
            <>
              <Link href="/admin/formulary" className="hover:text-purple">
                Formulary
              </Link>
              <Link href="/admin/orders" className="hover:text-purple">
                Production queue
              </Link>
            </>
          ) : (
            <>
              <Link href="/catalog" className="hover:text-purple">
                Formulary
              </Link>
              <Link href="/account" className="hover:text-purple">
                Practice orders
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={user ? (isPharmacy ? "/admin/orders" : "/account") : "/login"}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-purple"
          >
            {label}
          </Link>
          <Link
            href="/cart"
            className="relative rounded-lg bg-purple-deep px-3 py-1.5 text-sm font-semibold text-white"
          >
            Order
            {ready && cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-purple-mid px-1 text-[11px]">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
