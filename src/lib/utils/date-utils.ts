import { format } from 'date-fns';
import type { Locale } from 'date-fns/locale';

/**
 * Extrai ano, mês e dia em UTC e retorna string no formato 'yyyy-MM-dd'
 * Evita problemas de timezone ao trabalhar apenas com componentes de data
 */
export function getUTCDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata data usando componentes UTC para evitar problemas de timezone
 * 
 * Esta função cria uma nova data usando apenas os componentes de data (ano, mês, dia)
 * em UTC, ignorando a hora e o timezone. Isso garante que uma data como "2026-02-02"
 * seja sempre exibida como "02 de fevereiro" independente do timezone do usuário.
 * 
 * @param date - Data a ser formatada
 * @param formatStr - String de formato do date-fns (ex: "dd 'de' MMMM 'de' yyyy")
 * @param locale - Locale opcional para formatação
 * @returns String formatada usando componentes UTC
 */
export function formatTransactionDate(
  date: Date,
  formatStr: string,
  locale?: Locale
): string {
  // Extrair componentes de data em UTC
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  // Criar nova data usando UTC (meio-dia UTC para evitar problemas de timezone)
  const utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  
  // Formatar usando date-fns
  return format(utcDate, formatStr, { locale });
}

