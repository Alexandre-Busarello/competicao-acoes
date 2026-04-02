# Feature: Rankings qualitativos (ações e FIIs)

## Comportamento

- Rankings **qualitativos** separados do ranking de competição por rentabilidade: ações (**GGB**) e fundos imobiliários (**FII**).
- Acesso tipicamente associado ao **PRO** (ver [PRO-PREMIUM.md](./PRO-PREMIUM.md)).

## Implementação (pistas)

- Páginas: `src/app/ranking-ggb`, `src/app/ranking-fii`.
- APIs: `src/app/api/ranking-ggb`, `src/app/api/ranking-fii`.
- Serviços: `ggb-ranking-service.ts`, `fii-ranking-service.ts`, `fii-data-service.ts`; tabelas `GGBRanking`, `FIIRanking`.
- Script: `yarn fetch-fii-data` (ver `package.json`).
