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

UNITS.forEach(u => STATE.unitProgress[u.id] = { flash: false, quiz: false, match: false, listen: false });

let currentUnit = null;
let currentMode = null;

// ---------- Mistake limit (shared across Quiz, Listening, Match) ----------
// After 5 wrong answers in a single exercise attempt, the learner is sent back
// to redo that exercise from the start — encourages real recall instead of guessing through.
const MAX_MISTAKES = 5;
let mistakeCount = 0;

function resetMistakes() {
  mistakeCount = 0;
  updateMistakeDots();
}

function registerMistake(onLimitReached) {
  mistakeCount++;
  updateMistakeDots();
  if (mistakeCount >= MAX_MISTAKES) {
    setTimeout(() => onLimitReached(), 750);
    return true; // limit hit
  }
  return false;
}

function updateMistakeDots() {
  const wrap = document.getElementById('mistakeDots');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < MAX_MISTAKES; i++) {
    const dot = document.createElement('span');
    dot.className = 'mistake-dot' + (i < mistakeCount ? ' used' : '');
    wrap.appendChild(dot);
  }
}

function showRestartScreen(restartFn, continueFn, returnScreenId) {
  document.getElementById('restartSub').textContent =
    `You've made ${MAX_MISTAKES} mistakes — let's go through it again from the start.`;
  document.getElementById('restartBtn').onclick = () => {
    resetMistakes();
    restartFn();
  };
  const watchBtn = document.getElementById('watchAdBtn');
  if (continueFn) {
    watchBtn.style.display = 'flex';
    watchBtn.onclick = () => showRewardedAd(continueFn, returnScreenId);
  } else {
    watchBtn.style.display = 'none';
  }
  showScreen('screen-restart');
}

// ---------- Rewarded video ads ----------
// PLACEHOLDER IMPLEMENTATION: simulates the watch-an-ad-for-a-reward flow so the full
// UX is built and ready. To go live, replace showRewardedAd()'s body with your real
// AdMob rewarded ad call (see comment inside) once you have an AdMob Ad Unit ID.
let watchAdCallback = null;
let watchAdReturnScreen = null;

function showRewardedAd(continueFn, returnScreenId) {
  watchAdCallback = continueFn;
  watchAdReturnScreen = returnScreenId;
  // ---- REAL ADMOB INTEGRATION GOES HERE ----
  // Example (once packaged with a real ad SDK):
  //   AdMob.showRewardedAd({ adUnitId: 'YOUR_AD_UNIT_ID' })
  //     .then(() => onRewardedAdComplete())
  //     .catch(() => showToast('Ad not available right now'));
  // For now, this simulates a 3-second ad so the full flow can be tested:
  showScreen('screen-ad-simulator');
  let secondsLeft = 3;
  const countEl = document.getElementById('adCountdown');
  countEl.textContent = secondsLeft;
  const timer = setInterval(() => {
    secondsLeft--;
    countEl.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(timer);
      onRewardedAdComplete();
    }
  }, 1000);
}

function onRewardedAdComplete() {
  resetMistakes();
  if (watchAdReturnScreen) {
    showScreen(watchAdReturnScreen); // make the game screen visible again before re-rendering its content
  }
  if (watchAdCallback) {
    const fn = watchAdCallback;
    watchAdCallback = null;
    fn();
  }
  showToast('🎁 Bonus unlocked! Continuing...');
}

// ---------- Daily reminder notifications ----------
// Uses the Service Worker + Notification API, both free, built into the browser/OS.
// No backend, no push server needed for a local daily reminder while the app is installed.
let reminderEnabled = false;

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {
    // Fails silently if running from file:// or an unsupported context (e.g. this preview).
    // Works correctly once hosted on https:// (GitHub Pages) or packaged as an app.
  });
}

function notificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

async function enableDailyReminder() {
  if (!notificationsSupported()) {
    showToast('Reminders need the installed app or a hosted link');
    return false;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    showToast('Notifications permission was not granted');
    return false;
  }
  reminderEnabled = true;
  scheduleNextReminder();
  showToast('Daily reminder turned on 🔔');
  return true;
}

function disableDailyReminder() {
  reminderEnabled = false;
  if (reminderTimer) clearTimeout(reminderTimer);
  showToast('Daily reminder turned off');
}

