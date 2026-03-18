#!/usr/bin/env python3
"""Submit Cityscootlab URLs to Bing's IndexNow API after each deploy."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Iterable, List, Set
from urllib import error, request
from urllib.parse import quote

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HOST = "cityscootlab.com"
DEFAULT_KEY = "fc1887717a84459fabe3f4984e2669d7"

HOST = os.getenv("INDEXNOW_HOST", DEFAULT_HOST).strip()
BASE_URL = os.getenv("INDEXNOW_BASE_URL", f"https://{HOST}").rstrip("/")
KEY = os.getenv("INDEXNOW_KEY", DEFAULT_KEY).strip()
KEY_FILE_NAME = os.getenv("INDEXNOW_KEY_PATH", f"{KEY}.txt").lstrip("/")
KEY_LOCATION = os.getenv("INDEXNOW_KEY_LOCATION", f"{BASE_URL}/{KEY_FILE_NAME}")
ENDPOINT = os.getenv("INDEXNOW_ENDPOINT", "https://www.bing.com/indexnow")
MAX_URLS = int(os.getenv("INDEXNOW_MAX_URLS", "10000"))
SKIP = os.getenv("INDEXNOW_SKIP")
DRY_RUN = os.getenv("INDEXNOW_DRY_RUN")
SCAN_DIR = os.getenv("INDEXNOW_SCAN_DIR", "out").strip()
SCAN_ROOT = PROJECT_ROOT if SCAN_DIR in {"", ".", "./"} else (PROJECT_ROOT / SCAN_DIR)

EXCLUDED_DIRS = {".git", ".github", ".idea", ".netlify", "node_modules", "scripts", "__pycache__"}
TARGET_SUFFIXES = (".html", ".htm")


def should_skip(relative_path: Path) -> bool:
    """Return True when the file lives inside an excluded directory."""
    for part in relative_path.parts[:-1]:
        if part in EXCLUDED_DIRS:
            return True
    return False


def normalize_url_path(relative_path: Path) -> str:
    """Convert an exported HTML path into a canonical pretty URL path."""
    if relative_path.name.lower() in {"index.html", "index.htm"}:
        if relative_path.parent == Path("."):
            url_path = "/"
        else:
            parent = relative_path.parent.as_posix().rstrip("/")
            url_path = f"/{parent}/"
    else:
        stem_path = relative_path.with_suffix("")
        if stem_path.parent == Path(".") and stem_path.name in {"en", "es", "de"}:
            url_path = f"/{stem_path.name}/"
        else:
            url_path = f"/{stem_path.as_posix()}"

    # Collapse any double slashes that could appear after rstrip/concat.
    while "//" in url_path:
        url_path = url_path.replace("//", "/")

    if not url_path.startswith('/'):
        url_path = f"/{url_path}"

    if url_path != "/":
        url_path = quote(url_path, safe="/-_.~")
    return url_path


def discover_html_files() -> List[Path]:
    """Return every exported HTML file that should be announced to IndexNow."""
    collected: List[Path] = []
    for suffix in TARGET_SUFFIXES:
        for path in SCAN_ROOT.rglob(f"*{suffix}"):
            try:
                relative = path.relative_to(SCAN_ROOT)
            except ValueError:
                continue
            if should_skip(relative):
                continue
            if any(part.startswith("_") for part in relative.parts):
                continue
            if relative.name.lower() in {"404.html", "404.htm"}:
                continue
            collected.append(path)

    collected.sort(key=lambda item: item.relative_to(SCAN_ROOT).as_posix())

    unique: List[Path] = []
    seen: Set[Path] = set()
    for path in collected:
        if path in seen:
            continue
        seen.add(path)
        unique.append(path)
    return unique


def build_url_list(paths: Iterable[Path]) -> List[str]:
    urls: List[str] = []
    for path in paths:
        relative = path.relative_to(SCAN_ROOT)
        url_path = normalize_url_path(relative)
        if url_path == "/":
            url = f"{BASE_URL}/"
        else:
            url = f"{BASE_URL}{url_path}"
        urls.append(url)
    return urls


def submit_to_indexnow(urls: List[str]) -> bool:
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }

    if DRY_RUN:
        print("IndexNow dry-run: payload that would be submitted:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return True

    data = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    req = request.Request(ENDPOINT, data=data, headers={"Content-Type": "application/json"})
    try:
        with request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8", errors="replace").strip()
            print(f"IndexNow: submitted {len(urls)} URL(s) to Bing (HTTP {resp.status}).")
            if body:
                print(f"IndexNow response: {body}")
        return True
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace").strip()
        print(
            f"IndexNow warning: HTTP {exc.code} — {body or 'no response body'}",
            file=sys.stderr,
        )
        return False
    except error.URLError as exc:
        print(f"IndexNow warning: network error — {exc}", file=sys.stderr)
        return False


def main() -> int:
    if SKIP:
        print("IndexNow: skipping submission because INDEXNOW_SKIP is set.")
        return 0

    if not HOST:
        print("IndexNow error: INDEXNOW_HOST is empty.", file=sys.stderr)
        return 1
    if not KEY:
        print("IndexNow error: INDEXNOW_KEY is empty.", file=sys.stderr)
        return 1

    key_file = PROJECT_ROOT / KEY_FILE_NAME
    if not key_file.exists():
        key_file = PROJECT_ROOT / "public" / KEY_FILE_NAME

    if not key_file.exists():
        print(
            f"IndexNow warning: key file '{KEY_FILE_NAME}' is missing locally; make sure it is deployed.",
            file=sys.stderr,
        )

    if not SCAN_ROOT.exists():
        print(f"IndexNow: scan directory '{SCAN_ROOT}' not found; skipping submission.")
        return 0

    html_files = discover_html_files()
    if not html_files:
        print("IndexNow: no HTML files found; nothing to submit.")
        return 0

    urls = build_url_list(html_files)
    if len(urls) > MAX_URLS:
        print(f"IndexNow: trimming URL list from {len(urls)} to {MAX_URLS} (API limit).")
        urls = urls[:MAX_URLS]

    print(f"IndexNow: preparing to submit {len(urls)} URL(s):")
    for url in urls:
        print(f"  - {url}")

    success = submit_to_indexnow(urls)
    if success:
        print("IndexNow: submission complete.")
    else:
        print("IndexNow: submission failed but deploy will continue.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
