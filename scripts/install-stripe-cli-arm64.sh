#!/bin/bash
# Install Apple Silicon (arm64) build of the Stripe CLI.
# Replaces an existing Intel binary at /usr/local/bin/stripe if present.
#
# Usage:
#   bash scripts/install-stripe-cli-arm64.sh
set -euo pipefail

echo "==> Detecting latest Stripe CLI version..."
VERSION=$(curl -fsSL https://api.github.com/repos/stripe/stripe-cli/releases/latest \
  | grep '"tag_name"' \
  | head -n1 \
  | sed -E 's/.*"v([^"]+)".*/\1/')
echo "    Found v${VERSION}"

ASSET="stripe_${VERSION}_mac-os_arm64.tar.gz"
URL="https://github.com/stripe/stripe-cli/releases/download/v${VERSION}/${ASSET}"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "${TMPDIR}"' EXIT
cd "${TMPDIR}"

echo "==> Downloading ${ASSET}..."
curl -fL "${URL}" -o "${ASSET}"

echo "==> Extracting..."
tar -xzf "${ASSET}"

echo "==> Replacing /usr/local/bin/stripe (sudo will prompt for password)..."
sudo rm -f /usr/local/bin/stripe
sudo mv stripe /usr/local/bin/stripe
sudo chmod +x /usr/local/bin/stripe

echo ""
echo "==> Done. New binary installed at /usr/local/bin/stripe"
echo ""
echo "Next steps:"
echo "  1. Run:  stripe --version"
echo "     If macOS blocks it, go to System Settings → Privacy & Security"
echo "     → click 'Allow Anyway' next to the stripe entry, then run again"
echo "     and click 'Open' on the second popup. Touch ID may be needed."
echo "  2. Run:  stripe login"
echo "  3. Run:  stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo "  4. Copy the new whsec_... into STRIPE_WEBHOOK_SECRET in .env.local"
echo "  5. Restart 'npm run dev'"
