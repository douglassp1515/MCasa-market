# Constituição — MCasa market

Decisões que não podem ser contraditas sem registro explícito.

## Princípios

- Vitrine **pública para o comprador**: lista/detalhe de anúncios `ACTIVE`; a API GraphQL da vitrine **não** é aberta — o BFF `/api/graphql` injeta `MARKET_STOREFRONT_SECRET` (nunca no browser / nunca `NEXT_PUBLIC_`)
- Compra **somente** com login de `MarketplaceBuyer` (JWT próprio; não reutiliza CompanyUser)
- `Order`/`MarketplaceOrder.companyId` = `Listing.companyId` — nunca escolhido pelo comprador
- Stack alinhada ao ERP: Next App Router + Tailwind 4 + HeroUI + GraphQL
- Textos PT-BR; código em inglês
- Categorias globais com `accentColor` / `surfaceColor`; botões e destaques da UI seguem a categoria do produto/página

## Histórico

| Data | Decisão | Motivo | Ref |
|---|---|---|---|
| 2026-10-05 | Repo irmão `MCasa-market` porta 3002; papel MarketplaceBuyer separado de Person/CompanyUser | Base F0.5 1A+2A | `docs/specs/web/vitrine-publica.md` |
| 2026-10-05 | Layout home estilo marketplace + tema dinâmico por categoria | Pedido visual 1A+2A | `docs/specs/web/vitrine-publica.md` |
| 2026-10-05 | Hero em carrossel com slides do backend; cor dos botões segue categoria do slide | Banner Tech/Construção/Casa | `docs/specs/web/vitrine-publica.md` |
| 2026-10-06 | Vários endereços de entrega; ViaCEP no front; checkout com `deliveryAddressId` | Substitui perfil fiscal único | `docs/sdd/TASKS.md` |
| 2026-10-06 | Hub `/perfil`: compras, endereços e cupons (cupons placeholder) | Conta do comprador unificada | `docs/sdd/TASKS.md` |
| 2026-10-07 | GraphQL da vitrine via BFF `/api/graphql` + `MARKET_STOREFRONT_SECRET` server-only | Secret não aparece no Network | `docs/sdd/TASKS.md` |
