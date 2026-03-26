/**
 * Redireciona para checkout Cakto
 * Se a URL não estiver configurada, redireciona para página fake de simulação
 * @param email - Email do usuário (opcional, para pré-preencher)
 * @param source - Origem do checkout (para tracking)
 */
export function redirectToCheckout(email?: string, source?: string) {
  const checkoutUrl = process.env.NEXT_PUBLIC_CAKTO_PRODUCT_URL;
  
  if (!checkoutUrl) {
    const fakeUrl = new URL('/checkout/fake', window.location.origin);
    
    if (email) {
      fakeUrl.searchParams.set('email', email);
    }
    
    if (source) {
      fakeUrl.searchParams.set('source', source);
    }

    if (typeof window !== 'undefined') {
      window.location.href = fakeUrl.toString();
    }
    return;
  }

  const url = new URL(checkoutUrl);
  
  if (email) {
    url.searchParams.set('email', email);
  }
  
  if (source) {
    url.searchParams.set('source', source);
  }

  if (typeof window !== 'undefined') {
    window.location.href = url.toString();
  }
}

/** @deprecated Use redirectToCheckout instead */
export const redirectToKiwifyCheckout = redirectToCheckout;

