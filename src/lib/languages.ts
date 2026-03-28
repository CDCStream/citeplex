export const LANG_NAMES: Record<string, string> = {
  af: "Afrikaans", sq: "Albanian", am: "Amharic", ar: "Arabic", hy: "Armenian",
  az: "Azerbaijani", eu: "Basque", be: "Belarusian", bn: "Bengali", bs: "Bosnian",
  bg: "Bulgarian", ca: "Catalan", ceb: "Cebuano", zh: "Chinese", co: "Corsican",
  hr: "Croatian", cs: "Czech", da: "Danish", nl: "Dutch", en: "English",
  eo: "Esperanto", et: "Estonian", fi: "Finnish", fr: "French", fy: "Frisian",
  gl: "Galician", ka: "Georgian", de: "German", el: "Greek", gu: "Gujarati",
  ht: "Haitian Creole", ha: "Hausa", haw: "Hawaiian", he: "Hebrew", hi: "Hindi",
  hmn: "Hmong", hu: "Hungarian", is: "Icelandic", ig: "Igbo", id: "Indonesian",
  ga: "Irish", it: "Italian", ja: "Japanese", jv: "Javanese", kn: "Kannada",
  kk: "Kazakh", km: "Khmer", rw: "Kinyarwanda", ko: "Korean", ku: "Kurdish",
  ky: "Kyrgyz", lo: "Lao", la: "Latin", lv: "Latvian", lt: "Lithuanian",
  lb: "Luxembourgish", mk: "Macedonian", mg: "Malagasy", ms: "Malay", ml: "Malayalam",
  mt: "Maltese", mi: "Maori", mr: "Marathi", mn: "Mongolian", my: "Myanmar",
  ne: "Nepali", no: "Norwegian", ny: "Nyanja", or: "Odia", ps: "Pashto",
  fa: "Persian", pl: "Polish", pt: "Portuguese", pa: "Punjabi", ro: "Romanian",
  ru: "Russian", sm: "Samoan", gd: "Scots Gaelic", sr: "Serbian", st: "Sesotho",
  sn: "Shona", sd: "Sindhi", si: "Sinhala", sk: "Slovak", sl: "Slovenian",
  so: "Somali", es: "Spanish", su: "Sundanese", sw: "Swahili", sv: "Swedish",
  tl: "Tagalog", tg: "Tajik", ta: "Tamil", tt: "Tatar", te: "Telugu",
  th: "Thai", tr: "Turkish", tk: "Turkmen", uk: "Ukrainian", ur: "Urdu",
  ug: "Uyghur", uz: "Uzbek", vi: "Vietnamese", cy: "Welsh", xh: "Xhosa",
  yi: "Yiddish", yo: "Yoruba", zu: "Zulu",
};

export const COUNTRY_TO_LANG: Record<string, string> = {
  US: "en", GB: "en", AU: "en", CA: "en", NZ: "en", IE: "en", ZA: "en",
  TR: "tr", DE: "de", AT: "de", CH: "de", FR: "fr", BE: "fr", ES: "es",
  MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es",
  PT: "pt", BR: "pt", IT: "it", NL: "nl", PL: "pl", RU: "ru", UA: "uk",
  JP: "ja", KR: "ko", CN: "zh", TW: "zh", HK: "zh", SA: "ar", AE: "ar",
  EG: "ar", IN: "hi", SE: "sv", NO: "no", DK: "da", FI: "fi", CZ: "cs",
  RO: "ro", HU: "hu", GR: "el", TH: "th", VN: "vi", ID: "id", MY: "ms",
  PH: "tl", IL: "he", IR: "fa", BD: "bn", PK: "ur", BG: "bg", HR: "hr",
  SK: "sk", SI: "sl", LT: "lt", LV: "lv", EE: "et", RS: "sr", MK: "mk",
  AL: "sq", BA: "bs", GE: "ka", AZ: "az", AM: "hy", KE: "sw", NG: "en",
  KZ: "kk", UZ: "uz", TM: "tk", KG: "ky", TJ: "tg", MN: "mn", NP: "ne",
  LK: "si", MM: "my", KH: "km", LA: "lo", AF: "ps",
};

export function getLanguageName(code: string): string {
  return LANG_NAMES[code] ?? "English";
}

export function getLanguageFromCountry(countryCode: string): string {
  return COUNTRY_TO_LANG[countryCode?.toUpperCase()] ?? "en";
}
