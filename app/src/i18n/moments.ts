// Les moments d'une Carte sont écrits en français dans le journal (c'est la donnée, rejouée à l'identique
// par le cœur Rust). À l'écran de la personne en arabe, ils se lisent en arabe : on traduit à l'affichage.
const DAYS: Record<string, string> = {
  lundi: 'الاثنين', mardi: 'الثلاثاء', mercredi: 'الأربعاء', jeudi: 'الخميس', vendredi: 'الجمعة', samedi: 'السبت', dimanche: 'الأحد',
};
const MONTHS: Record<string, string> = {
  janvier: 'يناير', février: 'فبراير', mars: 'مارس', avril: 'أبريل', mai: 'مايو', juin: 'يونيو',
  juillet: 'يوليو', août: 'أغسطس', septembre: 'سبتمبر', octobre: 'أكتوبر', novembre: 'نوفمبر', décembre: 'ديسمبر',
};
const FEELINGS: Record<string, string> = { 'ça va': 'أنا بخير', 'je ne sais pas': 'لا أعرف', "c'est difficile": 'صعب' };
const PHRASES: [RegExp, string][] = [
  [/ · dite avec /, ' · قيلت مع '],
  [/ · écrite avec /, ' · كُتبت مع '],
  [/ · choisie avec /, ' · اختيرت مع '],
  [/ · reposée dans la réserve/, ' · أُعيدت إلى علبة البطاقات'],
  [/ · pas maintenant/, ' · ليس الآن'],
  [/aujourd'hui/, 'اليوم'],
];

export function momentAr(m: string): string {
  let out = m.replace(/« ([^»]+) »/g, (all, f: string) => (FEELINGS[f.trim()] ? `« ${FEELINGS[f.trim()]} »` : all));
  out = out.replace(/ · dans « /, ' · في « ');
  for (const [re, ar] of PHRASES) out = out.replace(re, ar);
  out = out.replace(/\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/g, (d) => DAYS[d]);
  out = out.replace(/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/g, (mo) => MONTHS[mo]);
  return out;
}
