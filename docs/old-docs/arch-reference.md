# Arquitetura do Projeto - Video Uploader

Este documento define a arquitetura completa do projeto Video Uploader, servindo como **boilerplate e referência** para novos projetos que seguem Clean Architecture.

## Princípios Arquiteturais

### Clean Architecture

O projeto segue **Clean Architecture** com separação clara de responsabilidades em camadas:

1. **Domain Layer** (Núcleo) - Zero dependências externas
2. **Application Layer** - Regras de negócio e casos de uso
3. **Infrastructure Layer** - Implementações concretas e integrações

### Dependency Rule

**Dependências sempre apontam para dentro**: Infrastructure → Application → Domain

- Domain não depende de nada
- Application depende apenas de Domain (interfaces)
- Infrastructure depende de Application e Domain (implementa interfaces)

## Estrutura de Pastas

```
video-uploader/
├── src/                          # Backend (TypeScript)
│   ├── domain/                   # Domain Layer (Núcleo)
│   │   ├── entities/            # Entidades de domínio
│   │   │   └── Video.ts
│   │   └── interfaces/          # Contratos (interfaces)
│   │       ├── IStorageGateway.ts
│   │       └── IVideoRepository.ts
│   ├── application/              # Application Layer
│   │   └── collaborations/       # Casos de uso
│   │       └── GenerateUploadUrlCollaboration.ts
│   └── infrastructure/           # Infrastructure Layer
│       ├── gateways/             # Implementações de interfaces
│       │   ├── DatabaseGateway.ts      # Queries SQL centralizadas
│       │   ├── S3StorageGateway.ts     # Implementação AWS S3
│       │   └── PostgresVideoRepository.ts  # Repository com mapeamento
│       ├── http/                 # HTTP Layer
│       │   ├── controllers/     # Controllers magros
│       │   │   └── UploadController.ts
│       │   └── routes/          # Definição de rotas
│       │       └── videoRoutes.ts
│       └── server/              # Configuração do servidor
│           └── server.ts
│   └── main.ts                  # Entrypoint da aplicação
├── web/                          # Frontend (React/Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── components/
│   │       └── VideoUpload.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── db/                           # Migrations (Sqitch)
│   ├── sqitch.conf               # Config básica (target construído dinamicamente)
│   ├── sqitch.plan               # Plano de execução das migrations
│   ├── sqitch                    # Script wrapper Docker (detecta POSTGRES_* vars)
│   ├── migrate.sh                # Script de execução (usado em CI/CD)
│   ├── deploy/                  # Scripts de deploy
│   ├── revert/                  # Scripts de revert
│   └── verify/                  # Scripts de verificação
├── docker-compose.yml            # PostgreSQL local (dev)
├── Dockerfile.server             # Multi-stage para app
├── Dockerfile.migrations          # Para init container (K8s)
├── .nvmrc                        # Versão do Node.js
├── .yarnrc.yml                   # Configuração do Yarn
├── package.json                  # Root workspace (workspaces: ["web"])
├── yarn.lock                     # Lock file do Yarn (gerenciado pelo workspace)
├── tsconfig.json                 # Config TypeScript
└── README.md
```

## Camadas Detalhadas

### 1. Domain Layer (`src/domain/`)

**Responsabilidade**: Definir as regras de negócio puras, sem dependências externas.

#### Entities (`entities/`)

Classes de domínio que representam conceitos do negócio:

```typescript
// Exemplo: Video.ts
export class Video {
  constructor(
    public readonly id: string,
    public readonly filename: string,
    // ... outros campos
  ) {}
  
  static create(params: {...}): Video {
    // Factory method para criar instâncias
  }
}
```

**Regras**:
- Apenas lógica de domínio
- Sem dependências de frameworks ou bibliotecas externas
- Métodos estáticos `create()` para factories quando necessário
- **Métodos públicos** que encapsulam regras de negócio (ex: `isComplete()`, `determineStatusFromProcessedFiles()`)
- **Métodos privados** para lógica interna que não deve ser exposta (ex: `getExpectedProcessedFiles()`)
- Toda decisão baseada em regras de negócio deve estar na entidade, não na Collaboration

#### Interfaces (`interfaces/`)

Contratos que definem o que a Infrastructure Layer deve implementar:

