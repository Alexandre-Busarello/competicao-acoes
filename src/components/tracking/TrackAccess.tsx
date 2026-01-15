'use client';

import { useTrackAccess } from '@/lib/hooks/useTrackAccess';

/**
 * Componente que rastreia acesso do usuário
 * Atualiza lastAccessAt no servidor periodicamente
 */
export function TrackAccess() {
  useTrackAccess();
  return null;
}

