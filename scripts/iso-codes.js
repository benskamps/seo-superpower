"use strict";
/**
 * ISO reference tables for hreflang validation.
 *
 * GENERATED, DO NOT HAND-EDIT. Derived from the Node runtime's bundled ICU/CLDR
 * data and classified against the deprecated/reserved sets ICU still resolves.
 * Regenerate with a full-icu Node; test/iso-codes.test.js re-derives these from
 * ICU and fails if the committed tables drift.
 *
 * Why the classification exists: ICU resolves "UK" to "United Kingdom" as a
 * legacy CLDR alias, so ICU acceptance alone does NOT catch the single most
 * common hreflang error in the wild. ISO officially assigns GB, never UK.
 *
 * Counts at generation time: 249 assigned regions (ISO 3166-1 alpha-2),
 * 183 assigned languages (ISO 639-1), 203 script subtags (ISO 15924).
 */

/** Officially assigned ISO 3166-1 alpha-2 region codes. */
const ASSIGNED_REGIONS = new Set([
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT",
  "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI",
  "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY",
  "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK",
  "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL",
  "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR",
  "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS",
  "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW",
  "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP",
  "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM",
  "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF",
  "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW",
  "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
]);

/** Withdrawn ISO 3166-1 codes mapped to their modern successor. */
const DEPRECATED_REGIONS = {
  "AN": "CW",
  "BU": "MM",
  "CS": "RS",
  "DD": "DE",
  "DY": "BJ",
  "FX": "FR",
  "HV": "BF",
  "NH": "VU",
  "RH": "ZW",
  "SU": "RU",
  "TP": "TL",
  "VD": "VN",
  "YD": "YE",
  "YU": "RS",
  "ZR": "CD"
};

/** Reserved / never-assigned codes. Value is the correct code, or null if none. */
const RESERVED_REGIONS = {
  "UK": "GB",
  "AC": "SH",
  "TA": "SH",
  "DG": "IO",
  "CP": "FR",
  "IC": "ES",
  "EA": "ES",
  "CQ": "GG",
  "EU": null,
  "EZ": null,
  "UN": null,
  "QO": null,
  "XA": null,
  "XB": null
};

/** User-assigned codes in real-world use; warn but do not reject. */
const TOLERATED_REGIONS = {
  "XK": "Kosovo (user-assigned; not ISO-official)"
};

/** Officially assigned ISO 639-1 language codes. */
const ASSIGNED_LANGS = new Set([
  "aa", "ab", "ae", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az",
  "ba", "be", "bg", "bi", "bm", "bn", "bo", "br", "bs", "ca", "ce", "ch",
  "co", "cr", "cs", "cu", "cv", "cy", "da", "de", "dv", "dz", "ee", "el",
  "en", "eo", "es", "et", "eu", "fa", "ff", "fi", "fj", "fo", "fr", "fy",
  "ga", "gd", "gl", "gn", "gu", "gv", "ha", "he", "hi", "ho", "hr", "ht",
  "hu", "hy", "hz", "ia", "id", "ie", "ig", "ii", "ik", "io", "is", "it",
  "iu", "ja", "jv", "ka", "kg", "ki", "kj", "kk", "kl", "km", "kn", "ko",
  "kr", "ks", "ku", "kv", "kw", "ky", "la", "lb", "lg", "li", "ln", "lo",
  "lt", "lu", "lv", "mg", "mh", "mi", "mk", "ml", "mn", "mr", "ms", "mt",
  "my", "na", "nb", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv", "ny",
  "oc", "oj", "om", "or", "os", "pa", "pi", "pl", "ps", "pt", "qu", "rm",
  "rn", "ro", "ru", "rw", "sa", "sc", "sd", "se", "sg", "si", "sk", "sl",
  "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw", "ta", "te",
  "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty",
  "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "wo", "xh", "yi", "yo",
  "za", "zh", "zu"
]);

/** Legacy ISO 639-1 codes mapped to their modern equivalent. */
const DEPRECATED_LANGS = {
  "in": "id",
  "iw": "he",
  "ji": "yi",
  "jw": "jv",
  "mo": "ro",
  "sh": "sr",
  "bh": "bho"
};

/** ISO 15924 script subtags (e.g. Hans, Hant, Cyrl). */
const SCRIPTS = new Set([
  "Adlm", "Afak", "Aghb", "Arab", "Aran", "Armi", "Armn", "Avst", "Bali", "Bamu", "Bass", "Batk",
  "Beng", "Berf", "Bhks", "Blis", "Bopo", "Brah", "Brai", "Bugi", "Buhd", "Cakm", "Cans", "Cari",
  "Cher", "Chrs", "Cirt", "Copt", "Cpmn", "Cprt", "Cyrl", "Cyrs", "Deva", "Diak", "Dogr", "Dsrt",
  "Dupl", "Egyd", "Egyh", "Egyp", "Elba", "Elym", "Ethi", "Gara", "Geok", "Geor", "Glag", "Gong",
  "Gonm", "Goth", "Gran", "Grek", "Gujr", "Gukh", "Guru", "Hanb", "Hang", "Hani", "Hano", "Hans",
  "Hant", "Hatr", "Hebr", "Hira", "Hluw", "Hmng", "Hmnp", "Hrkt", "Hung", "Inds", "Ital", "Java",
  "Jpan", "Jurc", "Kali", "Kana", "Khar", "Khmr", "Khoj", "Kits", "Knda", "Kore", "Kpel", "Krai",
  "Kthi", "Lana", "Laoo", "Latf", "Latg", "Latn", "Lepc", "Limb", "Lina", "Linb", "Lisu", "Lyci",
  "Lydi", "Mahj", "Maka", "Mand", "Mani", "Marc", "Maya", "Medf", "Mend", "Merc", "Mero", "Mlym",
  "Mong", "Mroo", "Mtei", "Mult", "Mymr", "Nagm", "Nand", "Narb", "Nbat", "Nkgb", "Nkoo", "Nshu",
  "Ogam", "Olck", "Onao", "Orkh", "Orya", "Osge", "Osma", "Ougr", "Palm", "Pauc", "Perm", "Phag",
  "Phli", "Phlp", "Phlv", "Phnx", "Plrd", "Prti", "Qaag", "Rjng", "Rohg", "Roro", "Runr", "Samr",
  "Sara", "Sarb", "Saur", "Sgnw", "Shaw", "Shrd", "Sidd", "Sidt", "Sind", "Sinh", "Sogd", "Sogo",
  "Sora", "Soyo", "Sund", "Sunu", "Sylo", "Syrc", "Syre", "Syrj", "Syrn", "Tagb", "Takr", "Tale",
  "Talu", "Taml", "Tang", "Tavt", "Tayo", "Telu", "Teng", "Tfng", "Tglg", "Thaa", "Tibt", "Tirh",
  "Tnsa", "Todr", "Tols", "Tutg", "Ugar", "Vaii", "Visp", "Vith", "Wara", "Wcho", "Wole", "Xpeo",
  "Xsux", "Yezi", "Yiii", "Zanb", "Zinh", "Zmth", "Zsye", "Zsym", "Zxxx", "Zyyy", "Zzzz"
]);

module.exports = {
  ASSIGNED_REGIONS,
  DEPRECATED_REGIONS,
  RESERVED_REGIONS,
  TOLERATED_REGIONS,
  ASSIGNED_LANGS,
  DEPRECATED_LANGS,
  SCRIPTS
};