```typescript
// Exemplo: IStorageGateway.ts
export interface IStorageGateway {
  generatePresignedUrl(params: {...}): Promise<string>;
}
```

**Regras**:
- Apenas definições de contratos
- Sem implementações concretas
- Nomes começam com `I` (convenção)

### 2. Application Layer (`src/application/`)

**Responsabilidade**: Orquestrar casos de uso, coordenando Domain e Infrastructure.

#### Collaborations (`collaborations/`)

Casos de uso que orquestram o fluxo de negócio:

```typescript
// Exemplo: GenerateUploadUrlCollaboration.ts
export class GenerateUploadUrlCollaboration {
  constructor(
    private storageGateway: IStorageGateway,      // Interface do Domain
    private videoRepository: IVideoRepository,   // Interface do Domain
    private s3BucketName: string
  ) {}
  
  async execute(params: {...}): Promise<Result> {
    // 1. Buscar dados necessários (via repositories/gateways)
    // 2. Delegar validação de regras de negócio para a entidade de domínio
    // 3. Criar/atualizar entidade de domínio usando métodos da entidade
    // 4. Persistência via repository
    // 5. Retorno do resultado
  }
}
```

**Regras**:
- Recebe apenas **interfaces** do Domain via Dependency Injection
- Nunca conhece implementações concretas
- Um método `execute()` por caso de uso
- Retorna DTOs ou entidades de domínio
- **NÃO contém lógica de negócio** - apenas orquestra e delega para entidades
- **Delega decisões de negócio** para métodos públicos das entidades de domínio

### 3. Infrastructure Layer (`src/infrastructure/`)

**Responsabilidade**: Implementar as interfaces do Domain e integrar com o mundo externo.

#### Gateways (`gateways/`)

Implementações concretas das interfaces do Domain:

**DatabaseGateway** (`DatabaseGateway.ts`):
- **Centraliza TODAS as queries SQL nativas**
- Usa `pg` (node-postgres) para conexões
- Métodos explícitos: `insertVideo()`, `findVideoById()`
- Retorna objetos planos (raw rows)
- **Nenhuma outra classe executa SQL diretamente**

```typescript
export class DatabaseGateway {
  async insertVideo(params: {...}): Promise<VideoRow> {
    const query = `INSERT INTO videos ... VALUES ($1, $2, ...) RETURNING *`;
    // Query SQL nativa parametrizada
  }
}
```

**S3StorageGateway** (`S3StorageGateway.ts`):
- Implementa `IStorageGateway`
- Usa AWS SDK v3
- Configuração via env vars

**PostgresVideoRepository** (`PostgresVideoRepository.ts`):
- Implementa `IVideoRepository`
- Recebe `DatabaseGateway` via DI
- **Apenas mapeia** raw rows para entidades de domínio
- Não contém SQL

#### HTTP (`http/`)

**Controllers** (`controllers/`):
- **Controllers magros** - apenas orquestram
- Validação com Zod antes de processar
- Instancia dependências (ou recebe via DI)
- Chama Collaborations
- Retorna respostas HTTP

```typescript
export class UploadController {
  async generateUploadUrl(req: Request, res: Response): Promise<void> {
    // 1. Validação Zod
    // 2. Instancia dependências
    // 3. Instancia Collaboration
    // 4. Executa Collaboration
    // 5. Retorna resposta
  }
}
```

**Routes** (`routes/`):
- Define rotas Express
- Conecta rotas aos controllers
- Middleware quando necessário

**Server** (`server/`):
- Configura Express app
- Registra rotas
- Serve arquivos estáticos (produção)
- Exporta app configurado (não inicia servidor)

**Entrypoint** (`main.ts`):
- **Carrega variáveis de ambiente** via `dotenv.config()` (primeira linha)
- Importa app de `server.ts`
- Inicia servidor
- Tratamento de erros e graceful shutdown

**Importante**: O `dotenv` deve ser importado e configurado **antes** de qualquer outro código que dependa de `process.env`, garantindo que as variáveis estejam disponíveis em toda a aplicação.

### Configuração de Variáveis de Ambiente

O projeto utiliza `dotenv` para gerenciar variáveis de ambiente em desenvolvimento.

**Instalação**:
```bash
yarn add -W dotenv
```

