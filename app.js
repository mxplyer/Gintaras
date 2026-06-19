// Gintaras — app logic
// All state is in-memory only (per session). No localStorage (not supported in this preview environment).
// When packaged as a real app (Cordova/Capacitor), swap STATE persistence for AsyncStorage/localStorage.

let STATE = {
  streak: 1,
  xp: 0,
  wordsLearned: 0,
  lessonsCompleted: 0,
  unitsCompleted: 0,
  hadPerfectQuiz: false,
  unitProgress: {}, // unitId -> { flash: bool, quiz: bool, match: bool }
};

UNITS.forEach(u => STATE.unitProgress[u.id] = { flash: false, quiz: false, match: false });

let currentUnit = null;
let currentMode = null;

// ---------- Init ----------
function init() {
  renderUnitGrid();
  renderSash();
  updateTopStats();
  renderProfile();
}

function updateTopStats() {
  document.getElementById('streakCount').textContent = STATE.streak;
  document.getElementById('xpCount').textContent = STATE.xp;
}

function renderSash() {
  const bar = document.getElementById('sashBar');
  bar.innerHTML = '';
  UNITS.forEach((u, i) => {
    const seg = document.createElement('div');
    const prog = STATE.unitProgress[u.id];
    const done = prog.flash && prog.quiz && prog.match;
    const started = prog.flash || prog.quiz || prog.match;
    seg.className = 'sash-seg' + (done ? ' filled' : '') + (started && !done ? ' filled current' : '');
    bar.appendChild(seg);
  });
}

function isUnitUnlocked(idx) {
  if (idx === 0) return true;
  const prevId = UNITS[idx - 1].id;
  const p = STATE.unitProgress[prevId];
  return p.flash && p.quiz; // unlock once previous unit's core lessons are done
}

function renderUnitGrid() {
  const grid = document.getElementById('unitGrid');
  grid.innerHTML = '';
  UNITS.forEach((u, idx) => {
    const unlocked = isUnitUnlocked(idx);
    const p = STATE.unitProgress[u.id];
    const done = p.flash && p.quiz && p.match;
    const card = document.createElement('div');
    card.className = 'unit-card' + (unlocked ? '' : ' locked') + (done ? ' done' : '') + (unlocked && !done ? ' current' : '');
    card.innerHTML = `
      <div class="unit-icon">${done ? '✓' : u.icon}</div>
      <div class="unit-info">
        <div class="u-title">${u.title}</div>
        <div class="u-sub">${unlocked ? u.sub : 'Complete previous unit to unlock'}</div>
      </div>
      <div class="unit-arrow">${unlocked ? '›' : '🔒'}</div>
    `;
    if (unlocked) card.onclick = () => openUnit(u.id);
    grid.appendChild(card);
  });
}

function openUnit(unitId) {
  currentUnit = UNITS.find(u => u.id === unitId);
  document.getElementById('lessonUnitTitle').textContent = currentUnit.title;
  showLessonHub();
}

