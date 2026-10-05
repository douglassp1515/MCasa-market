# MCasa market — Contexto para agentes de IA

> Este arquivo é lido automaticamente por agentes (Cursor, Claude Code, etc.).

## Projeto

Vitrine pública Next.js do MCasa (porta 3002). Consome GraphQL do `MCasa-backend`. Não altera o ERP (`MCasa-frontEnd`) salvo pedido explícito.

## Leitura obrigatória (nessa ordem)

1. `docs/sdd/TASKS.md`
2. `docs/sdd/CONSTITUTION.md`
3. `.cursorrules`

## Módulos ativos

| Módulo | Frontend | Backend | Status |
|---|---|---|---|
| Vitrine marketplace | este repositório | `../MCasa-backend` | ✅ Base F0.5 |

## Regras gerais

- Idioma do código: Inglês
- Idioma de mensagens, labels e docs: Português (PT-BR)
- Compra exige JWT de `MarketplaceBuyer` (não CompanyUser)
- `companyId` do pedido vem sempre do anúncio — nunca do input do comprador
- Nunca commit/push automático; nunca commit `.env`
