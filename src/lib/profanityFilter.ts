// Indonesian profanity filter
const BLOCKED_WORDS = [
  'anjing', 'anjir', 'anjrit', 'anj', 'ajg', 'anjay',
  'bangsat', 'bgst', 'bngst',
  'babi', 'babi lu',
  'kontol', 'kntl', 'kontl', 'memek', 'mmk', 'mmek',
  'ngentot', 'ngewe', 'entot', 'ngntd',
  'tolol', 'tll',  'goblok', 'gblk', 'goblog',
  'idiot', 'bego', 'bge', 'bodoh',
  'tai', 'taik',
  'kampret', 'kmprt',
  'jancuk', 'jancok', 'jnck', 'cuk', 'cok',
  'asu', 'asw',
  'pepek', 'ppk',
  'setan', 'iblis',
  'bajingan', 'bjngn',
  'keparat',
  'monyet',
  'brengsek', 'brngsk',
  'sialan', 'sial',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy',
  'damn', 'bastard', 'wtf', 'stfu',
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return BLOCKED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
}

export function censorMessage(text: string): string {
  let result = text;
  const lower = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, '*'.repeat(word.length));
  }
  return result;
}
