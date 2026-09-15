import { shuffle, randomInt, photos, trivia, assets } from './data.js';

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function button(className, text) {
  const element = node('button', className, text);
  element.type = 'button';
  return element;
}
function board(ctx, name) {
  const element = node('div', `puzzle-board ${name}`);
  ctx.root.append(element);
  return element;
}
function keyInput(ctx, handler) {
  ctx.on(document, 'keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (handler(event.key)) event.preventDefault();
  });
}

function memoryMatch(ctx) {
  const root = board(ctx, 'puzzle-memory');
  const grid = node('div', 'puzzle-memory-grid');
  grid.setAttribute('aria-label', 'Twelve memory cards');
  root.append(grid, node('p', 'control-note', 'Find all six photo pairs. Tap a card, or use Tab and Enter.'));
  const chosen = shuffle(photos).slice(0, 6);
  const deck = shuffle([...chosen, ...chosen]).map((photo, index) => {
    const card = button('puzzle-memory-card');
    card.dataset.index = index;
    card.setAttribute('aria-label', `Card ${index + 1}, face down`);
    const inner = node('span', 'puzzle-memory-inner');
    const back = node('span', 'puzzle-memory-back', '🐾');
    back.setAttribute('aria-hidden', 'true');
    const front = node('span', 'puzzle-memory-front');
    const img = node('img');
    img.src = photo.src;
    img.alt = '';
    front.append(img);
    inner.append(back, front);
    card.append(inner);
    grid.append(card);
    return { photo, card, matched: false };
  });
  let open = [], moves = 0, matched = 0, locked = false, shownTime = -1;
  const update = () => ctx.hud({ Pairs: `${matched} / 6`, Turns: moves, Time: `${Math.max(0, Math.ceil(90 - ctx.elapsed))}s` });
  const reveal = item => {
    item.card.classList.add('revealed');
    item.card.setAttribute('aria-label', `${item.photo.alt}, card ${deck.indexOf(item) + 1}`);
  };
  function select(index) {
    const item = deck[index];
    if (locked || !item || item.matched || open.includes(item)) return;
    reveal(item);
    ctx.sound('tap');
    open.push(item);
    if (open.length < 2) return;
    moves++;
    locked = true;
    if (open[0].photo.id === open[1].photo.id) {
      matched++;
      ctx.sound('good');
      open.forEach(entry => {
        entry.matched = true;
        entry.card.classList.add('matched');
        entry.card.setAttribute('aria-label', `Matched pair: ${entry.photo.alt}`);
        entry.card.setAttribute('aria-disabled', 'true');
      });
      ctx.status(`${matched} of 6 pairs found. ${matched === 6 ? 'Every dog accounted for!' : 'Keep going!'}`);
      open = [];
      locked = false;
      if (matched === 6) {
        locked = true;
        const score = 900 + Math.max(0, 90 - ctx.elapsed) * 12 - Math.max(0, moves - 6) * 15;
        ctx.later(() => ctx.finish({ score: Math.max(600, score), won: true, message: `All six pairs in ${moves} turns and ${Math.ceil(ctx.elapsed)} seconds. A very familiar set of faces!` }), 600);
      }
    } else {
      ctx.status('Different photos. Remember their places and try another pair.');
      ctx.sound('bad');
      ctx.later(() => {
        open.forEach(entry => {
          entry.card.classList.remove('revealed');
          entry.card.setAttribute('aria-label', `Card ${deck.indexOf(entry) + 1}, face down`);
        });
        open = [];
        locked = false;
      }, 1050);
    }
    update();
  }
  ctx.on(grid, 'click', event => {
    const card = event.target.closest('[data-index]');
    if (card) select(Number(card.dataset.index));
  });
  ctx.frame(() => {
    if (matched === 6) return;
    const time = Math.max(0, Math.ceil(90 - ctx.elapsed));
    if (time !== shownTime) { shownTime = time; update(); }
    if (ctx.elapsed >= 90) ctx.finish({ score: matched * 150, won: false, message: `Time’s up with ${matched} of 6 pairs. Those familiar faces will be waiting for another try.` });
  });
  ctx.status('Turn over two cards to find your first matching photo.');
  update();
}

