# Lifely

Personal life OS — calendar, todos, notes, knowledge, and finances.

**[English](#english)** · **[Srpski](#srpski)**

The UI is **Serbian (Latin)**. Sign-in and sync need the server from [DEPLOY.md](DEPLOY.md). Theme, palette, and the active tab stay on this device. Calendar, todos, notes, knowledge, and finances belong to the signed-in account.

---

## English

Lifely is a personal web app for running a day: calendar and todos, notes, a knowledge wiki, and finances. It is designed and optimized for phone and desktop — a bottom tab bar on mobile, a sidebar on wider screens — and can be installed as a PWA from the home screen.

### Status

| Module | Status |
| --- | --- |
| Calendar | Ready |
| Todo | Ready |
| Notes | Ready |
| Knowledge | Ready |
| Finances | Ready |
| Light / dark theme | Ready |

### What it does

One item (title, date, optional time) lives in both the calendar and the todo list. It can link to a note and/or a knowledge page, so the modules overlap instead of sitting in separate silos.

#### Calendar

- **Month** or **week** view (week starts on Monday).
- Arrow navigation, a **Today** button, Serbian month names.
- Opening a day shows that date’s items: add, complete, **move to tomorrow**, delete, and shortcuts to a linked note or knowledge page.
- New or existing items are edited in a sheet: title, date, time (**no time** / **start only** / **from–to**), and optional links to notes and knowledge.

#### Todo

Same items, different layout:

- Quick add for **today**
- Groups **Overdue**, **Today**, **Upcoming** (by date), **Done**

#### Notes

- List with title and preview
- TipTap editor: H1–H3, bold / italic / underline, text and highlight color, lists
- Auto title from the creation date if you leave it blank
- An empty untitled note is discarded when you go back to the list
- Linked calendar/todo items appear at the bottom of the editor

#### Knowledge

A wiki, not a flat list:

- Nested folders and pages
- Page search, and a tree in the explorer (on desktop, also in the sidebar while a page is open)
- Same rich text as notes, plus:
  - images (up to 12 MB) and video (up to 80 MB), drag-and-drop, alignment, image crop
  - internal links to other knowledge pages
  - **Find in page** (Enter / Shift+Enter)
- Linked calendar/todo items at the bottom of the page

#### Finances

- Monthly **salary** in RSD, split **50 / 30 / 20**: Dina card (housing), Visa card (wants), cash/savings (locked)
- **Expenses** by category and date; remaining amount per bucket is on the split graphic
- **Payments outside salary** go to one bucket and are not split
- Month history; overwriting a month’s salary resets that month’s expenses
- Optional reminders: enter salary from the 10th, enter expenses at 22:00

#### Also

- Confirm before deleting an item, note, folder, or page
- Honors `prefers-reduced-motion`
- Safe-area insets for phones with a home indicator

### Data and privacy

Everything for an account is stored on the server (PostgreSQL and private files). This browser keeps only device preferences and a cache of media:

| What | Where |
| --- | --- |
| Items, notes, knowledge, finances | Server, scoped to the signed-in account |
| Knowledge images, video, and files | Server, private; cached in `IndexedDB` (`lifely-media`) |
| Active tab, theme, palette, sidebar width | `localStorage` |

A different browser sees the same account after sign-in. See [DEPLOY.md](DEPLOY.md) for Hetzner, Cloudflare, and database access. The first sign-in as `nikola` on a browser that already has Lifely data copies that browser’s data onto the account.

---

## Srpski

Lifely je lična web aplikacija za organizaciju dana: kalendar i todo, beleške, baza znanja i finansije. Interfejs je na **srpskom (latinica)**. Dizajnirana i optimizovana je za telefon i desktop.

Interfejs je na **srpskom (latinica)**. Prijava i sinhronizacija traže server iz [DEPLOY.md](DEPLOY.md). Tema, paleta i aktivni tab ostaju na uređaju. Kalendar, todo, beleške, knowledge i finansije pripadaju nalogu.

### Stanje

| Modul | Status |
| --- | --- |
| Kalendar | Radi |
| Todo | Radi |
| Notes | Radi |
| Knowledge | Radi |
| Finansije | Radi |
| Svetla / tamna tema | Radi |

### Šta aplikacija radi

Jedna stavka (naslov, datum, opciono vreme) živi i u kalendaru i u todo listi. Može da se veže za belešku i/ili knowledge stranicu, pa se moduli preklapaju umesto da budu odvojeni silosi.

#### Kalendar

- Prikaz **meseca** ili **nedelje** (nedelja počinje ponedeljkom).
- Navigacija strelicama, dugme **Danas**, srpski nazivi meseci.
- Dan otvara sheet sa stavkama tog datuma: dodavanje, označavanje kao završeno, **Za sutra**, brisanje, prečice do vezane beleške ili knowledge stranice.
- Nova ili postojeća stavka se uređuje u sheet-u: naziv, datum, vreme (**bez vremena** / **samo početak** / **od–do**), veza na notes i knowledge.

#### Todo

Iste stavke, drugačiji pregled:

- Brzi unos za **danas**
- Grupe **Ranije**, **Danas**, **Predstojeće** (po datumu), **Završeno**

#### Notes

- Lista beleški sa naslovom i preview-om
- TipTap editor: H1–H3, bold / italic / underline, boja teksta i markera, liste
- Automatski naslov po datumu kreiranja ako ostane prazan
- Prazna neimenovana beleška se briše pri povratku na listu
- Na dnu editora: stavke koje vode na tu belešku

#### Knowledge

Wiki-struktura, ne flat lista:

- Folderi i stranice, proizvoljna dubina
- Pretraga stranica, stablo u exploreru (na desktopu i u sidebaru dok je stranica otvorena)
- Isti rich text kao notes, plus:
  - slike (do 12 MB) i video (do 80 MB), drag-and-drop, poravnanje, crop slike
  - unutrašnji linkovi ka drugim knowledge stranicama
  - **Pronađi u tekstu** (Enter / Shift+Enter)
- Povezane kalendar/todo stavke na dnu stranice

#### Finansije

- Mesečna **plata** u RSD, podela **50 / 30 / 20**: Dina kartica (hausings), Visa kartica (želje), keš/ušteđevina (zaključano)
- **Troškovi** po kategoriji i datumu; ostalo po grupi se vidi na grafiku
- **Uplata van plate** ide u jednu grupu i ne deli se 50/30/20
- Istorija meseci; preklop plate za isti mesec resetuje troškove tog meseca
- Opcioni podsetnici: unos plate od 10. u mesecu, unos troškova u 22h

#### Ostalo

- Potvrda pre brisanja stavke, beleške, foldera ili stranice
- `prefers-reduced-motion` se poštuje
- Safe area inseti za telefone sa home indikatorom

### Podaci i privatnost

Podaci naloga su na serveru (PostgreSQL i privatni fajlovi). Browser čuva samo podešavanja uređaja i keš medija:

| Šta | Gde |
| --- | --- |
| Stavke, beleške, knowledge, finansije | Server, samo za prijavljeni nalog |
| Slike, video i fajlovi u knowledge | Server, privatno; keš u `IndexedDB` (`lifely-media`) |
| Aktivni tab, tema, paleta, širina sidebara | `localStorage` |

Drugi browser vidi iste podatke posle prijave. Postavljanje na Hetzner i Cloudflare, i pristup bazi, opisani su u [DEPLOY.md](DEPLOY.md). Prva prijava kao `nikola` na browseru koji već ima podatke prebacuje te podatke na nalog.

---

## Tech stack

- [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) 8
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Zustand](https://github.com/pmndrs/zustand)
- [TipTap](https://tiptap.dev/)
- [Motion](https://motion.dev/)
- [date-fns](https://date-fns.org/) (`sr-Latn`)

## Getting started / Pokretanje

[Node.js](https://nodejs.org/) 20+ is required.

```bash
npm install
cp .env.example .env
# upiši POSTGRES_PASSWORD i SEED_PASSWORD u .env
docker compose up -d --build
npm run dev
```

The app opens at the URL Vite prints (usually `http://localhost:5173`). Sign in there. Production hosting, Cloudflare, and the database UI are in [DEPLOY.md](DEPLOY.md).

Without Docker, start PostgreSQL yourself, set `DATABASE_URL` and `MEDIA_DIR` in `.env`, then run `npm run api` in another terminal.

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build
npm run lint       # oxlint
```

For the PWA: in a mobile browser use **Add to Home Screen** / **Dodaj na početni ekran**. That does not copy data to another device.

## Project structure / Struktura

```
src/
  screens/       Calendar, Todo, Notes, Knowledge, Finances
  components/    shell, sheets, editor, knowledge tree
  store/         Zustand stores
  lib/           storage, dates, TipTap, media
  types.ts
```

Static files (icons, manifest) live in `public/`.
