"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { LOGIN_ACCOUNTS } from "@/lib/auth";
import { useStore } from "@/lib/store";

export function MainLogin() {
  const router = useRouter();
  const { signInUsername } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(nextUsername = username) {
    const result = signInUsername(nextUsername);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(result.home);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <img src={BRAND.logo} alt={BRAND.legalName} className="mx-auto h-20 w-auto" />
      <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">
        ISOSure · {BRAND.tagline}
      </p>
      <h1 className="mt-2 text-center text-3xl font-semibold">Sign in</h1>
      <p className="mt-2 text-center text-ink-soft">
        One login. Three pages: Operations, Provider, and Quality. The pharmacist account can open
        all three.
      </p>

      <form
        className="mt-8 space-y-3 rounded-2xl border border-line bg-paper p-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="block text-sm">
          Username
          <input
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder="hkitner-Ops"
            required
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Any value for this demo"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="w-full rounded-lg bg-purple-deep py-2.5 text-sm font-semibold text-white">
          Sign in
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Login examples</p>
        <ul className="mt-3 space-y-2">
          {LOGIN_ACCOUNTS.map((account) => (
            <li key={account.username}>
              <button
                type="button"
                className="w-full rounded-xl border border-line px-3 py-3 text-left hover:border-purple-mid"
                onClick={() => {
                  setUsername(account.username);
                  setPassword("");
                  setError("");
                  submit(account.username);
                }}
              >
                <span className="font-semibold">{account.username}</span>
                <span className="ml-2 text-sm text-ink-soft">{account.label}</span>
                <p className="mt-1 text-sm text-ink-soft">{account.description}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New practice?{" "}
        <Link href="/provider/register" className="underline underline-offset-4">
          Create a provider profile
        </Link>
      </p>
    </div>
  );
}
