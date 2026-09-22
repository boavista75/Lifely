import { randomBytes, createHash } from "node:crypto";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { serve } from "@hono/node-server";
import { getConnInfo } from "@hono/node-server/conninfo";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Hono } from "hono";
import type { Context, Next } from "hono";
import argon2 from "argon2";
import { initDb, pool } from "./db.js";
import {
  InputError,
  mimeAllowed,
  parseFinances,
  parseIdList,
  parseItem,
  parseNode,
  parseNote,
} from "./validate.js";

const PORT = Number(process.env.PORT ?? 3001);
const MEDIA_DIR = process.env.MEDIA_DIR ?? "/data/media";
const COOKIE = "lifely_session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_MEDIA = 90 * 1024 * 1024;
const MAX_JSON = 32 * 1024 * 1024;
const MAX_AVATAR = 2 * 1024 * 1024;
const AVATAR_FILE = ".profile-avatar";

type User = {
  id: string;
  username: string;
  email: string;
  avatarUpdatedAt: string | null;
  avatarMime: string | null;
  locale: "sr" | "en";
};

type UserRow = {
  id: string;
  username: string;
  email: string;
  avatar_updated_at: Date | string | null;
  avatar_mime: string | null;
  locale: string | null;
};

type AppEnv = { Variables: { user: User } };

const app = new Hono<AppEnv>();
const hits = new Map<string, { count: number; reset: number }>();

function allowedOrigins(): string[] {
  return (process.env.APP_ORIGIN ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function clientIp(c: Context): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return getConnInfo(c).remote.address ?? "unknown";
}

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  row.count += 1;
  return row.count <= max;
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "Lax" as const,
    path: "/",
    maxAge: SESSION_MS / 1000,
  };
}

function sameOrigin(c: Context): boolean {
  const origin = c.req.header("origin");
  const allowed = allowedOrigins();
  return Boolean(origin && allowed.includes(origin));
}

async function readUser(token: string | undefined): Promise<User | null> {
  if (!token || token.length < 32) return null;
  const result = await pool.query<UserRow>(
    `select u.id, u.username, u.email, u.avatar_updated_at, u.avatar_mime, u.locale
     from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now()`,
    [tokenHash(token)],
  );
  const row = result.rows[0];
  return row ? toUser(row) : null;
}

async function issueSession(c: Context, userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `insert into sessions (token_hash, user_id, expires_at) values ($1, $2, now() + interval '30 days')`,
    [tokenHash(token), userId],
  );
  setCookie(c, COOKIE, token, cookieOptions());
}

function publicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUpdatedAt: user.avatarUpdatedAt,
    locale: user.locale,
  };
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatarUpdatedAt: row.avatar_updated_at ? new Date(row.avatar_updated_at).toISOString() : null,
    avatarMime: row.avatar_mime,
    locale: row.locale === "en" ? "en" : "sr",
  };
}

function localeOk(value: unknown): value is "sr" | "en" {
  return value === "sr" || value === "en";
}

const USER_RETURNING = "id, username, email, avatar_updated_at, avatar_mime, locale";

function usernameOk(value: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,31}$/.test(value);
}

