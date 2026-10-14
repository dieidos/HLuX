#!/usr/bin/env bash
# EAS Build, avant `npm install` (hook `eas-build-pre-install`) : la chaîne Rust du cœur HLuX.
#
# ⚠️ À VALIDER AU PREMIER BUILD (il attend le compte Expo du propriétaire) : ce script n'a pas encore
#    tourné sur les machines EAS. Il prépare : la toolchain, les cibles de la plateforme, l'accès en
#    lecture au protocole ab-ante (dépôt privé), puis compile `hlux-ffi` pour la plateforme visée.
#    La génération du TurboModule (uniffi-bindgen-react-native) se branche ensuite : docs/eas.md.
set -euo pipefail

[ "${HLUX_RUST:-0}" = "1" ] || { echo "HLUX_RUST absent : pas de Rust pour ce build."; exit 0; }

# 1. Rust
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
fi
# shellcheck disable=SC1091
source "$HOME/.cargo/env"

# 2. ab-ante est privé : un jeton en lecture seule, posé en variable secrète EAS (AB_ANTE_READ_TOKEN).
if [ -n "${AB_ANTE_READ_TOKEN:-}" ]; then
  git config --global url."https://x-access-token:${AB_ANTE_READ_TOKEN}@github.com/Houngan/".insteadOf "https://github.com/Houngan/"
fi
export CARGO_NET_GIT_FETCH_WITH_CLI=true

CORE="$(cd "$(dirname "$0")/../../core" && pwd)"

# 3. Les cibles de la plateforme, puis la compilation du pont.
case "${EAS_BUILD_PLATFORM:-}" in
  ios)
    rustup target add aarch64-apple-ios aarch64-apple-ios-sim
    for t in aarch64-apple-ios aarch64-apple-ios-sim; do
      cargo build --manifest-path "$CORE/Cargo.toml" -p hlux-ffi --release --target "$t"
    done
    ;;
  android)
    rustup target add aarch64-linux-android x86_64-linux-android
    command -v cargo-ndk >/dev/null 2>&1 || cargo install cargo-ndk --locked
    cargo ndk --manifest-path "$CORE/Cargo.toml" -t arm64-v8a -t x86_64 build -p hlux-ffi --release
    ;;
  *)
    echo "EAS_BUILD_PLATFORM inconnu : '${EAS_BUILD_PLATFORM:-}'" >&2
    exit 1
    ;;
esac
echo "hlux-ffi compilé pour ${EAS_BUILD_PLATFORM}."
