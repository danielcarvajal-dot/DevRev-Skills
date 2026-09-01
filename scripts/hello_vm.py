#!/usr/bin/env python3
"""Example VM script. Add new catalog entries the same way: a file plus catalog.json."""

from __future__ import annotations

import argparse
import os
import socket
from datetime import datetime, timezone


def main() -> int:
    parser = argparse.ArgumentParser(description="Example catalog script that prints VM identity.")
    parser.add_argument("--message", default="hello from the VM", help="Text to print")
    args = parser.parse_args()

    print(args.message)
    print(f"host={socket.gethostname()}")
    print(f"user={os.environ.get('USER') or os.environ.get('USERNAME') or 'unknown'}")
    print(f"cwd={os.getcwd()}")
    print(f"utc={datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
