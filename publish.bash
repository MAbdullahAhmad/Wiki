#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# publish.bash - Publish draft wiki pages to wiki/ directory
# ============================================================
#
# Usage:
#   ./publish.bash              Interactive mode (select files)
#   ./publish.bash --all        Publish all drafts
#   ./publish.bash <file> ...   Publish specific files
#
# Workflow:
#   1. Selects drafts to publish
#   2. For each draft:
#      a) Generates two JSON files (.publish/):
#         - local-links.json   (links to other wiki pages)
#         - wikipedia-links.json (links to Wikipedia articles)
#      b) Opens the files for you to set "include": true
#      c) Waits for you to press Enter
#      d) Applies selected links and publishes to wiki/
#   3. Regenerates wiki/_index.json with updated metadata
# ============================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRAFTS_DIR="$REPO_ROOT/drafts"
WIKI_DIR="$REPO_ROOT/wiki"
PROJECT_DIR="$REPO_ROOT/project"
HELPER="$PROJECT_DIR/scripts/publish-helper.js"
WIKI_SEARCH="$REPO_ROOT/scripts/wikipedia-search.sh"
PUBLISH_DIR="$REPO_ROOT/.publish"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Pre-flight checks ──
if [ ! -d "$DRAFTS_DIR" ]; then
    echo -e "${RED}Error:${NC} No ${BOLD}drafts/${NC} directory found."
    echo "Create drafts/ and organize your markdown files by domain/subject/topic."
    exit 1
fi

if [ ! -f "$HELPER" ]; then
    echo -e "${RED}Error:${NC} publish-helper.js not found."
    echo "Expected at: $HELPER"
    exit 1
fi

mkdir -p "$WIKI_DIR"

# ── Discover drafts ──
mapfile -t DRAFT_FILES < <(find "$DRAFTS_DIR" -name "*.md" -type f | sort)

