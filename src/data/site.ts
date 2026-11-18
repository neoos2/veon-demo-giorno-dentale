// Single source of contacts, clinics and hours for the demo (veon/client.json → company.contacts, geography, hours).
// Phones: the numbers visible on /contacts (company.contacts.phones[0..2]). The client has several Kyiv/Lviv numbers
// (call tracking, B-F021, UX-F001): which one is primary is the client's decision (B-R006) — change them only here.

export type CityId = "kyiv" | "lviv" | "krakow";

export interface Phone { display: string; tel: string; }

export interface Clinic {
  street: string;
  landmark?: string;
  /** ISO weekdays when open: 1 = Monday … 7 = Sunday */
  days: number[];
  schedule: string;
  mapQuery: string;
  postalLocality: string;
}

export interface City {
  id: CityId;
  name: string;
  /** locative: «у Києві» */
  inName: string;
  country: string;
  countryCode: "UA" | "PL";
  timeZone: string;
  phone: Phone;
  schedule: string;
  clinics: Clinic[];
}

/** Opening hours, same for every clinic (company.contacts.hours): 9:00–20:00. */
export const OPEN_FROM = 9 * 60;
export const OPEN_TO = 20 * 60;

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];
const MON_SAT = [1, 2, 3, 4, 5, 6];
const MON_FRI = [1, 2, 3, 4, 5];

export const PHONES: Record<CityId, Phone> = {
  kyiv: { display: "+38 (067) 114 73 61", tel: "+380671147361" },
  lviv: { display: "+38 (067) 643 80 36", tel: "+380676438036" },
  krakow: { display: "+48 459 568 020", tel: "+48459568020" },
};

export const MESSENGERS = {
  telegram: "https://telegram.me/+380673934141",
  viber: "viber://chat?number=%2B380673934141",
};

export const EMAIL = "info@giorno-dentale.com";

export const SOCIALS = [
  { name: "Instagram", url: "https://www.instagram.com/giornodentale/" },
  { name: "Facebook", url: "https://www.facebook.com/GiornoDentale" },
  { name: "YouTube", url: "https://www.youtube.com/@giornodentale" },
  { name: "TikTok", url: "https://www.tiktok.com/@giornodentale" },
];

export const LEGAL_NAME = "ТОВ «Джорно Дентале»";

const kyiv = (street: string, landmark: string): Clinic => ({
  street, landmark, days: EVERY_DAY, schedule: "щодня, 9:00–20:00",
  mapQuery: `Giorno Dentale, ${street}, Київ`, postalLocality: "Київ",
});
const lviv = (street: string, landmark: string): Clinic => ({
  street, landmark, days: MON_SAT, schedule: "пн–сб, 9:00–20:00",
  mapQuery: `Giorno Dentale, ${street}, Львів`, postalLocality: "Львів",
});

export const CITIES: City[] = [
  {
    id: "kyiv", name: "Київ", inName: "у Києві", country: "Україна", countryCode: "UA",
    timeZone: "Europe/Kyiv", phone: PHONES.kyiv, schedule: "щодня, 9:00–20:00",
    clinics: [
      kyiv("вул. Є. Чикаленка, 20-А", "м. Театральна"),
      kyiv("пр-т В. Івасюка, 4, корп. 6", "м. Оболонь"),
      kyiv("вул. Є. Сверстюка, 6-А", "м. Лівобережна"),
      kyiv("пр-т Голосіївський, 27", "м. Голосіївська"),
      kyiv("вул. Автозаводська, 99/4", "пл. Т. Шевченка"),
      kyiv("вул. Бульварно-Кудрявська, 9-Б", "Львівська пл."),
    ],
  },
  {
    id: "lviv", name: "Львів", inName: "у Львові", country: "Україна", countryCode: "UA",
    timeZone: "Europe/Kyiv", phone: PHONES.lviv, schedule: "пн–сб, 9:00–20:00",
    clinics: [
      lviv("вул. Шевченка, 60, корп. 18", "ЖК Семицвіт"),
      lviv("вул. Кульпарківська, 93, корп. 4", "ЖК Парус Сіті"),
      lviv("вул. Юрія Руфа, 6-А", "MonoDoctor"),
    ],
  },
  {
    id: "krakow", name: "Краків", inName: "у Кракові", country: "Польща", countryCode: "PL",
    timeZone: "Europe/Warsaw", phone: PHONES.krakow, schedule: "9:00–20:00, дні — за адресою",
    clinics: [
      { street: "вул. Фелікса Конечнего, 8", days: MON_FRI, schedule: "пн–пт, 9:00–20:00",
        mapQuery: "Giorno Dentale, ul. Feliksa Konecznego 8, Kraków", postalLocality: "Kraków" },
      { street: "вул. Вроцлавська, 69", days: EVERY_DAY, schedule: "щодня, 9:00–20:00",
        mapQuery: "Giorno Dentale, ul. Wrocławska 69, Kraków", postalLocality: "Kraków" },
    ],
  },
];

export const mapUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/** «6 клінік», «3 клініки», «2 клініки» */
export const clinicsWord = (n: number) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "клініка";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "клініки";
  return "клінік";
};
