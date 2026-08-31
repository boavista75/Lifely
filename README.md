# Lifely

Personal life OS — calendar, todos, notes, knowledge, and finances.

**[English](#english)** · **[Srpski](#srpski)**

The UI is **Serbian (Latin)**. There is currently no account and no server. Everything stays in this browser on this device.

---

## English

Lifely is a personal web app for running a day: calendar and todos, notes, a knowledge wiki, and (soon) finances. It is designed and optimized for phone and desktop — a bottom tab bar on mobile, a sidebar on wider screens — and can be installed as a PWA from the home screen.

### Status

| Module | Status |
| --- | --- |
| Calendar | Ready |
| Todo | Ready |
| Notes | Ready |
| Knowledge | Ready |
| Finances | Placeholder — coming soon |
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

#### Also

- Confirm before deleting an item, note, folder, or page
- Honors `prefers-reduced-motion`
- Safe-area insets for phones with a home indicator

### Data and privacy

Everything is local to this browser:

| What | Where |
| --- | --- |
| Items, notes, knowledge, active tab, theme | `localStorage` |
| Knowledge images and video | `IndexedDB` (`lifely-media`) |

There is no sync across devices. A different browser, another phone, or clearing site data means a different (or empty) dataset. There is no backup off the device.

---

## Srpski

Lifely je lična web aplikacija za organizaciju dana: kalendar i todo, beleške, baza znanja i (uskoro) finansije. Interfejs je na **srpskom (latinica)**. Dizajnirana i optimizovana je za telefon i desktop.

Trenutno nema naloga i servera. Sve ostaje u browseru na tom uređaju.

### Stanje

| Modul | Status |
| --- | --- |
| Kalendar | Radi |
| Todo | Radi |
| Notes | Radi |
| Knowledge | Radi |
| Finansije | Placeholder — „stiže uskoro“ |
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

#### Ostalo

- Potvrda pre brisanja stavke, beleške, foldera ili stranice
- `prefers-reduced-motion` se poštuje
- Safe area inseti za telefone sa home indikatorom

### Podaci i privatnost

Sve je lokalno, u ovom browseru:

| Šta | Gde |
| --- | --- |
| Stavke, beleške, knowledge, aktivni tab, tema | `localStorage` |
| Slike i video u knowledge | `IndexedDB` (`lifely-media`) |

Nema sinhronizacije između uređaja. Drugi browser, drugi telefon ili brisanje podataka sajta = drugi (ili prazan) skup podataka. Nema backup-a van uređaja.

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
npm run dev
```

The app opens at the URL Vite prints (usually `http://localhost:5173`).

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
