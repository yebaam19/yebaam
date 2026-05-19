"""
Retry remaining portal sections with delays + alternative article titles +
identified user-agent (Wikipedia rate-limits anonymous high-volume callers).

Pairs are (portal_section_id, [candidate Wikipedia article titles]).
The first title that returns a `pageimages.original` of an image (not webm)
is used.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

CANDIDATES: list[tuple[str, list[str]]] = [
    ("promotions", ["Coupon", "Discount_(sales)", "Sales_promotion"]),
    ("videos", ["Video_camera", "Cinematography", "Camcorder"]),
    ("religion", ["Cathedral", "Church_(building)", "Place_of_worship"]),
    ("malls", ["Shopping_mall", "Shopping_center"]),
    ("sports", ["Stadium", "Sports_venue", "Association_football"]),
    ("health", ["Hospital", "Health_care", "Clinic"]),
    ("grocery", ["Supermarket", "Grocery_store"]),
    ("rural", ["Rural_area", "Village", "Countryside"]),
]

WIKI_ENDPOINT = "https://en.wikipedia.org/w/api.php"
UA = "client-next-portal-seed/1.0 (https://github.com/anthropics/claude-code)"

IMAGE_EXT_OK = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".svg")


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
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
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read().decode("utf-8"))
    pages = data.get("query", {}).get("pages", {})
    for _, page in pages.items():
        original = page.get("original")
        if not original or "source" not in original:
            continue
        src = original["source"]
        if src.lower().endswith(IMAGE_EXT_OK):
            return src
    return None


def upload_to_cloudflare(account_id: str, token: str, image_url: str, section: str) -> str | None:
    api = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1"
    boundary = "----CFImagesUpload" + os.urandom(8).hex()
    parts: list[bytes] = []
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(b'Content-Disposition: form-data; name="url"\r\n\r\n')
    parts.append(image_url.encode() + b"\r\n")
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(b'Content-Disposition: form-data; name="metadata"\r\n\r\n')
    parts.append(json.dumps({"section": section, "source": "wikipedia"}).encode() + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)
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
        print(f"  CF HTTP {e.code}: {err}", file=sys.stderr)
        return None
    if not data.get("success"):
        print(f"  CF error: {data}", file=sys.stderr)
        return None
    return data["result"]["id"]


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    env = load_env(repo_root / ".env.local")
    account_id = env["CLOUDFLARE_ACCOUNT_ID"]
    token = env["CLOUDFLARE_API_TOKEN"]

    inserts: list[str] = []
    skipped: list[tuple[str, str]] = []

    for section, candidates in CANDIDATES:
        img_url: str | None = None
        for title in candidates:
            print(f"[{section}] trying {title!r}…", file=sys.stderr)
            try:
                img_url = get_wiki_image_url(title)
            except Exception as e:
                print(f"  wiki: {e}", file=sys.stderr)
                img_url = None
            time.sleep(2.0)
            if img_url:
                print(f"  → {img_url}", file=sys.stderr)
                break
        if not img_url:
            skipped.append((section, "no-image-found"))
            continue
        cf_id = upload_to_cloudflare(account_id, token, img_url, section)
        if not cf_id:
            skipped.append((section, "cf-upload-failed"))
            continue
        print(f"  → CF id {cf_id}", file=sys.stderr)
        inserts.append(f"  ('{section}', '{cf_id}')")

    if inserts:
        print("-- generated by scripts/upload-portal-thumbnails-retry.py")
        print("insert into discovery_thumbnails (category, cf_image_id) values")
        print(",\n".join(inserts))
        print("on conflict (category) do update set cf_image_id = excluded.cf_image_id;")

    if skipped:
        print("\n-- skipped:", file=sys.stderr)
        for s, r in skipped:
            print(f"-- {s}: {r}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
