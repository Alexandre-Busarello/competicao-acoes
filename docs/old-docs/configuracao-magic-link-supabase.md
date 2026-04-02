# Configuração de Magic Link do Supabase

## Data: 09/01/2026

## Problema Identificado

O magic link do Supabase estava sendo enviado com URL `localhost` mesmo com `NEXT_PUBLIC_APP_URL` configurado corretamente. Isso acontece porque:

1. **`{{ .ConfirmationURL }}` no template do email**: O Supabase usa a **Site URL** configurada no dashboard para gerar o link inicial no email. O `emailRedirectTo` no código só afeta o redirecionamento APÓS a confirmação, não o link inicial.

2. **Variáveis `NEXT_PUBLIC_*`**: São expostas ao client-side, mas em rotas de API (server-side) podem não estar disponíveis da mesma forma

3. **Configuração do Supabase Dashboard**: O Supabase usa as URLs configuradas no dashboard para validar redirecionamentos. Mesmo passando `emailRedirectTo` no código, o Supabase só aceita URLs que estão na lista de "Redirect URLs" permitidas

**IMPORTANTE**: O template do email usa `{{ .ConfirmationURL }}` que é gerado baseado na **Site URL** do dashboard, não no `emailRedirectTo`!

## Solução Implementada

### 1. Variável de Ambiente para Server-Side

Adicionada variável `APP_URL` para uso em rotas de API (server-side):

```env
# URL pública (client-side)
NEXT_PUBLIC_APP_URL=https://competicao-acoes.vercel.app

# URL para server-side (rotas de API)
APP_URL=https://competicao-acoes.vercel.app
```

**Prioridade de uso**:
1. `APP_URL` (se definido) - preferencial para server-side
2. `NEXT_PUBLIC_APP_URL` (fallback) - usado se `APP_URL` não estiver definido
3. `http://localhost:3000` (fallback final) - apenas para desenvolvimento local

### 2. Atualização dos Endpoints

Todos os endpoints que enviam magic links foram atualizados:

- `src/app/api/auth/magic-link/route.ts`
- `src/app/api/webhooks/kiwify/route.ts`
- `src/app/api/webhooks/kiwify/test/route.ts`

**Código implementado**:
```typescript
// Obter URL de redirecionamento
// Prioridade: APP_URL (server-side) > NEXT_PUBLIC_APP_URL (client-side) > localhost
const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const redirectUrl = `${appUrl}/auth/callback`;

console.log('Magic link redirect URL:', redirectUrl);
console.log('APP_URL:', process.env.APP_URL);
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

const { error: linkError } = await supabase.auth.signInWithOtp({
  email: emailLower,
  options: {
    emailRedirectTo: redirectUrl,
  },
});
```

### 3. Logs para Debug

Adicionados logs para facilitar debug:
- URL de redirecionamento sendo usada
- Valores das variáveis de ambiente

## Configuração Necessária no Supabase Dashboard

**IMPORTANTE**: Você DEVE configurar as URLs no Supabase Dashboard, caso contrário o magic link não funcionará corretamente.

### Passos para Configurar:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Navegue até Authentication → URL Configuration**
   - Menu lateral: Authentication
   - Submenu: URL Configuration

3. **Configure Site URL** ⚠️ **CRÍTICO**
   - **Site URL**: `https://competicao-acoes.vercel.app`
   - **Esta é a URL usada para gerar o `{{ .ConfirmationURL }}` no template do email!**
   - Se estiver como `http://localhost:3000`, o link no email sempre será localhost
   - Esta é a URL principal da aplicação e DEVE ser a URL de produção

4. **Adicione Redirect URLs Permitidas**
   - **Redirect URLs**: Adicione as seguintes URLs (uma por linha):
     ```
     https://competicao-acoes.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     ```
   - **Importante**: O Supabase só aceita redirecionamentos para URLs que estão nesta lista
   - Adicione todas as URLs que você pode usar (produção, staging, desenvolvimento local)

### Exemplo de Configuração:

