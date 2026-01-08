/**
 * Redireciona para checkout Kiwify
 * @param email - Email do usuário (opcional, para pré-preencher)
 * @param source - Origem do checkout (para tracking)
 */
export function redirectToKiwifyCheckout(email?: string, source?: string) {
  const kiwifyProductUrl = process.env.NEXT_PUBLIC_KIWIFY_PRODUCT_URL;
  
  if (!kiwifyProductUrl) {
    console.error('KIWIFY_PRODUCT_URL not configured');
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