function wheresMolly(ctx) {
  const root = board(ctx, 'puzzle-shell-game');
  const banner = node('div', 'puzzle-round-banner');
  const field = node('div', 'puzzle-towel-field');
  const note = node('p', 'control-note', 'Watch the towel hiding Molly. When the shuffle stops, tap a towel or press 1, 2 or 3.');
  root.append(banner, field, note);
  const cups = Array.from({ length: 3 }, (_, id) => {
    const cup = button('puzzle-towel');
    cup.dataset.cup = id;
    const hiddenDog = node('img', 'puzzle-hidden-dog');
    hiddenDog.src = assets.molly;
    hiddenDog.alt = '';
    hiddenDog.hidden = id !== 0;
    const cloth = node('span', 'puzzle-towel-cloth');
    cloth.setAttribute('aria-hidden', 'true');
    cloth.append(node('span', 'puzzle-towel-stitch', 'M & S'));
    const label = node('span', 'puzzle-towel-number');
    cup.append(hiddenDog, cloth, label);
    field.append(cup);
    return { id, cup, label, slot: id };
  });
  let round = 0, lives = 3, correct = 0, phase = 'watch', chooseUntil = 0, shownTime = -1;
  function update() {
    ctx.hud({ Round: `${round} / 5`, Hearts: '♥'.repeat(lives) + '♡'.repeat(3 - lives), Found: correct, ...(phase === 'choose' ? { Time: `${Math.max(0, Math.ceil(chooseUntil - ctx.elapsed))}s` } : {}) });
  }
  function place() {
    cups.forEach(item => {
      item.cup.style.transform = `translateX(${item.slot * 100}%)`;
      item.label.textContent = item.slot + 1;
      item.cup.setAttribute('aria-label', `Hiding place ${item.slot + 1}`);
      item.cup.setAttribute('aria-disabled', String(phase !== 'choose'));
      item.cup.tabIndex = phase === 'choose' ? 0 : -1;
    });
  }
  function pick(item) {
    if (phase !== 'choose') return;
    phase = 'reveal';
    cups[0].cup.classList.add('lifted');
    const found = item?.id === 0;
    if (found) correct++; else lives--;
    if (item) item.cup.classList.add(found ? 'puzzle-hit' : 'puzzle-miss');
    banner.textContent = found ? 'There she is! 🐾' : item ? 'Molly was under another towel.' : 'Too slow! Molly peeked out.';
    ctx.status(found ? `You found Molly in round ${round}!` : `${banner.textContent} ${lives} ${lives === 1 ? 'heart' : 'hearts'} left.`);
    ctx.sound(found ? 'good' : 'bad');
    place();
    update();
    ctx.later(() => {
      if (!lives || round === 5) {
        ctx.finish({ score: correct * 250 + lives * 100, won: lives > 0, message: `${correct} of ${round} hiding places found. ${lives > 0 ? 'You kept up with Molly through all five shuffles!' : 'Molly has perfected the art of disappearing into the laundry.'}` });
      } else nextRound();
    }, 1450);
  }
  function nextRound() {
    round++;
    phase = 'watch';
    cups.forEach(item => item.cup.classList.remove('lifted', 'puzzle-hit', 'puzzle-miss'));
    cups[0].cup.classList.add('lifted');
    banner.textContent = `Round ${round} · Here’s Molly. Watch this towel.`;
    field.style.setProperty('--shuffle-time', `${Math.max(260, 690 - round * 80)}ms`);
    ctx.status(`Round ${round}. Molly is in hiding place ${cups[0].slot + 1}. Follow that towel.`);
    place();
    update();
    ctx.later(() => {
      cups[0].cup.classList.remove('lifted');
      banner.textContent = 'Eyes on the towels…';
      ctx.later(() => swap(0), 500);
    }, 1500);
  }
  function swap(step) {
    if (step >= 3 + round) {
      phase = 'choose';
      chooseUntil = ctx.elapsed + 12;
      banner.textContent = 'Where’s Molly? Choose 1, 2 or 3.';
      ctx.status('The shuffle has stopped. Choose a hiding place within 12 seconds.');
      place();
      update();
      return;
    }
    const first = randomInt(0, 2), second = (first + randomInt(1, 2)) % 3;
    [cups[first].slot, cups[second].slot] = [cups[second].slot, cups[first].slot];
    place();
    ctx.later(() => swap(step + 1), Math.max(260, 690 - round * 80) + 160);
  }
  ctx.on(field, 'click', event => {
    const target = event.target.closest('[data-cup]');
    if (target) pick(cups[Number(target.dataset.cup)]);
  });
  keyInput(ctx, key => {
    if (!/^[123]$/.test(key)) return false;
    pick(cups.find(item => item.slot === Number(key) - 1));
    return true;
  });
  ctx.frame(() => {
    if (phase !== 'choose') return;
    const time = Math.ceil(chooseUntil - ctx.elapsed);
    if (time !== shownTime) { shownTime = time; update(); }
    if (ctx.elapsed >= chooseUntil) pick(null);
  });
  nextRound();
}

