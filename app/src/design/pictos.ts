// Pictos repris de l’Atlas V4 (harmonia-lux/HLuX/src/app.js, PICTOS). Dessin SVG : couleurs a/b, tracé g.
export type PictoKey = "papiers" | "logement" | "formation" | "permis" | "famille" | "fatigue" | "sante" | "courage" | "amis" | "allocations" | "partage" | "appel" | "travail" | "creer";

export interface Picto { a: string; b: string; fr: string; ar: string; g: string }

export const PICTOS: Record<PictoKey, Picto> = {
  "papiers": {
    "a": "#8faadc",
    "b": "#ffd966",
    "fr": "Papiers",
    "ar": "الأوراق",
    "g": "<rect x=\"30\" y=\"18\" width=\"40\" height=\"52\" rx=\"4\"/><path d=\"M38 32h24M38 42h24M38 52h16\"/><path d=\"M24 58h40l-4 22H28z\"/><path d=\"M24 58l20 12 20-12\"/>"
  },
  "logement": {
    "a": "#a9d18e",
    "b": "#f4a3c6",
    "fr": "Logement",
    "ar": "السكن",
    "g": "<path d=\"M18 50 50 22l32 28\"/><path d=\"M27 44v34h46V44\"/><rect x=\"43\" y=\"56\" width=\"14\" height=\"22\" rx=\"2\"/>"
  },
  "formation": {
    "a": "#c39ad6",
    "b": "#ec6a76",
    "fr": "Formation",
    "ar": "التكوين",
    "g": "<path d=\"M14 40 50 24l36 16-36 16z\"/><path d=\"M28 47v14c0 6 10 11 22 11s22-5 22-11V47\"/><path d=\"M84 41v18\"/>"
  },
  "permis": {
    "a": "#8faadc",
    "b": "#ffd966",
    "fr": "Permis",
    "ar": "الرخصة",
    "g": "<path d=\"M18 58l7-18c1-4 4-6 8-6h34c4 0 7 2 8 6l7 18v12H18z\"/><circle cx=\"32\" cy=\"70\" r=\"6\"/><circle cx=\"68\" cy=\"70\" r=\"6\"/><path d=\"M28 50h44\"/>"
  },
  "famille": {
    "a": "#f6a25a",
    "b": "#9fdcb0",
    "fr": "Famille",
    "ar": "العائلة",
    "g": "<circle cx=\"36\" cy=\"28\" r=\"9\"/><circle cx=\"64\" cy=\"38\" r=\"7\"/><path d=\"M20 76c0-18 7-34 16-34s16 16 16 34z\"/><path d=\"M52 76c0-13 5-24 12-24s12 11 12 24z\"/>"
  },
  "fatigue": {
    "a": "#5c5f66",
    "b": "#d1493c",
    "fr": "Fatiguée",
    "ar": "متعبة",
    "g": "<circle cx=\"48\" cy=\"48\" r=\"26\"/><path d=\"M35 46q6 5 12 0M51 46q6 5 12 0M41 62h14\" fill=\"none\"/><path d=\"M68 12h11l-11 11h11\" fill=\"none\"/>"
  },
  "sante": {
    "a": "#c9ef8a",
    "b": "#e58ac6",
    "fr": "Santé",
    "ar": "الصحة",
    "g": "<rect x=\"22\" y=\"32\" width=\"56\" height=\"42\" rx=\"6\"/><path d=\"M40 32v-8h20v8\"/><path d=\"M45 42h10v8h8v10h-8v8H45v-8h-8V50h8z\"/>"
  },
  "courage": {
    "a": "#c48ad6",
    "b": "#ec5a5a",
    "fr": "Courage",
    "ar": "الشجاعة",
    "g": "<circle cx=\"60\" cy=\"20\" r=\"8\"/><path d=\"M57 30 43 50l12 9-6 18M43 50l-15 5M57 32l15 11\" fill=\"none\" stroke-width=\"12\"/><path d=\"M57 30 43 50l12 9-6 18M43 50l-15 5M57 32l15 11\" fill=\"none\" stroke=\"#fff\" stroke-width=\"5\"/>"
  },
  "amis": {
    "a": "#f6a25a",
    "b": "#9fdcb0",
    "fr": "Amis",
    "ar": "الأصدقاء",
    "g": "<circle cx=\"36\" cy=\"38\" r=\"10\"/><circle cx=\"64\" cy=\"38\" r=\"10\"/><path d=\"M18 78c0-14 8-22 18-22s18 8 18 22z\"/><path d=\"M46 78c0-14 8-22 18-22s18 8 18 22z\"/>"
  },
  "allocations": {
    "a": "#c9ef8a",
    "b": "#e58ac6",
    "fr": "Allocations",
    "ar": "المساعدات",
    "g": "<circle cx=\"50\" cy=\"42\" r=\"22\"/><path d=\"M59 33c-9-6-21-1-21 9s12 15 21 9M32 39h16M32 46h16\" fill=\"none\"/><path d=\"M18 70c10-6 20-6 30 0h22c4 0 4 8 0 8H34\"/>"
  },
  "partage": {
    "a": "#a9d18e",
    "b": "#f4a3c6",
    "fr": "Partage",
    "ar": "المشاركة",
    "g": "<path d=\"M50 66C32 54 24 45 24 35c0-8 6-13 13-13 6 0 10 4 13 9 3-5 7-9 13-9 7 0 13 5 13 13 0 10-8 19-26 31z\"/>"
  },
  "appel": {
    "a": "#7fc4f5",
    "b": "#f7ef62",
    "fr": "Appel",
    "ar": "الاتصال",
    "g": "<path d=\"M30 22l10-4 8 16-6 5c3 8 9 14 17 17l5-6 16 8-4 10c-26 2-48-20-46-46z\"/>"
  },
  "travail": {
    "a": "#c9ef8a",
    "b": "#e58ac6",
    "fr": "Travail",
    "ar": "العمل",
    "g": "<rect x=\"20\" y=\"36\" width=\"60\" height=\"38\" rx=\"5\"/><path d=\"M38 36v-8h24v8M20 52h60\"/>"
  },
  "creer": {
    "a": "#f6b26b",
    "b": "#a9d18e",
    "fr": "Créer",
    "ar": "إنشاء",
    "g": "<path d=\"M50 16a20 20 0 0 1 12 36v8H38v-8a20 20 0 0 1 12-36z\"/><path d=\"M40 68h20M43 76h14\"/>"
  }
};
