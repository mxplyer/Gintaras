// Gintaras — Lithuanian learning content
// Each unit has a set of words: { lt: Lithuanian word, en: English meaning, emoji, note: pronunciation hint }

const UNITS = [
  {
    id: 'greetings',
    title: 'Greetings',
    icon: '👋',
    sub: 'Say hello & goodbye',
    words: [
      { lt: 'Labas', en: 'Hello', emoji: '👋', note: 'LAH-bas' },
      { lt: 'Sveiki', en: 'Hello (formal/plural)', emoji: '🙋', note: 'SVAY-kee' },
      { lt: 'Viso gero', en: 'Goodbye', emoji: '👋', note: 'VEE-so GEH-ro' },
      { lt: 'Labas rytas', en: 'Good morning', emoji: '🌅', note: 'LAH-bas REE-tas' },
      { lt: 'Labas vakaras', en: 'Good evening', emoji: '🌆', note: 'LAH-bas VA-ka-ras' },
      { lt: 'Ačiū', en: 'Thank you', emoji: '🙏', note: 'AH-choo' },
      { lt: 'Prašau', en: 'Please / You\'re welcome', emoji: '🤲', note: 'pra-SHOW' },
      { lt: 'Atsiprašau', en: 'Sorry / Excuse me', emoji: '😅', note: 'at-see-pra-SHOW' },
    ]
  },
  {
    id: 'basics',
    title: 'Basics',
    icon: '💬',
    sub: 'Yes, no, and small talk',
    words: [
      { lt: 'Taip', en: 'Yes', emoji: '✅', note: 'TIE-p' },
      { lt: 'Ne', en: 'No', emoji: '❌', note: 'neh' },
      { lt: 'Kaip sekasi?', en: 'How are you?', emoji: '❓', note: 'KYE-p SEH-ka-see' },
      { lt: 'Gerai', en: 'Good / Fine', emoji: '👍', note: 'geh-RYE' },
      { lt: 'Aš', en: 'I', emoji: '🙋', note: 'ahsh' },
      { lt: 'Tu', en: 'You', emoji: '👉', note: 'too' },
      { lt: 'Mano vardas...', en: 'My name is...', emoji: '🪪', note: 'MA-no VAR-das' },
      { lt: 'Malonu', en: 'Nice to meet you', emoji: '🤝', note: 'ma-LO-noo' },
    ]
  },
  {
    id: 'numbers',
    title: 'Numbers',
    icon: '🔢',
    sub: 'Count from one to ten',
    words: [
      { lt: 'Vienas', en: 'One', emoji: '1️⃣', note: 'vee-EH-nas' },
      { lt: 'Du', en: 'Two', emoji: '2️⃣', note: 'doo' },
      { lt: 'Trys', en: 'Three', emoji: '3️⃣', note: 'trees' },
      { lt: 'Keturi', en: 'Four', emoji: '4️⃣', note: 'keh-too-REE' },
      { lt: 'Penki', en: 'Five', emoji: '5️⃣', note: 'pen-KEE' },
      { lt: 'Šeši', en: 'Six', emoji: '6️⃣', note: 'sheh-SHEE' },
      { lt: 'Septyni', en: 'Seven', emoji: '7️⃣', note: 'sep-tee-NEE' },
      { lt: 'Dešimt', en: 'Ten', emoji: '🔟', note: 'DEH-shimt' },
    ]
  },
  {
    id: 'food',
    title: 'Food & Drink',
    icon: '🍽️',
    sub: 'Order like a local',
    words: [
      { lt: 'Duona', en: 'Bread', emoji: '🍞', note: 'doo-O-na' },
      { lt: 'Vanduo', en: 'Water', emoji: '💧', note: 'van-doo-O' },
      { lt: 'Kava', en: 'Coffee', emoji: '☕', note: 'KA-va' },
      { lt: 'Pienas', en: 'Milk', emoji: '🥛', note: 'pee-EH-nas' },
      { lt: 'Obuolys', en: 'Apple', emoji: '🍎', note: 'o-boo-O-lees' },
      { lt: 'Bulvė', en: 'Potato', emoji: '🥔', note: 'BOOL-veh' },
      { lt: 'Sūris', en: 'Cheese', emoji: '🧀', note: 'SOO-rees' },
      { lt: 'Skanu', en: 'Tasty', emoji: '😋', note: 'ska-NOO' },
    ]
  },
  {
    id: 'family',
    title: 'Family',
    icon: '👨‍👩‍👧',
    sub: 'Talk about loved ones',
    words: [
      { lt: 'Šeima', en: 'Family', emoji: '👨‍👩‍👧‍👦', note: 'SHAY-ma' },
      { lt: 'Mama', en: 'Mom', emoji: '👩', note: 'MA-ma' },
      { lt: 'Tėtis', en: 'Dad', emoji: '👨', note: 'TEH-tees' },
      { lt: 'Brolis', en: 'Brother', emoji: '👦', note: 'BRO-lees' },
      { lt: 'Sesuo', en: 'Sister', emoji: '👧', note: 'seh-soo-O' },
      { lt: 'Senelis', en: 'Grandfather', emoji: '👴', note: 'seh-NEH-lees' },
      { lt: 'Senelė', en: 'Grandmother', emoji: '👵', note: 'seh-NEH-leh' },
      { lt: 'Vaikas', en: 'Child', emoji: '🧒', note: 'VYE-kas' },
    ]
  },
  {
    id: 'places',
    title: 'Places',
    icon: '🗺️',
    sub: 'Find your way around',
    words: [
      { lt: 'Namai', en: 'Home', emoji: '🏠', note: 'na-MYE' },
      { lt: 'Miestas', en: 'City', emoji: '🏙️', note: 'mee-EHS-tas' },
      { lt: 'Mokykla', en: 'School', emoji: '🏫', note: 'mo-keek-LA' },
      { lt: 'Parduotuvė', en: 'Shop', emoji: '🏪', note: 'par-doo-o-TOO-veh' },
      { lt: 'Gatvė', en: 'Street', emoji: '🛣️', note: 'GAT-veh' },
      { lt: 'Miškas', en: 'Forest', emoji: '🌲', note: 'MEESH-kas' },
      { lt: 'Jūra', en: 'Sea', emoji: '🌊', note: 'YOO-ra' },
      { lt: 'Upė', en: 'River', emoji: '🏞️', note: 'OO-peh' },
    ]
  },
  {
    id: 'colors',
    title: 'Colors',
    icon: '🎨',
    sub: 'Describe the world around you',
    words: [
      { lt: 'Raudona', en: 'Red', emoji: '🔴', note: 'row-do-NA' },
      { lt: 'Mėlyna', en: 'Blue', emoji: '🔵', note: 'meh-lee-NA' },
      { lt: 'Žalia', en: 'Green', emoji: '🟢', note: 'zha-LYA' },
      { lt: 'Geltona', en: 'Yellow', emoji: '🟡', note: 'gel-to-NA' },
      { lt: 'Juoda', en: 'Black', emoji: '⚫', note: 'yoo-o-DA' },
      { lt: 'Balta', en: 'White', emoji: '⚪', note: 'bal-TA' },
      { lt: 'Ruda', en: 'Brown', emoji: '🟤', note: 'roo-DA' },
      { lt: 'Oranžinė', en: 'Orange', emoji: '🟠', note: 'o-RAN-zhi-neh' },
    ]
  },
  {
    id: 'time',
    title: 'Time & Days',
    icon: '🕒',
    sub: 'Talk about when',
    words: [
      { lt: 'Šiandien', en: 'Today', emoji: '📅', note: 'shee-AN-dee-en' },
      { lt: 'Rytoj', en: 'Tomorrow', emoji: '➡️', note: 'ree-TOY' },
      { lt: 'Vakar', en: 'Yesterday', emoji: '⬅️', note: 'VA-kar' },
      { lt: 'Pirmadienis', en: 'Monday', emoji: '1️⃣', note: 'peer-ma-dee-EH-nis' },
      { lt: 'Penktadienis', en: 'Friday', emoji: '5️⃣', note: 'penk-ta-dee-EH-nis' },
      { lt: 'Savaitė', en: 'Week', emoji: '🗓️', note: 'sa-VYE-teh' },
      { lt: 'Valanda', en: 'Hour', emoji: '⏰', note: 'va-lan-DA' },
      { lt: 'Dabar', en: 'Now', emoji: '⌛', note: 'da-BAR' },
    ]
  },
  {
    id: 'body',
    title: 'Body Parts',
    icon: '🧍',
    sub: 'Head to toe',
    words: [
      { lt: 'Galva', en: 'Head', emoji: '🗣️', note: 'gal-VA' },
      { lt: 'Akis', en: 'Eye', emoji: '👁️', note: 'a-KIS' },
      { lt: 'Ranka', en: 'Hand / Arm', emoji: '✋', note: 'ran-KA' },
      { lt: 'Koja', en: 'Leg / Foot', emoji: '🦵', note: 'ko-YA' },
      { lt: 'Širdis', en: 'Heart', emoji: '❤️', note: 'shir-DIS' },
      { lt: 'Burna', en: 'Mouth', emoji: '👄', note: 'boor-NA' },
      { lt: 'Ausis', en: 'Ear', emoji: '👂', note: 'ow-SIS' },
      { lt: 'Nosis', en: 'Nose', emoji: '👃', note: 'no-SIS' },
    ]
  },
  {
    id: 'verbs',
    title: 'Everyday Verbs',
    icon: '🏃',
    sub: 'Common actions',
    words: [
      { lt: 'Valgyti', en: 'To eat', emoji: '🍽️', note: 'val-GEE-tee' },
      { lt: 'Gerti', en: 'To drink', emoji: '🥤', note: 'GER-tee' },
      { lt: 'Eiti', en: 'To go / walk', emoji: '🚶', note: 'AY-tee' },
      { lt: 'Miegoti', en: 'To sleep', emoji: '😴', note: 'mee-eh-GO-tee' },
      { lt: 'Kalbėti', en: 'To speak', emoji: '💬', note: 'kal-BEH-tee' },
      { lt: 'Skaityti', en: 'To read', emoji: '📖', note: 'skai-TEE-tee' },
      { lt: 'Dirbti', en: 'To work', emoji: '💼', note: 'DIRB-tee' },
      { lt: 'Žaisti', en: 'To play', emoji: '🎮', note: 'ZHAI-stee' },
    ]
  }
];

// Badge definitions
const BADGES = [
  { id: 'first_lesson', icon: '🌱', label: 'First steps', cond: s => s.lessonsCompleted >= 1 },
  { id: 'streak3', icon: '🔥', label: '3-day streak', cond: s => s.streak >= 3 },
  { id: 'streak7', icon: '⚡', label: '7-day streak', cond: s => s.streak >= 7 },
  { id: 'words25', icon: '📖', label: '25 words', cond: s => s.wordsLearned >= 25 },
  { id: 'allunits', icon: '🏆', label: 'Path complete', cond: s => s.unitsCompleted >= UNITS.length },
  { id: 'perfect', icon: '💯', label: 'Perfect quiz', cond: s => s.hadPerfectQuiz === true },
];
