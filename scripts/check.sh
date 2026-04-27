#!/usr/bin/env bash
# scripts/check.sh — verify SEO Superpower is ready to go.
# Usage: ./scripts/check.sh
# Exit code 0 = all green, 1 = something needs fixing.

set -u

# Pick the env file: prefer ~/.openclaw/.env (Claude convention), fall back to ~/.config/seo-superpower/.env
ENV_FILE=""
if [ -f "$HOME/.openclaw/.env" ]; then
  ENV_FILE="$HOME/.openclaw/.env"
elif [ -f "$HOME/.config/seo-superpower/.env" ]; then
  ENV_FILE="$HOME/.config/seo-superpower/.env"
fi

# Source env if found
if [ -n "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a; . "$ENV_FILE"; set +a
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

ok()   { printf "${GREEN}✅${NC} %s\n" "$1"; PASS=$((PASS+1)); }
fail() { printf "${RED}❌${NC} %s\n" "$1"; FAIL=$((FAIL+1)); }
warn() { printf "${YELLOW}⚠️ ${NC} %s\n" "$1"; }

echo "=== SEO Superpower readiness check ==="
echo ""

# 1. Env file
if [ -n "$ENV_FILE" ]; then
  ok "Env file: $ENV_FILE"
else
  fail "No env file found at ~/.openclaw/.env or ~/.config/seo-superpower/.env. Run /seo-setup."
fi

# 2. GSC client secrets
if [ -n "${GSC_OAUTH_CLIENT_SECRETS_FILE:-}" ] && [ -f "$GSC_OAUTH_CLIENT_SECRETS_FILE" ]; then
  ok "GSC client secrets file: $GSC_OAUTH_CLIENT_SECRETS_FILE"
else
  fail "GSC_OAUTH_CLIENT_SECRETS_FILE not set or file missing."
fi

# 3. PSI key
if [ -n "${PAGESPEED_API_KEY:-}" ]; then
  ok "PAGESPEED_API_KEY set (${PAGESPEED_API_KEY:0:8}...)"
else
  fail "PAGESPEED_API_KEY not set in env file."
fi

# 4. uvx
if command -v uvx >/dev/null 2>&1; then
  ok "uvx available ($(uvx --version 2>/dev/null | head -1))"
else
  fail "uvx not on PATH. Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

# 5. node
if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -ge 20 ]; then
    ok "node $(node --version)"
  else
    fail "node version $(node --version) < 20. Upgrade required."
  fi
else
  fail "node not on PATH. Install Node 20+."
fi

# 6. python3
if command -v python3 >/dev/null 2>&1; then
  ok "python3 $(python3 --version 2>&1 | awk '{print $2}')"
else
  warn "python3 not on PATH (optional — only needed for geo-check / schema-validate v2 MCPs)"
fi

# 7. Test GSC MCP installs (don't actually connect, just verify uvx can fetch it)
if command -v uvx >/dev/null 2>&1; then
  if uvx --help mcp-search-console >/dev/null 2>&1 || true; then
    ok "GSC MCP package reachable via uvx"
  else
    warn "Could not verify GSC MCP package — first /seo call will fetch it."
  fi
fi

# 8. PSI key works
if [ -n "${PAGESPEED_API_KEY:-}" ] && command -v curl >/dev/null 2>&1; then
  PSI_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=${PAGESPEED_API_KEY}" \
    --max-time 30)
  if [ "$PSI_TEST" = "200" ]; then
    ok "PSI API key works (200 from pagespeedonline.googleapis.com)"
  elif [ "$PSI_TEST" = "403" ]; then
    fail "PSI API returned 403 — key invalid or PSI API not enabled for this project."
  elif [ "$PSI_TEST" = "429" ]; then
    warn "PSI quota exceeded for today (429). Wait 24h or enable lighthouse-local."
  else
    warn "PSI API returned HTTP $PSI_TEST — investigate."
  fi
fi

echo ""
echo "=== Summary ==="
printf "${GREEN}Pass:${NC} %d   ${RED}Fail:${NC} %d\n" "$PASS" "$FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "Fix the items marked ❌ above, then re-run this script."
  echo "Or just run /seo-setup in Claude Code for guided setup."
  exit 1
fi

echo "🚀 Ready. Type /seo in any project to start."
exit 0
