/**
 * Gera um nome criativo relacionado a investimentos quando o usuário não fornece um nome
 * Nota: O ID único será adicionado nas exibições usando formatUserNameWithId()
 */

const INVESTOR_ADJECTIVES = [
  'Ágil',
  'Astuto',
  'Audaz',
  'Brilhante',
  'Estratégico',
  'Focado',
  'Inteligente',
  'Perspicaz',
  'Preciso',
  'Sábio',
  'Visionário',
  'Vencedor',
  'Determinado',
  'Calculista',
  'Persistente',
  'Inovador',
  'Analítico',
  'Disciplinado',
  'Arrojado',
  'Prudente',
  'Experiente',
  'Hábil',
  'Sagaz',
  'Competente',
  'Destemido',
];

const INVESTOR_NOUNS = [
  'Investidor',
  'Trader',
  'Analista',
  'Estrategista',
  'Especialista',
  'Mestre',
  'Profissional',
  'Guru',
  'Expert',
  'Consultor',
  'Gestor',
  'Operador',
  'Mercadista',
  'Especialista',
  'Investidor',
  'Especialista',
];

const MARKET_TERMS = [
  'Bull',
  'Bear',
  'Touro',
  'Urso',
  'Crypto',
  'Stock',
  'Ação',
  'FII',
  'ETF',
  'Dividend',
  'Dividendo',
  'Growth',
  'Value',
  'Momentum',
  'Blue Chip',
  'Small Cap',
  'Large Cap',
  'Tech',
  'Finance',
  'Energy',
  'Commodity',
  'Forex',
  'Bond',
  'Título',
];

const INVESTOR_TITLES = [
  'O Investidor',
  'O Trader',
  'O Analista',
  'O Estrategista',
  'O Especialista',
  'O Mestre',
  'O Profissional',
  'O Guru',
  'O Expert',
  'O Consultor',
  'O Gestor',
  'O Operador',
];

/**
 * Gera um nome criativo relacionado a investimentos
 * @param seed - Valor opcional para gerar nomes consistentes (ex: email)
 * @returns Nome criativo relacionado a investimentos (sem ID - o ID será adicionado nas exibições)
 */
export function generateInvestorName(seed?: string): string {
  // Se tiver seed, usar para gerar índice pseudo-aleatório consistente
  let index1 = 0;
  let index2 = 0;
  let index3 = 0;

  if (seed) {
    // Gerar índices baseados no seed para consistência
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    index1 = hash % INVESTOR_ADJECTIVES.length;
    index2 = (hash * 2) % INVESTOR_NOUNS.length;
    index3 = (hash * 3) % MARKET_TERMS.length;
  } else {
    // Sem seed, usar valores aleatórios
    index1 = Math.floor(Math.random() * INVESTOR_ADJECTIVES.length);
    index2 = Math.floor(Math.random() * INVESTOR_NOUNS.length);
    index3 = Math.floor(Math.random() * MARKET_TERMS.length);
  }

  // Escolher um padrão baseado no seed para consistência
  const pattern = seed 
    ? (seed.charCodeAt(0) % 4) 
    : Math.floor(Math.random() * 4);

  let baseName: string;

  switch (pattern) {
    case 0:
      // Padrão: "Adjetivo + Substantivo"
      baseName = `${INVESTOR_ADJECTIVES[index1]} ${INVESTOR_NOUNS[index2]}`;
      break;
    
    case 1:
      // Padrão: "Termo de Mercado + Substantivo"
      baseName = `${MARKET_TERMS[index3]} ${INVESTOR_NOUNS[index2]}`;
      break;
    
    case 2:
      // Padrão: "O + Título"
      const titleIndex = seed 
        ? (seed.charCodeAt(0) % INVESTOR_TITLES.length)
        : Math.floor(Math.random() * INVESTOR_TITLES.length);
      baseName = INVESTOR_TITLES[titleIndex];
      break;
    
    case 3:
      // Padrão: "Adjetivo + Termo de Mercado"
      baseName = `${INVESTOR_ADJECTIVES[index1]} ${MARKET_TERMS[index3]}`;
      break;
    
    default:
      baseName = `${INVESTOR_ADJECTIVES[index1]} ${INVESTOR_NOUNS[index2]}`;
  }

  return baseName;
}

