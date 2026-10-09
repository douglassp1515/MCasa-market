# Status de tarefas — MCasa market

> Fonte de verdade do que está pronto. Atualizar ao final de cada sessão.
>
> Última atualização: 2026-10-07 (Pedido devolução comprador)

---

## Sessão 2026-10-07 — Pedido de devolução

### Feito
- [x] Minhas compras: pedir devolução com motivo + 1–5 fotos
- [x] Proxy `/api/uploads/return-photos` + mutation `requestMarketplaceOrderReturn`

### Pendente
- [ ] F1 OAuth MELI/Shopee (aguardando sandbox)

---

## Sessão 2026-10-07 — Sessão JWT buyer inválida → logout

### Feito
- [x] `meMarketplaceBuyer` no MarketShell / BuyerProfileShell (mount + focus)
- [x] Token inválido limpa sessão; área `/perfil` redireciona ao login
- [x] `formatGraphqlError` invalida sessão em falha de auth

### Pendente
- [ ] C1 CPF no token MP (aguardando)

---

## Sessão 2026-10-07 — Gate storefront secret

### Feito
- [x] BFF `POST /api/graphql` injeta `X-Mcasa-Storefront-Key`
- [x] Cliente browser usa `/api/graphql` (sem secret na Network)
- [x] `MARKET_STOREFRONT_SECRET` / `GRAPHQL_URL` só no servidor

### Pendente
- [ ] C1 CPF no token MP (aguardando)

---

## Sessão 2026-10-07 — Seletor de variação (R-17)

### Feito
- [x] `publicListing` com `variants` / `variationAxes`
- [x] UI detalhe: escolher variação (estoque/indisponível)
- [x] Carrinho v2 chave `listingId:variantId` + envio no checkout

### Pendente
- [ ] C1 CPF no token MP (aguardando)
- [ ] Sync MELI/Shopee

---

## Sessão 2026-10-06 — A3 PIX + cartão

### Feito
- [x] Checkout com PIX/Cartão (Mercado Pago / simulated)
- [x] Página `/pagamento/[id]`
- [x] Confirmar PIX simulado

---

## Sessão 2026-10-06 — Menu de perfil no header

### Feito
- [x] Removida aba "Perfil" da nav central
- [x] Dropdown à direita: compras, endereços, cupons, sair

---

## Sessão 2026-10-06 — Hub Meu perfil

### Feito
- [x] `/perfil` com menu: Minhas compras, Endereços, Cupons
- [x] `/perfil/compras`, `/perfil/enderecos`, `/perfil/cupons`
- [x] `/pedidos` redireciona para `/perfil/compras`
- [x] Cupons como placeholder até A3/promoções

---

## Sessão 2026-10-06 — Endereços multi + ViaCEP

### Feito
- [x] `/perfil/enderecos` — lista, criar, excluir, padrão (ViaCEP no CEP)
- [x] Checkout escolhe endereço de entrega
- [x] Removido formulário fiscal único do comprador

### Pendente
- [ ] A3 PIX real
- [ ] A4 Admin hero slides

---

## Sessão 2026-10-06 — A1 Carrinho multi-item

### Feito
- [x] Carrinho localStorage + CartProvider
- [x] Página /carrinho + ícone no header com badge
- [x] Adicionar ao carrinho (card + detalhe)
- [x] Checkout multi-item (evoluiu para `createMarketplaceCheckout` em A2)
- [x] Stub de pagamento montado (`paymentStub` + env keys documentadas)

### Pendente
- [x] A2 Split multi-empresa
- [ ] A3 PIX real
- [ ] A4 Admin hero slides

---

## Sessão 2026-10-05 — Hero slides + tema no carrossel

### Feito
- [x] `publicHeroSlides` no client GraphQL
- [x] `HeroBanner` em carrossel
- [x] Slide ativo aplica `CategoryTheme`

### Pendente
- [ ] A3 / A4 (ver acima)

