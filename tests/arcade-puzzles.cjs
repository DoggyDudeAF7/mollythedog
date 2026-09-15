/* Full browser sessions using production controls and Playwright's active clock.
   Serve html/ at ARCADE_BASE and provide Playwright through NODE_PATH. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.ARCADE_BASE || 'http://127.0.0.1:8000';
const out = process.env.ARCADE_TEST_OUTPUT || '/tmp/ms-arcade-tests';
fs.mkdirSync(out, { recursive: true });
let browser, context, page, mobile = false, errors = [];
const records = [];
const advance = ms => page.clock.runFor(ms);
const activate = locator => mobile ? locator.tap() : locator.click();
async function test(name, fn) {
  try { await fn(); records.push({ name, pass: true }); console.log('PASS ' + name); }
  catch (error) {
    records.push({ name, pass: false, error: error.stack }); console.log('FAIL ' + name + ': ' + error.message);
    await page.screenshot({ path: path.join(out, name.replace(/[^a-z0-9]+/gi, '-') + '.png'), fullPage: true, animations: 'disabled' }).catch(() => {});
  }
}
async function setup(touch) {
  mobile = touch;
  context = await browser.newContext({ viewport: touch ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.fulfill({ status: 200, body: '', contentType: url.pathname.endsWith('.js') ? 'application/javascript' : 'text/css' });
    if (url.pathname === '/api/posts') return route.fulfill({ path: path.resolve('html/blog/posts.json'), contentType: 'application/json' });
    return route.continue();
  });
  page = await context.newPage(); errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`); });
  await page.clock.install({ time: new Date('2026-09-15T10:00:00Z') });
  await page.goto(base + '/games/', { waitUntil: 'networkidle' });
  await page.locator('.arcade-card').first().waitFor();
  await page.clock.pauseAt(new Date('2026-09-15T10:10:00Z'));
  await advance(50);
  await page.evaluate(() => localStorage.setItem('puzzle-regression-sentinel', 'keep'));
}
async function start(id) {
  await page.evaluate(id => { location.hash = id; }, id);
  await page.locator('#start-game').waitFor();
  await page.evaluate(() => { let n = 90321; Math.random = () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; });
  await activate(page.locator('#start-game'));
  await advance(32);
  await page.evaluate(async () => Promise.all([...document.querySelectorAll('#game-stage img')].map(image => image.decode())));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'page should fit its viewport');
}
async function result(id, won) {
  await page.locator('#play-again').waitFor({ timeout: 3000 });
  assert.match(await page.locator('.result-screen h2').innerText(), won ? /Very good/ : /Good effort/);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('msArcadeV1')));
  assert.ok(state.results[id].plays >= 1);
  if (won) assert.ok(state.results[id].wins >= 1);
  assert.ok(state.coins > 0);
  const saved = await page.evaluate(() => localStorage.getItem('msArcadeV1'));
  await advance(3000);
  assert.equal(await page.evaluate(() => localStorage.getItem('msArcadeV1')), saved, 'one result must pay coins only once');
  return state.results[id];
}
async function memoryWin() {
  await start('memory-match');
  const pairs = await page.locator('.puzzle-memory-card').evaluateAll(cards => {
    const map = new Map();
    cards.forEach((card, index) => { const source = card.querySelector('img').src; map.set(source, [...(map.get(source) || []), index]); });
    return [...map.values()];
  });
  // Exercise a mismatch and its temporary input lock before finding all pairs.
  await activate(page.locator('.puzzle-memory-card').nth(pairs[0][0]));
  await activate(page.locator('.puzzle-memory-card').nth(pairs[1][0]));
  await activate(page.locator('.puzzle-memory-card').nth(pairs[2][0]));
  assert.equal(await page.locator('.puzzle-memory-card.revealed').count(), 2);
  await advance(1200);
  assert.equal(await page.locator('.puzzle-memory-card.revealed').count(), 0);
  for (const pair of pairs) for (const index of pair) {
    if (mobile) await page.locator('.puzzle-memory-card').nth(index).tap();
    else { await page.locator('.puzzle-memory-card').nth(index).focus(); await page.keyboard.press('Enter'); }
    await advance(50);
  }
  await advance(700);
  const record = await result('memory-match', true);
  assert.ok(record.best >= 600);
}
async function shellRun(win) {
  await start('wheres-molly');
  for (let round = 0; round < (win ? 5 : 3); round++) {
    const trackedCup = await page.locator('.puzzle-towel.lifted').getAttribute('data-cup');
    for (let n = 0; n < 35 && !(await page.locator('.puzzle-towel[aria-disabled=false]').count()); n++) await advance(400);
    assert.equal(await page.locator('.puzzle-towel[aria-disabled=false]').count(), 3);
    const selected = win ? page.locator(`[data-cup="${trackedCup}"]`) : page.locator(`.puzzle-towel:not([data-cup="${trackedCup}"])`).first();
    if (mobile) await selected.tap();
    else await page.keyboard.press(await selected.locator('.puzzle-towel-number').innerText());
    await advance(1500);
  }
  const record = await result('wheres-molly', win);
  if (win) assert.equal(record.best, 1550);
}
async function quizRun(photoMode, win) {
  const id = photoMode ? 'who-is-it' : 'trivia';
  await start(id);
  for (let round = 0; round < (photoMode ? 8 : 10); round++) {
    let choice;
    if (photoMode) choice = (await page.locator('.puzzle-identify-photo').getAttribute('src')).includes('/molly/') ? 0 : 1;
    else {
      const question = await page.locator('.puzzle-question').innerText();
      const answer = await page.evaluate(async question => {
        const { trivia } = await import('/js/arcade/data.js');
        const item = trivia.find(item => item.question === question);
        return item.options[item.answer];
      }, question);
      const options = await page.locator('.puzzle-answer > span:last-child').allTextContents();
      choice = options.indexOf(answer);
      assert.ok(choice >= 0);
    }
    if (!win) choice = (choice + 1) % (photoMode ? 2 : 4);
    if (mobile) await page.locator('.puzzle-answer').nth(choice).tap();
    else await page.keyboard.press(photoMode ? (choice === 0 ? 'm' : 's') : String(choice + 1));
    assert.equal(await page.locator('.puzzle-answer.correct').count(), 1);
    assert.equal(await page.locator('.puzzle-review').isVisible(), true);
    assert.ok((await page.locator('.puzzle-review p').innerText()).length > 10);
    assert.match(await page.locator('.puzzle-source').getAttribute('href'), /^\/(about-|molly-|shaina-)/);
    await activate(page.locator('.puzzle-next'));
    await advance(32);
  }
  const record = await result(id, win);
  if (win) assert.equal(record.best, photoMode ? 1020 : 1300);
}
function solvePuzzle(initial) {
  const board = [...initial], route = [];
  const distance = () => board.reduce((sum, value, position) => sum + (value ? Math.abs(position % 3 - (value - 1) % 3) + Math.abs(Math.floor(position / 3) - Math.floor((value - 1) / 3)) : 0), 0);
  function search(empty, previous, depth, limit) {
    const h = distance(); if (!h) return true; if (depth + h > limit) return false;
    const neighbors = [empty - 3, empty + 3, ...(empty % 3 ? [empty - 1] : []), ...(empty % 3 < 2 ? [empty + 1] : [])].filter(position => position >= 0 && position < 9 && position !== previous);
    for (const next of neighbors) {
      const tile = board[next]; [board[empty], board[next]] = [board[next], board[empty]];
      route.push({ tile, key: { '-3': 'ArrowUp', '3': 'ArrowDown', '-1': 'ArrowLeft', '1': 'ArrowRight' }[next - empty] });
      if (search(next, empty, depth + 1, limit)) return true;
      route.pop(); [board[empty], board[next]] = [board[next], board[empty]];
    }
    return false;
  }
  for (let bound = distance(); bound <= 40; bound += 2) if (search(board.indexOf(0), -1, 0, bound)) return route;
  throw Error('Legal shuffle must be solvable within its original 40 moves');
}
async function photoWin() {
  await start('photo-puzzle');
  await activate(page.locator('.puzzle-sliding .game-button'));
  assert.equal(await page.locator('#puzzle-photo-preview').isVisible(), true);
  await activate(page.locator('.puzzle-sliding .game-button'));
  assert.equal(await page.locator('#puzzle-photo-preview').isVisible(), false);
  const initial = await page.locator('.puzzle-photo-tile').evaluateAll(tiles => {
    const state = Array(9).fill(0);
    tiles.forEach(tile => { const [col, row] = tile.style.transform.match(/-?\d+/g).map(Number); state[row / 100 * 3 + col / 100] = Number(tile.dataset.tile); });
    return state;
  });
  const solution = solvePuzzle(initial);
  assert.ok(solution.length > 0);
  for (const move of solution) {
    if (mobile) await page.locator(`[data-tile="${move.tile}"]`).tap();
    else await page.keyboard.press(move.key);
    await advance(180);
  }
  await advance(1000);
  const record = await result('photo-puzzle', true);
  assert.ok(record.best >= 250);
}
async function checks() {
  await test(`${mobile ? 'touch' : 'keyboard'} Memory Match full win and mismatch lock`, memoryWin);
  await test(`${mobile ? 'touch' : 'keyboard'} Where’s Molly five shuffles win`, () => shellRun(true));
  await test(`${mobile ? 'touch' : 'keyboard'} Trivia ten sourced answers win`, () => quizRun(false, true));
  await test(`${mobile ? 'touch' : 'keyboard'} Who Is It eight gallery photos win`, () => quizRun(true, true));
  await test(`${mobile ? 'touch' : 'keyboard'} Photo Puzzle legal shuffle solved`, photoWin);
  if (!mobile) {
    await test('Memory Match timeout and replay resets all cards', async () => {
      await start('memory-match'); await advance(91000); await result('memory-match', false);
      await activate(page.locator('#play-again')); await advance(32);
      assert.equal(await page.locator('.puzzle-memory-card').count(), 12);
      assert.equal(await page.locator('.puzzle-memory-card.matched').count(), 0);
      await page.locator('#back-to-arcade').click();
    });
    await test('Where’s Molly three misses lose', () => shellRun(false));
    await test('Where’s Molly unattended choice expires', async () => {
      await start('wheres-molly'); await advance(90000); await result('wheres-molly', false);
    });
    await test('Trivia below threshold loses', () => quizRun(false, false));
    await test('Who Is It below threshold loses', () => quizRun(true, false));
    await test('Progress, achievements and unrelated data survive reload', async () => {
      const before = await page.evaluate(() => JSON.parse(localStorage.getItem('msArcadeV1')));
      assert.ok(before.coins > 0); assert.ok(before.achievements['first-paw']);
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => localStorage.getItem('puzzle-regression-sentinel')), 'keep');
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('msArcadeV1'))), before);
    });
  }
  await test(`${mobile ? 'mobile' : 'desktop'} puzzle asset loading and console`, async () => assert.deepEqual(errors, []));
}
(async () => {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try { for (const touch of [false, true]) { await setup(touch); await checks(); await context.close(); } }
  finally {
    await browser.close(); fs.writeFileSync(path.join(out, 'puzzle-results.json'), JSON.stringify(records, null, 2));
    console.log(`${records.filter(record => record.pass).length}/${records.length} passed`);
    process.exitCode = records.some(record => !record.pass) ? 1 : 0;
  }
})().catch(error => { console.error(error); process.exitCode = 1; browser?.close(); });
