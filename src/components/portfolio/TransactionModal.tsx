'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { useTransactionStore } from '@/lib/store/transactionStore';
import { useUserStore } from '@/lib/store/userStore';
import { CheckoutCTA } from '@/components/checkout/CheckoutCTA';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getCurrencySymbol, isUSDCurrency } from '@/lib/utils/currency';
import { allowsFractionalQuantity } from '@/lib/utils/asset-type';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TickerValidation {
  valid: boolean;
  ticker: string;
  name?: string;
  price?: number;
  error?: string;
  loading: boolean;
}

export function TransactionModal({ open, onOpenChange }: TransactionModalProps) {
  const { user } = useUserStore();
  const { addTransaction } = useTransactionStore();
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'compra' | 'venda'>('compra');
  const [quantity, setQuantity] = useState('');
  const [currentMarketPrice, setCurrentMarketPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validation, setValidation] = useState<TickerValidation>({
    valid: false,
    ticker: '',
    loading: false,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Validação de ticker apenas no blur (quando sair do campo)
  const validateTicker = useCallback(async (tickerValue: string) => {
    if (!tickerValue || tickerValue.trim().length < 2) {
      setValidation({ valid: false, ticker: '', loading: false });
      return;
    }

    const trimmedTicker = tickerValue.trim();
    setValidation(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const response = await fetch('/api/ticker/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: trimmedTicker }),
      });

      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Resposta inválida do servidor');
      }

      const data = await response.json();

      if (data.valid) {
        setValidation({
          valid: true,
          ticker: data.ticker,
          name: data.name,
          price: data.price,
          loading: false,
        });
        // Atualizar preço atual do mercado (apenas para exibição)
        if (data.price) {
          setCurrentMarketPrice(data.price);
        }
      } else {
        setValidation({
          valid: false,
          ticker: data.ticker || trimmedTicker,
          error: data.error || 'Ticker inválido',
          loading: false,
        });
      }
    } catch (error) {
      let errorMessage = 'Erro ao validar ticker. Tente novamente.';
      
      if (error instanceof Error) {
        // Tratar erros específicos
        if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
          errorMessage = 'Muitas requisições. Aguarde alguns instantes e tente novamente.';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          errorMessage = error.message;
        }
      }

      setValidation({
        valid: false,
        ticker: trimmedTicker,
        error: errorMessage,
        loading: false,
      });
    }
  }, []); // Removido price da dependência para sempre atualizar quando validar

  // Handler para quando o usuário sair do campo (onBlur)
  const handleTickerBlur = () => {
    if (ticker.trim().length >= 2) {
      validateTicker(ticker.trim());
    } else {
      setValidation({ valid: false, ticker: '', loading: false });
    }
  };

  // Função para atualizar preço manualmente (apenas para visualização)
  const handleRefreshPrice = async () => {
    if (!validation.ticker || !validation.valid) return;

    try {
      const response = await fetch('/api/ticker/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: validation.ticker }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor');
      }

      const data = await response.json();

      if (data.valid && data.price) {
        setCurrentMarketPrice(data.price);
      }
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
    }
  };

  // Reset validation when modal closes
  useEffect(() => {
    if (!open) {
      setTicker('');
      setQuantity('');
      setCurrentMarketPrice(null);
      setSubmitError(null);
      setType('compra');
      setValidation({ valid: false, ticker: '', loading: false });
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticker || !quantity) return;
    
    // Verificar se tem assinatura premium
    if (!user.isPremium) {
      setSubmitError('Assinatura premium necessária para cadastrar transações');
      return;
    }
    
    // Bloquear submit se ticker não for válido
    if (!validation.valid) {
      setSubmitError('Valide o ticker antes de continuar');
      return;
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setSubmitError('Quantidade inválida');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Usar mutation do store que já faz a chamada à API
      // O preço será obtido no backend via Yahoo Finance
      await addTransaction({
          ticker: validation.ticker || ticker.toUpperCase(),
          type,
          quantity: numQuantity,
        price: currentMarketPrice || 0, // Preço atual do mercado ou 0 (será obtido no backend)
        date: today,
      });

      // Reset form
      setTicker('');
      setQuantity('');
      setCurrentMarketPrice(null);
      setSubmitError(null);
      setType('compra');
      setValidation({ valid: false, ticker: '', loading: false });
      onOpenChange(false);
    } catch (error) {
      // Tratar erro de quantidade insuficiente com mensagem detalhada
      if (error instanceof Error && 'availableQuantity' in error) {
        const customError = error as Error & {
          availableQuantity?: number;
          requestedQuantity?: number;
          ticker?: string;
        };
        const availableQty = customError.availableQuantity ?? 0;
        const requestedQty = customError.requestedQuantity ?? numQuantity;
        const tickerName = customError.ticker || validation.ticker || ticker;
        
        setSubmitError(
          `Quantidade insuficiente para venda. Você possui ${availableQty.toLocaleString('pt-BR')} unidades de ${tickerName}, mas está tentando vender ${requestedQty.toLocaleString('pt-BR')} unidades.`
        );
      } else {
        setSubmitError(error instanceof Error ? error.message : 'Erro ao criar transação');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = validation.valid && ticker && quantity && user && user.isPremium && !isSubmitting;

  // Detectar moeda baseada no ticker validado
  const detectedTicker = validation.ticker || ticker.toUpperCase();
  const isUSD = isUSDCurrency(detectedTicker);
  const currencySymbol = getCurrencySymbol(detectedTicker);
  const allowsFractions = allowsFractionalQuantity(detectedTicker);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 sm:p-6">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0">
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Registre uma nova transação para atualizar sua carteira.
          </DialogDescription>
        </DialogHeader>
        {user && !user.isPremium && (
          <div className="px-4 sm:px-6 pb-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                Você precisa de uma assinatura premium para cadastrar transações.
              </p>
              <CheckoutCTA
                source="transaction_modal"
                buttonText="Fazer Checkout"
                size="sm"
                className="w-full"
              />
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-4 px-4 sm:px-6 pb-4 overflow-y-auto flex-1">
            <div className="grid gap-2">
              <Label htmlFor="ticker">Ticker</Label>
              <div className="relative">
                <div className="relative">
                  <Input
                    id="ticker"
                    placeholder="Ex: PETR4"
                    value={ticker}
                    onChange={(e) => {
                      setTicker(e.target.value.toUpperCase());
                      // Limpar validação ao digitar novamente
                      if (validation.valid || validation.error) {
                        setValidation({ valid: false, ticker: '', loading: false });
                        setCurrentMarketPrice(null);
                        setSubmitError(null);
                      }
                    }}
                    onBlur={handleTickerBlur}
                    required
                    autoComplete="off"
                    className={validation.error ? 'border-red-500' : validation.valid ? 'border-green-500' : ''}
                  />
                  {validation.loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!validation.loading && validation.valid && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {!validation.loading && validation.error && ticker.length >= 2 && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                {validation.valid && validation.name && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {validation.name} {validation.price && (
                      <span>
                        - {currencySymbol} {validation.price.toLocaleString(
                          isUSD ? 'en-US' : 'pt-BR',
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </span>
                    )}
                  </p>
                )}
                {validation.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validation.error}
                  </p>
                )}
                {ticker.length > 0 && ticker.length < 2 && !validation.error && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite pelo menos 2 caracteres
                  </p>
                )}
                {ticker.length >= 2 && !validation.valid && !validation.error && !validation.loading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Saia do campo para validar o ticker
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === 'compra' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setType('compra')}
                >
                  Compra
                </Button>
                <Button
                  type="button"
                  variant={type === 'venda' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setType('venda')}
                >
                  Venda
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min={allowsFractions ? "0.00000001" : "1"}
                step={allowsFractions ? "0.00000001" : "1"}
                placeholder={allowsFractions ? "0.5" : "100"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              {allowsFractions && (
                <p className="text-xs text-muted-foreground">
                  Este ativo permite quantidades fracionadas (ex: 0.5, 0.001)
                </p>
              )}
            </div>

            {validation.valid && currentMarketPrice && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Preço de Mercado ({currencySymbol})</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshPrice}
                    disabled={isSubmitting}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Atualizar
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-lg font-semibold">
                    {currencySymbol} {currentMarketPrice.toLocaleString(
                      isUSD ? 'en-US' : 'pt-BR',
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Preço será obtido do Yahoo Finance no momento da execução da ordem
                  </p>
                </div>
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                    <strong>Importante:</strong> Utilizamos dados da nossa API que podem não ser exatamente o valor executado na sua carteira. Esta medida é necessária para garantir a integridade e evitar manipulação de rentabilidade no ranking.
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {submitError}
                </p>
              </div>
            )}

            {validation.valid && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
                <p className="text-xs text-orange-800 dark:text-orange-200 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Atenção:</strong> Uma vez executada, a transação não pode ser desfeita ou cancelada. 
                    Para sair de uma posição, é necessário registrar uma ordem de venda a mercado.
                  </span>
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="text"
                value={format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Para garantir a integridade do ranking, só são permitidas
                transações no dia corrente.
              </p>
            </div>
          </div>
          <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 border-t flex-shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Executar Ordem'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

