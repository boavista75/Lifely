import { getLocale, isLocale, setLocale, useLocaleStore, type Locale } from "@/i18n/locale";
import { messages, type MessageKey } from "@/i18n/messages";

export { getLocale, isLocale, setLocale, useLocaleStore, type Locale };
export type { MessageKey };

type Vars = Record<string, string | number>;

function fill(template: string, vars: Vars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function text(key: MessageKey, vars?: Vars): string {
  const template = messages[getLocale()][key];
  return vars ? fill(template, vars) : template;
}

export function useI18n() {
  const locale = useLocaleStore((state) => state.locale);
  return { locale, t: text };
}

const serverErrors: Record<string, MessageKey> = {
  "Nedozvoljen izvor.": "error.requestFailed",
  "Prijava je istekla.": "error.sessionExpired",
  "Previše pokušaja. Sačekaj pa probaj ponovo.": "error.rateLimit",
  "Podaci nisu ispravni.": "error.requestFailed",
  "Korisničko ime: 3–32 znaka, slova, brojevi, _ ili -.": "profile.usernameHint",
  "Email nije ispravan.": "error.badEmail",
  "Lozinka mora imati bar 10 znakova.": "auth.passwordHint",
  "Nova lozinka mora imati bar 10 znakova.": "auth.passwordHint",
  "Nalog nije napravljen.": "error.signUpFailed",
  "Korisničko ime ili email je zauzet.": "error.taken",
  "Pogrešno korisničko ime ili lozinka.": "error.badCredentials",
  "Trenutna lozinka nije tačna.": "error.wrongPassword",
  "Korisničko ime nije promenjeno.": "error.usernameFailed",
  "Korisničko ime je zauzeto.": "error.usernameTaken",
  "Slika je prevelika (maks. 2 MB).": "profile.photoLarge",
  "Izaberi JPG, PNG ili WebP sliku.": "profile.photoType",
  "Slika nije sačuvana.": "profile.photoFailed",
  "Slika ne postoji.": "profile.photoFailed",
  "Slika nije uklonjena.": "error.avatarRemoveFailed",
  "Zahtev je prevelik.": "error.requestFailed",
  "Ovaj tip fajla nije dozvoljen.": "error.requestFailed",
  "Fajl je prevelik (maks. 90 MB).": "error.requestFailed",
  "Fajl ne postoji.": "kb.fileMissing",
  "Server nije uspeo da sačuva podatke.": "boot.saveFailed",
  "Server nije dostupan.": "error.serverDown",
  "Zahtev nije uspeo.": "error.requestFailed",
  "Stavka nije ispravna.": "error.requestFailed",
  "Vreme stavke nije ispravno.": "error.requestFailed",
  "Datum stavke nije ispravan.": "error.requestFailed",
  "Beleška nije ispravna.": "error.requestFailed",
  "Knowledge stavka nije ispravna.": "error.requestFailed",
  "Tip knowledge stavke nije ispravan.": "error.requestFailed",
  "Tip fajla nije ispravan.": "error.requestFailed",
  "Veličina fajla nije ispravna.": "error.requestFailed",
  "Iznos nije ispravan.": "error.requestFailed",
  "Iznos je prevelik.": "error.requestFailed",
  "Finansije nisu ispravne.": "error.requestFailed",
  "Plata nije ispravna.": "error.requestFailed",
  "Mesec plate nije ispravan.": "error.requestFailed",
  "Trošak nije ispravan.": "error.requestFailed",
  "Datum troška nije ispravan.": "error.requestFailed",
  "Uplata nije ispravna.": "error.requestFailed",
  "Grupa uplate nije ispravna.": "error.requestFailed",
  "Datum uplate nije ispravan.": "error.requestFailed",
  "Ušteđevina nije ispravna.": "error.requestFailed",
  "Mesec ušteđevine nije ispravan.": "error.requestFailed",
  "Kategorija nije ispravna.": "error.requestFailed",
  "Grupa kategorije nije ispravna.": "error.requestFailed",
  "Previše potvrda.": "error.requestFailed",
  "Mesec nije ispravan.": "error.requestFailed",
  "Datum nije ispravan.": "error.requestFailed",
  "Lista za brisanje nije ispravna.": "error.requestFailed",
  "Previše brisanja odjednom.": "error.requestFailed",
  "Izmene nisu ispravne.": "error.requestFailed",
  "Previše izmena odjednom.": "error.requestFailed",
  "Datum zapisa nije ispravan.": "error.requestFailed",
  "Vreme nije ispravno.": "error.requestFailed",
};

export function localizeError(message: string): string {
  if (getLocale() === "sr") return message;
  const key = serverErrors[message];
  return key ? text(key) : message;
}
