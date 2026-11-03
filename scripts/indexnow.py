"""Submit every URL in https://cleaningexits.com/sitemap.xml to IndexNow (Bing, Yandex, Seznam...).

Bing's index feeds ChatGPT search and Copilot. Runs daily from
.github/workflows/indexnow.yml; safe to run by hand: python3 scripts/indexnow.py
The key file public/064fdf50bec6dc6387029617d4744ff8.txt must be live first.
"""
import json
import re
import sys
import urllib.error
import urllib.request

HOST = "cleaningexits.com"
KEY = "064fdf50bec6dc6387029617d4744ff8"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "IndexNow-submit/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def locs(xml):
    return re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)


def main():
    root = get(f"https://{HOST}/sitemap.xml")
    urls = []
    # Handles both a plain urlset and a sitemap index.
    for loc in locs(root):
        if loc.endswith(".xml"):
            urls.extend(locs(get(loc)))
        else:
            urls.append(loc)
    urls = [u for u in dict.fromkeys(urls) if u.startswith(f"https://{HOST}/") or u == f"https://{HOST}"]
    print(f"[+] {len(urls)} urls")
    if not urls:
        sys.exit("no urls found; refusing to submit an empty list")
    if get(KEY_LOCATION).strip() != KEY:
        sys.exit(f"key file {KEY_LOCATION} is not live yet; deploy first")
    for i in range(0, len(urls), 10_000):
        body = json.dumps({"host": HOST, "key": KEY, "keyLocation": KEY_LOCATION,
                           "urlList": urls[i:i + 10_000]}).encode()
        req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                print(f"[+] batch {i // 10_000 + 1}: HTTP {r.status}")
        except urllib.error.HTTPError as e:
            # 403 SiteVerificationNotCompleted on the first run is normal: retry later.
            sys.exit(f"HTTP {e.code} {e.read().decode()[:200]}")


if __name__ == "__main__":
    main()
