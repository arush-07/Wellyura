const COUNTRY_CURRENCY: Record<string, string> = {
  "United Kingdom": "GBP",
  Canada: "CAD",
  "United States": "USD",
  Australia: "AUD",
  "New Zealand": "NZD",
  India: "INR",
  Ireland: "EUR",
  Germany: "EUR",
  France: "EUR",
  Netherlands: "EUR",
  Singapore: "SGD",
  "United Arab Emirates": "AED",
};

const CURRENCY_LOCALE: Record<string, string> = {
  GBP: "en-GB",
  CAD: "en-CA",
  USD: "en-US",
  AUD: "en-AU",
  NZD: "en-NZ",
  INR: "en-IN",
  EUR: "en-IE",
  SGD: "en-SG",
  AED: "en-AE",
};

export function getAccommodationCurrency(
  country: string,
) {
  return COUNTRY_CURRENCY[country] ?? "CAD";
}

export function formatAccommodationPrice(
  amount: number,
  country: string,
) {
  const currency =
    getAccommodationCurrency(country);

  const locale =
    CURRENCY_LOCALE[currency] ?? "en-CA";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
