#!/usr/bin/env python3
"""Dispatch a cataloged VM script. Computer should run this — not ad-hoc shell.

Usage:
  python3 scripts/run_script.py list
  python3 scripts/run_script.py info install-printer-driver
  python3 scripts/run_script.py run hello-vm
  python3 scripts/run_script.py run shutdown-firefox -- --force
  python3 scripts/run_script.py run install-printer-driver -- --yes --drivers generic

Add a script by placing a file under scripts/ and appending an entry to
scripts/catalog.json. Do not pass arbitrary paths — only catalog IDs.
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CATALOG = REPO_ROOT / "scripts" / "catalog.json"
ALLOWED_ROOTS = (REPO_ROOT / "scripts",)


class CatalogError(Exception):
    pass


def detect_platform() -> str:
    system = platform.system().lower()
    if system.startswith("win"):
        return "windows"
    if system == "darwin":
        return "macos"
    return "linux"


def load_catalog(path: Path, extra_json: str | None = None) -> dict[str, Any]:
    if not path.is_file():
        raise CatalogError(f"catalog not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise CatalogError(f"invalid catalog JSON: {exc}") from exc

    scripts = list(data.get("scripts") or [])
    if extra_json:
        try:
            extra = json.loads(extra_json)
        except json.JSONDecodeError as exc:
            raise CatalogError(f"invalid extra catalog JSON: {exc}") from exc
        extra_scripts = extra if isinstance(extra, list) else extra.get("scripts") or []
        scripts.extend(extra_scripts)
    data["scripts"] = scripts
    return data


def index_scripts(catalog: dict[str, Any]) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for entry in catalog.get("scripts") or []:
        script_id = str(entry.get("id") or "").strip()
        if not script_id:
            raise CatalogError("catalog entry is missing id")
        if script_id in indexed:
            raise CatalogError(f"duplicate catalog id: {script_id}")
        indexed[script_id] = entry
    return indexed


def platform_spec(entry: dict[str, Any], plat: str) -> dict[str, Any]:
    platforms = entry.get("platforms") or {}
    spec = platforms.get(plat)
    if not spec:
        available = ", ".join(sorted(platforms)) or "(none)"
        raise CatalogError(
            f"script {entry.get('id')!r} has no '{plat}' command (available: {available})"
        )
    return spec


def resolve_argv(argv: list[str]) -> list[str]:
    if not argv:
        raise CatalogError("command argv is empty")
    resolved: list[str] = []
    for part in argv:
        if looks_like_repo_path(part):
            resolved.append(str(safe_repo_path(part)))
        else:
            resolved.append(part)
    return resolved


def looks_like_repo_path(part: str) -> bool:
    if part.startswith("-"):
        return False
    return "/" in part or "\\" in part or part.endswith((".sh", ".py", ".ps1", ".bash"))


def safe_repo_path(rel: str) -> Path:
    raw = rel[2:] if rel.startswith("./") else rel
    path = (REPO_ROOT / raw).resolve()
    if not any(path == root or root in path.parents for root in ALLOWED_ROOTS):
        raise CatalogError(f"refusing path outside scripts/: {rel}")
    if not path.exists():
        raise CatalogError(f"script file not found: {path}")
    return path


def print_list(indexed: dict[str, dict[str, Any]], plat: str) -> int:
    if not indexed:
        print("No scripts in catalog.")
        return 0
    print(f"{'ID':<28} {'NAME':<28} PLATFORM")
    for script_id, entry in indexed.items():
        platforms = ",".join(sorted((entry.get("platforms") or {}).keys()))
        marker = "*" if plat in (entry.get("platforms") or {}) else " "
        print(f"{script_id:<28} {str(entry.get('name') or script_id):<28} {marker}{platforms}")
    print(f"\nCurrent platform: {plat}  (* = runnable here)")
    return 0


def print_info(entry: dict[str, Any], plat: str) -> int:
    print(f"id:          {entry.get('id')}")
    print(f"name:        {entry.get('name')}")
    print(f"description: {entry.get('description')}")
    spec = platform_spec(entry, plat)
    argv = resolve_argv(list(spec.get("argv") or []))
    default_args = list(spec.get("default_args") or [])
    print(f"platform:    {plat}")
    print(f"needs_root:  {bool(spec.get('needs_root'))}")
    print(f"command:     {shlex_join(argv + default_args)}")
    return 0


def shlex_join(parts: list[str]) -> str:
    try:
        import shlex

        return shlex.join(parts)
    except AttributeError:
        return " ".join(json.dumps(p) if " " in p else p for p in parts)


def run_entry(entry: dict[str, Any], plat: str, extra_args: list[str], dry_run: bool) -> int:
    spec = platform_spec(entry, plat)
    argv = resolve_argv(list(spec.get("argv") or []))
    default_args = list(spec.get("default_args") or [])
    cmd = argv + default_args + extra_args
    needs_root = bool(spec.get("needs_root"))

    if needs_root and plat == "linux" and hasattr(os, "geteuid") and os.geteuid() != 0:
        if cmd[0] != "sudo":
            cmd = ["sudo", "-n", *cmd]

    print(f"[run_script] id={entry.get('id')} platform={plat}")
    print(f"[run_script] exec: {shlex_join(cmd)}")
    if dry_run:
        print("[run_script] dry-run: not executing")
        return 0

    env = os.environ.copy()
    env.setdefault("PYTHONUNBUFFERED", "1")
    completed = subprocess.run(cmd, cwd=REPO_ROOT, env=env, check=False)
    if completed.returncode != 0:
        print(f"[run_script] exited {completed.returncode}", file=sys.stderr)
    return completed.returncode


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a cataloged VM script for Computer.")
    parser.add_argument(
        "--catalog",
        default=str(DEFAULT_CATALOG),
        help="Path to catalog.json (default: scripts/catalog.json)",
    )
    parser.add_argument(
        "--extra-catalog-json",
        default=os.environ.get("VM_SCRIPT_EXTRA_CATALOG", ""),
        help="JSON object or array of extra script entries (or VM_SCRIPT_EXTRA_CATALOG)",
    )
    parser.add_argument("--platform", default="", help="Override linux|windows|macos")
    sub = parser.add_subparsers(dest="action", required=True)

    sub.add_parser("list", help="List cataloged scripts")
    info = sub.add_parser("info", help="Show how a script would run")
    info.add_argument("script_id")
    run = sub.add_parser("run", help="Execute a cataloged script")
    run.add_argument("script_id")
    run.add_argument("--dry-run", action="store_true")
    run.add_argument("extra", nargs="*", help="Extra args (prefix with -- to pass flags through)")
    return parser


def strip_separator(extra: list[str]) -> list[str]:
    if extra and extra[0] == "--":
        return extra[1:]
    return extra


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    plat = args.platform or detect_platform()
    try:
        catalog = load_catalog(Path(args.catalog), args.extra_catalog_json or None)
        indexed = index_scripts(catalog)
        if args.action == "list":
            return print_list(indexed, plat)
        entry = indexed.get(args.script_id)
        if entry is None:
            known = ", ".join(sorted(indexed)) or "(empty catalog)"
            raise CatalogError(f"unknown script id {args.script_id!r}. Known: {known}")
        if args.action == "info":
            return print_info(entry, plat)
        return run_entry(entry, plat, strip_separator(args.extra), args.dry_run)
    except CatalogError as exc:
        print(f"[run_script] error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
