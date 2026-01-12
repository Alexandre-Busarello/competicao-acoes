'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Code, Link, List, ListOrdered, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showPreview?: boolean;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Escreva seu post...',
  minHeight = '200px',
  showPreview: initialShowPreview = false,
  className,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(initialShowPreview);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  // Focar textarea ao montar
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Atualizar seleção quando textarea muda (sem interferir no comportamento nativo)
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
    }
  };

  // Prevenir interferência com comportamento nativo do textarea (seleção, undo/redo)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Permitir comportamento nativo para Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+A (select all)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y' || e.key === 'a')) {
      // Deixar o navegador lidar com isso nativamente - não fazer nada
      return;
    }
    // Atualizar seleção após outras teclas (de forma assíncrona para não interferir)
    setTimeout(handleSelectionChange, 0);
  };

  // Inserir texto na posição do cursor usando API nativa para preservar undo/redo
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    const textToInsertFull = before + textToInsert + after;

    // Focar o textarea primeiro
    textarea.focus();
    
    // Selecionar o texto atual (se houver) para substituir
    textarea.setSelectionRange(start, end);
    
    // Usar execCommand para inserir texto nativamente (preserva undo/redo)
    // execCommand está deprecated mas ainda funciona e preserva histórico
    try {
      const success = document.execCommand('insertText', false, textToInsertFull);
      
      if (success) {
        // Se execCommand funcionou, sincronizar estado React com o valor atualizado
        // Usar requestAnimationFrame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            const newValue = textareaRef.current.value;
            onChange(newValue);
            
            // Atualizar seleção após inserção
            const newCursorPos = start + textToInsertFull.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        });
        return;
      }
    } catch (e) {
      // Se execCommand falhar ou não for suportado, usar método manual
      console.debug('execCommand not supported, using manual insertion');
    }

    // Fallback: método manual (não preserva undo/redo, mas funciona)
    // Este método quebra o histórico porque substitui o valor diretamente
    const newValue =
      value.substring(0, start) +
      before +
      textToInsert +
      after +
      value.substring(end);

    onChange(newValue);

    // Restaurar foco e posição do cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + before.length + textToInsert.length + after.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleBold = () => {
    insertText('**', '**', 'texto em negrito');
  };

  const handleItalic = () => {
    insertText('*', '*', 'texto em itálico');
  };

  const handleCode = () => {
    insertText('`', '`', 'código');
  };

  const handleLink = () => {
    insertText('[', '](url)', 'texto do link');
  };

  const handleUnorderedList = () => {
    const lines = value.split('\n');
    const startLine = value.substring(0, selectionStart).split('\n').length - 1;
    const endLine = value.substring(0, selectionEnd).split('\n').length - 1;

    const newLines = lines.map((line, index) => {
      if (index >= startLine && index <= endLine) {
        return line.trim() ? `- ${line.trim()}` : line;
      }
      return line;
    });

    onChange(newLines.join('\n'));
  };

  const handleOrderedList = () => {
    const lines = value.split('\n');
    const startLine = value.substring(0, selectionStart).split('\n').length - 1;
    const endLine = value.substring(0, selectionEnd).split('\n').length - 1;

    let counter = 1;
    const newLines = lines.map((line, index) => {
      if (index >= startLine && index <= endLine) {
        if (line.trim()) {
          return `${counter++}. ${line.trim()}`;
        }
      }
      return line;
    });

    onChange(newLines.join('\n'));
  };

  const toolbarButtons = [
    { icon: Bold, label: 'Negrito', onClick: handleBold },
    { icon: Italic, label: 'Itálico', onClick: handleItalic },
    { icon: Code, label: 'Código', onClick: handleCode },
    { icon: Link, label: 'Link', onClick: handleLink },
    { icon: List, label: 'Lista', onClick: handleUnorderedList },
    { icon: ListOrdered, label: 'Lista numerada', onClick: handleOrderedList },
  ];

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto flex-shrink-0">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {toolbarButtons.map(({ icon: Icon, label, onClick }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClick}
              className="h-9 w-9 min-w-[44px] p-0 flex-shrink-0"
              aria-label={label}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="h-9 px-3 flex-shrink-0"
          aria-label={showPreview ? 'Mostrar editor' : 'Mostrar preview'}
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              <span className="text-xs hidden sm:inline">Editor</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              <span className="text-xs hidden sm:inline">Preview</span>
            </>
          )}
        </Button>
      </div>

      {/* Editor e Preview - altura calculada descontando toolbar (~49px) */}
      <div className="flex overflow-hidden flex-shrink-0" style={{ height: 'calc(100% - 49px)', maxHeight: 'calc(100% - 49px)' }}>
        {/* Editor - No mobile: esconde quando preview está ativo, no desktop: mostra lado a lado */}
        <div className={cn(
          'overflow-hidden',
          showPreview && 'hidden md:flex md:w-1/2 md:border-r'
        )} style={{ 
          width: showPreview ? '50%' : '100%', 
          height: '100%',
          maxHeight: '100%'
        }}>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              // Atualizar seleção de forma assíncrona para não interferir com comportamento nativo
              requestAnimationFrame(() => {
                handleSelectionChange();
              });
            }}
            onSelect={(e) => {
              // Permitir seleção nativa, apenas atualizar estado
              handleSelectionChange();
            }}
            onKeyDown={handleKeyDown}
            onMouseUp={(e) => {
              // Permitir comportamento nativo de mouse
              handleSelectionChange();
            }}
            onTouchEnd={(e) => {
              // Permitir comportamento nativo de touch (incluindo duplo toque para seleção)
              handleSelectionChange();
            }}
            placeholder={placeholder}
            className="resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full h-full"
            style={{ 
              height: '100%',
              minHeight: '100%',
              maxHeight: '100%'
            }}
            autoComplete="off"
            spellCheck="true"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
          />
        </div>

        {/* Preview - No mobile: tela cheia quando ativo, no desktop: lado a lado */}
        {showPreview && (
          <div className="p-4 overflow-y-auto bg-muted/10 flex-shrink-0" style={{ width: '50%', height: '100%', maxHeight: '100%' }}>
            {value.trim() ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
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
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <Eye className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm italic">
                  Preview aparecerá aqui quando você começar a escrever...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

