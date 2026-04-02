# Correção de Autenticação no Magic Link

## Data: 09/01/2026

## Problema Identificado

Ao clicar no magic link do Supabase, o usuário era redirecionado corretamente para a página de callback (`/auth/callback`), mas a autenticação não era persistida (tokens não eram salvos no storage/cookies).

### Sintomas:
- Link redirecionava para `/auth/callback`
- Página processava mas não autenticava o usuário
- Tokens não eram salvos no localStorage ou cookies
- Usuário não ficava logado após o callback

### Causa Raiz:
1. A página de callback não estava sincronizando a sessão com o servidor (cookies)
2. O código dependia apenas do `onAuthStateChange` do hook `useAuth`, que pode não disparar imediatamente
3. Não havia verificação se a sessão foi realmente persistida antes de redirecionar

## Solução Implementada

### 1. Sincronização Explícita com Servidor

A página de callback agora sincroniza explicitamente a sessão com o servidor através da API `/api/auth/sync-session`:

```typescript
// Sincronizar sessão com cookies do servidor
const syncResponse = await fetch('/api/auth/sync-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    expires_at: sessionData.session.expires_at,
  }),
});
```

### 2. Verificação de Sessão Antes de Redirecionar

Após setar a sessão e sincronizar, o código verifica se a sessão ainda está ativa:

```typescript
// Verificar se a sessão ainda está ativa antes de redirecionar
const { data: { session: verifySession } } = await supabase.auth.getSession();
if (!verifySession) {
  setError('Sessão não foi salva corretamente. Tente solicitar um novo link.');
  return;
}
```

### 3. Tratamento de Múltiplos Cenários

O código agora trata três cenários diferentes:

1. **Tokens no hash da URL** (comportamento padrão do Supabase)
   - Processa tokens do hash
   - Sincroniza com servidor
   - Verifica sessão antes de redirecionar

2. **Sessão já processada automaticamente**
   - Aguarda processamento automático do Supabase (`detectSessionInUrl: true`)
   - Verifica se sessão existe
   - Sincroniza com servidor se necessário

3. **Tokens na query string** (caso raro)
   - Processa tokens da query string
   - Sincroniza com servidor
   - Redireciona

### 4. Logs para Debug

Adicionados logs detalhados para facilitar debug:

```typescript
console.log('=== Auth Callback Processing ===');
console.log('Full URL:', window.location.href);
console.log('Hash:', window.location.hash);
console.log('Search:', window.location.search);
console.log('Tokens in hash:', { 
  hasAccessToken: !!accessToken, 
  hasRefreshToken: !!refreshToken 
});
```

### 5. Aguardar Processamento Automático

Quando não há tokens no hash, o código aguarda o Supabase processar automaticamente:

```typescript
// Aguardar um pouco para o Supabase processar automaticamente
await new Promise(resolve => setTimeout(resolve, 1500));
```

## Fluxo Completo

1. **Usuário clica no magic link**
   - Supabase redireciona para `/auth/callback` com tokens no hash ou query string

2. **Página de callback processa**
   - Detecta tokens no hash, query string ou sessão existente
   - Chama `supabase.auth.setSession()` se necessário

3. **Sincronização com servidor**
   - Chama `/api/auth/sync-session` para salvar tokens em cookies HTTP-only
   - Isso permite que o servidor leia a sessão

4. **Verificação**
   - Verifica se a sessão foi persistida corretamente
   - Se não, mostra erro

5. **Redirecionamento**
   - Redireciona para `/ranking` (ou URL especificada em `?next=`)

## Arquivos Modificados

1. **Modificado**: `src/app/auth/callback/page.tsx`
   - Adicionada sincronização explícita com servidor
   - Adicionada verificação de sessão antes de redirecionar
   - Adicionado tratamento para múltiplos cenários
   - Adicionados logs para debug
   - Adicionado delay para aguardar processamento automático do Supabase

## Como Testar

1. **Solicitar magic link**
   - Acesse `/auth/login`
   - Digite um email válido
   - Clique em "Enviar link"

2. **Clicar no link do email**
   - Abra o email recebido
   - Clique no link de acesso

3. **Verificar autenticação**
   - Deve redirecionar para `/ranking`
   - Usuário deve estar autenticado
   - Verifique no console do navegador os logs de processamento

4. **Verificar cookies**
   - Abra DevTools → Application → Cookies
   - Deve haver cookies `sb-{project-ref}-auth-token` e `sb-access-token`

## Troubleshooting

### Problema: Ainda não autentica após callback

**Soluções**:
1. Verifique os logs no console do navegador
2. Verifique se os cookies estão sendo criados (DevTools → Application → Cookies)
3. Verifique se a API `/api/auth/sync-session` está retornando sucesso
4. Verifique se o Supabase client está configurado corretamente (`detectSessionInUrl: true`)

### Problema: Erro "Sessão não foi salva corretamente"

**Soluções**:
1. Verifique se o Supabase está processando a sessão corretamente
2. Verifique se há erros no console
3. Tente solicitar um novo magic link
4. Verifique se as variáveis de ambiente do Supabase estão corretas

### Problema: Tokens não aparecem no hash

**Soluções**:
1. Verifique se a Site URL no Supabase Dashboard está configurada corretamente
2. Verifique se as Redirect URLs incluem a URL de callback
3. O código agora trata tokens na query string também

## Notas Técnicas

1. **Sincronização Dupla**: O código sincroniza explicitamente mesmo que o `useAuth` hook também sincronize. Isso garante que a sessão seja salva imediatamente.

2. **Delay para Processamento Automático**: O delay de 1.5s permite que o Supabase processe automaticamente a sessão se `detectSessionInUrl: true` estiver ativo.

3. **Verificação de Sessão**: A verificação antes de redirecionar garante que não redirecionamos sem uma sessão válida.

4. **Múltiplos Cenários**: O código trata diferentes formas que o Supabase pode enviar os tokens (hash, query string, processamento automático).

## Próximos Passos

1. ✅ Sincronização explícita implementada
2. ✅ Verificação de sessão implementada
3. ✅ Logs de debug adicionados
4. ✅ Tratamento de múltiplos cenários implementado
5. ⏳ Testar em produção
6. ⏳ Monitorar logs para identificar problemas