**Configuração no Entrypoint** (`src/main.ts`):
```typescript
import dotenv from 'dotenv';
import { createApp } from './infrastructure/server/server';

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;
// ... resto do código
```

**Arquivo `.env`**:
- Criar arquivo `.env` na raiz do projeto (baseado em `.env.example`)
- Contém todas as variáveis necessárias: `DATABASE_URL`, `AWS_*`, `S3_BUCKET_NAME`, `PORT`, etc.
- **Nunca commitar** o arquivo `.env` no Git (deve estar no `.gitignore`)
- Usar `.env.example` como template para outros desenvolvedores

**Variáveis Necessárias**:
- `DATABASE_URL`: String de conexão PostgreSQL (ex: `postgresql://user:password@host:port/database`)
- `AWS_REGION`: Região AWS (ex: `us-west-2` - Oeste dos EUA Oregon)
- `AWS_ACCESS_KEY_ID`: Chave de acesso AWS
- `AWS_SECRET_ACCESS_KEY`: Chave secreta AWS
- `S3_BUCKET_NAME`: Nome do bucket S3
- `PORT`: Porta do servidor (padrão: `3000`)
- `NODE_ENV`: Ambiente (`development` ou `production`)

**Produção**:
- Em produção (Kubernetes), variáveis são injetadas via Secrets/ConfigMaps
- O `dotenv` ainda funciona, mas as variáveis de ambiente do sistema têm prioridade
- Não é necessário arquivo `.env` em produção

## Fluxo de Dados

### Exemplo: Gerar Presigned URL

```mermaid
sequenceDiagram
    participant Frontend
    participant Controller
    participant Collaboration
    participant Repository
    participant DbGateway
    participant S3Gateway
    participant S3
    participant DB

    Frontend->>Controller: POST /api/videos/upload-url
    Controller->>Controller: Validação Zod
    Controller->>Collaboration: execute(params)
    Collaboration->>Repository: create(video)
    Repository->>DbGateway: insertVideo(params)
    DbGateway->>DB: INSERT INTO videos ...
    DB-->>DbGateway: Raw row
    DbGateway-->>Repository: VideoRow
    Repository->>Repository: Map to Video entity
    Repository-->>Collaboration: Video entity
    Collaboration->>S3Gateway: generatePresignedUrl()
    S3Gateway->>S3: Generate presigned URL
    S3-->>S3Gateway: URL
    S3Gateway-->>Collaboration: URL
    Collaboration-->>Controller: Result
    Controller-->>Frontend: JSON response
    Frontend->>S3: PUT video (direct upload)
```

## Princípios de Implementação

### 1. Queries SQL Centralizadas

**TODAS** as queries SQL ficam no `DatabaseGateway`:
- ✅ Facilita auditoria
- ✅ Facilita otimização
- ✅ Facilita manutenção
- ❌ Nenhum outro componente executa SQL diretamente

### 2. Dependency Injection

- Collaborations recebem interfaces via construtor
- Controllers instanciam dependências (ou recebem via DI framework)
- Facilita testes e troca de implementações

### 3. Controllers Magros

Controllers não contêm lógica de negócio:
- Validação de entrada (Zod)
- Instanciação de dependências
- Chamada para Collaborations
- Retorno de respostas

### 4. Mapeamento Domain ↔ Database

- `DatabaseGateway`: Retorna objetos planos (raw rows)
- `Repository`: Mapeia raw rows para entidades de domínio
- Separação clara de responsabilidades

### 5. Lógica de Negócio na Entidade de Domínio

**CRÍTICO**: Toda lógica de negócio deve estar encapsulada na entidade de domínio, não na Collaboration.

**Regras**:
- ✅ Entidades de domínio contêm métodos que implementam regras de negócio
- ✅ Collaborations apenas orquestram e delegam para as entidades
- ❌ Collaborations não devem conter lógica de negócio
- ❌ Collaborations não devem tomar decisões baseadas em regras de negócio

**Exemplo: Determinação de Status do Vídeo**

