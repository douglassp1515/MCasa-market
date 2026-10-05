# Constituição — MCasa market

Decisões que não podem ser contraditas sem registro explícito.

## Princípios

- Vitrine **pública**: lista/detalhe de anúncios `ACTIVE` de todas as empresas ativas
- Compra **somente** com login de `MarketplaceBuyer` (JWT próprio; não reutiliza CompanyUser)
- `Order`/`MarketplaceOrder.companyId` = `Listing.companyId` — nunca escolhido pelo comprador
- Stack alinhada ao ERP: Next App Router + Tailwind 4 + HeroUI + GraphQL
- Textos PT-BR; código em inglês

## Histórico

| Data | Decisão | Motivo | Ref |
|---|---|---|---|
| 2026-10-05 | Repo irmão `MCasa-market` porta 3002; papel MarketplaceBuyer separado de Person/CompanyUser | Base F0.5 1A+2A | `docs/specs/web/vitrine-publica.md` |
