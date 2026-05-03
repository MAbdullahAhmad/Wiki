#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════
# wikipedia-search.sh
# ═══════════════════════════════════════════════════════════════════
# Extracts important terms from a markdown file using regex patterns,
# searches Wikipedia API in parallel with curl, writes a JSON file
# for the user to review.
#
# Usage:
#   scripts/wikipedia-search.sh <markdown-file> <output-json> [patterns-file] [wiki-index-json]
#
# The patterns file contains one grep -oP regex per line.
# Lines starting with # and blank lines are skipped.
# ═══════════════════════════════════════════════════════════════════

FILE="$1"
OUTPUT="$2"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PATTERNS="${3:-$REPO_ROOT/scripts/patterns.txt}"
WIKI_INDEX="${4:-$REPO_ROOT/wiki/_index.json}"
MAX_PARALLEL=10
MAX_TERMS=25

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# ── Step 1: Strip code blocks and existing markdown links ────────

sed '/^```/,/^```/d' "$FILE" \
  | sed 's/`[^`]*`//g' \
  | sed 's/\[[^]]*\]([^)]*)//g' \
  > "$WORK/clean.txt"

# ── Step 2: Extract terms using every pattern in the file ────────

touch "$WORK/raw.txt"

while IFS= read -r pattern || [[ -n "$pattern" ]]; do
    # skip comments and blank lines
    [[ -z "$pattern" || "$pattern" =~ ^[[:space:]]*# ]] && continue
    grep -oP "$pattern" "$WORK/clean.txt" >> "$WORK/raw.txt" 2>/dev/null || true
done < "$PATTERNS"

# ── Step 3: Deduplicate and filter with python3 ─────────────────

PAGE_TITLE=$(grep -m1 '^title:' "$FILE" 2>/dev/null \
  | sed 's/^title:[[:space:]]*"*//;s/"*$//' || echo "")

python3 - "$WORK/raw.txt" "$WIKI_INDEX" "$PAGE_TITLE" "$MAX_TERMS" \
  << 'PYEOF' > "$WORK/terms.txt"
import sys, json

raw_file, index_file, page_title, max_terms = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])

# Load local page titles to exclude (they belong in local-links)
local = set()
try:
    with open(index_file) as f:
        for p in json.load(f).get("pages", []):
            local.add(p["title"].lower())
except Exception:
    pass

seen = set()
terms = []
for line in open(raw_file):
    t = line.strip()
    if not t or len(t) < 3 or len(t) > 80:
        continue
    if t.lower() in seen or t.lower() == page_title.lower():
        continue
    if t.lower() in local:
        continue
    seen.add(t.lower())
    terms.append(t)
    if len(terms) >= max_terms:
        break

for t in terms:
    print(t)
PYEOF

TERM_COUNT=$(wc -l < "$WORK/terms.txt" | tr -d ' ')

if [ "$TERM_COUNT" -eq 0 ]; then
    python3 -c "
import json, sys, os
json.dump({
  '_info': 'No Wikipedia terms found.',
  '_file': os.path.basename(sys.argv[1]),
  'links': []
}, open(sys.argv[2], 'w'), indent=2)
" "$FILE" "$OUTPUT"
    echo "0"
    exit 0
fi

# ── Step 4: Curl Wikipedia API in parallel ───────────────────────

mkdir -p "$WORK/results"
export RESULTS_DIR="$WORK/results"

search_one() {
    local term="$1"
    local encoded safe
    encoded=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$term")
    safe=$(echo "$term" | md5sum | cut -c1-8)
    curl -s --max-time 5 \
        "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&srlimit=1&utf8=1&format=json" \
        > "${RESULTS_DIR}/${safe}.json" 2>/dev/null || true
    echo "$term" > "${RESULTS_DIR}/${safe}.term"
}
export -f search_one

cat "$WORK/terms.txt" | xargs -P "$MAX_PARALLEL" -I {} bash -c 'search_one "$@"' _ {}

# ── Step 5: Assemble JSON output ────────────────────────────────

python3 - "$WORK/results" "$OUTPUT" "$FILE" << 'PYEOF'
import json, os, sys, re, html, glob

results_dir, output_file, source = sys.argv[1], sys.argv[2], sys.argv[3]

links = []
for tf in sorted(glob.glob(os.path.join(results_dir, "*.term"))):
    jf = tf[:-5] + ".json"
    if not os.path.exists(jf):
        continue
    term = open(tf).read().strip()
    try:
        data = json.load(open(jf))
        hits = data.get("query", {}).get("search", [])
        if not hits:
            continue
        r = hits[0]
        title = r["title"]
        snippet = html.unescape(r.get("snippet", ""))
        snippet = re.sub(r"<[^>]+>", "", snippet)[:200]
        url = "https://en.wikipedia.org/wiki/" + title.replace(" ", "_")
        links.append({
            "include": False,
            "term": term,
            "wikipedia_title": title,
            "url": url,
            "description": snippet,
        })
    except Exception:
        continue

json.dump({
    "_info": 'Set "include" to true for Wikipedia links you want to add. Save the file, then press Enter in terminal.',
    "_file": os.path.basename(source),
    "links": links,
}, open(output_file, "w"), indent=2)

print(len(links))
PYEOF
