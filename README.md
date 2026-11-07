# ZAI 26Z – pomiary z czujników

Aplikacja zbierająca i prezentująca serie wyników pomiarów. Etap 1: serwer REST API (Node.js, Express, MySQL) i generator danych.
Kontrakt API: `pliki_pomocnicze/zai-api-26z.yaml`. Diagram bazy danych: `docs/erd.md`.

## Uruchomienie lokalne

1. `npm install`
2. Skopiuj `.env.example` do `.env` i uzupełnij dane bazy oraz `ADMIN_PASSWORD`.
3. `npm run db:init` – tworzy tabele, `npm run db:seed` – tworzy konto administratora.
4. `npm start` (lub `npm run dev`) – API pod adresem http://localhost:3000/api/health
5. `npm test` – testy jednostkowe reguł (bez bazy danych).

Testy kontraktu (prowadzącego): `node pliki_pomocnicze/zai-tests.mjs --app http://localhost:3000 --user admin --pass <hasło> --stage E1`

## Generator danych

Pobiera pomiary ze źródła i wysyła je do API jako czujniki. Źródła: `gios` (pył PM10 z trzech stacji w Warszawie, publiczne API GIOŚ) i `synthetic` (dane wygenerowane).

```
node generator/cli.js setup    --source gios --api <adres API>   # serie i czujniki (raz)
node generator/cli.js backfill --source gios --api <adres API>   # wysyła dostępną historię
node generator/cli.js live     --source gios --api <adres API>   # powtarza co --interval minut
```

`setup` wymaga danych administratora (`ADMIN_USER`, `ADMIN_PASSWORD` lub `--user`, `--password`). Klucze czujników zapisuje w `generator/keys.json` (poza repozytorium). Ponowne uruchomienie nie duplikuje wyników.
