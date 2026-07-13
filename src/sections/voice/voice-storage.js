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
  if (lang === 'yo') return [en, 'Ta Garri meji', 'Add product Indomie'];
  if (lang === 'ha') return [en, 'Sayi Peak guda biyu', 'Add product Indomie'];
  if (lang === 'ig') return [en, 'Ree Peak milk abụọ', 'Add product Indomie'];
  return [en, 'Restock Peak milk 10', 'Add product Indomie carton'];
}
