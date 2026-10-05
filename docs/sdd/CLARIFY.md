# Esclarecimentos e riscos — MCasa market

| ID | Risco / ambiguidade | Área | Mitigação / status |
|---|---|---|---|
| M-01 | Catálogo vazio até haver anúncios ACTIVE | produto | Seed demo local marca listings ACTIVE sem chamar MELI/Shopee |
| M-02 | Sessão buyer em localStorage (MVP) | auth | Aceitável na base; migrar para cookie httpOnly depois |
| M-03 | Pedido marketplace separado do Pedido ERP (Person) | dados | `MarketplaceOrder` na base; espelho Person por empresa se fiscal exigir |
| M-04 | Sem pagamento real na 1ª entrega | checkout | Status PENDING; evolução PIX/cartão fora do escopo base |
