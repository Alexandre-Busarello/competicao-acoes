# Adição de ETFs ao Catálogo

## Data
Janeiro 2025

## Objetivo
Expandir o catálogo de ETFs disponíveis no sistema, adicionando o WRLD11 e outros ETFs relevantes que estavam faltando na base de dados.

## Implementação

### ETFs Adicionados

#### ETFs Internacionais
- **WRLD11**: iShares MSCI World (B3) - ETF que replica o índice MSCI ACWI, oferecendo exposição diversificada ao mercado global
- **VOO**: Vanguard S&P 500 ETF (NYSE) - Alternativa ao SPY com taxas mais baixas
- **IWM**: iShares Russell 2000 ETF (NYSE) - ETF de small caps americanas
- **DIA**: SPDR Dow Jones Industrial Average ETF (NYSE) - ETF que replica o índice Dow Jones

#### ETFs de Ações (Brasileiros)
- **BBOV11**: BB ETF Ibovespa (B3) - Alternativa ao BOVA11
- **TRIG11**: Trígono ETF Ações Micro Caps (B3) - ETF focado em empresas de menor capitalização

#### ETFs de Criptomoedas
- **ETHE11**: Hashdex Ethereum (B3) - ETF de Ethereum
- **NFTS11**: Hashdex NFTs (B3) - ETF focado em NFTs e metaverso
- **QDFI11**: QR Asset DeFi (B3) - ETF de finanças descentralizadas
- **COIN11**: Buena Vista Neos Bitcoin High Income ETF (B3) - ETF de Bitcoin que paga dividendos mensais através de estratégia covered call

#### ETFs de Commodities
- **BBOI11**: BB ETF Boi Gordo (B3) - ETF que acompanha o índice Futuro de Boi Gordo B3
- **CORN11**: BB ETF Milho (B3) - ETF que acompanha o índice Futuro de Milho B3

#### ETFs de Dividendos
- **HIGH11**: iShares High Dividend (B3) - ETF focado em empresas com alto pagamento de dividendos

#### ETFs de Renda Fixa
- **LFTS11**: iShares Renda Fixa LFT (B3) - ETF de renda fixa vinculado à LFT
- **LFTBETF11**: iShares Renda Fixa LFT B (B3) - Outro ETF de renda fixa LFT
- **BDAP11**: iShares Renda Fixa DAP (B3) - ETF que replica o índice DAP5 B3
- **DEBB11**: Trígono ETF Debêntures (B3) - ETF focado em debêntures
- **FIXA11**: iShares Renda Fixa DI (B3) - ETF de renda fixa vinculado ao DI
- **AREA11**: Raul Senna ETF IPCA Rendimento (B3) - ETF que replica o índice ITBR-IPCA Rendimento, composto por títulos Tesouro IPCA+ (NTN-Bs) e distribui rendimentos mensais

## Arquivo Modificado
- `src/lib/data/etfs.ts`

## Total de ETFs Adicionados
Foram adicionados **20 novos ETFs** ao catálogo, distribuídos nas seguintes categorias:
- 2 ETFs de ações brasileiros
- 4 ETFs de criptomoedas
- 2 ETFs de commodities
- 1 ETF de dividendos
- 4 ETFs internacionais
- 6 ETFs de renda fixa

## Impacto
- O sistema agora reconhece e pode processar um maior número de ETFs negociados na B3 e nas bolsas internacionais
- Usuários podem incluir o WRLD11 e outros ETFs populares em suas carteiras
- A categorização permite filtros mais precisos por tipo de investimento

## Observações Técnicas
- Todos os ETFs foram adicionados mantendo a estrutura existente do arquivo
- A categorização segue o padrão já estabelecido no sistema
- As funções auxiliares (`getETFInfo`, `getKnownETFTickers`, `getETFsByCategory`) continuam funcionando normalmente com os novos ETFs
- O mapa `ETF_MAP` é atualizado automaticamente com os novos ETFs

## Próximos Passos Sugeridos
- Considerar adicionar BDRs de ETFs (tickers terminados em 39) se necessário
- Manter o catálogo atualizado conforme novos ETFs são lançados na B3
- Avaliar a necessidade de adicionar ETFs de outras bolsas internacionais além de NYSE e NASDAQ

