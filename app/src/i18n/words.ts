// Catalogue des mots de l'interface, repris de l'Atlas V4 (`data-ar`, `data-falc`).
// Trois registres : français, arabe (écrans de la personne), et « Plus simple » (FALC).

export type Register = 'fr' | 'ar' | 'falc';

export const WORDS = {
  hello: { fr: 'Bonjour', ar: 'مرحبا', falc: 'Bonjour' },
  myProject: { fr: 'Mon projet', ar: 'مشروعي', falc: 'Mon projet' },
  ourProject: { fr: 'Notre projet', ar: 'مشروعنا', falc: 'Notre projet' },
  listen: { fr: '🔊 Écouter', ar: '🔊 استماع', falc: '🔊 Écouter' },
  simpler: { fr: '💬 Plus simple', ar: '💬 أبسط', falc: '💬 Plus simple' },
  language: { fr: '🌐 Langue', ar: '🌐 اللغة', falc: '🌐 Langue' },
  withSarah: { fr: 'avec Sarah', ar: 'مع سارة', falc: 'avec Sarah' },
  // Étapes du Projet Personnalisé
  cards: { fr: '🃏 Cartes', ar: '🃏 بطاقاتي', falc: '🃏 Cartes' },
  feeling: { fr: '😊 Ressenti', ar: '😊 إحساسي', falc: '😊 Ressenti' },
  wishes: { fr: '🌈 Envies', ar: '🌈 رغباتي', falc: '🌈 Envies' },
  priorities: { fr: '⭐ Priorités', ar: '⭐ أولوياتي', falc: '⭐ Priorités' },
  views: { fr: '👥 Regards', ar: '👥 نظرات', falc: '👥 Regards' },
  path: { fr: '🛤️ Chemin', ar: '🛤️ طريقي', falc: '🛤️ Chemin' },
  // Étapes du Projet d'Établissement
  subjects: { fr: '📥 Sujets', ar: '📥 Sujets', falc: '📥 Sujets' },
  finding: { fr: '🔎 Constat', ar: '🔎 Constat', falc: '🔎 Constat' },
  course: { fr: '🧭 Cap', ar: '🧭 Cap', falc: '🧭 Cap' },
  choice: { fr: '⚖️ Choix', ar: '⚖️ Choix', falc: '⚖️ Choix' },
  actions: { fr: '🛠️ Actions', ar: '🛠️ Actions', falc: '🛠️ Actions' },
  follow: { fr: '📅 Suivi', ar: '📅 Suivi', falc: '📅 Suivi' },
  // 01 Cartes
  whichCard: { fr: 'Quelle Carte veux-tu reprendre ?', ar: 'أيّ بطاقة تريدين أن تستأنفي؟', falc: 'Choisis une carte.' },
  newCard: { fr: 'Nouvelle Carte', ar: 'بطاقة جديدة', falc: 'Nouvelle carte' },
  newCardHow: { fr: "je parle, j'écris ou je choisis une image", ar: 'أتكلّم، أكتب أو أختار صورة', falc: 'Je parle ou je choisis une image.' },
  keepsAll: { fr: 'Ta Carte garde tout son parcours.', ar: 'بطاقتكِ تحتفظ بكلّ مسارها.', falc: 'La carte garde tout.' },
  notPlaced: { fr: 'pas encore posée', ar: 'لم تُوضع بعد', falc: 'pas encore posée' },
  // 02 Ressenti
  fine: { fr: '😊 Ça va', ar: '😊 أنا بخير', falc: '😊 Ça va' },
  unsure: { fr: '🤔 Je ne sais pas', ar: '🤔 لا أعرف', falc: '🤔 Je ne sais pas' },
  hard: { fr: "😟 C'est difficile", ar: '😟 صعب', falc: "😟 C'est difficile" },
  howFeel: { fr: 'Comment ça va pour moi ? Je prends une carte, je la pose.', ar: 'كيف حالي؟ آخذ بطاقة وأضعها.', falc: 'Je prends une carte. Je la pose.' },
  // 03 Envies
  love: { fr: "❤️ J'aime", ar: '❤️ أحبّ', falc: "❤️ J'aime" },
  able: { fr: "🛠️ J'en suis capable", ar: '🛠️ أنا قادرة', falc: '🛠️ Je sais faire' },
  useful: { fr: '🤝 Je suis utile', ar: '🤝 أنا مفيدة', falc: "🤝 J'aide" },
  living: { fr: "💶 J'en vis", ar: '💶 أعيش منه', falc: "💶 J'en vis" },
  passion: { fr: 'Passion', ar: 'شغف', falc: 'Passion' },
  mission: { fr: 'Mission', ar: 'رسالة', falc: 'Mission' },
  profession: { fr: 'Profession', ar: 'مهنة', falc: 'Métier' },
  vocation: { fr: 'Vocation', ar: 'دعوة', falc: 'Vocation' },
  wishQuestion: { fr: "Qu'est-ce que j'aimerais ? J'imagine des possibles.", ar: 'ماذا أحبّ أن أفعل؟ أتخيّل الممكن.', falc: "Ce que j'aimerais." },
  tray: { fr: 'À placer', ar: 'للترتيب', falc: 'À placer' },
  discard: { fr: 'Écarter (on ne peut pas revenir)', ar: 'إبعاد (لا رجعة فيه)', falc: 'Enlever pour toujours' },
  newIdea: { fr: '＋ Une idée', ar: '＋ فكرة', falc: '＋ Une idée' },
  bornOf: { fr: 'née de', ar: 'نابعة من', falc: 'vient de' },
  // 04 Priorités
  prioQuestion: { fr: "Qu'est-ce qui compte le plus ? Je range, puis je situe mes idées.", ar: 'ما الأهمّ عندي؟ أرتّب ثم أضع أفكاري.', falc: 'Ce qui compte le plus pour moi.' },
  first: { fr: "D'ABORD", ar: 'أوّلاً', falc: "D'ABORD" },
  then: { fr: 'ENSUITE', ar: 'ثمّ', falc: 'ENSUITE' },
  also: { fr: 'AUSSI', ar: 'أيضاً', falc: 'AUSSI' },
  less: { fr: 'MOINS', ar: 'أقلّ', falc: 'MOINS' },
  notYet: { fr: 'Je ne sais pas encore', ar: 'لا أعرف بعد', falc: 'Je ne sais pas' },
  shareRank: { fr: 'Deux axes peuvent partager un rang. « Je ne sais pas encore » est permis.', ar: 'محوران يمكن أن يتشاركا نفس المرتبة. « لا أعرف بعد » جواب مقبول.', falc: 'Deux cartes peuvent être ensemble.' },
  ranks: { fr: '1 · Je range', ar: '1 · أرتّب', falc: '1 · Je range' },
  lines: { fr: '2 · Je situe mes idées', ar: '2 · أضع أفكاري', falc: '2 · Je place mes idées' },
  littleMuch: { fr: 'peu ←→ beaucoup', ar: 'قليلاً ←→ كثيراً', falc: 'un peu ←→ beaucoup' },
} as const;

export type WordKey = keyof typeof WORDS;
