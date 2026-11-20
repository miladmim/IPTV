#!/usr/bin/env python3
"""
Parto TV - Static Database Builder
Builds data/channels.json from playlists/*.m3u and playlists/sources.json
without requiring PHP or a web server.
"""

import os
import re
import json
import gzip
import time
import base64
import hashlib
import sqlite3
from urllib.parse import urlparse, parse_qs, unquote

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PLDIR = os.path.join(BASE_DIR, "playlists")
OUT_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(BASE_DIR, "..", "data", "parto.sqlite")

def b64u(raw_bytes):
    return base64.urlsafe_b64encode(raw_bytes).decode("ascii").rstrip("=")

def m3u_kind(url, drm=False):
    if drm:
        return "drm"
    if not re.match(r"^https?://", url, re.I):
        return "proto"
    path = url.split("?")[0].split("#")[0].lower()
    if path.endswith(".mpd"):
        return "dash"
    if path.endswith(".flv"):
        return "flv"
    if re.search(r"\.(ts|mp4|mkv|avi|mp3|aac|ogg)$", path):
        return "file"
    return "hls"

def m3u_unquote(v):
    v = v.strip()
    if len(v) > 1 and (v[0] in ('"', "'")) and v[-1] == v[0]:
        return v[1:-1]
    return v

def m3u_inf(line):
    line_body = line[8:]
    in_q = False
    comma_idx = -1
    for i, c in enumerate(line_body):
        if c == '"':
            in_q = not in_q
        elif c == ',' and not in_q:
            comma_idx = i
            break
            
    if comma_idx < 0:
        head = line_body
        name = ""
    else:
        head = line_body[:comma_idx]
        name = line_body[comma_idx + 1:].strip()
        
    attrs = {}
    for m in re.finditer(r'([\w-]+)="([^"]*)"', head):
        attrs[m.group(1).lower()] = m.group(2)
        
    return {
        "attrs": attrs,
        "name": name,
        "ua": "",
        "ref": "",
        "group": "",
        "drm": False
    }

def m3u_clean_url(raw):
    url = re.sub(r"^h(https?://)", r"\1", raw.strip(), flags=re.I)
    ua = ""
    ref = ""
    if "|" in url and re.match(r"^https?:", url, re.I):
        parts = url.split("|", 1)
        url = parts[0]
        params = parse_qs(parts[1])
        for k, v in params.items():
            kl = k.lower()
            val = v[0] if v else ""
            if kl == "user-agent":
                ua = val
            elif kl in ("referer", "referrer"):
                ref = val
    return url, ua, ref

def m3u_finish(c, url, eua="", eref=""):
    a = c["attrs"]
    name = c["name"].strip() or a.get("tvg-name", "").strip()
    orig = name
    q = 0
    flags = 0
    
    # Extract resolution and tags from name
    for _ in range(6):
        m = re.search(r"\s*[(\[]([^()\[\]]{1,24})[)\]]\s*$", name)
        if not m:
            break
        tag = m.group(1).strip()
        if re.match(r"^\d{3,4}[pi]$", tag, re.I):
            if not q:
                try:
                    q = int(re.sub(r"\D", "", tag))
                except Exception:
                    pass
        elif re.search(r"geo", tag, re.I):
            flags |= 1
        elif re.search(r"not\s*24\s*/\s*7", tag, re.I):
            flags |= 2
        else:
            break
        name = name[:m.start()]
        
    if not name:
        name = orig or a.get("tvg-id", "Channel")
        
    tvg = a.get("tvg-id", "")
    country = ""
    if "." in tvg:
        parts = tvg.rsplit(".", 1)[1].split("@")
        cc = parts[0].lower()
        if re.match(r"^[a-z]{2}$", cc):
            country = "gb" if cc == "uk" else cc
            
    group_str = (a.get("group-title", "") + ";" + c.get("group", "")).strip()
    groups = []
    seen_g = set()
    for g in re.split(r"[;,]", group_str):
        g = g.strip()
        if not g or g.lower() == "undefined":
            continue
        gl = g.lower()
        if gl not in seen_g:
            seen_g.add(gl)
            groups.append(g)
            
    logo = a.get("tvg-logo", "").strip()
    if not re.match(r"^https?://", logo, re.I):
        logo = ""
        
    ua = c.get("ua") or a.get("http-user-agent") or eua
    ref = c.get("ref") or a.get("http-referrer") or a.get("http-referer") or eref
    
    return {
        "url": url,
        "name": name,
        "logo": logo,
        "groups": groups,
        "country": country,
        "q": q,
        "flags": flags,
        "ua": m3u_unquote(ua),
        "ref": m3u_unquote(ref),
        "kind": m3u_kind(url, c.get("drm", False))
    }

