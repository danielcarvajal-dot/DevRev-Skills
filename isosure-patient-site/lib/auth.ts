import type { Doctor, PharmacistUser, PharmacyUser, QualityUser, SessionUser } from "./types";

export type Portal = "ops" | "provider" | "qa";

export type LoginAccount = {
  username: string;
  portal: Portal | "all";
  label: string;
  home: string;
  description: string;
};

export const LOGIN_ACCOUNTS: LoginAccount[] = [
  {
    username: "hkitner-Ops",
    portal: "ops",
    label: "Operations",
    home: "/ops",
    description: "Lab floor, intake, inventory, compounding.",
  },
  {
    username: "hkitner-Provider",
    portal: "provider",
    label: "Provider",
    home: "/account",
    description: "Prescriber portal — patients, orders, refills.",
  },
  {
    username: "hkitner-QA",
    portal: "qa",
    label: "Quality",
    home: "/qa",
    description: "QMS — release, deviations, environment holds.",
  },
  {
    username: "hkitner-RPh",
    portal: "all",
    label: "Pharmacist",
    home: "/hub",
    description: "Access to Operations, Provider, and Quality.",
  },
];

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function resolveLogin(username: string): LoginAccount | null {
  const key = normalizeUsername(username);
  return LOGIN_ACCOUNTS.find((account) => normalizeUsername(account.username) === key) || null;
}

export function canAccessOps(user: SessionUser | null | undefined): user is SessionUser {
  return user?.role === "pharmacy" || user?.role === "rph";
}

export function canAccessProvider(user: SessionUser | null | undefined): user is SessionUser {
  return user?.role === "doctor" || user?.role === "rph";
}

export function canAccessQa(user: SessionUser | null | undefined): user is SessionUser {
  return user?.role === "qa" || user?.role === "rph";
}

export function homePath(user: SessionUser | null | undefined) {
  if (!user) return "/login";
  if (user.role === "rph") return "/hub";
  if (user.role === "qa") return "/qa";
  if (user.role === "pharmacy") return "/ops";
  return "/account";
}

export function staffName(user: SessionUser) {
  if (user.role === "doctor") return user.prescriberName;
  if (user.role === "pharmacy") return user.contactName;
  return user.displayName;
}

export function staffLabel(user: SessionUser | null | undefined) {
  if (!user) return "Sign in";
  if (user.role === "doctor") return user.practiceName;
  if (user.role === "pharmacy") return user.pharmacyName;
  if (user.role === "qa") return "Quality";
  return user.pharmacyName;
}

export function providerIdentity(user: SessionUser): Pick<Doctor, "practiceName" | "prescriberName" | "npi" | "dea" | "loginKind"> {
  if (user.role === "doctor") {
    return {
      practiceName: user.practiceName,
      prescriberName: user.prescriberName,
      npi: user.npi,
      dea: user.dea,
      loginKind: user.loginKind,
    };
  }
  return {
    practiceName: "ISOSure Compounding Lab",
    prescriberName: staffName(user),
    npi: "",
    dea: "",
    loginKind: "prescriber",
  };
}

export function demoOpsUser(): PharmacyUser {
  return {
    id: "hkitner-ops",
    role: "pharmacy",
    username: "hkitner-Ops",
    pharmacyName: "ISOSure Compounding Lab",
    contactName: "Hannah Kitner",
    email: "hkitner-ops@isosure.example",
    phone: "(800) 555-4767",
    createdAt: new Date().toISOString(),
  };
}

export function demoProviderUser(): Doctor {
  return {
    id: "hkitner-provider",
    role: "doctor",
    username: "hkitner-Provider",
    loginKind: "prescriber",
    practiceName: "Hawthorne Family Medicine",
    prescriberName: "Hannah Kitner, NP",
    npi: "1234567890",
    dea: "BK1234563",
    email: "hkitner-provider@hawthornefm.example",
    phone: "(503) 555-0148",
    createdAt: new Date().toISOString(),
  };
}

export function demoQaUser(): QualityUser {
  return {
    id: "hkitner-qa",
    role: "qa",
    username: "hkitner-QA",
    displayName: "Hannah Kitner",
    email: "hkitner-qa@isosure.example",
    createdAt: new Date().toISOString(),
  };
}

export function demoRphUser(): PharmacistUser {
  return {
    id: "hkitner-rph",
    role: "rph",
    username: "hkitner-RPh",
    displayName: "Hannah Kitner, RPh",
    pharmacyName: "ISOSure Compounding Lab",
    email: "hkitner-rph@isosure.example",
    createdAt: new Date().toISOString(),
  };
}

export function userForAccount(account: LoginAccount): SessionUser {
  if (account.portal === "ops") return demoOpsUser();
  if (account.portal === "provider") return demoProviderUser();
  if (account.portal === "qa") return demoQaUser();
  return demoRphUser();
}
