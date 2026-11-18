#!/bin/sh
# Build and publish dist/ to the gh-pages branch (GitHub Pages serves that branch).
set -e
npm test -- --run
npm run lint
npm run build
touch dist/.nojekyll
TMP=$(mktemp -d)
git worktree add --detach "$TMP" >/dev/null
(
  cd "$TMP"
  git checkout --orphan gh-pages-new >/dev/null 2>&1
  git rm -rfq . >/dev/null 2>&1 || true
  cp -R "$OLDPWD/dist/." .
  git add -A
  git commit -qm "Deploy $(git -C "$OLDPWD" rev-parse --short HEAD)"
  git push -f origin HEAD:gh-pages
)
git worktree remove --force "$TMP"
git branch -D gh-pages-new >/dev/null 2>&1 || true
