# GTV downloads

The download page is `html/gtv/index.html`, served at `/gtv/`.

All six GTV 0.2.2 installers are linked directly to the GitHub release:
https://github.com/DoggyDudeAF7/mollythedog/releases/tag/gtv-v0.2.2

Installer binaries are hosted as release assets rather than added to the website repository. `html/gtv/downloads.json` records platform, architecture, size and SHA-256; `SHA256SUMS` provides the same checksums for users.

The page is standalone, works without JavaScript and uses local CSS and the GTV app icon. `downloads.js` only coordinates the native help disclosures. A link to the page is included in the arcade hero.

For the next release, regenerate the page from the GTV project's `scripts/create-download-page.py` after building and verifying all six packages, and publish matching GitHub release assets before linking a new version.