❌ **ERRADO** - Lógica na Collaboration:
```typescript
// CheckProcessingStatusCollaboration.ts (ERRADO)
async execute(videoId: string) {
  const video = await this.videoRepository.findById(videoId);
  const files = await this.storageGateway.listObjects(prefix);
  
  // ❌ Lógica de negócio na collaboration
  const expectedFiles = [`${uuid}_480.m3u8`, ...];
  const existingFiles = expectedFiles.filter(f => files.includes(f));
  const isComplete = existingFiles.length === expectedFiles.length;
  
  let newStatus: VideoStatus;
  if (isComplete) {
    newStatus = 'COMPLETED';
  } else if (existingFiles.length > 0) {
    newStatus = 'PROCESSING';
  } else {
    newStatus = video.status === 'PROCESSING' ? 'PROCESSING' : 'PENDING';
  }
  
  await this.videoRepository.updateStatus(videoId, newStatus);
}
```

✅ **CORRETO** - Lógica na Entidade:
```typescript
// Video.ts (Domain Layer)
export class Video {
  // Método privado para uso interno
  private getExpectedProcessedFiles(): string[] {
    return [
      `${this.id}_480.m3u8`,
      `${this.id}.m3u8`,
      `${this.id}_1080.m3u8`,
      `${this.id}_720.m3u8`,
    ];
  }

  // Método público que encapsula regra de negócio
  isComplete(processedFiles: string[]): boolean {
    const expectedFiles = this.getExpectedProcessedFiles();
    const existingFiles = expectedFiles.filter((expectedFile) =>
      processedFiles.includes(expectedFile)
    );
    return existingFiles.length === expectedFiles.length;
  }

  // Método público que determina status baseado em regras de negócio
  determineStatusFromProcessedFiles(processedFiles: string[]): VideoStatus {
    const expectedFiles = this.getExpectedProcessedFiles();
    const existingFiles = expectedFiles.filter((expectedFile) =>
      processedFiles.includes(expectedFile)
    );

    if (this.isComplete(processedFiles)) {
      return 'COMPLETED';
    } else if (existingFiles.length > 0) {
      return 'PROCESSING';
    } else {
      return this.status === 'PROCESSING' ? 'PROCESSING' : 'PENDING';
    }
  }
}

// CheckProcessingStatusCollaboration.ts (Application Layer)
async execute(videoId: string) {
  const video = await this.videoRepository.findById(videoId);
  const files = await this.storageGateway.listObjects(prefix);
  
  // ✅ Delega lógica de negócio para a entidade
  const newStatus = video.determineStatusFromProcessedFiles(files);
  const isComplete = video.isComplete(files);
  
  // Apenas atualiza se mudou
  if (newStatus !== video.status) {
    await this.videoRepository.updateStatus(videoId, newStatus);
  }
  
  return { status: newStatus, isComplete };
}
```

**Benefícios**:
- ✅ Testabilidade: Lógica de negócio pode ser testada isoladamente
- ✅ Reutilização: Métodos da entidade podem ser usados em diferentes contexts
- ✅ Manutenibilidade: Mudanças nas regras de negócio ficam centralizadas
- ✅ Clareza: Fica explícito que a entidade é responsável por suas próprias regras

### 6. Migrations com Sqitch

- Migrations SQL nativas (não ORM)
- Controle total sobre o banco
- Deploy via init container no K8s

**Configuração**:
- `sqitch.conf`: Configuração básica do engine PostgreSQL (target vazio, construído dinamicamente)
- `sqitch`: Script wrapper que detecta variáveis `POSTGRES_*` e constrói target URI automaticamente
- Variáveis necessárias: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

**Desenvolvimento Local**:
```bash
export POSTGRES_USER=video_uploader
export POSTGRES_PASSWORD=video_uploader_password
export POSTGRES_HOST=localhost
export POSTGRES_DATABASE=video_uploader
./sqitch deploy
```

**Produção (K8s)**:
- `Dockerfile.migrations` usa variáveis de ambiente diretamente no CMD
- Kubernetes injeta variáveis via Secrets/ConfigMap no init container
- Target construído automaticamente: `db:pg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DATABASE}`

## Tecnologias e Ferramentas

### Backend
- **Runtime**: Node.js 24 LTS (controlado via `.nvmrc`)
- **Package Manager**: Yarn (workspaces)
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Migrations**: Sqitch
- **Storage**: AWS S3 (SDK v3)
- **Validation**: Zod
- **Environment Variables**: dotenv (carregamento automático de `.env`)

