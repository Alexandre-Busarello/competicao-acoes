'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { addHours } from 'date-fns';

interface ProfitabilityUpdateIndicatorProps {
  lastUpdated: string;
}

export function ProfitabilityUpdateIndicator({ lastUpdated }: ProfitabilityUpdateIndicatorProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');
  const [timeToNextUpdate, setTimeToNextUpdate] = useState<string>('');

  useEffect(() => {
    const updateTimes = () => {
      const lastUpdateDate = new Date(lastUpdated);
      const now = new Date();
      
      // Tempo desde a última atualização
      const hoursSinceUpdate = Math.floor(
        (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60)
      );
      
      if (hoursSinceUpdate < 1) {
        setTimeSinceUpdate('menos de 1 hora');
      } else if (hoursSinceUpdate === 1) {
        setTimeSinceUpdate('1 hora');
      } else {
        setTimeSinceUpdate(`${hoursSinceUpdate} horas`);
      }

      // Próxima atualização (24 horas após a última)
      const nextUpdateDate = addHours(lastUpdateDate, 24);
      const timeUntilNext = nextUpdateDate.getTime() - now.getTime();

      if (timeUntilNext > 0) {
        const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
        const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hoursUntilNext > 0) {
          setTimeToNextUpdate(`${hoursUntilNext}h ${minutesUntilNext}m`);
        } else {
          setTimeToNextUpdate(`${minutesUntilNext}m`);
        }
      } else {
        setTimeToNextUpdate('em breve');
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
      <span className="leading-tight">
        Atualizado há {timeSinceUpdate}
        {timeToNextUpdate && (
          <span className="hidden sm:inline"> • Próximo em {timeToNextUpdate}</span>
        )}
      </span>
      <span className="hidden sm:inline text-[9px] opacity-75">
        (a cada 24h)
      </span>
    </div>
  );
}

