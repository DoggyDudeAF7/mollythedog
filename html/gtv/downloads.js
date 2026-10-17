
'use strict';

// Detection stays in the browser; no device details are sent to a server.
// Mac UA strings can say "Intel" on Apple Silicon; Windows UA strings can hide ARM.
// Only recommend a processor-specific installer when architecture is explicit.
// Android ARM64 is supported through the APK release.

(async function recommendDownload() {
  const grid = document.querySelector('.platform-grid');
  if (!grid) return;

  const panel = document.createElement('div');
  panel.className = 'device-panel';

  panel.innerHTML = `
    <div class="device-copy">
      <p id="device-status" role="status" aria-live="polite">
        Detecting…
      </p>
      <a id="device-download" class="device-download" hidden></a>
    </div>

    <label class="device-picker" for="device-choice">
      Platform
      <select id="device-choice">
        <option value="auto">Auto detect</option>
        <option value="windows-x64">Windows · Intel / AMD (x64)</option>
        <option value="windows-arm64">Windows · ARM64</option>
        <option value="mac-intel">Mac · Intel</option>
        <option value="mac-silicon">Mac · Apple Silicon</option>
        <option value="linux-x64">Linux · Intel / AMD (64-bit)</option>
        <option value="android-arm64">Android · ARM64</option>
      </select>
    </label>
  `;

  grid.before(panel);

  const status = panel.querySelector('#device-status');
  const quick = panel.querySelector('#device-download');
  const choice = panel.querySelector('#device-choice');

  const links = [...grid.querySelectorAll('[data-download]')];

  const selected = {
    'windows-x64': { os: 'Windows', arch: 'x64' },
    'windows-arm64': { os: 'Windows', arch: 'arm64' },
    'mac-intel': { os: 'macOS', arch: 'x64' },
    'mac-silicon': { os: 'macOS', arch: 'arm64' },
    'linux-x64': { os: 'Linux', arch: 'x64' },
    'android-arm64': { os: 'Android', arch: 'arm64' }
  };

  let automatic = { os: 'Unknown', arch: '' };

  function render(device, manual = false) {
    const { os, arch } = device;

    let ids = [];
    let message = '';

    if (os === 'Windows' || os === 'macOS') {
      if (arch === 'x64' || arch === 'arm64') {
        const id = os === 'Windows'
          ? `windows-${arch}`
          : arch === 'arm64'
            ? 'mac-silicon'
            : 'mac-intel';

        ids = [id];

        const label = os === 'macOS'
          ? (arch === 'arm64' ? 'Apple Silicon' : 'Intel')
          : arch.toUpperCase();

        message = `${os} · ${label}`;
      } else if (arch === 'unsupported') {
        message = `${os} · Unsupported processor`;
      } else {
        message = `${os} · Select ${
          os === 'macOS'
            ? 'Intel or Apple Silicon'
            : 'x64 or ARM64'
        }`;
      }
    }

    else if (os === 'Linux') {
      if (arch === 'x64') {
        ids = ['linux-appimage', 'linux-deb'];
        message = 'Linux · x86_64';
      } else if (arch === 'arm64' || arch === 'unsupported') {
        message = 'Linux · Unsupported processor';
      } else {
        message = 'Linux · x86_64 downloads';
      }
    }

    else if (os === 'Android') {
      if (arch === 'arm64') {
        ids = ['android-arm64'];
        message = 'Android · ARM64';
      } else if (arch === 'unsupported' || arch === 'x64') {
        message = 'Android · Unsupported processor';
      } else {
        message = 'Android · ARM64 APK available';
      }
    }

    else if (os === 'iPhone / iPad') {
      message = 'iPhone / iPad · iOS version not available yet';
    }

    else if (os === 'ChromeOS') {
      message = 'ChromeOS · Select a compatible download manually';
    }

    else {
      message = 'Select your platform';
    }

    status.textContent = message;

    quick.hidden = true;
    quick.removeAttribute('href');

    for (const card of grid.querySelectorAll('.platform-card')) {
      const matches = !!card.querySelector(
        `[data-platform="${os}"]`
      );

      card.classList.toggle('device-platform', matches);

      const label = card.querySelector('.platform-label');

      if (label) {
        label.textContent = matches
          ? (manual ? 'SELECTED' : 'DETECTED')
          : '';
      }
    }

    for (const link of links) {
      const recommended = ids.includes(link.dataset.download);

      link.classList.toggle('device-recommended', recommended);

      link.querySelector('.device-match')?.remove();

      if (recommended) {
        const badge = document.createElement('span');
        badge.className = 'device-match';
        badge.textContent = manual ? 'Selected' : 'Recommended';

        link.querySelector('.download-copy')?.append(badge);
      }
    }

    if (ids.length === 1) {
      const match = links.find(
        link => link.dataset.download === ids[0]
      );

      if (match) {
        quick.href = match.href;

        const variant = match.querySelector('strong')?.textContent || '';

        quick.textContent =
          `Download for ${os} · ${variant} ↓`;

        quick.hidden = false;
      }
    }

    panel.dataset.ready = 'true';
  }

  choice.addEventListener('change', () => {
    const manual = choice.value !== 'auto';

    render(
      manual ? selected[choice.value] : automatic,
      manual
    );
  });

  const ua = navigator.userAgent || '';
  const legacyPlatform = navigator.platform || '';
  const hints = navigator.userAgentData;
  const platform = hints?.platform || legacyPlatform;

  let os = 'Unknown';

  if (/Android/i.test(platform + ' ' + ua)) {
    os = 'Android';
  }

  else if (
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Mac/i.test(legacyPlatform) && navigator.maxTouchPoints > 1)
  ) {
    os = 'iPhone / iPad';
  }

  else if (/CrOS|Chrome OS/i.test(platform + ' ' + ua)) {
    os = 'ChromeOS';
  }

  else if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    os = 'Windows';
  }

  else if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
    os = 'macOS';
  }

  else if (/Linux/i.test(platform + ' ' + ua)) {
    os = 'Linux';
  }

  let arch = '';

  if (['Windows', 'macOS', 'Linux', 'Android'].includes(os)) {
    let values = {};

    if (typeof hints?.getHighEntropyValues === 'function') {
      let timeout;

      try {
        values = await Promise.race([
          hints.getHighEntropyValues([
            'architecture',
            'bitness',
            'wow64'
          ]),
          new Promise(resolve => {
            timeout = setTimeout(() => resolve({}), 1500);
          })
        ]) || {};
      } catch {
        // Privacy settings may withhold architecture.
        // Keep manual choices available.
      } finally {
        clearTimeout(timeout);
      }
    }

    const architecture = String(
      values.architecture || ''
    ).toLowerCase();

    const bitness = String(values.bitness || '');

    if (architecture === 'arm' && bitness === '64') {
      arch = 'arm64';
    }

    else if (
      architecture === 'x86' &&
      (bitness === '64' || values.wow64 === true)
    ) {
      arch = 'x64';
    }

    else if (bitness === '32') {
      arch = 'unsupported';
    }

    else if (
      !architecture &&
      /aarch64|arm64/i.test(ua + ' ' + legacyPlatform)
    ) {
      arch = 'arm64';
    }

    else if (
      !architecture &&
      os === 'Linux' &&
      /x86_64|amd64/i.test(ua + ' ' + legacyPlatform)
    ) {
      arch = 'x64';
    }

    else if (
      !architecture &&
      os === 'Linux' &&
      /\bi[3-6]86\b|\barmv[5-8]l\b/i.test(
        ua + ' ' + legacyPlatform
      )
    ) {
      arch = 'unsupported';
    }

    // Many Android browsers do not expose CPU architecture.
    // Only infer ARM64 when explicitly indicated by the user agent.
    if (
      os === 'Android' &&
      !arch &&
      /armv8|aarch64|arm64/i.test(ua)
    ) {
      arch = 'arm64';
    }
  }

  automatic = { os, arch };

  // A delayed hints response must not override
  // the visitor's manual selection.
  if (choice.value === 'auto') {
    render(automatic);
  }
})();