function showLessonHub() {
  showScreen('screen-lesson');
  const grid = document.getElementById('lessonModeGrid');
  const p = STATE.unitProgress[currentUnit.id];
  const modes = [
    { key: 'flash', icon: '🃏', title: 'Flashcards', sub: 'Learn the words', done: p.flash, fn: startFlash },
    { key: 'quiz', icon: '❓', title: 'Quiz', sub: 'Test yourself', done: p.quiz, fn: startQuiz, locked: !p.flash },
    { key: 'match', icon: '🔗', title: 'Match pairs', sub: 'Quick game round', done: p.match, fn: startMatch, locked: !p.quiz },
  ];
  grid.innerHTML = '';
  modes.forEach(m => {
    const card = document.createElement('div');
    card.className = 'unit-card' + (m.locked ? ' locked' : '') + (m.done ? ' done' : '');
    card.innerHTML = `
      <div class="unit-icon">${m.done ? '✓' : m.icon}</div>
      <div class="unit-info">
        <div class="u-title">${m.title}</div>
        <div class="u-sub">${m.locked ? 'Finish the step above first' : m.sub}</div>
      </div>
      <div class="unit-arrow">${m.locked ? '🔒' : '›'}</div>
    `;
    if (!m.locked) card.onclick = m.fn;
    grid.appendChild(card);
  });
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() {
  renderUnitGrid();
  renderSash();
  updateTopStats();
  switchTab('home');
}

function switchTab(tab) {
  document.getElementById('nav-home').classList.toggle('active', tab === 'home');
  document.getElementById('nav-profile').classList.toggle('active', tab === 'profile');
  if (tab === 'home') { showScreen('screen-home'); renderUnitGrid(); renderSash(); }
  else { showScreen('screen-profile'); renderProfile(); }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- FLASHCARDS ----------
let flashIdx = 0;
let flashFlipped = false;

function startFlash() {
  flashIdx = 0;
  flashFlipped = false;
  showScreen('screen-flash');
  renderFlash();
}

function renderFlash() {
  const word = currentUnit.words[flashIdx];
  document.getElementById('flashProgress').textContent = `${flashIdx + 1}/${currentUnit.words.length}`;
  const card = document.getElementById('flashCard');
  flashFlipped = false;
  card.innerHTML = `
    <div class="flash-emoji">${word.emoji}</div>
    <div class="flash-word">${word.lt}</div>
    <div class="flash-translit">${word.note}</div>
    <div class="flash-hint">Tap to reveal meaning</div>
  `;
}

function flipCard() {
  const word = currentUnit.words[flashIdx];
  const card = document.getElementById('flashCard');
  flashFlipped = !flashFlipped;
  if (flashFlipped) {
    card.innerHTML = `
      <div class="flash-emoji">${word.emoji}</div>
      <div class="flash-back">${word.en}</div>
      <div class="flash-hint">${word.lt} · ${word.note}</div>
    `;
  } else {
    renderFlash();
  }
}

function nextFlash() {
  if (flashIdx < currentUnit.words.length - 1) {
    flashIdx++;
    renderFlash();
  } else {
    STATE.unitProgress[currentUnit.id].flash = true;
    STATE.wordsLearned += currentUnit.words.length;
    awardXP(10);
    showResult({ title: 'Cards complete!', sub: `You reviewed all ${currentUnit.words.length} words in ${currentUnit.title}`, xp: 10, acc: null });
  }
}

function prevFlash() {
  if (flashIdx > 0) { flashIdx--; renderFlash(); }
}

// ---------- QUIZ ----------
let quizIdx = 0;
let quizCorrect = 0;
let quizOrder = [];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  quizIdx = 0;
  quizCorrect = 0;
  quizOrder = shuffle(currentUnit.words);
  showScreen('screen-quiz');
  renderQuiz();
}

function renderQuiz() {
  const word = quizOrder[quizIdx];
  document.getElementById('quizProgress').textContent = `${quizIdx + 1}/${quizOrder.length}`;
  document.getElementById('quizWord').textContent = word.lt;

  // build 4 options: correct + 3 distractors from same unit
  const distractors = shuffle(currentUnit.words.filter(w => w.lt !== word.lt)).slice(0, 3).map(w => w.en);
  const options = shuffle([word.en, ...distractors]);

  const optGrid = document.getElementById('quizOptions');
  optGrid.innerHTML = '';
  let answered = false;
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.onclick = () => {
      if (answered) return;
      answered = true;
      const correct = opt === word.en;
      btn.classList.add(correct ? 'correct' : 'wrong');
      if (correct) quizCorrect++;
      else {
        // reveal the right one
        [...optGrid.children].forEach(c => { if (c.textContent === word.en) c.classList.add('correct'); });
      }
      [...optGrid.children].forEach(c => { if (c !== btn) c.classList.add('dim'); });
      setTimeout(() => {
        if (quizIdx < quizOrder.length - 1) { quizIdx++; renderQuiz(); }
        else finishQuiz();
      }, 700);
    };
    optGrid.appendChild(btn);
  });
}

function finishQuiz() {
  STATE.unitProgress[currentUnit.id].quiz = true;
  const acc = Math.round((quizCorrect / quizOrder.length) * 100);
  const xpEarned = 5 + quizCorrect * 2;
  awardXP(xpEarned);
  if (acc === 100) STATE.hadPerfectQuiz = true;
  showResult({ title: acc === 100 ? 'Perfect score!' : 'Quiz complete!', sub: `${quizCorrect} of ${quizOrder.length} correct`, xp: xpEarned, acc });
}

