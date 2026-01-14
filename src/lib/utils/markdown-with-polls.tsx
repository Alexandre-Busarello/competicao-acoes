import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { findAllPollComments } from './poll-parser';
import { PollDisplay } from '@/components/feed/PollDisplay';

/**
 * Processa conteúdo markdown e renderiza enquetes quando encontradas
 */
export function renderMarkdownWithPolls(
  content: string,
  postId: string,
  pollId?: string | null,
  shouldBlurObfuscated?: boolean
) {
  // Função helper para criar strong com blur se contém XXXX ou valores monetários ofuscados
  const createStrong = (children: React.ReactNode) => {
    if (!shouldBlurObfuscated) {
      return <strong className="font-semibold">{children}</strong>;
    }
    
    const text = typeof children === 'string' ? children : 
                 Array.isArray(children) ? children.join('') : 
                 String(children);
    
    // Aplicar blur se contém XXXX ou R$ XXXX
    if (text.includes('XXXX') || text.includes('R$ XXXX')) {
      return (
        <strong 
          className="font-semibold blur-sm select-none"
          style={{ filter: 'blur(4px)' }}
        >
          {children}
        </strong>
      );
    }
    return <strong className="font-semibold">{children}</strong>;
  };
  const pollComments = findAllPollComments(content);

  if (pollComments.length === 0 || !pollId) {
    // Sem enquetes, renderizar markdown normalmente
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => createStrong(children),
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  // Encontrou enquete, renderizar com componente
  const parts: Array<React.ReactNode> = [];
  let lastIndex = 0;

  pollComments.forEach((pollComment, index) => {
    // Adicionar texto antes do comentário poll
    if (pollComment.startIndex > lastIndex) {
      const textBefore = content.substring(lastIndex, pollComment.startIndex);
      if (textBefore.trim()) {
        parts.push(
          <ReactMarkdown
            key={`text-before-${index}`}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
                  {children}
                </code>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
              h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
                  {children}
                </blockquote>
              ),
            }}
          >
            {textBefore}
          </ReactMarkdown>
        );
      }
    }

    // Adicionar componente PollDisplay
    parts.push(
      <PollDisplay
        key={`poll-${index}`}
        pollId={pollId}
        postId={postId}
      />
    );

    lastIndex = pollComment.endIndex;
  });

  // Adicionar texto restante após o último comentário
  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    if (textAfter.trim()) {
      parts.push(
        <ReactMarkdown
          key="text-after"
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => (
              <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
                {children}
              </code>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            ),
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="ml-2">{children}</li>,
            h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
                {children}
              </blockquote>
            ),
          }}
        >
          {textAfter}
        </ReactMarkdown>
      );
    }
  }

  return <>{parts}</>;
}