/* Both quizzes share one accessible answer/review flow, while keeping their own content. */
function quiz(ctx, photoMode = false) {
  const root = board(ctx, photoMode ? 'puzzle-identify' : 'puzzle-trivia');
  const progress = node('div', 'puzzle-quiz-progress');
  const question = node('h2', 'puzzle-question');
  const media = node('div', 'puzzle-quiz-media');
  const choices = node('div', 'puzzle-answers choice-grid');
  const review = node('div', 'puzzle-review');
  review.hidden = true;
  review.setAttribute('aria-live', 'polite');
  const next = button('primary-button puzzle-next', 'Next question →');
  next.hidden = true;
  const controlNote = node('p', 'control-note', photoMode ? 'Tap a name or press 1 / M for Molly, 2 / S for Shaina.' : 'Tap an answer, or use number keys 1–4.');
  root.append(progress, question, media, choices, review, next, controlNote);
  const rounds = photoMode ? shuffle(photos).slice(0, 8).map(photo => ({
    question: 'Who’s in this photo?',
    options: ['Molly', 'Shaina'].map(name => ({ text: name, correct: name === photo.dog })),
    explanation: `${photo.alt}.`,
    source: photo.dog === 'Molly' ? '/molly-gallery/' : '/shaina-gallery/',
    photo
  })) : shuffle(trivia).slice(0, 10).map(item => ({ ...item,
    options: shuffle(item.options.map((text, index) => ({ text, correct: index === item.answer })))
  }));
  let index = 0, correct = 0, streak = 0, score = 0, answered = false;
  const dots = rounds.map((_, i) => {
    const dot = node('span', 'puzzle-quiz-dot', i + 1);
    dot.setAttribute('aria-label', `Question ${i + 1}, not answered`);
    progress.append(dot);
    return dot;
  });
  function display() {
    answered = false;
    const current = rounds[index];
    question.textContent = current.question;
    media.replaceChildren();
    if (photoMode) {
      const img = node('img', 'puzzle-identify-photo');
      img.src = current.photo.src;
      img.alt = `Gallery photo: a dog ${current.photo.alt.replace(/^(Molly|Shaina) /, '')}. Identify Molly or Shaina below.`;
      media.append(img, node('span', 'puzzle-photo-label', 'From the real family album'));
    }
    choices.replaceChildren(...current.options.map((option, i) => {
      const answer = button('answer puzzle-answer');
      answer.dataset.answer = i;
      answer.append(node('span', 'puzzle-answer-key', i + 1), node('span', '', option.text));
      return answer;
    }));
    dots.forEach((dot, i) => dot.classList.toggle('current', i === index));
    review.hidden = true;
    next.hidden = true;
    next.textContent = index === rounds.length - 1 ? 'See results →' : 'Next question →';
    ctx.hud({ [photoMode ? 'Photo' : 'Question']: `${index + 1} / ${rounds.length}`, Correct: correct, Score: score });
    ctx.status(photoMode ? 'Look carefully, then choose Molly or Shaina.' : 'One correct answer. What do you remember from the site?');
  }
  function select(choice) {
    if (answered || !rounds[index].options[choice]) return;
    answered = true;
    const current = rounds[index], right = current.options[choice].correct;
    if (right) { correct++; streak++; score += 100 + Math.min(streak - 1, 4) * 10; } else streak = 0;
    ctx.sound(right ? 'good' : 'bad');
    [...choices.children].forEach((answer, i) => {
      answer.disabled = true;
      if (current.options[i].correct) answer.classList.add('correct');
      else if (i === choice) answer.classList.add('incorrect');
    });
    dots[index].classList.add(right ? 'right' : 'wrong');
    dots[index].setAttribute('aria-label', `Question ${index + 1}, ${right ? 'correct' : 'incorrect'}`);
    const heading = node('strong', '', right ? 'That’s right! 🐾' : `The answer is ${current.options.find(option => option.correct).text}.`);
    const source = node('a', 'puzzle-source', photoMode ? 'See the gallery ↗' : 'Read the fact on the site ↗');
    source.href = current.source;
    source.target = '_blank';
    source.rel = 'noopener';
    source.setAttribute('aria-label', `${source.textContent} (opens in a new tab)`);
    review.replaceChildren(heading, node('p', '', current.explanation), source);
    review.hidden = false;
    next.hidden = false;
    ctx.hud({ [photoMode ? 'Photo' : 'Question']: `${index + 1} / ${rounds.length}`, Correct: correct, Score: score });
    ctx.status(`${right ? 'Correct!' : 'Not quite.'} ${correct} correct so far. Read the explanation, then continue.`);
    // The focused answer is now disabled; move focus to the next usable control.
    next.focus({ preventScroll: true });
  }
  ctx.on(choices, 'click', event => {
    const answer = event.target.closest('[data-answer]');
    if (answer) select(Number(answer.dataset.answer));
  });
  ctx.on(next, 'click', () => {
    if (!answered) return;
    index++;
    if (index >= rounds.length) {
      const threshold = photoMode ? 6 : 7;
      ctx.finish({ score, won: correct >= threshold, message: `${correct} of ${rounds.length} ${photoMode ? 'photos recognised' : 'questions correct'}. ${correct >= threshold ? (photoMode ? 'You know those faces anywhere!' : 'An expert in household dog lore!') : `You need ${threshold} for the win. The gallery and About pages are excellent practice.`}` });
    } else {
      display();
      choices.firstElementChild.focus({ preventScroll: true });
    }
  });
  keyInput(ctx, key => {
    const normal = key.toLowerCase();
    if (photoMode && ['m', 's'].includes(normal)) { select(normal === 'm' ? 0 : 1); return true; }
    if (!/^[1-4]$/.test(key)) return false;
    select(Number(key) - 1);
    return true;
  });
  display();
}

