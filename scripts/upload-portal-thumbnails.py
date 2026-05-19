"""
One-shot script: source representative Wikipedia main images for every portal
section that doesn't already have a `discovery_thumbnails` row, upload them to
Cloudflare Images via URL ingestion, and emit an SQL block to insert/update
the `discovery_thumbnails` table.

Usage:
    python scripts/upload-portal-thumbnails.py

Outputs the SQL to stdout. Pipe through the Supabase MCP to apply.

Requires the following env vars in .env.local:
    CLOUDFLARE_ACCOUNT_ID
    CLOUDFLARE_API_TOKEN
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

# (portal_section_id, Wikipedia article title)
# Article titles chosen so the page's main lead image is a representative
# real-world photo for the concept. We deliberately use English Wikipedia —
# the article main images are more consistently photographic.
SECTIONS: list[tuple[str, str]] = [
    ("chats", "Online_chat"),
    ("forums", "Internet_forum"),
    ("promotions", "Sales_promotion"),
    ("news", "Newspaper"),
    ("directories", "Telephone_directory"),
    ("classifieds", "Classified_advertising"),
    ("photos", "Photography"),
    ("videos", "Video"),
    ("publications", "Magazine"),
    ("government", "Government"),
    ("religion", "Cathedral"),
    ("malls", "Shopping_mall"),
    ("sports", "Stadium"),
    ("health", "Hospital"),
    ("grocery", "Supermarket"),
    ("clubs-blogs", "Community"),
    ("social-help", "Volunteering"),
    ("contact", "Email"),
    ("complaints", "Customer_service"),
    ("rural", "Countryside"),
]

WIKI_ENDPOINT = "https://en.wikipedia.org/w/api.php"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        # Strip surrounding quotes if any
        if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
            v = v[1:-1]
        env[k.strip()] = v.strip()
    return env


def get_wiki_image_url(title: str) -> str | None:
    params = {
        "action": "query",
        "format": "json",
        "prop": "pageimages",
        "piprop": "original",
        "titles": title,
    }
    url = f"{WIKI_ENDPOINT}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "client-next/portal-thumb-seed"})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read().decode("utf-8"))
    pages = data.get("query", {}).get("pages", {})
    for _, page in pages.items():
        original = page.get("original")
        if original and "source" in original:
            return original["source"]
    return None


def upload_to_cloudflare(account_id: str, token: str, image_url: str, section: str) -> str | None:
    """POST multipart/form-data with `url` field to Cloudflare Images."""
    api = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1"
    boundary = "----CFImagesUpload" + os.urandom(8).hex()
    body_parts: list[bytes] = []
    body_parts.append(f"--{boundary}\r\n".encode())
    body_parts.append(b'Content-Disposition: form-data; name="url"\r\n\r\n')
    body_parts.append(image_url.encode() + b"\r\n")
    body_parts.append(f"--{boundary}\r\n".encode())
    body_parts.append(b'Content-Disposition: form-data; name="metadata"\r\n\r\n')
    metadata = json.dumps({"section": section, "source": "wikipedia"})
    body_parts.append(metadata.encode() + b"\r\n")
    body_parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(body_parts)

    req = urllib.request.Request(
        api,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"  [{section}] CF HTTP {e.code}: {err}", file=sys.stderr)
        return None
    if not data.get("success"):
        print(f"  [{section}] CF API error: {data}", file=sys.stderr)
        return None
    return data["result"]["id"]


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    env_path = repo_root / ".env.local"
    if not env_path.exists():
        print(f"missing {env_path}", file=sys.stderr)
        return 1
    env = load_env(env_path)
    account_id = env.get("CLOUDFLARE_ACCOUNT_ID")
    token = env.get("CLOUDFLARE_API_TOKEN")
    if not account_id or not token:
        print("missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env.local", file=sys.stderr)
        return 1

    inserts: list[str] = []
    skipped: list[tuple[str, str]] = []
    for section, article in SECTIONS:
        print(f"[{section}] looking up Wikipedia main image for {article!r}…", file=sys.stderr)
        try:
            img_url = get_wiki_image_url(article)
        except Exception as e:
            print(f"  wiki error: {e}", file=sys.stderr)
            skipped.append((section, f"wiki-error:{e}"))
            continue
        if not img_url:
            print(f"  no main image", file=sys.stderr)
            skipped.append((section, "no-main-image"))
            continue
        print(f"  → {img_url}", file=sys.stderr)
        cf_id = upload_to_cloudflare(account_id, token, img_url, section)
        if not cf_id:
            skipped.append((section, "cf-upload-failed"))
            continue
        print(f"  → CF id {cf_id}", file=sys.stderr)
        # Escape single quotes for SQL safety
        s = section.replace("'", "''")
        c = cf_id.replace("'", "''")
        inserts.append(
            f"  ('{s}', '{c}')"
        )

    if not inserts:
        print("no inserts emitted", file=sys.stderr)
        return 1

    print("-- generated by scripts/upload-portal-thumbnails.py")
    print("insert into discovery_thumbnails (category, cf_image_id) values")
    print(",\n".join(inserts))
    print("on conflict (category) do update set cf_image_id = excluded.cf_image_id;")

    if skipped:
        print("\n-- skipped:", file=sys.stderr)
        for s, reason in skipped:
            print(f"-- {s}: {reason}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
