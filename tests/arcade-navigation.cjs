const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_PATH || '/Users/asher/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const base = process.env.ARCADE_URL || 'http://127.0.0.1:8000';
const ids = ['navToggle', 'navLinks', 'searchBtn', 'searchBox', 'searchInput', 'results'];
const failures = [];
const checks = [];
async function check(name, fn) {
  try { await fn(); checks.push(name); console.log(`PASS ${name}`); }
  catch (error) { failures.push({name, message: error.message}); console.error(`FAIL ${name}: ${error.message}`); }
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  try {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
    // Remote analytics and font services do not participate in local navigation.
    await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.fulfill({status: 200, body: ''}));
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await check('all shared main-navigation pages have a single Arcade destination', async () => {
      const directories = fs.readdirSync('html', {withFileTypes: true}).filter(entry => entry.isDirectory());
      let scanned = 0;
      for (const entry of directories) {
        const file = path.join('html', entry.name, 'index.html');
        if (!fs.existsSync(file)) continue;
        const html = fs.readFileSync(file, 'utf8');
        if (!html.includes('id="navLinks"')) continue;
        const links = html.match(/<div class="nav-links" id="navLinks">([\s\S]*?)<\/div>/)?.[1];
        assert.ok(links, `${file}: shared nav-links markup`);
        if (!links.includes('href="/blog/"')) continue; // Cyber-safety has its own section navigation.
        assert.equal((links.match(/href="\/games\/"/g) || []).length, 1, `${file}: Arcade link count`);
        assert.ok(links.indexOf('href="/blog/"') < links.indexOf('href="/games/"'), `${file}: Blog comes first`);
        assert.ok(links.indexOf('href="/games/"') < links.indexOf('href="/merch/"'), `${file}: Merch follows`);
        assert.equal(/href="\/games\/"[^>]*aria-current="page"/.test(links), entry.name === 'games', `${file}: current destination`);
        scanned++;
      }
      assert.ok(scanned >= 35);
    });

    for (const width of [1440, 900]) {
      for (const route of ['/games/', '/molly/']) {
        await check(`${route} desktop ${width}px has no dock or page overflow`, async () => {
          await page.setViewportSize({width, height: 1000});
          await page.goto(base + route);
          await page.waitForSelector('#searchBox.ms-site-search', {state: 'attached'});
          for (const id of ids) assert.equal(await page.locator(`#${id}`).count(), 1, id);
          const layout = await page.evaluate(() => {
            const nav = document.querySelector('nav').getBoundingClientRect();
            const links = [...document.querySelectorAll('#navLinks a'), document.querySelector('#searchBtn')].map(el => {
              const r = el.getBoundingClientRect(); return {left: r.left, right: r.right, top: r.top, bottom: r.bottom};
            });
            return {nav: {left: nav.left, right: nav.right}, links, overflow: document.documentElement.scrollWidth - innerWidth};
          });
          assert.ok(layout.nav.left >= 0 && layout.nav.right <= width + 1);
          assert.ok(layout.links.every(r => r.left >= layout.nav.left - 1 && r.right <= layout.nav.right + 1), JSON.stringify(layout));
          assert.ok(layout.overflow <= 1, `horizontal overflow ${layout.overflow}`);
          assert.equal(await page.locator('#navToggle').isVisible(), false);
        });
      }
    }

    for (const width of [390, 320]) {
      for (const route of ['/games/', '/molly/']) {
        await check(`${route} mobile ${width}px opens, scrolls to final link, and closes outside`, async () => {
          await page.setViewportSize({width, height: width === 320 ? 568 : 844});
          await page.goto(base + route);
          await page.waitForSelector('#searchBox.ms-site-search', {state: 'attached'});
          assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'false');
          await page.locator('#navToggle').click();
          await page.waitForTimeout(350);
          assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'true');
          const last = page.locator('#navLinks a').last();
          await last.scrollIntoViewIfNeeded();
          const layout = await last.evaluate(el => {
            const r = el.getBoundingClientRect(), menu = el.parentElement.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return {left: r.left, right: r.right, top: r.top, bottom: r.bottom, menuTop: menu.top, menuBottom: menu.bottom,
              height: innerHeight, width: innerWidth, hit: el === hit || el.contains(hit), scrollTop: el.parentElement.scrollTop,
              overflow: document.documentElement.scrollWidth - innerWidth};
          });
          assert.ok(layout.hit, `last destination is clipped or obscured: ${JSON.stringify(layout)}`);
          assert.ok(layout.bottom <= layout.height + 1 && layout.left >= 0 && layout.right <= width, JSON.stringify(layout));
          assert.ok(layout.scrollTop > 0, 'mobile menu scrolls to last destination');
          assert.ok(layout.overflow <= 1, `horizontal overflow ${layout.overflow}`);
          if (route === '/games/') await page.screenshot({path: `/tmp/arcade-navigation-${width}.png`});
          await page.mouse.click(width / 2, Math.min(layout.height - 3, layout.menuBottom + 8));
          assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'false');
        });

        await check(`${route} mobile ${width}px search works with preserved IDs`, async () => {
          await page.locator('#searchBtn').click();
          await page.waitForFunction(() => !document.getElementById('results').textContent.includes('Loading the site index'));
          await page.locator('#searchInput').fill('arcade');
          const result = page.locator('#results a[href="/games/"]');
          await result.waitFor();
          assert.ok(await result.isVisible());
          await page.keyboard.press('Escape');
          assert.ok(await page.locator('#searchBox').evaluate(el => el.classList.contains('hidden')));
        });

        await check(`${route} mobile ${width}px link selection closes the menu`, async () => {
          await page.locator('#navToggle').click();
          const observed = await page.locator('#navLinks a[href="/games/"]').evaluate(el => {
            el.addEventListener('click', event => event.preventDefault(), {once: true});
            el.click();
            return {open: document.getElementById('navLinks').classList.contains('open'), expanded: document.getElementById('navToggle').getAttribute('aria-expanded')};
          });
          assert.deepEqual(observed, {open: false, expanded: 'false'});
        });
      }
    }

    await check('representative existing destinations still load their shared navigation', async () => {
      await page.setViewportSize({width: 1280, height: 900});
      for (const route of ['/shaina/', '/molly-gallery/', '/shaina-gallery/', '/blog/', '/merch/', '/achievements/']) {
        const response = await page.goto(base + route);
        assert.equal(response.status(), 200, route);
        assert.equal(await page.locator('#navLinks a[href="/games/"]').count(), 1, route);
        assert.equal(await page.locator('#navLinks a[href="/games/"]').getAttribute('aria-current'), null, route);
      }
    });
    await check('navigation and existing pages produce no uncaught JavaScript errors', async () => assert.deepEqual(pageErrors, []));
    await context.close();
  } finally { await browser.close(); }
  console.log(JSON.stringify({checks: checks.length, failures}, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => {console.error(error); process.exitCode = 1;});
