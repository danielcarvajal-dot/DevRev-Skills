#!/usr/bin/env python3
"""Export SE enablement markdown to print PDFs (DevRev visual language)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import markdown

DOCS = Path(__file__).resolve().parent
CHROME = "/usr/bin/google-chrome-stable"

# DevRev print palette: black/white wordmark, sophisticated greys,
# one saturated digitally-native accent (service desk / Computer).
DOCS_META = {
    "se-configuration-guide.md": {
        "eyebrow": "Sales engineer enablement",
        "kicker": "Lab guide",
        "pdf": "se-configuration-guide.pdf",
    },
    "se-demo-script.md": {
        "eyebrow": "Sales engineer enablement",
        "kicker": "Talk track",
        "pdf": "se-demo-script.pdf",
    },
}

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <style>
    @page {{
      size: letter;
      margin: 0.7in 0.7in 0.75in 0.7in;
    }}
    * {{ box-sizing: border-box; }}
    html, body {{
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      font-family: Inter, "Liberation Sans", Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    .masthead {{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 3px solid #111;
      padding-bottom: 10px;
      margin-bottom: 22px;
    }}
    .wordmark {{
      font-weight: 600;
      font-size: 13pt;
      letter-spacing: -0.02em;
    }}
    .eyebrow {{
      font-size: 8.5pt;
      color: #5c5c5c;
      font-weight: 500;
    }}
    .kicker {{
      display: inline-block;
      background: #111;
      color: #fff;
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 0.02em;
      padding: 2px 8px;
      margin-bottom: 10px;
    }}
    h1 {{
      font-size: 22pt;
      font-weight: 600;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin: 0 0 12px 0;
    }}
    h2 {{
      font-size: 13.5pt;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 26px 0 10px 0;
      padding-top: 8px;
      border-top: 1px solid #d8d8d8;
      page-break-after: avoid;
    }}
    h3 {{
      font-size: 11.5pt;
      font-weight: 600;
      margin: 18px 0 8px 0;
      page-break-after: avoid;
    }}
    p {{ margin: 0 0 10px 0; }}
    a {{ color: #0b6e6b; text-decoration: none; }}
    strong {{ font-weight: 600; }}
    ul, ol {{ margin: 0 0 12px 1.2em; padding: 0; }}
    li {{ margin: 0 0 4px 0; }}
    li ul, li ol {{ margin-top: 4px; margin-bottom: 4px; }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 14px 0;
      font-size: 9.5pt;
      page-break-inside: auto;
    }}
    thead {{ display: table-header-group; }}
    th, td {{
      border: 1px solid #d0d0d0;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }}
    th {{
      background: #111;
      color: #fff;
      font-weight: 600;
    }}
    tr {{ page-break-inside: avoid; }}
    pre, code {{
      font-family: "JetBrains Mono", "Cascadia Mono", "Liberation Mono", monospace;
    }}
    code {{
      font-size: 8.8pt;
      background: #f3f3f3;
      padding: 1px 4px;
    }}
    pre {{
      background: #111;
      color: #f5f5f5;
      font-size: 8.2pt;
      line-height: 1.4;
      padding: 10px 12px;
      margin: 0 0 12px 0;
      white-space: pre-wrap;
      word-break: break-word;
      page-break-inside: avoid;
    }}
    pre code {{
      background: transparent;
      color: inherit;
      padding: 0;
      font-size: inherit;
    }}
    blockquote {{
      margin: 0 0 12px 0;
      padding: 8px 12px;
      border-left: 3px solid #0b6e6b;
      background: #f4fbfb;
    }}
    blockquote p:last-child {{ margin-bottom: 0; }}
    hr {{
      border: 0;
      border-top: 1px solid #d8d8d8;
      margin: 18px 0;
    }}
    .footer-note {{
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid #d8d8d8;
      font-size: 8.5pt;
      color: #5c5c5c;
    }}
  </style>
</head>
<body>
  <header class="masthead">
    <div class="wordmark">DevRev</div>
    <div class="eyebrow">{eyebrow}</div>
  </header>
  <div class="kicker">{kicker}</div>
  {body}
  <p class="footer-note">DevRev sales engineer enablement. Do not include client secrets, personal access tokens, or raw JWTs in this document or on a customer call.</p>
</body>
</html>
"""


def md_to_html(md_text: str) -> tuple[str, str]:
    html = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "sane_lists"],
    )
    # Pair markdown links to the exported PDFs.
    html = html.replace("se-demo-script.md", "se-demo-script.pdf")
    html = html.replace("se-configuration-guide.md", "se-configuration-guide.pdf")
    title = "DevRev"
    if md_text.startswith("# "):
        title = md_text.splitlines()[0][2:].strip()
    # Drop the first H1 from the body; the template reprints it after the kicker
    # only if we keep it — keep it so the document title stays in the flow.
    return title, html


def export_one(md_name: str) -> Path:
    meta = DOCS_META[md_name]
    md_path = DOCS / md_name
    pdf_path = DOCS / meta["pdf"]
    html_path = DOCS / f".{md_name}.print.html"
    title, body = md_to_html(md_path.read_text())
    html_path.write_text(
        TEMPLATE.format(
            title=title,
            eyebrow=meta["eyebrow"],
            kicker=meta["kicker"],
            body=body,
        )
    )
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        f"file://{html_path}",
    ]
    subprocess.run(cmd, check=True, capture_output=True, text=True)
    html_path.unlink(missing_ok=True)
    return pdf_path


def main() -> int:
    for name in DOCS_META:
        path = export_one(name)
        print(f"wrote {path} ({path.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
