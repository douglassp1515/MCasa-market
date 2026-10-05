# Docker — MCasa market

Serviço `market` no Compose de `../MCasa-backend`:

- Build: `../MCasa-market`
- Porta host: `3002`
- `NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql`
- `NEXT_PUBLIC_API_URL=http://localhost:3001`

Subir com o stack completo a partir de `MCasa-backend`:

```powershell
docker compose up --build -d
```
