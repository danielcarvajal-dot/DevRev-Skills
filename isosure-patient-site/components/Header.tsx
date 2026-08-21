"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { useStore } from "@/lib/store";
import { CartIcon, Mark, UserIcon } from "./Icons";

const NAV = [
  { href: "/catalog", label: "Catalog" },
  { href: "/catalog?category=Hormone%20Therapy", label: "Hormones" },
  { href: "/catalog?category=Pain%20%26%20Inflammation", label: "Pain" },
  { href: "/account", label: "My refills" },
];

export function Header() {
  const { cartCount, patient, ready } = useStore();

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Mark className="h-9 w-9" />
          <span className="leading-tight">
            <span className="serif block text-lg tracking-[0.18em]">{BRAND.name}</span>
            <span className="block text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              Compounding
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-forest">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={patient ? "/account" : "/login"}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm hover:border-forest"
          >
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {ready && patient ? patient.firstName : "Sign in"}
            </span>
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1.5 text-sm text-paper-strong"
          >
            <CartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {ready && cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brass px-1 text-[11px] text-forest-deep">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
