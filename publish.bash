#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# publish.bash - Publish draft wiki pages to wiki/ directory
# ============================================================
#
# Usage:
#   ./publish.bash              Interactive mode (select files)
#   ./publish.bash --all        Publish all drafts
#   ./publish.bash <file> ...   Publish specific files (by relative
#                               path under drafts/ or just filename)
#
# Workflow:
#   1. Selects drafts to publish
#   2. For each draft, auto-detects mentions of existing wiki pages
#   3. Lets you choose which mentions to convert to markdown links
#   4. Derives tags from directory structure (domain/subject/topic)
#   5. Copies processed file to wiki/<slug>.md
#   6. Regenerates wiki/_index.json with updated metadata
# ============================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRAFTS_DIR="$REPO_ROOT/drafts"
WIKI_DIR="$REPO_ROOT/wiki"
PROJECT_DIR="$REPO_ROOT/project"
HELPER="$PROJECT_DIR/scripts/publish-helper.js"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
    echo -e "${CYAN}━━━ ${BOLD}${rel_path}${NC}${CYAN} ━━━${NC}"

    # Step 1: Detect links to other wiki pages
    echo -e "  ${DIM}Scanning for linkable references...${NC}"

    DETECTED_LINES=()
    while IFS= read -r line; do
        [ -n "$line" ] && DETECTED_LINES+=("$line")
    done < <(node "$HELPER" detect-links "$file" 2>/dev/null || true)

    APPLY_LINKS=""

    if [ ${#DETECTED_LINES[@]} -gt 0 ]; then
        echo ""
        echo -e "  ${GREEN}Found ${#DETECTED_LINES[@]} potential link(s):${NC}"

        for i in "${!DETECTED_LINES[@]}"; do
            IFS='|' read -r d_slug d_title d_count <<<"${DETECTED_LINES[$i]}"
            printf "    ${YELLOW}%d${NC}. \"%s\" ${DIM}(%s occurrence(s))${NC} ${DIM}→ %s${NC}\n" \
                $((i + 1)) "$d_title" "$d_count" "$d_slug"
        done

        echo ""
        echo -e "  Select links to apply ${DIM}(comma-separated)${NC}, ${GREEN}'a'${NC} for all, or ${YELLOW}Enter${NC} to skip:"
        read -rp "  > " link_selection

        if [[ "$link_selection" == "a" || "$link_selection" == "A" ]]; then
            LINK_SLUGS=()
            for line in "${DETECTED_LINES[@]}"; do
                IFS='|' read -r d_slug _ _ <<<"$line"
                LINK_SLUGS+=("$d_slug")
            done
            APPLY_LINKS=$(
                IFS=','
                echo "${LINK_SLUGS[*]}"
            )
        elif [[ -n "$link_selection" ]]; then
            IFS=',' read -ra LINK_PARTS <<<"$link_selection"
            LINK_SLUGS=()
            for part in "${LINK_PARTS[@]}"; do
                part=$(echo "$part" | tr -d ' ')
                if [[ "$part" =~ ^[0-9]+$ ]]; then
                    lidx=$((part - 1))
                    if ((lidx >= 0 && lidx < ${#DETECTED_LINES[@]})); then
                        IFS='|' read -r d_slug _ _ <<<"${DETECTED_LINES[$lidx]}"
                        LINK_SLUGS+=("$d_slug")
                    fi
                fi
            done
            if [ ${#LINK_SLUGS[@]} -gt 0 ]; then
                APPLY_LINKS=$(
                    IFS=','
                    echo "${LINK_SLUGS[*]}"
                )
            fi
        fi
    else
        echo -e "  ${DIM}No auto-linkable references found.${NC}"
    fi

    # Step 2: Publish the file via helper
    RESULT=$(node "$HELPER" publish "$file" "$APPLY_LINKS" 2>&1)

    if echo "$RESULT" | grep -q "^PUBLISHED"; then
        pub_slug=$(echo "$RESULT" | sed 's/PUBLISHED //')
        if [ -n "$APPLY_LINKS" ]; then
            link_count=$(echo "$APPLY_LINKS" | tr ',' '\n' | wc -l | tr -d ' ')
            echo -e "  ${GREEN}Published${NC} wiki/${pub_slug}.md  ${DIM}(${link_count} link(s) applied)${NC}"
        else
            echo -e "  ${GREEN}Published${NC} wiki/${pub_slug}.md"
        fi
        PUBLISHED=$((PUBLISHED + 1))
    else
        echo -e "  ${RED}Failed:${NC} $RESULT"
    fi
done

# ── Regenerate wiki index ──
echo ""
echo -e "${DIM}Regenerating wiki index...${NC}"
(cd "$PROJECT_DIR" && node scripts/generate-index.js 2>&1)

echo ""
echo -e "${BOLD}${GREEN}Done — published ${PUBLISHED} of ${#SELECTED_INDICES[@]} file(s)${NC}"
