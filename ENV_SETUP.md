# Configuração de Variáveis de Ambiente

## DATABASE_URL - Codificação de Senhas

Quando sua senha do banco de dados contém caracteres especiais, você precisa codificá-los usando URL encoding (percent encoding).

### Caracteres Especiais Comuns:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`
- `/` → `%2F`
- `:` → `%3A`
- `;` → `%3B`
- ` ` (espaço) → `%20`

### Exemplo:

**Senha original:** `Ght$$@1234&&T`

**Senha codificada:** `Ght%24%24%401234%26%26T`

**DATABASE_URL completa:**
```
DATABASE_URL=postgresql://usuario:Ght%24%24%401234%26%26T@host:5432/database?schema=public
```

### Breakdown da codificação:

- `$$` → `%24%24` (cada $ vira %24)
- `@` → `%40`
- `&&` → `%26%26` (cada & vira %26)

### Ferramentas Úteis:

1. **Online URL Encoder:**
   - https://www.urlencoder.org/
   - Cole apenas a senha e copie o resultado codificado

2. **JavaScript (Node.js):**
   ```javascript
   const senha = "Ght$$@1234&&T";
   const codificada = encodeURIComponent(senha);
   console.log(codificada); // Ght%24%24%401234%26%26T
   ```

3. **Python:**
   ```python
   from urllib.parse import quote_plus
   senha = "Ght$$@1234&&T"
   codificada = quote_plus(senha)
   print(codificada)  # Ght%24%24%401234%26%26T
   ```

### Formato Completo da DATABASE_URL:

```
postgresql://[usuario]:[senha_codificada]@[host]:[porta]/[database]?schema=public
```

### Exemplo Prático:

Se você tem:
- **Usuário:** `myuser`
- **Senha:** `Ght$$@1234&&T`
- **Host:** `db.xxxxx.supabase.co`
- **Porta:** `5432`
- **Database:** `postgres`

A URL seria:
```
DATABASE_URL=postgresql://myuser:Ght%24%24%401234%26%26T@db.xxxxx.supabase.co:5432/postgres?schema=public
```

### ⚠️ Importante:

- **NUNCA** commite o arquivo `.env.local` no Git
- Use `.env.local.example` como template (sem valores reais)
- A senha codificada ainda é sensível - mantenha segredo