let reminderTimer = null;
function scheduleNextReminder() {
  if (!reminderEnabled) return;
  if (reminderTimer) clearTimeout(reminderTimer);

  // Fires once every 24 hours while the app is installed and has been opened at least
  // once that day. True "app fully closed" delivery requires native push (a later upgrade);
  // this covers the common case of a phone with the app installed in the background.
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  reminderTimer = setTimeout(() => {
    triggerReminderNotification();
    scheduleNextReminder();
  }, TWENTY_FOUR_HOURS);
}

function triggerReminderNotification() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({
    type: 'SHOW_STREAK_REMINDER',
    body: `Your ${STATE.streak}-day streak is waiting! Keep it alive with a quick lesson.`,
  });
}

// ---------- Init ----------
function init() {
  renderUnitGrid();
  renderSash();
  updateTopStats();
  renderProfile();
  registerServiceWorker();
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
    const done = prog.flash && prog.quiz && prog.listen && prog.match;
    const started = prog.flash || prog.quiz || prog.listen || prog.match;
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
    const done = p.flash && p.quiz && p.listen && p.match;
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
    { key: 'listen', icon: '🎧', title: 'Listening practice', sub: 'Hear it, pick the spelling', done: p.listen, fn: startListen, locked: !p.quiz },
    { key: 'match', icon: '🔗', title: 'Match pairs', sub: 'Quick game round', done: p.match, fn: startMatch, locked: !p.listen },
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

// ---------- Pronunciation (built into the browser, free, no API needed) ----------
function speak(text) {
  if (!('speechSynthesis' in window)) {
    showToast('Sound not supported on this device');
    return;
  }
  window.speechSynthesis.cancel(); // stop any word currently being spoken
  const utter = new SpeechSynthesisUtterance(text);
  // Try to use a Lithuanian voice if the device has one installed.
  // Most phones don't ship Lithuanian by default, so we fall back gracefully.
  const voices = window.speechSynthesis.getVoices();
  const ltVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('lt'));
  if (ltVoice) {
    utter.voice = ltVoice;
    utter.lang = ltVoice.lang;
  } else {
    utter.lang = 'lt-LT'; // ask for Lithuanian phonetics even without a dedicated voice
  }
  utter.rate = 0.85; // slightly slower, easier for learners to catch
  window.speechSynthesis.speak(utter);
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
    <button class="speak-btn" aria-label="Hear pronunciation">🔊 Hear it</button>
    <div class="flash-translit">${word.note}</div>
    <div class="flash-hint">Tap the card to flip</div>
  `;
  card.querySelector('.speak-btn').onclick = (e) => { e.stopPropagation(); speak(word.lt); };
  speak(word.lt); // auto-play pronunciation when the card appears
}

function flipCard() {
  const word = currentUnit.words[flashIdx];
  const card = document.getElementById('flashCard');
  flashFlipped = !flashFlipped;
  if (flashFlipped) {
    card.innerHTML = `
      <div class="flash-emoji">${word.emoji}</div>
      <div class="flash-back">${word.en}</div>
      <button class="speak-btn" aria-label="Hear pronunciation">🔊 Hear it</button>
      <div class="flash-hint">${word.lt} · ${word.note}</div>
    `;
    card.querySelector('.speak-btn').onclick = (e) => { e.stopPropagation(); speak(word.lt); };
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
  resetMistakes();
  showScreen('screen-quiz');
  renderQuiz();
}

function renderQuiz() {
  updateMistakeDots();
  const word = quizOrder[quizIdx];
  document.getElementById('quizProgress').textContent = `${quizIdx + 1}/${quizOrder.length}`;
  document.getElementById('quizWord').innerHTML = `${word.lt} <button class="speak-btn-inline" aria-label="Hear pronunciation">🔊</button>`;
  document.querySelector('#quizWord .speak-btn-inline').onclick = () => speak(word.lt);
  speak(word.lt); // auto-play when question appears

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
      let limitHit = false;
      if (correct) quizCorrect++;
      else {
        // reveal the right one
        [...optGrid.children].forEach(c => { if (c.textContent === word.en) c.classList.add('correct'); });
        limitHit = registerMistake(() => showRestartScreen(startQuiz, () => renderQuiz(), 'screen-quiz'));
      }
      [...optGrid.children].forEach(c => { if (c !== btn) c.classList.add('dim'); });
      if (limitHit) return; // showRestartScreen will take over after its own delay
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

// ---------- LISTENING PRACTICE ----------
let listenIdx = 0;
let listenCorrect = 0;
let listenOrder = [];

function startListen() {
  listenIdx = 0;
  listenCorrect = 0;
  listenOrder = shuffle(currentUnit.words);
  resetMistakes();
  showScreen('screen-listen');
  renderListen();
}

function renderListen() {
  updateMistakeDots();
  const word = listenOrder[listenIdx];
  document.getElementById('listenProgress').textContent = `${listenIdx + 1}/${listenOrder.length}`;

  const distractors = shuffle(currentUnit.words.filter(w => w.lt !== word.lt)).slice(0, 3).map(w => w.lt);
  const options = shuffle([word.lt, ...distractors]);

  const optGrid = document.getElementById('listenOptions');
  optGrid.innerHTML = '';
  let answered = false;
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.onclick = () => {
      if (answered) return;
      answered = true;
      const correct = opt === word.lt;
      btn.classList.add(correct ? 'correct' : 'wrong');
      let limitHit = false;
      if (correct) listenCorrect++;
      else {
        [...optGrid.children].forEach(c => { if (c.textContent === word.lt) c.classList.add('correct'); });
        limitHit = registerMistake(() => showRestartScreen(startListen, () => renderListen(), 'screen-listen'));
      }
      [...optGrid.children].forEach(c => { if (c !== btn) c.classList.add('dim'); });
      if (limitHit) return;
      setTimeout(() => {
        if (listenIdx < listenOrder.length - 1) { listenIdx++; renderListen(); }
        else finishListen();
      }, 700);
    };
    optGrid.appendChild(btn);
  });

  speak(word.lt); // play the word automatically so the learner can guess from sound alone
}

function replayListenAudio() {
  speak(listenOrder[listenIdx].lt);
}

function finishListen() {
  STATE.unitProgress[currentUnit.id].listen = true;
  const acc = Math.round((listenCorrect / listenOrder.length) * 100);
  const xpEarned = 5 + listenCorrect * 2;
  awardXP(xpEarned);
  if (acc === 100) STATE.hadPerfectQuiz = true;
  showResult({ title: acc === 100 ? 'Great ear!' : 'Listening done!', sub: `${listenCorrect} of ${listenOrder.length} correct`, xp: xpEarned, acc });
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
  resetMistakes();
  showScreen('screen-match');
  renderMatch();
}

function renderMatch() {
  updateMistakeDots();
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
          return p.flash && p.quiz && p.listen && p.match;
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
    const limitHit = registerMistake(() => showRestartScreen(startMatch, () => renderMatch(), 'screen-match'));
    setTimeout(() => {
      tiles[matchSelected].classList.remove('selected', 'shake');
      tiles[idx].classList.remove('selected', 'shake');
      matchSelected = null;
    }, 450);
    if (limitHit) {
      // Disable further taps while the restart screen takes over.
      document.querySelectorAll('.match-tile').forEach(t => t.onclick = null);
    }
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

async function toggleReminder() {
  const btn = document.getElementById('reminderToggle');
  if (!reminderEnabled) {
    const success = await enableDailyReminder();
    if (success) {
      btn.classList.add('on');
      btn.setAttribute('aria-pressed', 'true');
    }
  } else {
    disableDailyReminder();
    btn.classList.remove('on');
    btn.setAttribute('aria-pressed', 'false');
  }
}

function renderProfile() {
  document.getElementById('profStreak').textContent = STATE.streak;
  document.getElementById('profXP').textContent = STATE.xp;
  document.getElementById('profWords').textContent = STATE.wordsLearned;
  document.getElementById('profUnits').textContent = STATE.unitsCompleted;

  const reminderBtn = document.getElementById('reminderToggle');
  if (reminderBtn) {
    reminderBtn.classList.toggle('on', reminderEnabled);
    reminderBtn.setAttribute('aria-pressed', String(reminderEnabled));
  }

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
