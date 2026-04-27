#!/usr/bin/env bash
# scripts/wire-credentials.sh — write GSC client secret or PSI API key to env.
# Used by /seo-setup. Safe to run manually too.
#
# Usage:
#   wire-credentials.sh gsc /path/to/downloaded/client_secret.json
#   wire-credentials.sh psi AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
#   wire-credentials.sh check                          # show current state

set -euo pipefail

# Pick env home: prefer ~/.openclaw/ (Claude convention), else ~/.config/seo-superpower/
if [ -d "$HOME/.openclaw" ]; then
  ENV_HOME="$HOME/.openclaw"
else
  ENV_HOME="$HOME/.config/seo-superpower"
  mkdir -p "$ENV_HOME"
  chmod 700 "$ENV_HOME"
fi
ENV_FILE="$ENV_HOME/.env"
touch "$ENV_FILE"
chmod 600 "$ENV_FILE"

CMD="${1:-}"

case "$CMD" in
  gsc)
    SRC="${2:-}"
    if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
      echo "❌ gsc: file not found: $SRC" >&2
      echo "Usage: wire-credentials.sh gsc /path/to/client_secret.json" >&2
      exit 1
    fi
    DEST="$ENV_HOME/gsc_client_secret.json"
    cp -f "$SRC" "$DEST"
    chmod 600 "$DEST"

    # Update or append GSC_OAUTH_CLIENT_SECRETS_FILE
    if grep -q '^GSC_OAUTH_CLIENT_SECRETS_FILE=' "$ENV_FILE"; then
      # macOS / GNU sed compatibility
      sed -i.bak "s|^GSC_OAUTH_CLIENT_SECRETS_FILE=.*|GSC_OAUTH_CLIENT_SECRETS_FILE=\"$DEST\"|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    else
      echo "GSC_OAUTH_CLIENT_SECRETS_FILE=\"$DEST\"" >> "$ENV_FILE"
    fi

    echo "✅ GSC client secret installed at $DEST"
    echo "   GSC_OAUTH_CLIENT_SECRETS_FILE set in $ENV_FILE"
    ;;

  psi)
    KEY="${2:-}"
    if [ -z "$KEY" ]; then
      echo "❌ psi: missing key" >&2
      echo "Usage: wire-credentials.sh psi AIzaSyXXXXXXXXXXXXX" >&2
      exit 1
    fi
    if grep -q '^PAGESPEED_API_KEY=' "$ENV_FILE"; then
      sed -i.bak "s|^PAGESPEED_API_KEY=.*|PAGESPEED_API_KEY=\"$KEY\"|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    else
      echo "PAGESPEED_API_KEY=\"$KEY\"" >> "$ENV_FILE"
    fi
    echo "✅ PAGESPEED_API_KEY set in $ENV_FILE"
    ;;

  check)
    echo "Env file: $ENV_FILE"
    echo "---"
    grep -E '^(GSC_OAUTH_CLIENT_SECRETS_FILE|PAGESPEED_API_KEY|PERPLEXITY_API_KEY)=' "$ENV_FILE" 2>/dev/null \
      | sed 's/=.*$/=<set>/' \
      || echo "(no SEO vars set)"
    ;;

  *)
    echo "Usage: $0 {gsc <path-to-json> | psi <api-key> | check}" >&2
    exit 1
    ;;
esac