```
Site URL: https://competicao-acoes.vercel.app

Redirect URLs:
https://competicao-acoes.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

## Como Funciona

### Fluxo do Magic Link:

1. **Usuário solicita magic link**
   - Endpoint: `/api/auth/magic-link`
   - Sistema obtém URL de redirecionamento usando `APP_URL` ou `NEXT_PUBLIC_APP_URL`
   - Passa `emailRedirectTo` para o Supabase

2. **Supabase gera o link no email**
   - **O `{{ .ConfirmationURL }}` no template do email usa a Site URL do dashboard!**
   - Se a Site URL estiver como `localhost`, o link será `localhost`
   - O `emailRedirectTo` não afeta o link inicial, apenas o redirecionamento final

3. **Supabase valida a URL**
   - Supabase verifica se a URL está na lista de "Redirect URLs" permitidas
   - Se não estiver, o magic link pode não funcionar ou redirecionar para localhost

4. **Email é enviado**
   - Supabase envia email com link de autenticação
   - O link inicial (`ConfirmationURL`) usa a Site URL do dashboard
   - O redirecionamento após confirmação usa o `emailRedirectTo` (se configurado)

5. **Usuário clica no link**
   - Supabase autentica o usuário
   - Redireciona para a URL especificada em `emailRedirectTo` (ex: `/auth/callback`)

## Variáveis de Ambiente

### Produção (Vercel)

Configure no Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_APP_URL=https://competicao-acoes.vercel.app
APP_URL=https://competicao-acoes.vercel.app
```

### Desenvolvimento Local

No arquivo `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

## Verificação

### Como Verificar se Está Funcionando:

1. **Verifique os logs do servidor**
   - Ao enviar magic link, você verá logs como:
     ```
     Magic link redirect URL: https://competicao-acoes.vercel.app/auth/callback
     APP_URL: https://competicao-acoes.vercel.app
     NEXT_PUBLIC_APP_URL: https://competicao-acoes.vercel.app
     ```

2. **Teste o magic link**
   - Solicite um magic link
   - Verifique o email recebido
   - O link deve apontar para a URL de produção (não localhost)

3. **Verifique no Supabase Dashboard**
   - Authentication → Logs
   - Você pode ver tentativas de login e redirecionamentos

## Troubleshooting

### Problema: Magic link ainda redireciona para localhost

**Soluções**:

1. **⚠️ VERIFIQUE A SITE URL NO SUPABASE DASHBOARD** (Mais Importante!)
   - Vá em Authentication → URL Configuration
   - **Site URL DEVE ser**: `https://competicao-acoes.vercel.app`
   - **NÃO pode ser**: `http://localhost:3000`
   - O `{{ .ConfirmationURL }}` no template do email usa esta URL!

2. **Verifique variáveis de ambiente**
   ```bash
   # No servidor (Vercel)
   # Verifique se APP_URL está configurado corretamente
   ```

3. **Verifique configuração do Supabase**
   - Site URL está configurada corretamente? (URL de produção)
   - Redirect URLs incluem a URL de produção?

4. **Verifique logs**
   - Os logs mostram qual URL está sendo usada?
   - Se mostrar localhost, a variável não está sendo lida corretamente
   - Os logs agora mostram avisos sobre a Site URL

### Problema: Erro "Invalid redirect URL"

**Solução**:
- Adicione a URL exata no campo "Redirect URLs" do Supabase Dashboard
- A URL deve corresponder exatamente (incluindo protocolo, domínio e caminho)

### Problema: Magic link funciona localmente mas não em produção

**Solução**:
- Verifique se `APP_URL` está configurado no Vercel
- Verifique se a URL de produção está na lista de Redirect URLs do Supabase

## Arquivos Modificados

1. **Modificado**: `src/app/api/auth/magic-link/route.ts`
   - Adicionada lógica para usar `APP_URL` com fallback
   - Adicionados logs para debug

2. **Modificado**: `src/app/api/webhooks/kiwify/route.ts`
   - Adicionada lógica para usar `APP_URL` com fallback
   - Adicionados logs para debug

3. **Modificado**: `src/app/api/webhooks/kiwify/test/route.ts`
   - Adicionada lógica para usar `APP_URL` com fallback
   - Adicionados logs para debug

4. **Modificado**: `envs`
   - Adicionada variável `APP_URL`

## Notas Importantes

1. **Você DEVE configurar no Supabase Dashboard**: O código sozinho não resolve o problema. As URLs precisam estar configuradas no dashboard.

2. **URLs devem corresponder exatamente**: A URL no código deve corresponder exatamente a uma das URLs na lista de Redirect URLs do Supabase.

3. **Variáveis de ambiente em produção**: Certifique-se de configurar `APP_URL` no Vercel (ou sua plataforma de deploy) para produção.

4. **Desenvolvimento local**: Para desenvolvimento, você pode usar `http://localhost:3000` mas precisa adicionar essa URL no Supabase Dashboard também.

## Próximos Passos

1. ✅ Configurar `APP_URL` no Vercel
2. ✅ Configurar URLs no Supabase Dashboard
3. ✅ Testar magic link em produção
4. ✅ Verificar logs para confirmar URL correta