def parse_m3u_file(filepath):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    if text.startswith("\ufeff"):
        text = text[1:]
        
    out = []
    cur = None
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            if line.startswith("#EXTINF:"):
                cur = m3u_inf(line)
            elif cur is not None:
                if line.startswith("#EXTVLCOPT:"):
                    kv = line[11:]
                    if "=" in kv:
                        k, v = kv.split("=", 1)
                        kl = k.strip().lower()
                        vl = m3u_unquote(v.strip())
                        if kl == "http-user-agent":
                            cur["ua"] = vl
                        elif kl in ("http-referrer", "http-referer"):
                            cur["ref"] = vl
                elif line.startswith("#KODIPROP:"):
                    if re.search(r"drm|license", line, re.I):
                        cur["drm"] = True
                elif line.startswith("#EXTGRP:"):
                    cur["group"] = line[8:].strip()
            continue
            
        url, ua, ref = m3u_clean_url(line)
        if cur is None:
            p = urlparse(url)
            n = f"{p.netloc}{p.path}" if p.netloc else url
            cur = {"attrs": {}, "name": n, "ua": "", "ref": "", "group": "", "drm": False}
        out.append(m3u_finish(cur, url, ua, ref))
        cur = None
    return out

def build():
    t0 = time.time()
    os.makedirs(OUT_DIR, exist_ok=True)
    
    # Load sources.json metadata
    sources_meta = {}
    smf = os.path.join(PLDIR, "sources.json")
    if os.path.isfile(smf):
        try:
            with open(smf, "r", encoding="utf-8") as f:
                sources_meta = json.load(f)
        except Exception as e:
            print("Failed to read sources.json:", e)
            
    # Find all m3u/m3u8 files
    files = []
    for f in os.listdir(PLDIR):
        if f.lower().endswith((".m3u", ".m3u8")):
            files.append(f)
            
    sources = []
    for f in files:
        key = re.sub(r"\.m3u8?$", "", f, flags=re.I)
        m = sources_meta.get(key, {})
        sources.append({
            "file": os.path.join(PLDIR, f),
            "key": key,
            "fa": m.get("fa", key),
            "en": m.get("en", key),
            "order": m.get("order", 1000)
        })
        
    sources.sort(key=lambda s: (s["order"], s["key"].lower()))
    
    # Read existing DB health status if available
    old_health = {}
    if os.path.isfile(DB_PATH):
        try:
            con = sqlite3.connect(DB_PATH)
            cur = con.cursor()
            cur.execute("SELECT id, s, ms FROM chan")
            for r in cur.fetchall():
                old_health[r[0]] = {"s": int(r[1]), "ms": int(r[2])}
            con.close()
            print(f"Loaded {len(old_health)} channel health records from database.")
        except Exception as e:
            print("Notice: could not read old health from database:", e)

    seen_urls = set()
    channels = []
    src_out = []
    
    for si, src in enumerate(sources):
        print(f"Parsing playlist: {src['file']} ({src['fa']})...")
        parsed = parse_m3u_file(src["file"])
        unique_ch = []
        for ch in parsed:
            if ch["url"] in seen_urls:
                continue
            seen_urls.add(ch["url"])
            ch["src"] = si
            unique_ch.append(ch)
            
        unique_ch.sort(key=lambda c: c["name"].lower())
        src_out.append({
            "k": src["key"],
            "fa": src["fa"],
            "en": src["en"],
            "n": len(unique_ch)
        })
        channels.extend(unique_ch)
        print(f"  -> Added {len(unique_ch)} channels from {src['key']}")

    group_index = {}
    groups = []
    ids = set()
    ch_list = []
    
    for i, ch in enumerate(channels):
        # Generate stable channel id from sha1 of URL
        h = b64u(hashlib.sha1(ch["url"].encode("utf-8")).digest())
        cid = h[:8]
        length = 9
        while cid in ids and length <= len(h):
            cid = h[:length]
            length += 1
        ids.add(cid)
        
        gi = []
        for gname in ch["groups"]:
            gk = gname.lower()
            if gk not in group_index:
                group_index[gk] = len(groups)
                groups.append(gname)
            gi.append(group_index[gk])
            
        kind = ch["kind"]
        s = 0
        ms = 0
        if kind != "hls":
            s = 3
        elif cid in old_health:
            s = old_health[cid]["s"]
            ms = old_health[cid]["ms"]
            
        # Format: [id, name, url, logo, [groups], country, q, src, flags, kind, s, ms]
        ch_list.append([
            cid,
            ch["name"],
            ch["url"],
            ch["logo"],
            gi,
            ch["country"],
            ch["q"],
            ch["src"],
            ch["flags"],
            kind,
            s,
            ms
        ])

    payload = {
        "v": 4,
        "app": "Parto TV",
        "sources": src_out,
        "groups": groups,
        "ch": ch_list
    }

    out_file = os.path.join(OUT_DIR, "channels.json")
    out_gz = os.path.join(OUT_DIR, "channels.json.gz")
    
    json_bytes = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    with open(out_file, "wb") as f:
        f.write(json_bytes)
        
    with gzip.open(out_gz, "wb", compresslevel=6) as f:
        f.write(json_bytes)
        
    duration = time.time() - t0
    print(f"\nDone in {duration:.2f}s!")
    print(f"Total channels: {len(ch_list)}")
    print(f"Total groups: {len(groups)}")
    print(f"Total sources: {len(src_out)}")
    print(f"channels.json: {len(json_bytes) / 1024:.1f} KB")
    print(f"channels.json.gz: {os.path.getsize(out_gz) / 1024:.1f} KB")

if __name__ == "__main__":
    build()