if [ ${#DRAFT_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}No markdown files found in drafts/${NC}"
    exit 0
fi

# ── Parse arguments → build SELECTED_INDICES ──
SELECTED_INDICES=()

if [ $# -gt 0 ]; then
    if [ "$1" == "--all" ]; then
        SELECTED_INDICES=($(seq 0 $((${#DRAFT_FILES[@]} - 1))))
    else
        for arg in "$@"; do
            for i in "${!DRAFT_FILES[@]}"; do
                rel="${DRAFT_FILES[$i]#$DRAFTS_DIR/}"
                fname=$(basename "${DRAFT_FILES[$i]}")
                if [[ "$rel" == "$arg" || "$fname" == "$arg" || "$fname" == "${arg}.md" ]]; then
                    SELECTED_INDICES+=("$i")
                fi
            done
        done
    fi
else
    # ── Interactive selection ──
    echo ""
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║         Wiki Publish Tool              ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Available drafts:${NC}"
    echo ""

    for i in "${!DRAFT_FILES[@]}"; do
        rel_path="${DRAFT_FILES[$i]#$DRAFTS_DIR/}"
        slug=$(basename "${DRAFT_FILES[$i]}" .md)
        dir_path=$(dirname "$rel_path")
        file_name=$(basename "$rel_path")

        if [ -f "$WIKI_DIR/$slug.md" ]; then
            status="${BLUE}UPDATE${NC}"
        else
            status="${GREEN}  NEW ${NC}"
        fi

        printf "  ${YELLOW}%2d${NC}. [${status}] ${DIM}%s/${NC}${BOLD}%s${NC}\n" \
            $((i + 1)) "$dir_path" "$file_name"
    done

    echo ""
    echo -e "  Enter numbers ${DIM}(comma-separated, e.g. 1,3,5)${NC}"
    echo -e "  ${GREEN}'a'${NC} for all, or ${RED}'q'${NC} to quit:"
    read -rp "  > " selection

    if [[ "$selection" == "q" || "$selection" == "Q" ]]; then
        echo "Cancelled."
        exit 0
    fi

    if [[ "$selection" == "a" || "$selection" == "A" ]]; then
        SELECTED_INDICES=($(seq 0 $((${#DRAFT_FILES[@]} - 1))))
    else
        IFS=',' read -ra PARTS <<<"$selection"
        for part in "${PARTS[@]}"; do
            part=$(echo "$part" | tr -d ' ')
            if [[ "$part" =~ ^[0-9]+$ ]]; then
                idx=$((part - 1))
                if ((idx >= 0 && idx < ${#DRAFT_FILES[@]})); then
                    SELECTED_INDICES+=("$idx")
                fi
            fi
        done
    fi
fi

if [ ${#SELECTED_INDICES[@]} -eq 0 ]; then
    echo -e "${YELLOW}No valid files selected.${NC}"
    exit 0
fi

echo ""
echo -e "${BOLD}Publishing ${#SELECTED_INDICES[@]} file(s)...${NC}"

# ── Process each selected file ──
PUBLISHED=0

for idx in "${SELECTED_INDICES[@]}"; do
    file="${DRAFT_FILES[$idx]}"
    rel_path="${file#$DRAFTS_DIR/}"
    slug=$(basename "$file" .md)

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  ${BOLD}${rel_path}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    mkdir -p "$PUBLISH_DIR"
    LOCAL_FILE="$PUBLISH_DIR/local-links.json"
    WIKI_FILE="$PUBLISH_DIR/wikipedia-links.json"

    # Step 1a: Generate local link suggestions
    echo ""
    echo -e "  ${DIM}Scanning for local wiki links...${NC}"

    GEN_OUTPUT=$(node "$HELPER" generate-local-links "$file" 2>&1 || true)
    LOCAL_COUNT=$(echo "$GEN_OUTPUT" | grep "^LOCAL:" | sed 's/LOCAL://' | tr -d '[:space:]')
    LOCAL_COUNT=${LOCAL_COUNT:-0}

    # Step 1b: Search Wikipedia for terms
    echo -e "  ${DIM}Searching Wikipedia for relevant terms...${NC}"

    WIKI_COUNT=0
    if [ -x "$WIKI_SEARCH" ]; then
        WIKI_COUNT=$(bash "$WIKI_SEARCH" "$file" "$WIKI_FILE" 2>/dev/null || echo 0)
        WIKI_COUNT=$(echo "$WIKI_COUNT" | tr -d '[:space:]')
        WIKI_COUNT=${WIKI_COUNT:-0}
    fi

    echo ""
    echo -e "  ${GREEN}Found:${NC}"
    echo -e "    ${BLUE}Local wiki links:${NC}     ${BOLD}${LOCAL_COUNT}${NC} potential match(es)"
    echo -e "    ${MAGENTA}Wikipedia links:${NC}    ${BOLD}${WIKI_COUNT}${NC} potential match(es)"

    if [[ "$LOCAL_COUNT" -gt 0 || "$WIKI_COUNT" -gt 0 ]]; then
        echo ""
        echo -e "  ${BOLD}Review the link files and set ${GREEN}\"include\": true${NC}${BOLD} for links you want:${NC}"

        if [[ "$LOCAL_COUNT" -gt 0 ]]; then
            echo -e "    ${BLUE}Local:${NC}     ${DIM}${LOCAL_FILE}${NC}"
        fi
        if [[ "$WIKI_COUNT" -gt 0 ]]; then
            echo -e "    ${MAGENTA}Wikipedia:${NC} ${DIM}${WIKI_FILE}${NC}"
        fi

        echo ""
        echo -e "  ${YELLOW}Edit the JSON file(s) in your editor, save, then press Enter here to continue.${NC}"
        echo -e "  ${DIM}(Press Enter without editing to skip all links)${NC}"
        read -rp "  > Press Enter to continue... "
    else
        echo -e "  ${DIM}No linkable references found — publishing as-is.${NC}"
    fi

    # Step 2: Publish (reads the JSON files automatically)
    RESULT=$(node "$HELPER" publish "$file" 2>&1)

    if echo "$RESULT" | grep -q "^PUBLISHED"; then
        pub_slug=$(echo "$RESULT" | sed 's/PUBLISHED //')

        # Count how many links were actually applied
        APPLIED_LOCAL=0
        APPLIED_WIKI=0
        if [ -f "$LOCAL_FILE" ]; then
            APPLIED_LOCAL=$(grep -c '"include": true' "$LOCAL_FILE" || true)
            APPLIED_LOCAL=${APPLIED_LOCAL:-0}
        fi
        if [ -f "$WIKI_FILE" ]; then
            APPLIED_WIKI=$(grep -c '"include": true' "$WIKI_FILE" || true)
            APPLIED_WIKI=${APPLIED_WIKI:-0}
        fi

        echo ""
        echo -e "  ${GREEN}Published${NC} → wiki/${pub_slug}.md"
        if [[ "$APPLIED_LOCAL" -gt 0 || "$APPLIED_WIKI" -gt 0 ]]; then
            echo -e "  ${DIM}Links applied: ${APPLIED_LOCAL} local, ${APPLIED_WIKI} Wikipedia${NC}"
        fi
        PUBLISHED=$((PUBLISHED + 1))
    else
        echo -e "  ${RED}Failed:${NC} $RESULT"
    fi
done

# ── Clean up .publish/ directory ──
if [ -d "$PUBLISH_DIR" ]; then
    rm -rf "$PUBLISH_DIR"
fi

# ── Regenerate wiki index ──
echo ""
echo -e "${DIM}Regenerating wiki index...${NC}"
(cd "$PROJECT_DIR" && node scripts/generate-index.js 2>&1)

echo ""
echo -e "${BOLD}${GREEN}Done — published ${PUBLISHED} of ${#SELECTED_INDICES[@]} file(s)${NC}"
