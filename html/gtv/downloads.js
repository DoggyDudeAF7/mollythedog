'use strict';
// Direct download links and native disclosures work without JavaScript.
// Keeping only one guide open helps on small screens without hiding any download.
const guides = [...document.querySelectorAll('.help-list details')];
for (const guide of guides) {
  guide.addEventListener('toggle', () => {
    if (guide.open) for (const other of guides) if (other !== guide) other.open = false;
  });
}

// Detection stays in the browser; no device details are sent to a server.
// Mac UA strings can say "Intel" on Apple Silicon; Windows UA strings can hide ARM.
// Only recommend a processor-specific installer when architecture is explicit.
(async function recommendDownload() {
  const grid = document.querySelector('.platform-grid');
  if (!grid) return;
  const panel = document.createElement('div');
  panel.className = 'device-panel';
  panel.innerHTML = `<div class="device-copy"><p class="device-eyebrow">YOUR DEVICE</p><p id="device-status" role="status" aria-live="polite">Checking your device…</p><a id="device-download" class="device-download" hidden></a></div><label class="device-picker" for="device-choice">Choose another device<select id="device-choice"><option value="auto">Detect automatically</option><option value="windows-x64">Windows · Intel / AMD (x64)</option><option value="windows-arm64">Windows · ARM64</option><option value="mac-intel">Mac · Intel</option><option value="mac-silicon">Mac · Apple Silicon</option><option value="linux-x64">Linux · Intel / AMD (64-bit)</option></select></label>`;
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
  };
  let automatic = { os: 'Unknown', arch: '' };
  function render(device, manual = false) {
    const { os, arch } = device;
    const prefix = manual ? 'Selected' : 'Detected';
    let ids = [], message = '';
    if (os === 'Windows' || os === 'macOS') {
      if (arch === 'x64' || arch === 'arm64') {
        const id = os === 'Windows' ? `windows-${arch}` : arch === 'arm64' ? 'mac-silicon' : 'mac-intel';
        ids = [id];
        const label = os === 'macOS' ? (arch === 'arm64' ? 'Apple Silicon' : 'Intel') : arch;
        message = `${prefix}: ${os} · ${label}. Your matching installer is highlighted below.`;
      } else if (arch === 'unsupported') {
        message = `${prefix}: ${os}. There is no matching installer for the processor reported by your browser.`;
      } else {
        message = `${prefix}: ${os}. Your browser doesn’t identify the processor. Choose ${os === 'macOS' ? 'Intel or Apple Silicon' : 'x64 or ARM64'} below, or select your device here.`;
      }
    } else if (os === 'Linux') {
      if (arch === 'x64') {
        ids = ['linux-appimage', 'linux-deb'];
        message = `${prefix}: Linux · x86_64. Choose AppImage or DEB below.`;
      } else if (arch === 'arm64' || arch === 'unsupported') {
        message = 'Linux detected. These Linux installers require an Intel / AMD 64-bit processor; there is no matching build for the processor reported by your browser.';
      } else {
        message = 'Linux detected. Choose AppImage or DEB if your computer has an Intel / AMD 64-bit processor.';
      }
    } else if (['Android', 'iPhone / iPad', 'ChromeOS'].includes(os)) {
      message = `${os} detected. GTV is available for Windows, macOS and Linux desktop computers. You can still download for another device below.`;
    } else {
      message = 'Your browser doesn’t identify this device. Choose your computer below, or use the device selector.';
    }
    status.textContent = message;
    quick.hidden = true;
    quick.removeAttribute('href');
    for (const card of grid.querySelectorAll('.platform-card')) {
      const matches = !!card.querySelector(`[data-platform="${os}"]`);
      card.classList.toggle('device-platform', matches);
      card.querySelector('.platform-label').textContent = matches ? (manual ? 'YOUR CHOICE' : 'YOUR DEVICE') : 'DESKTOP';
    }
    for (const link of links) {
      link.classList.toggle('device-recommended', ids.includes(link.dataset.download));
      link.querySelector('.device-match')?.remove();
      if (ids.includes(link.dataset.download)) {
        const badge = document.createElement('span');
        badge.className = 'device-match';
        badge.textContent = manual ? 'Your selection' : 'Matches your device';
        link.querySelector('.download-copy').append(badge);
      }
    }
    if (ids.length === 1) {
      const match = links.find(link => link.dataset.download === ids[0]);
      quick.href = match.href;
      quick.textContent = `Download for ${os} · ${match.querySelector('strong').textContent} ↓`;
      quick.hidden = false;
    }
    panel.dataset.ready = 'true';
  }
  choice.addEventListener('change', () => render(choice.value === 'auto' ? automatic : selected[choice.value], choice.value !== 'auto'));
  const ua = navigator.userAgent || '';
  const legacyPlatform = navigator.platform || '';
  const hints = navigator.userAgentData;
  const platform = hints?.platform || legacyPlatform;
  let os = 'Unknown';
  if (/Android/i.test(platform + ' ' + ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(legacyPlatform) && navigator.maxTouchPoints > 1)) os = 'iPhone / iPad';
  else if (/CrOS|Chrome OS/i.test(platform + ' ' + ua)) os = 'ChromeOS';
  else if (/Win/i.test(platform) || /Windows/i.test(ua)) os = 'Windows';
  else if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(platform + ' ' + ua)) os = 'Linux';
  let arch = '';
  if (['Windows', 'macOS', 'Linux'].includes(os)) {
    let values = {};
    if (typeof hints?.getHighEntropyValues === 'function') {
      let timeout;
      try {
        values = await Promise.race([
          hints.getHighEntropyValues(['architecture', 'bitness', 'wow64']),
          new Promise(resolve => { timeout = setTimeout(() => resolve({}), 1500); }),
        ]) || {};
      } catch { /* Privacy settings may withhold architecture. Keep manual choices. */ }
      finally { clearTimeout(timeout); }
    }
    const architecture = String(values.architecture || '').toLowerCase();
    if (architecture === 'arm' && values.bitness === '64') arch = 'arm64';
    else if (architecture === 'x86' && (values.bitness === '64' || values.wow64 === true)) arch = 'x64';
    else if (values.bitness === '32') arch = 'unsupported';
    // Explicit ARM and Linux machine identifiers are useful on older browsers.
    else if (!architecture && /aarch64|arm64/i.test(ua + ' ' + legacyPlatform)) arch = 'arm64';
    else if (!architecture && os === 'Linux' && /x86_64|amd64/i.test(ua + ' ' + legacyPlatform)) arch = 'x64';
    else if (!architecture && os === 'Linux' && /\bi[3-6]86\b|\barmv[5-8]l\b/i.test(ua + ' ' + legacyPlatform)) arch = 'unsupported';
  }
  automatic = { os, arch };
  // A delayed hints response must not override the visitor's manual selection.
  if (choice.value === 'auto') render(automatic);
})();
