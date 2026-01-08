import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Obtém o período atual (ano e mês vigente)
 */
export function getCurrentPeriod(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // getMonth() retorna 0-11, então adicionamos 1
  };
}

/**
 * Valida se um período é válido
 */
export function isValidPeriod(year: number, month?: number): boolean {
  const currentYear = new Date().getFullYear();
  const minYear = 2026; // Ano mínimo permitido (ano de lançamento)
  
  if (year < minYear || year > currentYear + 1) {
    return false;
  }
  
  if (month !== undefined) {
    if (month < 1 || month > 12) {
      return false;
    }
    
    // Se o ano é o atual e o mês é futuro, não é válido
    if (year === currentYear) {
      const currentMonth = new Date().getMonth() + 1;
      if (month > currentMonth) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Formata um período para exibição
 */
export function formatPeriod(
  period: 'mensal' | 'anual',
  year: number,
  month?: number
): string {
  if (period === 'mensal' && month) {
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMMM yyyy', { locale: ptBR });
  }
  
  return year.toString();
}

/**
 * Obtém o intervalo de datas para um período específico
 */
export function getPeriodRange(
  period: 'mensal' | 'anual',
  year: number,
  month?: number
): { start: Date; end: Date } {
  if (period === 'mensal' && month) {
    const date = new Date(year, month - 1, 1);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  }
  
  // Anual: do início do ano até o fim do ano (ou data de corte se definida)
  const date = new Date(year, 0, 1);
  return {
    start: startOfYear(date),
    end: endOfYear(date),
  };
}

/**
 * Verifica se um período é o período vigente (atual)
 */
export function isCurrentPeriod(
  period: 'mensal' | 'anual',
  year: number,
  month?: number
): boolean {
  const current = getCurrentPeriod();
  
  if (period === 'mensal') {
    return year === current.year && month === current.month;
  }
  
  return year === current.year;
}

/**
 * Obtém o nome do mês em português
 */
export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1, 1);
  return format(date, 'MMMM', { locale: ptBR });
}

/**
 * Gera lista de anos disponíveis (desde o lançamento em 2026 até o ano atual)
 */
export function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = 2026; // Ano de lançamento do sistema
  const years: number[] = [];
  
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year);
  }
  
  return years.reverse(); // Mais recente primeiro
}

/**
 * Gera lista de meses disponíveis para um ano específico
 */
export function getAvailableMonths(year: number): number[] {
  const current = getCurrentPeriod();
  const maxMonth = year === current.year ? current.month : 12;
  
  const months: number[] = [];
  for (let month = 1; month <= maxMonth; month++) {
    months.push(month);
  }
  
  return months.reverse(); // Mais recente primeiro
}