function photoPuzzle(ctx) {
  const root = board(ctx, 'puzzle-sliding');
  const photo = shuffle(photos)[0];
  const picture = node('div', 'puzzle-sliding-board');
  picture.setAttribute('aria-label', 'Sliding photo puzzle. Put tiles 1 through 8 in reading order, with the gap last.');
  const gap = node('div', 'puzzle-photo-gap', '🐾');
  gap.setAttribute('aria-hidden', 'true');
  picture.append(gap);
  const controls = node('div', 'game-controls');
  const previewButton = button('game-button', 'Show completed photo');
  previewButton.setAttribute('aria-expanded', 'false');
  previewButton.setAttribute('aria-controls', 'puzzle-photo-preview');
  const preview = node('figure', 'puzzle-photo-preview');
  preview.id = 'puzzle-photo-preview';
  preview.hidden = true;
  const previewImage = node('img');
  previewImage.src = photo.src;
  previewImage.alt = photo.alt;
  preview.append(previewImage, node('figcaption', '', `${photo.dog} · Arrange 1–8 in order; leave the last space empty.`));
  controls.append(previewButton);
  root.append(picture, controls, preview, node('p', 'control-note', 'Tap a tile next to the gap. Arrow keys move the gap; Tab and Enter select a tile. Gold edges mark tiles that can move. No time limit.'));
  const positions = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  let empty = 8, previous = -1, moves = 0, complete = false, lastSecond = -1;
  const neighbours = position => [position - 3, position + 3, ...(position % 3 ? [position - 1] : []), ...(position % 3 < 2 ? [position + 1] : [])].filter(value => value >= 0 && value < 9);
  // Starting from the solution and making legal moves guarantees a solvable board.
  for (let step = 0; step < 40; step++) {
    const options = neighbours(empty).filter(position => position !== previous);
    const next = options[randomInt(0, options.length - 1)];
    [positions[empty], positions[next]] = [positions[next], positions[empty]];
    previous = empty;
    empty = next;
  }
  if (positions.every((value, index) => value === (index + 1) % 9)) {
    positions[8] = positions[7]; positions[7] = 0; empty = 7;
  }
  const tiles = Array.from({ length: 8 }, (_, index) => {
    const tile = button('puzzle-photo-tile');
    tile.dataset.tile = index + 1;
    tile.style.backgroundImage = `url("${photo.src}")`;
    tile.style.backgroundPosition = `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`;
    tile.append(node('span', '', index + 1));
    picture.append(tile);
    return tile;
  });
  function positionElement(element, index) {
    element.style.transform = `translate(${(index % 3) * 100}%, ${Math.floor(index / 3) * 100}%)`;
  }
  function render() {
    const valid = neighbours(empty);
    positionElement(gap, empty);
    tiles.forEach((tile, index) => {
      const position = positions.indexOf(index + 1), movable = valid.includes(position);
      positionElement(tile, position);
      tile.classList.toggle('movable', movable);
      tile.classList.toggle('in-place', position === index);
      tile.setAttribute('aria-label', `Tile ${index + 1}, row ${Math.floor(position / 3) + 1}, column ${position % 3 + 1}${movable ? ', can move' : ''}`);
      tile.setAttribute('aria-disabled', String(!movable || complete));
    });
    ctx.hud({ Moves: moves, Placed: `${positions.filter((value, index) => value !== 0 && value === index + 1).length} / 8`, Time: `${Math.floor(ctx.elapsed)}s` });
  }
  function move(position) {
    if (complete || !neighbours(empty).includes(position)) return;
    [positions[empty], positions[position]] = [positions[position], positions[empty]];
    empty = position;
    moves++;
    ctx.sound('tap');
    complete = positions.every((value, index) => value === (index + 1) % 9);
    render();
    if (complete) {
      picture.classList.add('solved');
      ctx.sound('win');
      ctx.status('Photo complete! Every piece is in its place.');
      const duration = Math.floor(ctx.elapsed);
      const score = Math.max(250, 2500 - moves * 15 - duration * 2);
      ctx.later(() => ctx.finish({ score, won: true, message: `${photo.dog}’s photo restored in ${moves} moves and ${duration} seconds. Picture perfect!` }), 900);
    } else ctx.status(`Tile moved. ${moves} ${moves === 1 ? 'move' : 'moves'} so far. Arrange the numbers in reading order.`);
  }
  ctx.on(picture, 'click', event => {
    const tile = event.target.closest('[data-tile]');
    if (tile) move(positions.indexOf(Number(tile.dataset.tile)));
  });
  ctx.on(previewButton, 'click', () => {
    preview.hidden = !preview.hidden;
    previewButton.textContent = preview.hidden ? 'Show completed photo' : 'Hide completed photo';
    previewButton.setAttribute('aria-expanded', String(!preview.hidden));
  });
  keyInput(ctx, key => {
    const offset = { ArrowUp: -3, ArrowDown: 3, ArrowLeft: -1, ArrowRight: 1 }[key];
    if (!offset) return false;
    if ((key === 'ArrowLeft' && empty % 3 === 0) || (key === 'ArrowRight' && empty % 3 === 2)) return true;
    move(empty + offset);
    return true;
  });
  ctx.frame(() => {
    const second = Math.floor(ctx.elapsed);
    if (!complete && second !== lastSecond) { lastSecond = second; render(); }
  });
  ctx.status('Slide neighbouring tiles into the gap to restore the photo.');
  render();
}

export const games = {
  'memory-match': memoryMatch,
  'wheres-molly': wheresMolly,
  trivia: ctx => quiz(ctx),
  'who-is-it': ctx => quiz(ctx, true),
  'photo-puzzle': photoPuzzle
};