function emailOk(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function passwordOk(value: string): boolean {
  return value.length >= 10 && value.length <= 200;
}

async function requireUser(c: Context<AppEnv>, next: Next) {
  if (c.req.method !== "GET" && c.req.method !== "HEAD" && !sameOrigin(c)) {
    return c.json({ error: "Nedozvoljen izvor." }, 403);
  }
  const user = await readUser(getCookie(c, COOKIE));
  if (!user) return c.json({ error: "Prijava je istekla." }, 401);
  c.set("user", user);
  await next();
}

app.get("/api/health", (c) => c.json({ ok: true }));

app.post("/api/auth/register", async (c) => {
  if (!sameOrigin(c)) return c.json({ error: "Nedozvoljen izvor." }, 403);
  if (!rateLimit(`register:${clientIp(c)}`, 5, 60 * 60 * 1000)) {
    return c.json({ error: "Previše pokušaja. Sačekaj pa probaj ponovo." }, 429);
  }
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Podaci nisu ispravni." }, 400);
  const username = String((body as { username?: unknown }).username ?? "").trim().toLowerCase();
  const email = String((body as { email?: unknown }).email ?? "").trim().toLowerCase();
  const password = String((body as { password?: unknown }).password ?? "");
  const locale = localeOk((body as { locale?: unknown }).locale)
    ? (body as { locale: "sr" | "en" }).locale
    : "sr";
  if (!usernameOk(username)) {
    return c.json({ error: "Korisničko ime: 3–32 znaka, slova, brojevi, _ ili -." }, 400);
  }
  if (!emailOk(email)) return c.json({ error: "Email nije ispravan." }, 400);
  if (!passwordOk(password)) return c.json({ error: "Lozinka mora imati bar 10 znakova." }, 400);
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  try {
    const inserted = await pool.query<UserRow>(
      `insert into users (username, email, password_hash, locale) values ($1, $2, $3, $4)
       returning ${USER_RETURNING}`,
      [username, email, passwordHash, locale],
    );
    const user = inserted.rows[0];
    if (!user) return c.json({ error: "Nalog nije napravljen." }, 500);
    await issueSession(c, user.id);
    return c.json({ user: publicUser(toUser(user)) });
  } catch (error) {
    if (isUnique(error)) return c.json({ error: "Korisničko ime ili email je zauzet." }, 409);
    throw error;
  }
});

app.post("/api/auth/login", async (c) => {
  if (!sameOrigin(c)) return c.json({ error: "Nedozvoljen izvor." }, 403);
  if (!rateLimit(`login:${clientIp(c)}`, 10, 15 * 60 * 1000)) {
    return c.json({ error: "Previše pokušaja. Sačekaj pa probaj ponovo." }, 429);
  }
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Podaci nisu ispravni." }, 400);
  const identifier = String((body as { identifier?: unknown }).identifier ?? "").trim().toLowerCase();
  const password = String((body as { password?: unknown }).password ?? "");
  const result = await pool.query<UserRow & { password_hash: string }>(
    `select id, username, email, password_hash, avatar_updated_at, avatar_mime, locale from users
     where username = $1 or email = $1`,
    [identifier],
  );
  const user = result.rows[0];
  const hash = user?.password_hash ?? dummyHash();
  const match = await argon2.verify(hash, password).catch(() => false);
  if (!user || !match) {
    return c.json({ error: "Pogrešno korisničko ime ili lozinka." }, 401);
  }
  await issueSession(c, user.id);
  return c.json({ user: publicUser(toUser(user)) });
});

app.post("/api/auth/logout", async (c) => {
  if (!sameOrigin(c)) return c.json({ error: "Nedozvoljen izvor." }, 403);
  const token = getCookie(c, COOKIE);
  if (token) await pool.query(`delete from sessions where token_hash = $1`, [tokenHash(token)]);
  deleteCookie(c, COOKIE, {
    path: "/",
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "Lax",
  });
  return c.json({ ok: true });
});

app.get("/api/auth/me", async (c) => {
  const user = await readUser(getCookie(c, COOKIE));
  if (!user) return c.json({ user: null });
  return c.json({ user: publicUser(user) });
});

app.post("/api/auth/password", requireUser, async (c) => {
  if (!rateLimit(`password:${c.get("user").id}`, 5, 15 * 60 * 1000)) {
    return c.json({ error: "Previše pokušaja. Sačekaj pa probaj ponovo." }, 429);
  }
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Podaci nisu ispravni." }, 400);
  const current = String((body as { current?: unknown }).current ?? "");
  const next = String((body as { next?: unknown }).next ?? "");
  if (!passwordOk(next)) return c.json({ error: "Nova lozinka mora imati bar 10 znakova." }, 400);
  const user = c.get("user");
  const result = await pool.query<{ password_hash: string }>(
    `select password_hash from users where id = $1`,
    [user.id],
  );
  const hash = result.rows[0]?.password_hash;
  if (!hash || !(await argon2.verify(hash, current).catch(() => false))) {
    return c.json({ error: "Trenutna lozinka nije tačna." }, 401);
  }
  const passwordHash = await argon2.hash(next, { type: argon2.argon2id });
  await pool.query(`update users set password_hash = $1 where id = $2`, [passwordHash, user.id]);
  await pool.query(`delete from sessions where user_id = $1`, [user.id]);
  await issueSession(c, user.id);
  return c.json({ ok: true });
});

app.post("/api/auth/locale", requireUser, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);
  const locale = body && typeof body === "object" ? (body as { locale?: unknown }).locale : null;
  if (!localeOk(locale)) return c.json({ error: "Podaci nisu ispravni." }, 400);
  const updated = await pool.query<UserRow>(
    `update users set locale = $1 where id = $2 returning ${USER_RETURNING}`,
    [locale, user.id],
  );
  const next = updated.rows[0];
  if (!next) return c.json({ error: "Podaci nisu ispravni." }, 500);
  return c.json({ user: publicUser(toUser(next)) });
});