**Nota sobre Workspaces**: O projeto usa Yarn workspaces com `web/` como workspace. Comandos devem usar o nome do package (`video-uploader-web`) ao invés do nome da pasta: `yarn workspace video-uploader-web dev`

**Configuração de Variáveis de Ambiente**:
- O projeto usa `dotenv` para carregar variáveis de ambiente do arquivo `.env` em desenvolvimento
- O carregamento é feito no entrypoint (`src/main.ts`) através de `dotenv.config()`
- Em produção, variáveis são injetadas via Kubernetes Secrets/ConfigMaps
- Arquivo `.env.example` serve como template para configuração local

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript

### DevOps
- **Containerização**: Docker
- **Orquestração**: Kubernetes (EKS)
- **Database Local**: Docker Compose

## Padrões de Código

### Nomenclatura

- **Entities**: PascalCase (`Video`)
- **Interfaces**: `I` + PascalCase (`IStorageGateway`)
- **Collaborations**: `{Action}{Entity}Collaboration` (`GenerateUploadUrlCollaboration`)
- **Gateways**: `{Service}Gateway` (`S3StorageGateway`, `DatabaseGateway`)
- **Repositories**: `{Database}{Entity}Repository` (`PostgresVideoRepository`)
- **Controllers**: `{Entity}Controller` (`UploadController`)

### Estrutura de Arquivos

- Um arquivo por classe/interface
- Pastas organizadas por camada
- Imports usando paths do tsconfig (`@domain/*`, `@application/*`, `@infrastructure/*`)

### Validação

- Validação de entrada sempre no Controller (Zod)
- Validação de regras de negócio na **Entidade de Domínio** (não na Collaboration)
- Validação de dados antes de persistir no Repository (se necessário)

**Nota**: Collaborations apenas orquestram e delegam validações de negócio para as entidades. A lógica de validação de regras de negócio deve estar encapsulada na entidade.

## Deploy

### Desenvolvimento Local

1. `nvm use` (usar versão do Node do `.nvmrc`)
2. `docker-compose up -d` (PostgreSQL)
3. `yarn install` (instalar dependências)
4. **Configurar variáveis de ambiente**:
   - Copiar `.env.example` para `.env`
   - Preencher valores necessários (DATABASE_URL, AWS credentials, etc.)
   - O `dotenv` carregará automaticamente essas variáveis ao iniciar o servidor
5. Executar migrations:
   ```bash
   cd db
   export POSTGRES_USER=video_uploader
   export POSTGRES_PASSWORD=video_uploader_password
   export POSTGRES_HOST=localhost
   export POSTGRES_DATABASE=video_uploader
   ./sqitch deploy
   ```
6. `yarn dev`

### Produção (EKS)

1. Build imagens: `Dockerfile.server` e `Dockerfile.migrations`
2. Push para ECR
3. Deploy Kubernetes com init container para migrations
4. Container principal só inicia após migrations completarem

## Checklist para Novos Projetos

Ao criar um novo projeto seguindo esta arquitetura:

- [ ] Criar estrutura de pastas (`domain/`, `application/`, `infrastructure/`)
- [ ] Configurar `tsconfig.json` com paths
- [ ] Criar entidades de domínio (sem dependências)
- [ ] Criar interfaces no Domain Layer
- [ ] Implementar `DatabaseGateway` com queries SQL centralizadas
- [ ] Implementar Gateways que implementam interfaces do Domain
- [ ] Criar Repositories que mapeiam rows para entidades
- [ ] Criar Collaborations (casos de uso) com Dependency Injection
- [ ] Criar Controllers magros com validação Zod
- [ ] Configurar rotas Express
- [ ] Criar `server.ts` e `main.ts`
- [ ] Configurar Sqitch para migrations (`sqitch.conf`, `sqitch.plan`, scripts deploy/revert/verify)
- [ ] Criar script `sqitch` wrapper que detecta variáveis `POSTGRES_*` e constrói target automaticamente
- [ ] Criar `docker-compose.yml` para desenvolvimento
- [ ] Criar Dockerfiles para produção
- [ ] Documentar arquitetura em `ARCH.md`

## Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Rule](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html#the-dependency-rule)
- [Sqitch Documentation](https://sqitch.org/)

