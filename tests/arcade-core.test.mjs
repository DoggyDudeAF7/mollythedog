import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const moduleURL = name => pathToFileURL(resolve(`html/js/arcade/${name}.js`)).href;
let serial = 0;

async function progressFixture({readError = false, writeError = false, saved} = {}) {
  const values = new Map([['msFavourites', '["molly"]'], ['msAchievements', '{"existing":true}']]);
  if (saved !== undefined) values.set('msArcadeV1', saved);
  const storage = {
    getItem(key) { if (readError) throw Error('Read blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (writeError) throw Error('Quota exceeded'); values.set(key, value); },
  };
  globalThis.localStorage = storage;
  globalThis.window = new EventTarget();
  const api = await import(`${moduleURL('progress')}?core-test=${serial++}`);
  return {api, values, storage};
}

test('results preserve existing site data, personal bests, and one-time achievements', async () => {
  const {api, values} = await progressFixture();
  const first = api.recordResult('memory-match', 1000, true);
  assert.equal(first.best, 1000);
  assert.equal(first.coins, 55);
  assert.deepEqual(first.unlocked.map(b => b.id), ['first-paw', 'good-dog']);
  const repeat = api.recordResult('memory-match', 500, false);
  assert.equal(repeat.best, 1000);
  assert.equal(repeat.newBest, false);
  assert.equal(repeat.coins, 10);
  assert.deepEqual(repeat.unlocked, []);
  assert.deepEqual(api.getProgress().results['memory-match'], {best: 1000, plays: 2, wins: 1});
  assert.equal(values.get('msFavourites'), '["molly"]');
  assert.equal(values.get('msAchievements'), '{"existing":true}');
});

test('every game contributes to pack completion and all relevant achievements', async () => {
  const {api} = await progressFixture();
  const {catalog} = await import(moduleURL('data'));
  for (const game of catalog) api.recordResult(game.id, 1000, true);
  const saved = api.getProgress();
  assert.equal(Object.keys(saved.results).length, 16);
  assert.equal(Object.keys(saved.achievements).length, 8);
  assert.ok(saved.coins >= 250);
  assert.throws(() => api.recordResult('not-a-game', 100, true), /Unknown game/);
});

test('invalid saved data is recoverable and unsafe scores do not corrupt coins', async () => {
  const {api} = await progressFixture({saved: '{broken json'});
  assert.equal(api.getProgress().coins, 0);
  api.recordResult('memory-match', NaN, false);
  api.recordResult('memory-match', -999, false);
  const saved = api.getProgress();
  assert.equal(saved.results['memory-match'].best, 0);
  assert.equal(saved.coins, 10);
});

test('blocked storage keeps progression for the current visit', async () => {
  const {api} = await progressFixture({readError: true, writeError: true});
  api.recordResult('memory-match', 1000, true);
  api.recordResult('trivia', 500, true);
  assert.equal(Object.keys(api.getProgress().results).length, 2);
  assert.equal(api.storageAvailable(), false);
});

test('readable but full storage retains new results and settings in memory', async () => {
  const {api} = await progressFixture({
    writeError: true,
    saved: JSON.stringify({version: 1, coins: 2, results: {}, achievements: {}, muted: true}),
  });
  api.recordResult('memory-match', 1000, true);
  api.recordResult('trivia', 500, true);
  api.setMuted(false);
  const saved = api.getProgress();
  assert.equal(Object.keys(saved.results).length, 2);
  assert.equal(saved.coins, 82);
  assert.equal(saved.muted, false);
  assert.equal(api.storageAvailable(), false);
});

async function sessionFixture() {
  let now = 0;
  let nextID = 0;
  const requests = new Map();
  globalThis.performance = {now: () => now};
  globalThis.requestAnimationFrame = callback => {requests.set(++nextID, callback); return nextID;};
  globalThis.cancelAnimationFrame = id => requests.delete(id);
  globalThis.document = new EventTarget();
  globalThis.window = new EventTarget();
  const root = new EventTarget();
  root.inert = false;
  root.contains = target => target === root;
  const results = [];
  const {createSession} = await import(`${moduleURL('engine')}?core-test=${serial++}`);
  const session = createSession(root, result => results.push(result));
  function advance(milliseconds) {
    const steps = Math.ceil(milliseconds / 10);
    for (let i = 0; i < steps; i++) {
      now += milliseconds / steps;
      const callbacks = [...requests.values()];
      requests.clear();
      callbacks.forEach(callback => callback(now));
    }
  }
  function key(code, target = {tagName: 'DIV', closest: () => null}) {
    const event = new Event('keydown', {cancelable: true});
    Object.defineProperties(event, {code: {value: code}, key: {value: code}, target: {value: target}});
    document.dispatchEvent(event);
    return event;
  }
  return {session, advance, key, root, results};
}

test('session pause freezes timers and gameplay and resumes active time', async () => {
  const {session, advance, root} = await sessionFixture();
  let timers = 0;
  let clicks = 0;
  const target = new EventTarget();
  session.later(() => timers++, 100);
  session.on(target, 'click', () => clicks++);
  advance(40);
  session.pause(true);
  assert.equal(root.inert, true);
  target.dispatchEvent(new Event('click'));
  advance(1000);
  assert.equal(timers, 0);
  assert.equal(clicks, 0);
  assert.ok(Math.abs(session.elapsed - .04) < .0001);
  session.pause(false);
  advance(80);
  target.dispatchEvent(new Event('click'));
  assert.equal(timers, 1);
  assert.equal(clicks, 1);
  assert.equal(root.inert, false);
  session.dispose();
});

test('finish removes input and timers, and duplicate completion cannot award twice', async () => {
  const {session, advance, results} = await sessionFixture();
  let clicks = 0;
  let timers = 0;
  const target = new EventTarget();
  session.on(target, 'click', () => clicks++);
  session.every(() => timers++, 10);
  advance(20);
  session.finish({score: 101.8, won: true});
  session.finish({score: 9999, won: true});
  target.dispatchEvent(new Event('click'));
  const previousTimers = timers;
  advance(1000);
  assert.equal(clicks, 0);
  assert.equal(timers, previousTimers);
  assert.deepEqual(results, [{score: 101, won: true}]);
});

test('game keyboard shortcuts do not intercept shared search typing', async () => {
  const {session, key} = await sessionFixture();
  let actions = 0;
  session.on(document, 'keydown', event => {
    if (event.code === 'KeyW') {event.preventDefault(); actions++;}
  });
  const input = {tagName: 'INPUT', isContentEditable: false, closest: () => input};
  const event = key('KeyW', input);
  assert.equal(actions, 0);
  assert.equal(event.defaultPrevented, false);
  assert.equal(session.keys.size, 0);
  session.dispose();
});
