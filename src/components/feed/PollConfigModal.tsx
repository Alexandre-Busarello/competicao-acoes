'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { PollConfig } from '@/types';

interface PollConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (config: PollConfig) => void;
}

export function PollConfigModal({
  open,
  onOpenChange,
  onInsert,
}: PollConfigModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleInsert = () => {
    const filledOptions = options.filter((opt) => opt.trim().length > 0);
    if (question.trim().length === 0 || filledOptions.length < 2) {
      return;
    }

    onInsert({
      question: question.trim(),
      options: filledOptions.map((opt) => opt.trim()),
    });

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    onOpenChange(false);
  };

  const filledOptions = options.filter((opt) => opt.trim().length > 0);
  const isValid = question.trim().length > 0 && filledOptions.length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Enquete</DialogTitle>
          <DialogDescription>
            Adicione uma pergunta e até 6 opções para sua enquete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo de pergunta */}
          <div className="space-y-2">
            <label htmlFor="poll-question" className="text-sm font-medium">
              Pergunta
            </label>
            <Input
              id="poll-question"
              placeholder="Ex: Qual ação você prefere comprar hoje?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Campos de opções */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Opções</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Opção ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    maxLength={100}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="flex-shrink-0"
                      aria-label="Remover opção"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Botão adicionar opção */}
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Opção
              </Button>
            )}

            {options.length >= 6 && (
              <p className="text-xs text-muted-foreground">
                Máximo de 6 opções atingido
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleInsert} disabled={!isValid}>
            Inserir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

