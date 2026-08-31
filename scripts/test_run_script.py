#!/usr/bin/env python3
"""Unit tests for the Computer VM script dispatcher."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUNNER = ROOT / "scripts" / "run_script.py"


def run_dispatcher(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(RUNNER), *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


class RunScriptTests(unittest.TestCase):
    def test_list_includes_builtin_ids(self) -> None:
        result = run_dispatcher("list")
        self.assertEqual(result.returncode, 0, result.stderr)
        for script_id in ("install-printer-driver", "shutdown-firefox", "hello-vm"):
            self.assertIn(script_id, result.stdout)

    def test_run_hello_vm(self) -> None:
        result = run_dispatcher("run", "hello-vm", "--", "--message", "catalog-ok")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("catalog-ok", result.stdout)
        self.assertIn("host=", result.stdout)

    def test_unknown_id(self) -> None:
        result = run_dispatcher("run", "not-a-real-script")
        self.assertEqual(result.returncode, 2)
        self.assertIn("unknown script id", result.stderr)

    def test_rejects_path_outside_scripts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            catalog = Path(tmp) / "catalog.json"
            catalog.write_text(
                json.dumps(
                    {
                        "version": 1,
                        "scripts": [
                            {
                                "id": "evil",
                                "name": "evil",
                                "platforms": {
                                    "linux": {"argv": ["bash", "etc/passwd"]},
                                    "windows": {"argv": ["cmd", "etc/passwd"]},
                                },
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            result = run_dispatcher("--catalog", str(catalog), "run", "evil")
            self.assertEqual(result.returncode, 2)
            self.assertIn("refusing path outside scripts/", result.stderr)

    def test_dry_run_does_not_execute(self) -> None:
        result = run_dispatcher("run", "hello-vm", "--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("dry-run", result.stdout)
        self.assertNotIn("hello from the VM", result.stdout)

    def test_extra_catalog_json(self) -> None:
        extra = json.dumps(
            [
                {
                    "id": "inline-hello",
                    "name": "Inline hello",
                    "platforms": {
                        "linux": {"argv": ["python3", "scripts/hello_vm.py"]},
                        "windows": {"argv": ["python", "scripts/hello_vm.py"]},
                    },
                }
            ]
        )
        result = run_dispatcher("--extra-catalog-json", extra, "run", "inline-hello")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("hello from the VM", result.stdout)


if __name__ == "__main__":
    unittest.main()
