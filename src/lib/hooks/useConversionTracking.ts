import { useAuth } from '@/lib/auth/client';

/**
 * Hook para tracking de eventos de conversão
 */
export function useConversionTracking() {
  const { user } = useAuth();

  const trackView = async (type: 'blur_overlay' | 'profile_checkout' | 'signup_banner' | 'ggb_ranking') => {
    try {
      await fetch('/api/conversion-events/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          event: 'view',
          userId: user?.id || null,
        }),
      });
    } catch (error) {
      console.error(`Error tracking ${type} view:`, error);
    }
  };

  const trackClick = async (
    type: 'blur_overlay' | 'profile_checkout' | 'signup_banner' | 'ggb_ranking',
    leadId?: string
  ) => {
    try {
      const response = await fetch('/api/conversion-events/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          event: 'click',
          userId: user?.id || null,
          leadId: leadId || null,
        }),
      });

      const data = await response.json();
      return data.eventId;
    } catch (error) {
      console.error(`Error tracking ${type} click:`, error);
      return null;
    }
  };

  return { trackView, trackClick };
}

