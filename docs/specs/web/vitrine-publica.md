# Vitrine pública — MCasa market

## Rotas

| Rota | Auth | Descrição |
|---|---|---|
| `/` | pública | Home (hero, categorias, destaques) |
| `/categoria/[slug]` | pública | Listagem filtrada + tema da categoria |
| `/anuncio/[id]` | pública | Detalhe + imagens; botão com accent da categoria |
| `/login` `/cadastro` | pública | MarketplaceBuyer |
| `/checkout?listingId=` | buyer | Compra simples |
| `/pedidos` | buyer | Histórico com empresa |

## GraphQL

- `publicCategories` / `publicCategory(slug)`
- `publicListings(search, channel, categorySlug)`
- `publicListing(id)` (inclui `category`)
- `registerMarketplaceBuyer` / `loginMarketplaceBuyer` / `meMarketplaceBuyer`
- `createMarketplaceOrder(listingId, quantity)`
- `myMarketplaceOrders`

## Tema por categoria

- `accentColor` → botões Comprar / CTA / badge
- `surfaceColor` → fundo dos cards de categoria e faixa da página `/categoria/[slug]`
- CSS vars: `--market-accent`, `--market-surface`, `--market-accent-fg`
- Hero: `publicHeroSlides` — slide ativo aplica tema da categoria (ex. Tecnologia azul, Construção verde)

## Rastreio de empresa

`companyId` no pedido = `listing.companyId`. UI nunca envia `companyId` no checkout.
