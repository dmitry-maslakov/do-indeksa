# Do indeksa

Besplatna priprema za prijemni ispit: banka zadataka sa nagoveštajima i rešenjima, probni testovi sa vremenom, test dana, analiza testa i statistika. Prvi ispit je FTN P1 matematika.

Sajt: [doindeksa.rs](https://doindeksa.rs). [English](README.md)

## Lokalno pokretanje

Potrebni su Node 24, pnpm i Docker.

```sh
cp .env.example .env.local
docker compose up -d
pnpm install
pnpm db:migrate
pnpm dev
```

Za prijavu preko Google naloga potrebni su `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET`; sve ostalo radi i bez prijave.

## Licenca

Kod je pod MIT licencom. Sadržaj u `content/` je pod CC BY-NC-SA 4.0.
