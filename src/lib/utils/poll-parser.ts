import { PollConfig } from '@/types';

/**
 * Regex para detectar comentários HTML de enquete no formato:
 * <!-- poll:question|option1|option2|... -->
 */
const POLL_COMMENT_REGEX = /<!--\s*poll:([^|]+(?:\|[^|]+)*)\s*-->/g;

/**
 * Extrai dados de enquete de um comentário HTML poll
 */
function parsePollComment(comment: string): PollConfig | null {
  const match = comment.match(/<!--\s*poll:(.+?)\s*-->/);
  if (!match) return null;

  const parts = match[1].split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null; // Precisa ter pelo menos pergunta + 1 opção

  const question = parts[0];
  const options = parts.slice(1);

  // Validar: máximo 6 opções
  if (options.length > 6) {
    return null;
  }

  return {
    question,
    options,
  };
}

/**
 * Detecta e extrai enquete do conteúdo markdown
 * Retorna null se não encontrar enquete
 */
export function parsePollFromMarkdown(content: string): PollConfig | null {
  const matches = Array.from(content.matchAll(POLL_COMMENT_REGEX));
  if (matches.length === 0) return null;

  // Retorna a primeira enquete encontrada
  const firstMatch = matches[0][0];
  return parsePollComment(firstMatch);
}

/**
 * Remove comentário poll do markdown
 * Útil para salvar o conteúdo sem o comentário no banco
 */
export function removePollFromMarkdown(content: string): string {
  return content.replace(POLL_COMMENT_REGEX, '').trim();
}

/**
 * Gera comentário HTML poll a partir de configuração
 */
export function generatePollComment(config: PollConfig): string {
  const { question, options } = config;
  const parts = [question, ...options].join('|');
  return `<!-- poll:${parts} -->`;
}

/**
 * Encontra todas as posições de comentários poll no markdown
 * Retorna array de objetos com match e posição
 */
export function findAllPollComments(content: string): Array<{
  match: string;
  startIndex: number;
  endIndex: number;
  config: PollConfig;
}> {
  const results: Array<{
    match: string;
    startIndex: number;
    endIndex: number;
    config: PollConfig;
  }> = [];

  let match;
  while ((match = POLL_COMMENT_REGEX.exec(content)) !== null) {
    const config = parsePollComment(match[0]);
    if (config) {
      results.push({
        match: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        config,
      });
    }
  }

  return results;
}