// ---------- MATCH ----------
let matchPairs = [];
let matchSelected = null;
let matchFound = 0;

function startMatch() {
  const set = shuffle(currentUnit.words).slice(0, 6);
  matchPairs = [];
  set.forEach((w, i) => {
    matchPairs.push({ key: i, text: w.lt, type: 'lt' });
    matchPairs.push({ key: i, text: w.en, type: 'en' });
  });
  matchPairs = shuffle(matchPairs);
  matchSelected = null;
  matchFound = 0;
  showScreen('screen-match');
  renderMatch();
}

function renderMatch() {
  document.getElementById('matchProgress').textContent = `${matchFound}/6`;
  const grid = document.getElementById('matchGrid');
  grid.innerHTML = '';
  matchPairs.forEach((tile, idx) => {
    const div = document.createElement('div');
    div.className = 'match-tile' + (tile.matched ? ' matched' : '');
    div.textContent = tile.text;
    if (!tile.matched) {
      div.onclick = () => selectMatchTile(idx);
    }
    grid.appendChild(div);
  });
}

function selectMatchTile(idx) {
  const tiles = document.querySelectorAll('.match-tile');
  if (matchSelected === null) {
    matchSelected = idx;
    tiles[idx].classList.add('selected');
    return;
  }
  if (matchSelected === idx) return;

  const a = matchPairs[matchSelected];
  const b = matchPairs[idx];

  if (a.key === b.key && a.type !== b.type) {
    a.matched = true;
    b.matched = true;
    matchFound++;
    matchSelected = null;
    renderMatch();
    if (matchFound === 6) {
      setTimeout(() => {
        STATE.unitProgress[currentUnit.id].match = true;
        const newUnitsDone = UNITS.filter(u => {
          const p = STATE.unitProgress[u.id];
          return p.flash && p.quiz && p.match;
        }).length;
        if (newUnitsDone > STATE.unitsCompleted) {
          STATE.unitsCompleted = newUnitsDone;
        }
        STATE.lessonsCompleted++;
        awardXP(15);
        showResult({ title: 'All matched!', sub: `You completed ${currentUnit.title}`, xp: 15, acc: null });
      }, 400);
    }
  } else {
    tiles[idx].classList.add('selected');
    tiles[matchSelected].classList.add('shake');
    tiles[idx].classList.add('shake');
    setTimeout(() => {
      tiles[matchSelected].classList.remove('selected', 'shake');
      tiles[idx].classList.remove('selected', 'shake');
      matchSelected = null;
    }, 450);
  }
}

// ---------- Shared: XP, results, badges ----------
function awardXP(n) {
  STATE.xp += n;
  updateTopStats();
}

function showResult({ title, sub, xp, acc }) {
  document.getElementById('resultEmoji').textContent = acc === 100 ? '🏅' : '🎉';
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultSub').textContent = sub;
  document.getElementById('resultXP').textContent = `+${xp}`;
  document.getElementById('resultAcc').parentElement.style.display = acc === null ? 'none' : 'flex';
  document.getElementById('resultAcc').textContent = acc === null ? '' : `${acc}%`;
  showScreen('screen-result');
  checkBadges();
}

let unlockedBadges = new Set();
function checkBadges() {
  BADGES.forEach(b => {
    if (!unlockedBadges.has(b.id) && b.cond(STATE)) {
      unlockedBadges.add(b.id);
      showToast(`${b.icon} Badge unlocked: ${b.label}`);
    }
  });
}

function renderProfile() {
  document.getElementById('profStreak').textContent = STATE.streak;
  document.getElementById('profXP').textContent = STATE.xp;
  document.getElementById('profWords').textContent = STATE.wordsLearned;
  document.getElementById('profUnits').textContent = STATE.unitsCompleted;

  const row = document.getElementById('badgeRow');
  row.innerHTML = '';
  BADGES.forEach(b => {
    const unlocked = unlockedBadges.has(b.id) || b.cond(STATE);
    const div = document.createElement('div');
    div.className = 'badge' + (unlocked ? '' : ' locked');
    div.innerHTML = `<span>${b.icon}</span><span>${b.label}</span>`;
    row.appendChild(div);
  });
}

init();
