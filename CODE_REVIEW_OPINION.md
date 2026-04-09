# Parere sul codice VolleyRank (2026-04-08)

## Impressione generale

Il progetto ha una base **promettente** per il prodotto (UX chiara e flussi core presenti), ma il codice è ancora in una fase da **prototipo avanzato**, non da release.

## Cosa funziona bene

1. **Struttura funzionale del dominio**
   - I flussi principali del prodotto sono già visibili: dashboard, scouting live, roster, leaderboard, profilo atleta.

2. **Separazione logica discreta in alcune aree**
   - La logica di stato partita (`reduceMatchState`) e il rating sono separati dalla UI.
   - `eventStore` prova a gestire cache + persistenza con rollback.

3. **Buona velocità di iterazione**
   - Uso di mock/localStorage utile per prototipazione rapida.

## Debolezze principali

1. **Integrità del progetto compromessa (build/runtime bloccati)**
   - Import verso moduli mancanti (`lib/repositories`, `services/official_competition_sync/*`).

2. **Boundary frontend/backend non ancora stabilizzato**
   - Alcuni componenti hanno ancora dipendenze da repository assenti o in transizione.

3. **Assenza di quality gates**
   - Nessuno script `test` e nessuna evidenza di CI automatizzata.

4. **Debito tecnico su affidabilità prodotto**
   - Senza test su event sourcing/scouting live, il rischio regressioni è alto.

## Parere tecnico sintetico

- **Visione prodotto:** 8/10
- **Qualità architettura attuale:** 5/10
- **Prontezza per beta privata:** 3/10
- **Prontezza App Store / Play Store:** 1/10

## Cosa fare subito (ordine consigliato)

1. Ripristinare i moduli mancanti e rimettere verde `npm run build` e `npm run dev`.
2. Definire e implementare `lib/repositories` come unico boundary dati.
3. Aggiungere test minimi su `matchEngine`, `ratingSystem`, `eventStore`.
4. Introdurre CI con gate obbligatori (build + test).
5. Scegliere strategia mobile (Capacitor breve termine o app nativa).

## Conclusione

Il codice **non è messo male come direzione**, ma oggi è fragile per produzione. Prima di parlare di “software d’uso comune” serve consolidare fondamenta tecniche (build, test, affidabilità) e solo dopo accelerare su crescita/distribuzione.
