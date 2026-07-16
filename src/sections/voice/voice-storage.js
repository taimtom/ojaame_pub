const LANG_KEY = 'ojaame_voice_language';
const COACH_KEY = 'ojaame_voice_coach_seen';

export const VOICE_LANGUAGES = [
  { value: 'auto', label: 'Auto' },
  { value: 'en', label: 'EN' },
  { value: 'yo', label: 'YO' },
  { value: 'ha', label: 'HA' },
  { value: 'ig', label: 'IG' },
];

export function getStickyVoiceLanguage() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v && VOICE_LANGUAGES.some((l) => l.value === v)) return v;
  } catch {
    // ignore
  }
  return 'auto';
}

export function setStickyVoiceLanguage(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
}

export function hasSeenVoiceCoach() {
  try {
    return localStorage.getItem(COACH_KEY) === '1';
  } catch {
    return false;
  }
}

export function markVoiceCoachSeen() {
  try {
    localStorage.setItem(COACH_KEY, '1');
  } catch {
    // ignore
  }
}

export function voiceCoachExamples(lang) {
  const en = 'Sell 2 Peak milk cash';
  if (lang === 'yo') {
    return [
      'Ta Garri meji',
      'Ta Citrus Fizz meji and Viva Detergent meji',
      'Ta chicken 5000 naira cash',
    ];
  }
  if (lang === 'ha') {
    return [
      'Sayi Peak guda biyu',
      'Sayi Peak biyu da Indomie uku',
      'Sayi chicken 5000 naira cash',
    ];
  }
  if (lang === 'ig') {
    return [
      'Ree Peak milk abụọ',
      'Ree Citrus Fizz abụọ and Viva Detergent abụọ',
      'Ree chicken 5000 naira cash',
    ];
  }
  return [en, 'Sell Citrus Fizz and Viva Detergent', 'Restock Peak milk 10'];
}
