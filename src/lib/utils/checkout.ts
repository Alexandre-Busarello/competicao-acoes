/**
 * Redireciona para checkout Kiwify
 * Se a URL não estiver configurada, redireciona para página fake de simulação
 * @param email - Email do usuário (opcional, para pré-preencher)
 * @param source - Origem do checkout (para tracking)
 */
export function redirectToKiwifyCheckout(email?: string, source?: string) {
  const kiwifyProductUrl = process.env.NEXT_PUBLIC_KIWIFY_PRODUCT_URL;
  
  if (!kiwifyProductUrl) {
    // Se não houver URL configurada, redirecionar para página fake
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

  // Adicionar parâmetros de query se necessário
  const url = new URL(kiwifyProductUrl);
  
  if (email) {
    url.searchParams.set('email', email);
  }
  
  if (source) {
    url.searchParams.set('source', source);
  }

  // Redirecionar para checkout
  if (typeof window !== 'undefined') {
    window.location.href = url.toString();
  }
}

