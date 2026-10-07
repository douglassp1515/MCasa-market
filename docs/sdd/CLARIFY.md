# Esclarecimentos e riscos — MCasa market

| ID | Risco / ambiguidade | Área | Mitigação / status |
|---|---|---|---|
| M-01 | Catálogo vazio até haver anúncios ACTIVE | produto | Seed demo local marca listings ACTIVE sem chamar MELI/Shopee |
| M-02 | Sessão buyer em localStorage (MVP) | auth | Aceitável na base; migrar para cookie httpOnly depois |
| M-08 | Sessão buyer stale até `meMarketplaceBuyer` / focus / erro auth | auth | Mitigado: verify no shell/perfil + invalidate em falha GraphQL |
| M-03 | Pedido marketplace separado do Pedido ERP (Person) | dados | `MarketplaceOrder` na base; espelho Person por empresa se fiscal exigir |
| M-04 | Sem pagamento real na 1ª entrega | checkout | Status PENDING; evolução PIX/cartão fora do escopo base |
| M-05 | Newsletter só UI (sem backend) | marketing | Aceito na entrega de layout; persistência depois |
| M-06 | Produto com variação sem `productVariantId` no checkout | estoque | Mitigado 2026-10-07: seletor no anúncio + carrinho v2 |
| M-07 | Secret da vitrine no browser vazaria na aba Network | auth | Mitigado: BFF `/api/graphql`; `MARKET_STOREFRONT_SECRET` só server-side |
