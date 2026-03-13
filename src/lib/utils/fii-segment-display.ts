/**
 * Exibe segmento de FII com acentuação correta.
 * Corrige: sem acento (Escritorios), mojibake com "?" (Escrit?rios).
 */

const SEGMENT_ACCENT_MAP: Record<string, string> = {
  'Escritorios': 'Escritórios',
  'Logistica': 'Logística',
  'Totulos e Val. Mob.': 'Títulos e Val. Mob.',
  'Titulos e Val. Mob.': 'Títulos e Val. Mob.',
  'Lajes Corporativas': 'Lajes Corporativas',
  'Multicategoria': 'Multicategoria',
  'Residencial': 'Residencial',
  'Shoppings': 'Shoppings',
  'Varejo': 'Varejo',
  'Hospital': 'Hospital',
  'Hotel': 'Hotel',
  'Hoteis': 'Hotéis',
  'Outros': 'Outros',
  'Educacional': 'Educacional',
  'Híbrido': 'Híbrido',
  'Hibrido': 'Híbrido',
  'Papéis': 'Papéis',
  'Papeis': 'Papéis',
};

/** Corrige segmentos que vieram com "?" no lugar de acento (problema de encoding) */
const SEGMENT_FIX_QUESTION_MARK: Array<[RegExp, string]> = [
  [/Escrit[?o]rios/gi, 'Escritórios'],
  [/Log[?i]stica/gi, 'Logística'],
  [/T[?i]tulos e Val\. Mob\./gi, 'Títulos e Val. Mob.'],
  [/Hoteis/gi, 'Hotéis'],
  [/H[?i]brido/gi, 'Híbrido'],
  [/Pap[?e]is/gi, 'Papéis'],
  [/Multicategoria/gi, 'Multicategoria'],
  [/Lajes Corporativas/gi, 'Lajes Corporativas'],
];

export function formatSegmentDisplay(segment: string | null): string {
  if (!segment || !segment.trim()) return '-';
  let trimmed = segment.trim();
  for (const [regex, replacement] of SEGMENT_FIX_QUESTION_MARK) {
    trimmed = trimmed.replace(regex, replacement);
  }
  return SEGMENT_ACCENT_MAP[trimmed] ?? trimmed;
}
