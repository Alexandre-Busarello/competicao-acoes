/**
 * Funções utilitárias para trabalhar com UTC
 * Garante que todos os cálculos de data sejam feitos em UTC para evitar problemas de fuso horário
 */

/**
 * Obtém o período anterior (mês/ano) em UTC
 * Retorna mês/ano anterior ao atual em UTC
 */
export function getUTCPreviousPeriod(): { year: number; month: number } {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth() + 1; // getUTCMonth() retorna 0-11
  
  if (utcMonth === 1) {
    return { year: utcYear - 1, month: 12 };
  }
  return { year: utcYear, month: utcMonth - 1 };
}

/**
 * Verifica se estamos em Janeiro em UTC
 */
export function isUTCJanuary(): boolean {
  return new Date().getUTCMonth() === 0; // Janeiro = 0
}

/**
 * Obtém ano anterior em UTC
 */
export function getUTCPreviousYear(): number {
  return new Date().getUTCFullYear() - 1;
}




