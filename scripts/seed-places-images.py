"""One-off: source a Wikipedia main image per seeded Popayán place,
upload to Cloudflare Images, and emit UPDATE SQL to attach cf_image_id."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

PLACES: list[tuple[str, str]] = [
    ("efcc622c-2190-4e43-b4cd-880605231269", "Iglesia_de_San_Francisco_(Popay%C3%A1n)"),
    ("0f202dd0-5013-4d95-b1b4-dfc188147af3", "Puente_del_Humilladero"),
    ("5bf68805-7ba4-4a6d-8212-c47aebd8693a", "Morro_de_Tulc%C3%A1n"),
    ("dcee54a6-2ecf-405d-932f-da86aa31b192", "Popay%C3%A1n"),
    ("6381b65a-ae23-4d01-b322-543ec5bc8429", "Parque_Caldas_(Popay%C3%A1n)"),
    ("06dac8fb-3561-4d41-870f-a5940f871c45", "Catedral_de_Popay%C3%A1n"),
]

WIKI_ES = "https://es.wikipedia.org/w/api.php"
WIKI_EN = "https://en.wikipedia.org/w/api.php"
UA = "client-next-portal-seed/1.0"
IMAGE_EXT_OK = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg")


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


def wiki_image(endpoint: str, title: str) -> str | None:
    params = {
        "action": "query",
        "format": "json",
        "prop": "pageimages",
        "piprop": "original",
        "titles": urllib.parse.unquote(title),
    }
    url = f"{endpoint}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"  wiki: {e}", file=sys.stderr)
        return None
    pages = data.get("query", {}).get("pages", {})
    for _, page in pages.items():
        original = page.get("original")
        if not original or "source" not in original:
            continue
        src = original["source"]
        if src.lower().endswith(IMAGE_EXT_OK):
            return src
    return None


def upload_to_cf(account_id: str, token: str, image_url: str, place_id: str) -> str | None:
    api = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1"
    boundary = "----CFImagesUpload" + os.urandom(8).hex()
    parts: list[bytes] = []
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(b'Content-Disposition: form-data; name="url"\r\n\r\n')
    parts.append(image_url.encode() + b"\r\n")
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(b'Content-Disposition: form-data; name="metadata"\r\n\r\n')
    parts.append(json.dumps({"place_id": place_id, "source": "wikipedia"}).encode() + b"\r\n")
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
        print(f"  CF HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}", file=sys.stderr)
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

    updates: list[str] = []
    for place_id, title in PLACES:
        print(f"[{place_id}] {title}…", file=sys.stderr)
        img = wiki_image(WIKI_ES, title) or wiki_image(WIKI_EN, title)
        time.sleep(1.5)
        if not img:
            print("  no image", file=sys.stderr)
            continue
        print(f"  → {img}", file=sys.stderr)
        cf_id = upload_to_cf(account_id, token, img, place_id)
        if not cf_id:
            continue
        print(f"  → CF {cf_id}", file=sys.stderr)
        updates.append(f"update city_places set cf_image_id = '{cf_id}' where id = '{place_id}';")

    if updates:
        print("\n".join(updates))
    return 0


if __name__ == "__main__":
    sys.exit(main())
