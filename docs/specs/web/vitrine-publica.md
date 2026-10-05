# Vitrine pública — MCasa market

## Rotas

| Rota | Auth | Descrição |
|---|---|---|
| `/` | pública | Lista anúncios ACTIVE |
| `/anuncio/[id]` | pública | Detalhe + imagens |
| `/login` `/cadastro` | pública | MarketplaceBuyer |
| `/checkout?listingId=` | buyer | Compra simples |
| `/pedidos` | buyer | Histórico com empresa |

## GraphQL

- `publicListings(search, channel)`
- `publicListing(id)`
- `registerMarketplaceBuyer` / `loginMarketplaceBuyer` / `meMarketplaceBuyer`
- `createMarketplaceOrder(listingId, quantity)`
- `myMarketplaceOrders`

## Rastreio de empresa

`companyId` no pedido = `listing.companyId`. UI nunca envia `companyId` no checkout.
