# Ranking de Investimentos - Bruno Chimarelli

MVP de aplicação mobile-first para competição de investimentos e ranking da comunidade, desenvolvido em parceria com Bruno Chimarelli.

## 🚀 Tecnologias

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (Componentes UI)
- **Zustand** (Estado global)
- **Recharts** (Gráficos)
- **next-pwa** (PWA)
- **date-fns** (Manipulação de datas)

## 📱 Funcionalidades

### MVP Atual

- ✅ Ranking da Comunidade (Mensal, Anual, MIC Method)
- ✅ Visualização de Carteiras com Blur (Free vs Premium)
- ✅ Carteira Oficial do Bruno Chimarelli
- ✅ Minha Carteira (Input de transações)
- ✅ Sistema Premium/Free
- ✅ PWA (Progressive Web App) - Instalável
- ✅ Dados Mockados com localStorage

### Próximas Implementações

- 🔄 Integração Supabase (Auth + Database)
- 🔄 Sistema de Pagamento
- 🔄 Notificações Push
- 🔄 Analytics

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── (main)/            # Layout group com Bottom Navigation
│   │   ├── ranking/       # Home - Ranking da Comunidade
│   │   ├── minha-carteira/ # Input de transações
│   │   └── perfil/        # Perfil e Premium
│   ├── carteira/[id]/     # Detalhe de carteira de terceiros
│   ├── bruno-method/      # Carteira oficial do Bruno
│   └── manifest.ts        # Web App Manifest
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── ranking/           # Componentes específicos de ranking
│   ├── portfolio/         # Componentes de carteira
│   ├── profile/           # Componentes de perfil
│   ├── navigation/        # Bottom Navigation Bar
│   └── pwa/               # Componentes PWA
├── lib/
│   ├── store/             # Zustand stores
│   ├── mock-data/         # Dados mockados
│   ├── supabase/          # Preparação para Supabase
│   └── utils/             # Utilitários
└── types/                 # TypeScript types
```

## 🎨 Design

- **Mobile-First**: 100% responsivo e otimizado para mobile
- **PWA**: Instalável como app nativo
- **Dark Mode**: Suporte completo (preparado)
- **Safe Areas**: Respeita notch e home indicator do iOS

## 📝 Dados Mockados

O MVP utiliza dados mockados armazenados em `localStorage`:

- `competicao_user`: Dados do usuário atual
- `competicao_transactions`: Transações do usuário
- `competicao_competitors`: Lista de competidores

Para resetar os dados mockados, use a função `resetMockData()` do módulo `lib/mock-data`.

## 🔧 Desenvolvimento

### Alternar Status Premium (Dev)

No console do navegador:
```javascript
// Tornar usuário premium
localStorage.setItem('competicao_user', JSON.stringify({
  ...JSON.parse(localStorage.getItem('competicao_user')),
  isPremium: true
}));
location.reload();
```

### Cache durante Desenvolvimento

Se alterações não refletirem:

1. **Chrome DevTools**: Application → Storage → Clear site data
2. **Hard refresh**: Ctrl+Shift+R / Cmd+Shift+R
3. **Desabilitar cache**: Network tab → Disable cache

## 📦 Deploy

### Vercel (Recomendado)

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente (quando Supabase for integrado)
3. Deploy automático

### Build Local

```bash
npm run build
npm start
```

## 🔐 Variáveis de Ambiente (Futuro)

Quando Supabase for integrado:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📄 Licença

Proprietário - Parceria Bruno Chimarelli

## 👥 Contribuição

Este é um projeto MVP para validação. Contribuições serão consideradas após validação inicial.