app.post("/api/auth/username", requireUser, async (c) => {
  const user = c.get("user");
  if (!rateLimit(`username:${user.id}`, 10, 15 * 60 * 1000)) {
    return c.json({ error: "Previše pokušaja. Sačekaj pa probaj ponovo." }, 429);
  }
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Podaci nisu ispravni." }, 400);
  const username = String((body as { username?: unknown }).username ?? "").trim().toLowerCase();
  if (!usernameOk(username)) {
    return c.json({ error: "Korisničko ime: 3–32 znaka, slova, brojevi, _ ili -." }, 400);
  }
  if (username === user.username) return c.json({ user: publicUser(user) });
  try {
    const updated = await pool.query<UserRow>(
      `update users set username = $1 where id = $2 returning ${USER_RETURNING}`,
      [username, user.id],
    );
    const next = updated.rows[0];
    if (!next) return c.json({ error: "Korisničko ime nije promenjeno." }, 500);
    return c.json({ user: publicUser(toUser(next)) });
  } catch (error) {
    if (isUnique(error)) return c.json({ error: "Korisničko ime je zauzeto." }, 409);
    throw error;
  }
});

app.put("/api/auth/avatar", requireUser, async (c) => {
  const user = c.get("user");
  if (!rateLimit(`avatar:${user.id}`, 20, 15 * 60 * 1000)) {
    return c.json({ error: "Previše pokušaja. Sačekaj pa probaj ponovo." }, 429);
  }
  const length = Number(c.req.header("content-length") ?? 0);
  if (Number.isFinite(length) && length > MAX_AVATAR) {
    return c.json({ error: "Slika je prevelika (maks. 2 MB)." }, 413);
  }
  const bytes = Buffer.from(await c.req.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_AVATAR) {
    return c.json({ error: "Slika je prevelika (maks. 2 MB)." }, 413);
  }
  const mime = imageKind(bytes);
  if (!mime) return c.json({ error: "Izaberi JPG, PNG ili WebP sliku." }, 400);
  const dir = join(MEDIA_DIR, user.id);
  await mkdir(dir, { recursive: true });
  const finalPath = avatarPath(user.id);
  const tempPath = `${finalPath}.tmp`;
  await writeFile(tempPath, bytes);
  try {
    const updated = await pool.query<UserRow>(
      `update users set avatar_mime = $1, avatar_updated_at = now()
       where id = $2
       returning ${USER_RETURNING}`,
      [mime, user.id],
    );
    await rename(tempPath, finalPath);
    const next = updated.rows[0];
    if (!next) return c.json({ error: "Slika nije sačuvana." }, 500);
    return c.json({ user: publicUser(toUser(next)) });
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
});

app.get("/api/auth/avatar", requireUser, async (c) => {
  const user = c.get("user");
  if (!user.avatarUpdatedAt || !user.avatarMime) return c.json({ error: "Slika ne postoji." }, 404);
  const path = avatarPath(user.id);
  try {
    await access(path);
  } catch {
    return c.json({ error: "Slika ne postoji." }, 404);
  }
  const stream = createReadStream(path);
  return c.body(Readable.toWeb(stream) as ReadableStream, 200, {
    "content-type": user.avatarMime,
    "cache-control": "private, max-age=86400",
    "x-content-type-options": "nosniff",
  });
});

app.delete("/api/auth/avatar", requireUser, async (c) => {
  const user = c.get("user");
  await rm(avatarPath(user.id), { force: true });
  const updated = await pool.query<UserRow>(
    `update users set avatar_mime = null, avatar_updated_at = null
     where id = $1
     returning ${USER_RETURNING}`,
    [user.id],
  );
  const next = updated.rows[0];
  if (!next) return c.json({ error: "Slika nije uklonjena." }, 500);
  return c.json({ user: publicUser(toUser(next)) });
});

app.get("/api/state", requireUser, async (c) => {
  const userId = c.get("user").id;
  const [items, notes, nodes, finances, media] = await Promise.all([
    pool.query<{ data: unknown }>(`select data from items where user_id = $1`, [userId]),
    pool.query<{ data: unknown }>(`select data from notes where user_id = $1`, [userId]),
    pool.query<{ data: unknown }>(`select data from kb_nodes where user_id = $1`, [userId]),
    pool.query<{ data: unknown }>(`select data from finances where user_id = $1`, [userId]),
    pool.query<{ id: string }>(`select id from media where user_id = $1`, [userId]),
  ]);
  return c.json({
    items: items.rows.map((row) => row.data),
    notes: notes.rows.map((row) => row.data),
    nodes: nodes.rows.map((row) => row.data),
    finances: finances.rows[0]?.data ?? null,
    mediaIds: media.rows.map((row) => row.id),
  });
});

app.post("/api/sync", requireUser, async (c) => {
  const length = Number(c.req.header("content-length") ?? 0);
  if (length > MAX_JSON) return c.json({ error: "Zahtev je prevelik." }, 413);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Podaci nisu ispravni." }, 400);
  try {
    const userId = c.get("user").id;
    const items = parsePatch((body as { items?: unknown }).items, parseItem);
    const notes = parsePatch((body as { notes?: unknown }).notes, parseNote);
    const nodes = parsePatch((body as { nodes?: unknown }).nodes, parseNode);
    const financesRaw = (body as { finances?: unknown }).finances;
    const finances = financesRaw == null ? null : parseFinances(financesRaw);
    const client = await pool.connect();
    try {
      await client.query("begin");
      await applyPatch(client, "items", userId, items);
      await applyPatch(client, "notes", userId, notes);
      await applyPatch(client, "kb_nodes", userId, nodes);
      if (finances) {
        await client.query(
          `insert into finances (user_id, data, updated_at) values ($1, $2::jsonb, now())
           on conflict (user_id) do update set data = excluded.data, updated_at = now()`,
          [userId, JSON.stringify(finances)],
        );
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
    return c.json({ ok: true });
  } catch (error) {
    if (error instanceof InputError) return c.json({ error: error.message }, 400);
    throw error;
  }
});

app.put("/api/media/:id", requireUser, async (c) => {
  const userId = c.get("user").id;
  let mediaId: string;
  try {
    mediaId = parseIdList([c.req.param("id")])[0] ?? "";
  } catch (error) {
    if (error instanceof InputError) return c.json({ error: error.message }, 400);
    throw error;
  }
  const mime = c.req.header("x-lifely-mime") ?? "application/octet-stream";
  if (!mimeAllowed(mime)) return c.json({ error: "Ovaj tip fajla nije dozvoljen." }, 400);
  const length = Number(c.req.header("content-length") ?? 0);
  if (!Number.isFinite(length) || length <= 0 || length > MAX_MEDIA) {
    return c.json({ error: "Fajl je prevelik (maks. 90 MB)." }, 413);
  }
  const bytes = Buffer.from(await c.req.arrayBuffer());
  if (bytes.byteLength > MAX_MEDIA) return c.json({ error: "Fajl je prevelik (maks. 90 MB)." }, 413);
  const dir = join(MEDIA_DIR, userId);
  await mkdir(dir, { recursive: true });
  const finalPath = join(dir, mediaId);
  const tempPath = `${finalPath}.tmp`;
  await writeFile(tempPath, bytes);
  try {
    await pool.query(
      `insert into media (user_id, id, mime, size) values ($1, $2, $3, $4)
       on conflict (user_id, id) do update set mime = excluded.mime, size = excluded.size`,
      [userId, mediaId, mime, bytes.byteLength],
    );
    await rename(tempPath, finalPath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
  return c.json({ id: mediaId });
});

app.get("/api/media/:id", requireUser, async (c) => {
  const userId = c.get("user").id;
  const mediaId = mediaParam(c.req.param("id"));
  if (!mediaId) return c.json({ error: "Fajl ne postoji." }, 404);
  const result = await pool.query<{ mime: string }>(
    `select mime from media where user_id = $1 and id = $2`,
    [userId, mediaId],
  );
  const row = result.rows[0];
  if (!row) return c.json({ error: "Fajl ne postoji." }, 404);
  const path = join(MEDIA_DIR, userId, mediaId);
  try {
    await access(path);
  } catch {
    return c.json({ error: "Fajl ne postoji." }, 404);
  }
  const stream = createReadStream(path);
  return c.body(Readable.toWeb(stream) as ReadableStream, 200, {
    "content-type": row.mime,
    "cache-control": "private, max-age=3600",
    "x-content-type-options": "nosniff",
  });
});

app.delete("/api/media/:id", requireUser, async (c) => {
  const userId = c.get("user").id;
  const mediaId = mediaParam(c.req.param("id"));
  if (!mediaId) return c.json({ ok: true });
  await pool.query(`delete from media where user_id = $1 and id = $2`, [userId, mediaId]);
  await rm(join(MEDIA_DIR, userId, mediaId), { force: true });
  return c.json({ ok: true });
});

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Server nije uspeo da sačuva podatke." }, 500);
});

function parsePatch<T extends { id: string; updatedAt: string }>(
  value: unknown,
  parse: (entry: unknown) => T,
): { upsert: T[]; deleteIds: string[] } {
  if (value == null) return { upsert: [], deleteIds: [] };
  if (typeof value !== "object") throw new InputError("Izmene nisu ispravne.");
  const record = value as { upsert?: unknown; deleteIds?: unknown };
  const upsertRaw = record.upsert ?? [];
  if (!Array.isArray(upsertRaw)) throw new InputError("Izmene nisu ispravne.");
  if (upsertRaw.length > 5000) throw new InputError("Previše izmena odjednom.");
  const upsert = upsertRaw.map(parse);
  const deleteIds = record.deleteIds == null ? [] : parseIdList(record.deleteIds);
  const keep = new Set(upsert.map((entry) => entry.id));
  return { upsert, deleteIds: deleteIds.filter((entry) => !keep.has(entry)) };
}

async function applyPatch(
  client: import("pg").PoolClient,
  table: "items" | "notes" | "kb_nodes",
  userId: string,
  patch: { upsert: { id: string; updatedAt: string }[]; deleteIds: string[] },
): Promise<void> {
  if (patch.deleteIds.length > 0) {
    await client.query(`delete from ${table} where user_id = $1 and id = any($2::text[])`, [
      userId,
      patch.deleteIds,
    ]);
  }
  for (const row of patch.upsert) {
    await client.query(
      `insert into ${table} (user_id, id, data, updated_at) values ($1, $2, $3::jsonb, $4)
       on conflict (user_id, id) do update set data = excluded.data, updated_at = excluded.updated_at`,
      [userId, row.id, JSON.stringify(row), row.updatedAt],
    );
  }
}

function isUnique(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

let placeholderHash = "";
function dummyHash(): string {
  return placeholderHash;
}

async function seedUser(): Promise<void> {
  const username = process.env.SEED_USERNAME?.trim().toLowerCase() ?? "";
  const email = process.env.SEED_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.SEED_PASSWORD ?? "";
  if (!username || !email || !password) {
    console.log("Seed nalog nije podešen (SEED_USERNAME, SEED_EMAIL, SEED_PASSWORD).");
    return;
  }
  if (!usernameOk(username) || !emailOk(email) || !passwordOk(password)) {
    console.error("Seed nalog ima neispravne podatke i nije kreiran.");
    return;
  }
  const existing = await pool.query(`select id from users where username = $1 or email = $2`, [
    username,
    email,
  ]);
  if (existing.rowCount) {
    console.log(`Seed nalog već postoji (${username}).`);
    return;
  }
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await pool.query(
    `insert into users (username, email, password_hash) values ($1, $2, $3)`,
    [username, email, passwordHash],
  );
  console.log(`Seed nalog je kreiran (${username}).`);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL nije postavljen.");
  if (allowedOrigins().length === 0) throw new Error("APP_ORIGIN nije postavljen.");
  placeholderHash = await argon2.hash(randomBytes(24).toString("hex"), { type: argon2.argon2id });
  await initDb();
  await seedUser();
  await mkdir(MEDIA_DIR, { recursive: true });
  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`Lifely API sluša na ${PORT}`);
  });
}

function mediaParam(value: string | undefined): string | null {
  if (!value || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)) return null;
  return value;
}

function avatarPath(userId: string): string {
  return join(MEDIA_DIR, userId, AVATAR_FILE);
}

function imageKind(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

void main();
