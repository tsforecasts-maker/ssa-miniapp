#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (GitHub Pages source). No Actions needed.
# (ci/pages.yml.example is the Actions variant; it needs a token with the `workflow` scope to be pushed.)
set -euo pipefail
cd "$(dirname "$0")"
npm run build
REMOTE=$(git remote get-url origin)
rm -rf .deploy && mkdir .deploy && cp -r dist/. .deploy/ && touch .deploy/.nojekyll
(cd .deploy && git init -q -b gh-pages && git add -A \
  && git -c user.name=SSA -c user.email=ssa@localhost commit -qm "deploy $(git -C .. rev-parse --short HEAD)" \
  && git -c credential.helper='!/usr/local/bin/gh auth git-credential' push -q -f "$REMOTE" gh-pages)
rm -rf .deploy
echo "published to gh-pages"
