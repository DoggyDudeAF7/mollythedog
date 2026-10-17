# GTV downloads

The download page is `html/gtv/index.html`, served at `/gtv/`.

All six GTV 0.2.2 installers are linked directly to the GitHub release:
https://github.com/DoggyDudeAF7/mollythedog/releases/tag/gtv-v0.2.2

Installer binaries are hosted as release assets rather than added to the website repository. `html/gtv/downloads.json` records platform, architecture, size and SHA-256; `SHA256SUMS` provides the same checksums for users.

The page is standalone, works without JavaScript and uses local CSS and the GTV app icon. `downloads.js` detects the visitor’s platform and requests architecture/bitness hints when available, highlights matching downloads, offers a direct link when the processor is known, and provides a manual device selector. It also coordinates the native help disclosures. Detection runs locally without analytics, storage or device-data requests to a server. Phones, tablets, ChromeOS and unsupported Linux architectures do not get an incorrect desktop recommendation. A link to the page is included in the arcade hero.

For the next release, regenerate the page from the GTV project's `scripts/create-download-page.py` after building and verifying all six packages, and publish matching GitHub release assets before linking a new version.


Device detection deliberately treats the “Intel” text in a Mac user-agent and Windows x64 user-agent text as insufficient proof of the actual processor. Browsers may withhold architecture hints; see [Chrome’s Client Hints documentation](https://developer.chrome.com/docs/privacy-security/user-agent-client-hints). The page then highlights the OS family and asks the visitor to choose the processor.

Run `node tests/gtv-device-detection.cjs` to check the simulated desktop/mobile, privacy, timeout and manual-selection cases. It uses Playwright Chromium, an installed Mac Chrome, or `CHROME_BIN` if provided. Screenshots and results are saved under `.tools/gtv-device-tests/`.
