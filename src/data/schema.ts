// Schema.org for the homepage (SE-R003): the network as Organization + 11 Dentist locations.
import { CITIES, EMAIL, SOCIALS, LEGAL_NAME } from "./site";

const DAY = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function buildSchema() {
  const org = {
    "@type": "Organization",
    "@id": "#organization",
    name: "Giorno Dentale",
    legalName: LEGAL_NAME.replace(/[«»]/g, '"'),
    email: EMAIL,
    sameAs: SOCIALS.map((s) => s.url),
  };
  const places = CITIES.flatMap((c) =>
    c.clinics.map((k) => ({
      "@type": "Dentist",
      name: `Giorno Dentale, ${c.name}, ${k.street}`,
      parentOrganization: { "@id": "#organization" },
      telephone: c.phone.tel,
      email: EMAIL,
      address: {
        "@type": "PostalAddress",
        streetAddress: k.street + (k.landmark ? ` (${k.landmark})` : ""),
        addressLocality: c.name,
        addressCountry: c.countryCode,
      },
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: k.days.map((d) => DAY[d]),
        opens: "09:00",
        closes: "20:00",
      }],
    })),
  );
  return { "@context": "https://schema.org", "@graph": [org, ...places] };
}
