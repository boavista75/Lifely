# Lifely

Personal life OS — calendar, todos, notes, knowledge, and finances.

Lifely je lična web aplikacija za organizaciju dana: kalendar i todo, beleške, baza znanja i (uskoro) finansije. Interfejs je na **srpskom (latinica)**. Dizajnirana i optimizovana je za telefon i desktop.

Trenutno nema naloga i servera. Sve ostaje u browseru na tom uređaju.

## Stanje

| Modul | Status |
| --- | --- |
| Kalendar | Radi |
| Todo | Radi |
| Notes | Radi |
| Knowledge | Radi |
| Finansije | Placeholder — „stiže uskoro“ |
| Svetla / tamna tema | Radi |

## Šta aplikacija radi

Jedna stavka (naslov, datum, opciono vreme) živi i u kalendaru i u todo listi. Može da se veže za belešku i/ili knowledge stranicu, pa se moduli preklapaju umesto da budu odvojeni silosi.

### Kalendar

- Prikaz **meseca** ili **nedelje** (nedelja počinje ponedeljkom).
- Navigacija strelicama, dugme **Danas**, srpski nazivi meseci.
- Dan otvara sheet sa stavkama tog datuma: dodavanje, označavanje kao završeno, **Za sutra**, brisanje, prečice do vezane beleške ili knowledge stranice.
- Nova ili postojeća stavka se uređuje u sheet-u: naziv, datum, vreme (**bez vremena** / **samo početak** / **od–do**), veza na notes i knowledge.

### Todo

Iste stavke, drugačiji pregled:

- Brzi unos za **danas**
- Grupe **Ranije**, **Danas**, **Predstojeće** (po datumu), **Završeno**

### Notes

- Lista beleški sa naslovom i preview-om
- TipTap editor: H1–H3, bold / italic / underline, boja teksta i markera, liste
- Automatski naslov po datumu kreiranja ako ostane prazan
- Prazna neimenovana beleška se briše pri povratku na listu
- Na dnu editora: stavke koje vode na tu belešku

### Knowledge

Wiki-struktura, ne flat lista:

- Folderi i stranice, proizvoljna dubina
- Pretraga stranica, stablo u exploreru (na desktopu i u sidebaru dok je stranica otvorena)
- Isti rich text kao notes, plus:
  - slike (do 12 MB) i video (do 80 MB), drag-and-drop, poravnanje, crop slike
  - unutrašnji linkovi ka drugim knowledge stranicama
  - **Pronađi u tekstu** (Enter / Shift+Enter)
- Povezane kalendar/todo stavke na dnu stranice

### Ostalo

- Potvrda pre brisanja stavke, beleške, foldera ili stranice
- `prefers-reduced-motion` se poštuje
- Safe area inseti za telefone sa home indikatorom

## Podaci i privatnost

Sve je lokalno, u ovom browseru:

| Šta | Gde |
| --- | --- |
| Stavke, beleške, knowledge, aktivni tab, tema | `localStorage` |
| Slike i video u knowledge | `IndexedDB` (`lifely-media`) |

Nema sinhronizacije između uređaja. Drugi browser, drugi telefon ili brisanje podataka sajta = drugi (ili prazan) skup podataka. Nema backup-a van uređaja.

## Tech stack

- [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) 8
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Zustand](https://github.com/pmndrs/zustand)
- [TipTap](https://tiptap.dev/)
- [Motion](https://motion.dev/)
- [date-fns](https://date-fns.org/) (`sr-Latn`)

## Pokretanje

Potreban je [Node.js](https://nodejs.org/) 20+.

```bash
npm install
npm run dev
```

App se otvara na adresi koju Vite ispiše (obično `http://localhost:5173`).

```bash
npm run build      # produkcioni build u dist/
npm run preview    # lokalni preview builda
npm run lint       # oxlint
```

Za PWA: u mobilnom browseru **Add to Home Screen** / **Dodaj na početni ekran**. To ne prenosi podatke na drugi uređaj.

## Struktura

```
src/
  screens/       Kalendar, Todo, Notes, Knowledge, Finansije
  components/    shell, sheetovi, editor, knowledge stablo
  store/         Zustand store-ovi
  lib/           storage, datumi, TipTap, mediji
  types.ts
```

Statički fajlovi (ikonice, manifest) su u `public/`.
