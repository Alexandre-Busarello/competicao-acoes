import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function GGBDisclaimer() {
  return (
    <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Aviso Importante
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Este ranking é uma <strong>análise quantitativa</strong> baseada em indicadores financeiros. 
              <strong> Não é uma recomendação de compra ou venda</strong>. Sempre faça sua própria análise 
              e consulte um profissional qualificado antes de tomar decisões de investimento.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

