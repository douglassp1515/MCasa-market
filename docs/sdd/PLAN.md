# Plano — MCasa market

## Escopo base (F0.5)

| Item | Critério |
|---|---|
| Vitrine `/` | Lista `publicListings` (ACTIVE) com empresa + preço + thumbnail |
| Detalhe `/anuncio/[id]` | `publicListing` + imagens |
| Auth `/login` `/cadastro` | JWT MarketplaceBuyer |
| Checkout `/checkout` | Exige login; `createMarketplaceOrder(listingId, quantity)` |
| Pedidos `/pedidos` | Lista do comprador com nome da empresa |

## Fora do escopo base

- Pagamento real, carrinho multi-empresa, OAuth social
