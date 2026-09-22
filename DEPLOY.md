# Postavljanje Lifely online

Dok nema VPS-a, baza i aplikacija rade na ovom računaru.

Interfejs baze (isto što je phpMyAdmin za MySQL) je na [http://127.0.0.1:8088](http://127.0.0.1:8088). Otvara se odmah, bez posebne prijave. Vidi samo Postgres na ovom računaru. Ako se posle restarta ne otvori:

```bash
.data/bin/pgweb_linux_amd64 --bind=127.0.0.1 --listen=8088 --url="$DATABASE_URL"
```

Pokreni to iz korena projekta, posle `source .env`.

Aplikacija je na [http://localhost:5173](http://localhost:5173). Kalendar, beleške, knowledge, finansije i fajlovi upisuju se u bazu pod nalogom koji je prijavljen. Tema, paleta i aktivni tab ostaju na uređaju.

Donji deo je za kasnije, kad bude VPS i domen.

Lozinka se ne upisuje u git. Stoji samo u `.env` na mašini koja pokreće Docker.

## 1. Šta treba na računaru i na VPS-u

- [Docker](https://docs.docker.com/engine/install/) i Docker Compose
- Node.js 20 ili noviji, samo na računaru gde već imaš podatke u browseru (prenos na nalog)
- Domen koji koristi Cloudflare nameservere
- Hetzner VPS (Ubuntu). Dovoljan je najmanji plan sa 2 GB RAM-a

Na VPS-u, posle prijave:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"
```

Odjavi se i prijavi ponovo da grupa `docker` važi.

Firewall: otvoreni su samo SSH, HTTP i HTTPS. Postgres i Adminer slušaju samo na `127.0.0.1` samog servera.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 2. Prenos postojećih podataka

`localStorage` i `IndexedDB` pripadaju adresi na kojoj si do sada otvarao Lifely, najčešće `http://localhost:5173`. Novi domen te podatke ne vidi. Zato se prenos radi **na ovom računaru, pre nego što baza ode na VPS**.

U korenu projekta:

```bash
cp .env.example .env
```

U `.env` upiši:

- `POSTGRES_PASSWORD` — dugačka slučajna lozinka baze (nije lozinka naloga)
- `SEED_PASSWORD` — lozinka naloga `nikola` (najmanje 10 znakova)
- `SEED_USERNAME=nikola`
- `SEED_EMAIL=jovanovicnn02@gmail.com`
- `APP_ORIGIN=http://localhost:5173,http://127.0.0.1:5173`
- `COOKIE_SECURE=false`

Pokreni bazu i API:

```bash
docker compose up -d --build
npm install
npm run dev
```

Otvori `http://localhost:5173` u **istom browseru** u kom su stari podaci. Prijavi se kao `nikola`. Ekran piše „Prenos podataka sa ovog uređaja…“, zatim „Fajlovi“. Kad se kalendar otvori, proveri beleške, knowledge i finansije.

Ta prijava pravi nalog ako ne postoji. Lozinka iz `SEED_PASSWORD` važi samo pri prvom kreiranju. Posle toga menja se u aplikaciji: dugme sa imenom `nikola`, polja za trenutnu i novu lozinku.

Drugi ljudi prave nalog preko „Novi nalog“. Njihov browser ne dobija tvoje stare podatke.

## 3. Kopiranje baze i fajlova na VPS

Na ovom računaru, dok kontejneri rade:

```bash
docker compose exec -T db pg_dump -U lifely -d lifely --no-owner --clean --if-exists > lifely.sql
docker compose cp api:/data/media ./media-backup
```

`lifely.sql` i `media-backup/` sadrže nalog i fajlove. Ne šalji ih nikom i ne stavljaj ih u git.

Na VPS, u folder projekta (git clone), napravi `.env` za javnu adresu:

```bash
POSTGRES_PASSWORD=ista-lozinka-baze-kao-lokalno
APP_ORIGIN=https://tvoj-domen
COOKIE_SECURE=true
SEED_USERNAME=nikola
SEED_EMAIL=jovanovicnn02@gmail.com
SEED_PASSWORD=lozinka-samo-ako-nalog-jos-ne-postoji
DOMAIN=tvoj-domen
ACME_EMAIL=jovanovicnn02@gmail.com
```

`POSTGRES_PASSWORD` mora biti isti kao u dump-u samo ako dump već sadrži uloge sa tom lozinkom. Ovaj dump je `--no-owner` i ne nosi lozinku baze. Na serveru `POSTGRES_PASSWORD` sme da bude nova, dugačka lozinka. Nalog `nikola` je u dump-u i ne zavisi od `SEED_PASSWORD` ako red u `users` već postoji.

Prvi put podigni samo bazu, ubaci dump, pa ostatak:

```bash
docker compose up -d db
docker compose exec -T db psql -U lifely -d lifely < lifely.sql
docker compose --profile prod up -d --build
docker compose cp ./media-backup/. api:/data/media
docker compose exec api chown -R node:node /data/media
```

Ako `chown` ne prođe jer API ne radi kao root, fajlovi i dalje mogu da se čitaju ako su world-readable. Ako slike ne izlaze, na VPS-u:

```bash
docker compose exec -u root api chown -R node:node /data/media
```

Posle ovoga lokalni Docker više nije izvor istine. Dalje izmene idu na server.

## 4. Cloudflare

U Cloudflare-u, za domen:

1. DNS zapis `A`, ime `@` (ili `lifely`), vrednost je javna IPv4 adresa VPS-a, uključen proxy (narandžasti oblak).
2. SSL/TLS režim **Full (strict)**.
3. Uvek HTTPS: SSL/TLS → Edge Certificates → Always Use HTTPS.
4. Pravilo keša: `index.html` i putanja `/api/*` se ne keširaju. Heširani fajlovi u `/assets/` smeju.

Caddy na VPS-u sam traži sertifikat od Let's Encrypt. Ako izdavanje ne uspe dok je oblak narandžast, privremeno isključi proxy (sivi oblak), sačekaj minut, pa:

```bash
docker compose --profile prod restart caddy
docker compose --profile prod logs caddy
```

Kad u logu nema greške sertifikata, vrati narandžasti oblak i Full (strict).

Cloudflare odbija telo veće od 100 MB. Knowledge fajl u aplikaciji staje na 90 MB, video na 80 MB, slika na 12 MB.

Provera:

```bash
curl -I https://tvoj-domen/api/health
```

Očekuje se `200` i JSON `{"ok":true}` ako pitaš bez `-I` (`curl https://tvoj-domen/api/health`).

Otvori `https://tvoj-domen`, prijavi se kao `nikola`. Podaci su oni iz dump-a.

## 5. Interfejs baze na VPS-u

Na ovom računaru interfejs je već na [http://127.0.0.1:8088](http://127.0.0.1:8088). Na VPS-u, kad ga bude, Adminer sluša samo `127.0.0.1:8088`. Sa interneta se ne otvara. Ne menjaj to u `0.0.0.0`.

Na svom računaru otvori tunel (zameni `korisnik` i adresu servera):

```bash
ssh -L 8088:127.0.0.1:8088 korisnik@adresa-vps
```

Ostavi taj terminal otvoren. U browseru otvori:

`http://127.0.0.1:8088`

Polja na prijavi:

| Polje | Vrednost |
| --- | --- |
| System | PostgreSQL |
| Server | `db` |
| Username | `lifely` |
| Password | `POSTGRES_PASSWORD` iz `.env` na serveru |
| Database | `lifely` |

Server je `db`, ne `localhost`. Adminer je u Docker mreži i bazu vidi pod tim imenom.

Posle prijave levo su tabele:

| Tabela | Sadržaj |
| --- | --- |
| `users` | Nalozi. `password_hash` je heš, ne lozinka. |
| `sessions` | Aktivne prijave. Brisanje reda odjavljuje taj browser. |
| `items` | Kalendar i todo. Kolona `data` je JSON jedne stavke. |
| `notes` | Beleške. HTML je u `data`. |
| `kb_nodes` | Folderi, stranice i fajlovi knowledge-a. |
| `finances` | Jedan JSON po nalogu: plata, troškovi, uplate, ušteđevina. |
| `media` | Ime, tip i veličina fajla. Sam fajl je na disku, ne u tabeli. |

Svaki red osim `users` i `sessions` ima `user_id`. To je UUID iz `users.id`. Upit koji meša dva naloga bez tog uslova pokazuje tuđe podatke tebi kao administratoru baze. Aplikacija taj filter radi sama iz sesije.

Klik na ime tabele otvara redove. „Select“ pokreće SQL. Primer, zameni email:

```sql
select id, username, email, created_at from users;
```

Fajlovi na disku:

```bash
docker compose exec api ls -la /data/media
```

Unutra je folder po `user_id`, a u njemu fajlovi čije ime je `id` iz tabele `media`.

### psql u terminalu

Na VPS-u, u folderu projekta:

```bash
docker compose exec db psql -U lifely -d lifely
```

Izlaz je `\q`. Korisne komande: `\dt` lista tabela, `\d items` opisuje kolone.

### DBeaver ili drugi desktop klijent

Na VPS-u je Postgres vezan za `127.0.0.1:5432`. Sa svog računara:

```bash
ssh -L 5433:127.0.0.1:5432 korisnik@adresa-vps
```

Port `5433` je lokalni, da ne sudari sa Postgresom ako ga već imaš na `5432`.

U DBeaver-u, nova konekcija PostgreSQL:

| Polje | Vrednost |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `5433` |
| Database | `lifely` |
| Username | `lifely` |
| Password | lozinka iz `POSTGRES_PASSWORD` |

SSH tunel u samom DBeaver-u radi isto: SSH ka VPS-u, pa host baze `127.0.0.1` i port `5432` (port na serveru, ne 5433).

Ne otvaraj `5432` u `ufw` i ne menjaj bind u `docker-compose.yml` na `0.0.0.0`.

## 6. Bekap

Na VPS-u, s vremena na vreme:

```bash
docker compose exec -T db pg_dump -U lifely -d lifely --no-owner > "lifely-$(date +%F).sql"
docker compose cp api:/data/media "./media-$(date +%F)"
```

Čuvaj oba van servera. Dump bez foldera `media` vraća tekst, ali ne i slike.

Hetzner snapshot diska je drugi sloj, pored ovoga.

## 7. Šta ostaje lokalno

Tema, paleta, širina sidebara i aktivni tab i dalje su u browseru. Podsetnici za finansije traže dozvolu za notifikacije na tom uređaju.

Odjava je na dugmetu sa korisničkim imenom. Posle promene lozinke ostaješ prijavljen na tom browseru, a ostale sesije se gase.
