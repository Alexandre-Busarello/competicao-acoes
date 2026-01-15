# Testando Notificações Push via cURL

Este documento explica como testar notificações push usando o endpoint `/api/push/test-curl`, especialmente útil para testar com o browser fechado.

## 📋 Pré-requisitos

1. O usuário precisa ter o PWA instalado no dispositivo
2. O usuário precisa ter registrado a subscription de push notifications
3. O usuário precisa ter notificações habilitadas nas configurações

## 🔧 Como Obter o userId

### Opção 1: Via Interface Web
1. Acesse `/perfil/notificacoes`
2. Abra o DevTools (F12) → Console
3. Execute: `localStorage.getItem('userId')` ou verifique o ID na URL do perfil

### Opção 2: Via API
```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: sb-xxx-auth-token=YOUR_COOKIE"
```

## 🚀 Exemplos de Uso

### 1. Com userId no body (sem autenticação)

```bash
curl -X POST http://localhost:3000/api/push/test-curl \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-aqui"}'
```

### 2. Com cookie de autenticação (recomendado)

Primeiro, obtenha o cookie do navegador:
1. Abra o DevTools (F12) → Application → Cookies
2. Copie o valor do cookie `sb-xxx-auth-token`

Depois, use no curl:
```bash
curl -X POST http://localhost:3000/api/push/test-curl \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-xxx-auth-token=YOUR_COOKIE_VALUE"
```

### 3. Com Authorization header

Primeiro, obtenha o access token:
1. Abra o DevTools (F12) → Application → Cookies
2. Copie o valor do cookie `sb-access-token` ou extraia do `sb-xxx-auth-token`

Depois, use no curl:
```bash
curl -X POST http://localhost:3000/api/push/test-curl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Ver informações do endpoint

```bash
curl http://localhost:3000/api/push/test-curl
```

## 📱 Testando com Browser Fechado

Para testar com o browser completamente fechado:

1. **Instale o PWA** no dispositivo móvel ou desktop
2. **Feche completamente o navegador** (não apenas a aba)
3. **Execute o curl** do seu computador/terminal:
   ```bash
   curl -X POST https://seu-dominio.com/api/push/test-curl \
     -H "Content-Type: application/json" \
     -d '{"userId": "user-id-aqui"}'
   ```
4. **A notificação deve aparecer** mesmo com o browser fechado (se o PWA estiver instalado)

## ✅ Respostas Esperadas

### Sucesso
```json
{
  "success": true,
  "message": "Notificação de teste enviada com sucesso!",
  "userId": "user-id",
  "userEmail": "user@example.com",
  "subscriptionsCount": 1
}
```

### Erro: Sem subscription
```json
{
  "error": "Usuário user-id não tem subscription registrada. O usuário precisa registrar a subscription primeiro através da interface web."
}
```

### Erro: Notificações desabilitadas
```json
{
  "error": "Usuário user-id não tem notificações habilitadas. O usuário precisa ativar as notificações primeiro através da interface web."
}
```

## 🔍 Debugging

Se a notificação não aparecer:

1. **Verifique se o service worker está ativo:**
   - Abra o DevTools → Application → Service Workers
   - Verifique se está "activated and is running"

2. **Verifique se há subscription registrada:**
   ```bash
   # No banco de dados ou via API
   SELECT * FROM "PushSubscription" WHERE "userId" = 'user-id';
   ```

3. **Verifique os logs do servidor:**
   - Procure por `[API]` e `[PushNotification]` nos logs
   - Verifique se há erros relacionados ao web-push

4. **Verifique se o PWA está instalado:**
   - No mobile: verifique se o app aparece na lista de apps instalados
   - No desktop: verifique se há um ícone na área de trabalho/barra de tarefas

## 📝 Notas Importantes

- O service worker é atualizado automaticamente a cada 5 minutos
- Em produção, o script `inject-push-handlers.js` roda automaticamente após o build
- O service worker usa `skipWaiting: true` para ativar atualizações imediatamente
- Notificações funcionam mesmo com o browser fechado se o PWA estiver instalado

