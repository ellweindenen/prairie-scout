# Prairie Scout

**Find the right South Dakota hunt — and the lodge that fits it.**

Prairie Scout puts South Dakota hunting lodges in one list, lets you search by the hunt you
want (species, East River vs West River, guided vs DIY, dogs, budget), compare lodges side by
side, and type a hunt in plain words to get ranked lodges with a short reason for each match.

> Example: *"3-day wild pheasant hunt, 4 guys, dogs welcome, under $2,500, near Winner"*
> → ranked lodges with hunt type, price, and why each one matched — not a generic chatbot reply.

Built by Denen Ellwein (Mitchell, SD) as a one-semester MVP.

> ⚠️ **This is the Weeks 1–2 skeleton. All lodges in it are FAKE sample data**
> ("Sample Lodge A" … "H", links to example.com, placeholder prices). Only the town names and
> coordinates are real places. See [TODO for Denen](#todo-for-denen).

---

## Quick start

Requirements: Node.js 20+, npm. Docker is optional (only needed for Postgres).

### Option A — demo without a database (fastest)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `DATABASE_URL` set, the app automatically uses the built-in
sample lodges from `src/data/sampleLodges.ts`, and shows a "Sample data" banner.

### Option B — with Postgres

```bash
npm install
cp .env.example .env          # sets DATABASE_URL for the local Docker database
docker compose up -d          # starts Postgres 16 on localhost:5432
npx prisma migrate dev        # creates the Lodge table
npx prisma db seed            # loads the sample lodges into the database
npm run dev
```

If the database is unreachable, the app logs a warning and falls back to the sample lodges.

### Try the matcher from the command line

```bash
npm run match -- "3-day wild pheasant hunt, 4 guys, dogs welcome, under \$2,500, near Winner"
```

## Tests

```bash
npm test            # runs all Vitest tests once
npm run test:watch  # re-runs tests when files change
npm run typecheck   # TypeScript check
npm run build       # production build (works without a database)
```

Tests live in `tests/`:

- `parser.test.ts` — free text → hunt criteria (species, days, group size, budget, dogs, town…)
- `ranker.test.ts` — ranking, including the pheasant example against the sample lodges
- `filters.test.ts` — list-page filters, URL parsing, and a check that sample data is marked fake

## Pages

| URL | What it does |
| --- | --- |
| `/` | Lodge list with filters (species, region, guided/DIY, dogs, max price). Tick 2–3 lodges → Compare. |
| `/lodges/[id]` | Lodge detail: all fields, source link, "last checked by hand" date. |
| `/compare?ids=a&ids=b` | Side-by-side comparison of 2–3 lodges. |
| `/match?q=...` | "Type your hunt": free-text request → ranked lodges with reasons and warnings. |

## Project structure

```
prairie-scout/
├── docker-compose.yml         # local Postgres
├── .env.example               # DATABASE_URL (copy to .env)
├── prisma/
│   ├── schema.prisma          # Lodge model + enums (Species, Region, HuntStyle)
│   ├── migrations/            # SQL migration for the Lodge table
│   └── seed.ts                # loads sample lodges into the DB
├── scripts/match-demo.ts      # run the matcher from the terminal
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # lodge list + filters
│   │   ├── lodges/[id]/       # lodge detail
│   │   ├── compare/           # side-by-side compare
│   │   └── match/             # "type your hunt"
│   ├── components/            # SampleBadge, LodgeFacts
│   ├── data/sampleLodges.ts   # FAKE demo lodges (replace with real ones)
│   └── lib/
│       ├── types.ts           # Lodge type, species/region labels
│       ├── geo.ts             # SD towns + distance in miles
│       ├── db.ts              # Prisma client
│       ├── lodges/
│       │   ├── source.ts      # DB or sample-data fallback
│       │   └── filters.ts     # list-page filters
│       └── match/
│           ├── types.ts       # HuntCriteria, MatchResult, HuntParser, LodgeRanker
│           ├── parser.ts      # rules-based text parser
│           ├── ranker.ts      # rules-based scorer (weights at the top)
│           └── index.ts       # matchHunt(text, lodges, parser?, ranker?)
└── tests/                     # Vitest tests
```

## How matching works (today)

1. **Parse** (`src/lib/match/parser.ts`): regex rules pull out species, days, group size,
   budget (per person or total), dogs, guided/DIY, East/West River, "wild" birds, and a nearby
   SD town. No AI, no API keys, no network.
2. **Rank** (`src/lib/match/ranker.ts`): lodges that don't offer the species are dropped. Each
   remaining lodge earns points for what fits (budget, dogs, group size, wild birds, style,
   region, package length, distance) and loses points for what doesn't. Score = points earned ÷
   points possible, shown as a % fit. Every result lists its reasons and warnings.
3. If the budget doesn't say "per person" or "total", it's **assumed per person** and the UI says so.

The parser and ranker sit behind two small interfaces (`HuntParser`, `LodgeRanker` in
`src/lib/match/types.ts`). A future LLM version can implement the same interfaces and be passed
to `matchHunt()` — the rules-based version stays as the baseline and the tests keep both honest.
Any LLM version must only use real lodge fields for its reasons (no invented prices or acres).

Sample output for the pheasant example (sample data):

```
1. Sample Lodge A (Winner)   100% — wild pheasant; $2,100 fits $2,500; dogs welcome; 3-day package; in Winner
2. Sample Lodge B (Gregory)   96% — wild pheasant; $1,800 fits; dogs welcome; 24 mi from Winner
3. Sample Lodge D (Mitchell)  78% — wild pheasant; $675 est. for 3 days; dogs welcome; 94 mi away
4. Sample Lodge G (Pierre)    27% — watch out: over budget ($3,000)
5. Sample Lodge H (Aberdeen)  23% — watch out: only takes groups up to 3; 159 mi away
6. Sample Lodge C (Chamberlain) 17% — watch out: preserve birds, no outside dogs
```

## Roadmap (from the pitch)

| Weeks | Goal | Human checkpoint |
| --- | --- | --- |
| 1–2 | List 40 lodges | **I check every row** |
| 3–5 | Search + match | One hunt type first (pheasant) |
| 6–8 | Test the AI | **I write the tests** |
| 9–12 | MVP ready | End of semester |

## Human checkpoints (where AI still fails)

- **AI can invent acres, prices, or APIs** → every listing is reviewed by hand. The `lastChecked`
  field records when; unverified rows show "Not verified yet".
- **AI can miss new GFP dates** → hunting rules, seasons and dates come only from the official
  SD Game, Fish & Parks handbook. The app does not generate regulations.
- **AI can leak private notes** → no personal data goes into the model. The match form asks
  users not to type names or contact info, and the app does not save what is typed.

## TODO for Denen

- [ ] **Replace the sample lodges with ~40 real, verified lodges.** For each one:
  - fill every field in `prisma/schema.prisma` from the lodge's own website/brochure,
  - set `isSample: false`, `sourceUrl` to where you got it, and `lastChecked` to the date you verified it,
  - double-check price, what the price covers (`priceNotes`), package length, dogs policy, max group size.
  - Suggested: put real rows in `prisma/data/lodges.ts` and seed from there; keep
    `src/data/sampleLodges.ts` for tests only.
- [ ] Confirm East River / West River for each lodge (region = which side of the Missouri River
      the lodge is on — e.g. Winner is West River even though it's pheasant country).
- [ ] Commit `package-lock.json` after your first `npm install` (it was left out of the skeleton
      push; dependency versions are pinned exactly in `package.json`).
- [ ] Decide whether the "no database" sample fallback should be turned off in production.
- [ ] Add a real map (e.g. Leaflet + OpenStreetMap) — the detail page currently links to OpenStreetMap.
- [ ] Weeks 3–5: tune `WEIGHTS` in `ranker.ts` for pheasant hunts and add more parser test cases
      from real requests friends would type.
- [ ] Weeks 6–8: if you add an LLM parser, write tests that compare it with the rules parser.
