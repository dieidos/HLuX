// Recette : les 36 notes de l'Atlas V4 (`src/app.js`, `NOTES`), une par test, sur l'aperçu web.
// Chaque test part d'une tablette neuve (vide), ouvre la démonstration (Amina / CHRS Les Lilas) et suit
// les gestes de l'Atlas. Le titre de chaque test est la note de l'Atlas, mot pour mot.
import { expect, test, type Page } from '@playwright/test';

// ── gestes communs ─────────────────────────────────────────────────────────────────────────────────

/** Ouvrir la séance (la professionnelle), puis le profil (la personne). */
async function enter(page: Page, pro = 'Sarah', person: string | null = 'Amina') {
  await page.goto('/');
  // Une tablette neuve est vide : la démonstration (appui long sur « HLuX ») entre les données de l'Atlas.
  await page.getByLabel('HLuX', { exact: true }).first().click({ delay: 1200 });
  await page.getByRole('button', { name: 'Ouvrir', exact: true }).click();
  await expect(page.getByText('DÉMONSTRATION · personnages imaginaires')).toBeVisible();
  await page.getByRole('button', { name: pro, exact: true }).click();
  if (person) {
    await page.getByRole('button', { name: person, exact: true }).click();
    await expect(page.getByText(`Bonjour ${person}`).filter({ visible: true })).toBeVisible();
  }
}
const link = (page: Page, name: RegExp | string) => page.getByRole('link', { name }).filter({ visible: true }).first();
const mine = async (page: Page, screen: RegExp) => {
  // Toucher la personne ouvre directement 01 ; depuis Notre projet, le bandeau ramène à Mon projet.
  const back = page.getByRole('link', { name: /Mon projet/ }).filter({ visible: true });
  if (await back.count()) await back.first().click();
  if (!/Cartes/.test(screen.source)) await link(page, screen).click();
};
const ours = async (page: Page, screen: RegExp) => {
  await link(page, /Notre projet/).click();
  await link(page, screen).click();
};
/** Prendre, puis poser : le geste de l'Atlas, dans sa version accessible (toucher, puis « Poser ici »). */
async function drop(page: Page, item: string, zone: string) {
  await page.getByRole('button', { name: item, exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button', { name: `Poser ici : ${zone}` }).filter({ visible: true }).click();
}
// La pile de navigation garde les écrans précédents montés (cachés) : on ne vise que ce qui se voit.
const fill = (page: Page, label: string, text: string) => page.getByLabel(label, { exact: true }).filter({ visible: true }).first().fill(text);
const tap = (page: Page, name: string | RegExp) => page.getByRole('button', { name, exact: typeof name === 'string' }).filter({ visible: true }).first().click();

// ── 01 Cartes ──────────────────────────────────────────────────────────────────────────────────────

test.describe('01 Cartes', () => {
  test("Amina ouvre HLuX ; on l'accueille par son prénom.", async ({ page }) => {
    await enter(page);
    await expect(page.getByText('Bonjour Amina 👋').filter({ visible: true })).toBeVisible();
  });

  test('Elle touche Papiers, sa Carte dite avec Sarah.', async ({ page }) => {
    await enter(page);
    await mine(page, /Cartes/);
    await expect(page.getByText('mardi · dite avec Sarah')).toBeVisible();
    await tap(page, 'Papiers');
    await expect(page.getByText('« Les lettres de la CAF, je les laisse fermées. »')).toBeVisible();
  });

  test("La Carte s'ouvre, avec toute son histoire.", async ({ page }) => {
    await enter(page);
    await mine(page, /Cartes/);
    await tap(page, 'Papiers');
    await expect(page.getByText('Ta Carte garde tout son parcours.')).toBeVisible();
    await expect(page.getByLabel('Le fil de la Carte')).toContainText('Dite · mardi · dite avec Sarah');
  });
});

// ── 02 Ressenti ────────────────────────────────────────────────────────────────────────────────────

test.describe('02 Ressenti', () => {
  test('Trois lieux : ça va, je ne sais pas, difficile.', async ({ page }) => {
    await enter(page);
    await mine(page, /Ressenti/);
    for (const z of ['😊 Ça va', '🤔 Je ne sais pas', "😟 C'est difficile"]) await expect(page.getByText(z, { exact: true })).toBeVisible();
  });

  test('Amina prend Papiers et la glisse vers « difficile ».', async ({ page }) => {
    await enter(page);
    await mine(page, /Ressenti/);
    await tap(page, 'Papiers');
    // Les destinations s'éclairent dès la prise : trois « Poser ici ».
    await expect(page.getByRole('button', { name: /Poser ici/ })).toHaveCount(3);
    await page.getByRole('button', { name: "Poser ici : 😟 C'est difficile" }).click();
    await expect(page.getByText('Papiers va dans « c\'est difficile ».')).toBeVisible();
  });

  test('Posée. Sa phrase est gardée, mot pour mot.', async ({ page }) => {
    await enter(page);
    await mine(page, /Ressenti/);
    await drop(page, 'Papiers', "😟 C'est difficile");
    // Annuler, c'est le même geste à l'envers ; puis la Carte garde sa phrase et le moment.
    await expect(page.getByRole('button', { name: '↶ Annuler' })).toBeVisible();
    await link(page, /Cartes/).click();
    await tap(page, 'Papiers');
    await expect(page.getByText('« Les lettres de la CAF, je les laisse fermées. »').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByLabel('Le fil de la Carte')).toContainText(/Ressentie · \S+ \d+ \S+ · dans « c'est difficile »/);
  });
});

// ── 03 Envies ──────────────────────────────────────────────────────────────────────────────────────

test.describe('03 Envies', () => {
  test("Quatre cercles : j'aime, j'en suis capable, je suis utile, j'en vis.", async ({ page }) => {
    await enter(page);
    await mine(page, /Envies/);
    for (const c of ["❤️ J'aime", "🛠️ J'en suis capable", '🤝 Je suis utile', "💶 J'en vis"]) await expect(page.getByText(c, { exact: true }).first()).toBeVisible();
    for (const x of ['PASSION', 'MISSION', 'PROFESSION', 'VOCATION']) await expect(page.getByText(x, { exact: true })).toBeVisible();
  });

  test('De Papiers naît une envie : comprendre ses courriers seule.', async ({ page }) => {
    await enter(page);
    await mine(page, /Envies/);
    await tap(page, '＋ Une idée');
    await fill(page, 'Mon idée', 'Comprendre mes courriers seule');
    await tap(page, 'Papiers');
    await tap(page, 'Créer');
    await expect(page.getByText('née de Papiers')).toBeVisible();
  });

  test('Elle la pose entre « j\'en suis capable » et « j\'en vis ».', async ({ page }) => {
    await enter(page);
    await mine(page, /Envies/);
    await drop(page, 'Formation', 'Profession');
    await link(page, /Cartes/).click();
    await link(page, /Envies/).click();
    // Posée au croisement : elle n'est plus « à placer », et reste déplaçable.
    await expect(page.getByRole('button', { name: 'Formation', exact: true })).toBeVisible();
    await tap(page, 'Formation');
    await expect(page.getByRole('button', { name: 'Poser ici : À placer' })).toBeVisible();
  });
});

// ── 04 Priorités ───────────────────────────────────────────────────────────────────────────────────

test.describe('04 Priorités', () => {
  test("D'abord « j'en vis », ensuite « j'en suis capable ».", async ({ page }) => {
    await enter(page);
    await mine(page, /Priorités/);
    await drop(page, "💶 J'en vis", "D'ABORD");
    await drop(page, "🛠️ J'en suis capable", 'ENSUITE');
    await expect(page.getByText('Deux axes peuvent partager un rang. « Je ne sais pas encore » est permis.')).toBeVisible();
    await page.getByRole('tab', { name: '2 · Je situe mes idées' }).click();
    const heads = page.getByRole('button').filter({ hasText: /^(D'ABORD|ENSUITE)/ });
    await expect(heads.first()).toContainText("💶 J'en vis");
  });

  test('Sur ses lignes, elle glisse « Comprendre » vers la droite.', async ({ page }) => {
    await enter(page);
    await mine(page, /Envies/);
    await tap(page, '＋ Une idée');
    await fill(page, 'Mon idée', 'Comprendre');
    await tap(page, 'Créer');
    await link(page, /Priorités/).click();
    await drop(page, "💶 J'en vis", "D'ABORD");
    await page.getByRole('tab', { name: '2 · Je situe mes idées' }).click();
    // Créée en dernier, elle est à droite : on la ramène, puis elle glisse vers la droite.
    await tap(page, 'Comprendre vers peu');
    await tap(page, 'Comprendre vers beaucoup');
    await expect(page.getByText('« Comprendre » passe devant Formation.').filter({ visible: true }).first()).toBeVisible();
  });

  test('« Comprendre » arrive en tête de ce qui compte pour elle.', async ({ page }) => {
    await enter(page);
    await mine(page, /Envies/);
    await tap(page, '＋ Une idée');
    await fill(page, 'Mon idée', 'Comprendre');
    await tap(page, 'Créer');
    await link(page, /Priorités/).click();
    await drop(page, "💶 J'en vis", "D'ABORD");
    await page.getByRole('tab', { name: '2 · Je situe mes idées' }).click();
    await tap(page, 'Comprendre vers peu');
    await tap(page, 'Comprendre vers beaucoup');
    // Tout à droite sur la ligne du haut : plus rien à sa droite.
    await expect(page.getByRole('button', { name: 'Comprendre vers beaucoup' }).filter({ visible: true })).toBeDisabled();
  });
});

// ── 05 Regards ─────────────────────────────────────────────────────────────────────────────────────

async function inviteSalma(page: Page, from = 'home') {
  if (from === 'home') await mine(page, /Regards/);
  await tap(page, '＋ Inviter un proche');
  await fill(page, 'Prénom', 'Salma');
  await fill(page, 'Lien', 'ma sœur');
  await tap(page, 'Formation');
  await tap(page, 'بالعربية');
  // Sans connexion, la traduction ne s'invente pas : on écrit l'idée en arabe.
  await fill(page, "L'idée en arabe", 'التكوين');
  await tap(page, 'Inviter');
}

test.describe('05 Regards', () => {
  test("Amina, au centre, choisit qui l'éclaire.", async ({ page }) => {
    await enter(page);
    await mine(page, /Regards/);
    await expect(page.getByText("c'est elle qui invite")).toBeVisible();
    await inviteSalma(page, 'regards');
    await expect(page.getByText('Salma, ma sœur')).toBeVisible();
    await expect(page.getByText('« Formation » · en arabe')).toBeVisible();
  });

  test('Salma répond en arabe ; les regards se superposent.', async ({ page }) => {
    await enter(page);
    await inviteSalma(page);
    await link(page, 'Ouvrir le lien invité').click();
    await expect(page.getByText('Amina تطلب رأيكِ')).toBeVisible();
    for (const r of await page.getByRole('radio', { name: 'كثيراً' }).all()) await r.click();
    await page.getByRole('button', { name: 'أرسل رأيي' }).click();
    await expect(page.getByText('شكراً')).toBeVisible();
    await page.goBack();
    await expect(page.getByText('a répondu ✓')).toBeVisible();
  });

  test('La bande montre où chacun se situe.', async ({ page }) => {
    await enter(page);
    await inviteSalma(page);
    await link(page, 'Ouvrir le lien invité').click();
    for (const r of await page.getByRole('radio', { name: 'كثيراً' }).all()) await r.click();
    await page.getByRole('button', { name: 'أرسل رأيي' }).click();
    await page.goBack();
    await tap(page, 'Découvrir les regards ensemble');
    await page.getByRole('tab', { name: 'Nos regards réunis' }).click();
    await expect(page.getByText('😊 bande étroite : on se rejoint · 💬 bande large : à en parler')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Le regard de Salma' })).toBeVisible();
  });
});

// ── 06 Chemin ──────────────────────────────────────────────────────────────────────────────────────

test.describe('06 Chemin', () => {
  test("Le chemin d'Amina, saison après saison.", async ({ page }) => {
    await enter(page);
    await mine(page, /Chemin/);
    for (const s of ['AUTOMNE', 'HIVER', 'PRINTEMPS', 'ÉTÉ']) await expect(page.getByText(s, { exact: true })).toBeVisible();
    await expect(page.getByText('atelier courriers avec Sarah')).toBeVisible();
  });

  test('Et si le rendez-vous à la CAF était repoussé ? Une copie se joue.', async ({ page }) => {
    await enter(page);
    await mine(page, /Chemin/);
    await tap(page, '💭 Et si… ?');
    await expect(page.getByText('COPIE — ton vrai chemin ne change pas')).toBeVisible();
    await tap(page, /rendez-vous CAF demandé → plus tard/);
    await expect(page.getByRole('button', { name: "Je garde l'idée" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Je referme' })).toBeVisible();
  });

  test("Rien n'a bougé ; elle emporte son plan.", async ({ page }) => {
    await enter(page);
    await mine(page, /Chemin/);
    await tap(page, '💭 Et si… ?');
    await tap(page, /rendez-vous CAF demandé → plus tard/);
    await tap(page, 'Je referme');
    await expect(page.getByText('COPIE — ton vrai chemin ne change pas')).toHaveCount(0);
    await tap(page, '📘 Mon plan');
    for (const k of ["🥇 D'abord", '⏳ Ça attend', '👥 Avec qui', '🌱 Reste ouvert']) await expect(page.getByText(k, { exact: true })).toBeVisible();
    await fill(page, 'Ma phrase', 'le jeudi je lis mes courriers');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Emporter', exact: true }).click();
    expect((await download).suggestedFilename()).toBe('dossier-amina.hlux.json');
    await expect(page.getByText('Ton dossier chiffré est prêt.')).toBeVisible();
  });
});

// ── 07 Sujets ──────────────────────────────────────────────────────────────────────────────────────

test.describe('07 Sujets', () => {
  test("Sa difficulté reste privée, tant qu'elle ne choisit pas de la partager.", async ({ page }) => {
    await enter(page);
    await ours(page, /Sujets/);
    await expect(page.getByText(/C’est bien ce que tu veux dire au collectif \? Ton dossier reste chez toi\./)).toBeVisible();
    // Rien n'est encore écrit pour le collectif : c'est elle qui décide.
    await expect(page.getByRole('button', { name: 'Pas maintenant' })).toBeVisible();
  });

  test('Amina dit oui : elle apporte le sujet.', async ({ page }) => {
    await enter(page);
    await ours(page, /Sujets/);
    await tap(page, '✨ Proposer une formulation générale');
    await expect(page.getByLabel('Version pour le collectif')).toHaveValue(/est difficile pour plusieurs personnes\./);
    await expect(page.getByRole('button', { name: 'Pas maintenant' })).toBeVisible();
    await tap(page, 'Oui, j’apporte');
  });

  test("Le sujet entre à l'ordre du jour.", async ({ page }) => {
    await enter(page);
    await ours(page, /Sujets/);
    await tap(page, '✨ Proposer une formulation générale');
    await tap(page, 'Oui, j’apporte');
    await expect(page.getByText(/Ordre du jour/)).toBeVisible();
    await expect(page.getByText(/Les lettres de la CAF.* est difficile pour plusieurs personnes\./).first()).toBeVisible();
  });
});

// ── 08 Constat ─────────────────────────────────────────────────────────────────────────────────────

test.describe('08 Constat', () => {
  test('Aïcha a la parole ; la tablette circule.', async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await link(page, /Notre projet/).click();
    await expect(page.getByText('🎙️ La parole est à Aïcha')).toBeVisible();
    await tap(page, '→ Bruno');
    await expect(page.getByText('🎙️ La parole est à Bruno')).toBeVisible();
  });

  test("Bruno pose une carte de l'équipe.", async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await link(page, /Notre projet/).click();
    await tap(page, '→ Bruno');
    await fill(page, 'Nouvelle carte du constat', 'Les courriers restent fermés');
    await tap(page, '👥 équipe');
    await tap(page, 'Poser');
    await expect(page.getByText('Les courriers restent fermés').first()).toBeVisible();
    await expect(page.getByText('👥 équipe · Bruno').first()).toBeVisible();
  });

  test("L'équipe et Amina le disent : la difficulté se répète.", async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await link(page, /Notre projet/).click();
    const q = page.getByRole('button', { name: /Qualification de « Horaires de la laverie »/ });
    await q.click();
    await expect(q).toContainText('signal à vérifier');
    await q.click();
    await expect(q).toContainText('difficulté répétée');
    await expect(page.getByText('Un cas isolé reste un signal ; il faut plusieurs voix pour faire un constat.', { exact: false })).toBeVisible();
  });
});

// ── 09 Cap ─────────────────────────────────────────────────────────────────────────────────────────

async function capReady(page: Page) {
  await enter(page, 'Aïcha', null);
  await link(page, /Notre projet/).click();
  const q = page.getByRole('button', { name: /Qualification de « Horaires de la laverie »/ });
  await q.click();
  await q.click();
  await link(page, /Cap/).click();
}

test.describe('09 Cap', () => {
  test('Le même Ikigai, au pluriel.', async ({ page }) => {
    await capReady(page);
    for (const c of ['❤️ Nous aimons', '🛠️ Nous en sommes capables', '🤝 Nous sommes utiles', '💶 Nous en vivons']) await expect(page.getByText(c, { exact: true }).first()).toBeVisible();
  });

  test('Aïcha et Bruno placent la carte différemment.', async ({ page }) => {
    await capReady(page);
    await drop(page, 'Horaires de la laverie', 'Mission');
    await page.getByRole('radio', { name: 'Bruno' }).click();
    await drop(page, 'Horaires de la laverie', 'Profession');
    await expect(page.getByText('Deux placements · à discuter. Les deux positions restent à l’écran.')).toBeVisible();
  });

  test("Les deux avis restent visibles ; le groupe écrit ce qu'il veut voir changer.", async ({ page }) => {
    await capReady(page);
    await drop(page, 'Horaires de la laverie', 'Mission');
    await fill(page, 'Changement attendu', 'chaque personne trouve un créneau de laverie');
    await tap(page, '✨ Mettre en mots ce que le groupe a dit');
    await expect(page.getByLabel('Changement attendu', { exact: true })).toHaveValue('Chaque personne trouve un créneau de laverie.');
    await tap(page, 'Validé par le groupe');
    // Proposé par l'IA : à valider ; l'animatrice valide pour le groupe, une fois que tout le monde a dit oui.
    await expect(page.getByText('À valider pour le groupe')).toBeVisible();
    await tap(page, 'Validé par le groupe · Aïcha');
    await expect(page.getByText('✓ validé : Chaque personne trouve un créneau de laverie.')).toBeVisible();
  });
});

// ── 10 Choix ───────────────────────────────────────────────────────────────────────────────────────

async function orientation(page: Page, title = 'Accompagner la lecture des courriers') {
  await fill(page, 'Nouvelle orientation', title);
  await tap(page, '＋ Une orientation');
}

async function placeAs(page: Page, who: string, lean: string) {
  await page.getByRole('button', { name: `${who} : à venir` }).click();
  for (const r of await page.getByRole('radio', { name: lean, exact: true }).all()) await r.click();
  await tap(page, 'J’ai placé');
}

test.describe('10 Choix', () => {
  test('Le groupe range six critères ; cinq personnes donnent leur avis.', async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await ours(page, /Choix/);
    await page.getByRole('button', { name: /👤 Effet attendu pour les personnes : \?/ }).click();
    await expect(page.getByRole('button', { name: /👤 Effet attendu pour les personnes : D'ABORD/ })).toBeVisible();
    await orientation(page);
    for (const v of ['Aïcha', 'Bruno', 'Karim', 'Léa', 'Le CVS']) await expect(page.getByRole('button', { name: `${v} : à venir` })).toBeVisible();
  });

  test('Chacun place seul, puis tout se révèle.', async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await ours(page, /Choix/);
    await orientation(page);
    await placeAs(page, 'Karim', 'beaucoup');
    // On voit qui a placé, jamais où.
    await expect(page.getByRole('button', { name: 'Karim : a placé' })).toBeVisible();
    await placeAs(page, 'Aïcha', 'peu');
    await tap(page, 'Tout révéler, ensemble');
    await expect(page.getByText(/voient .* très différemment\./).first()).toBeVisible();
  });

  test('Les écarts restent visibles ; le groupe décide.', async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await ours(page, /Choix/);
    await orientation(page);
    await placeAs(page, 'Karim', 'beaucoup');
    await placeAs(page, 'Aïcha', 'peu');
    await tap(page, 'Tout révéler, ensemble');
    await expect(page.getByText(/^À DISCUTER ·/).first()).toBeVisible();
    await fill(page, 'Décision dictée', 'on fait un atelier courriers le mardi');
    await tap(page, '✨ Reformuler la phrase dictée');
    await tap(page, 'Validée par le groupe · vers les actions');
    await tap(page, 'Validé par le groupe · Aïcha');
    await expect(page.getByText('✓ On fait un atelier courriers le mardi.')).toBeVisible();
  });
});

// ── 11 Actions ─────────────────────────────────────────────────────────────────────────────────────

async function solution(page: Page, title: string, modality = '', rhythm = '') {
  await fill(page, 'Nouvelle solution', title);
  if (modality) await fill(page, 'Modalité', modality);
  if (rhythm) await fill(page, 'Rythme', rhythm);
  await tap(page, 'Ajouter');
}

test.describe('11 Actions', () => {
  test('Trois solutions sur la table.', async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await ours(page, /Actions/);
    await solution(page, 'Atelier courriers du mardi', 'binôme', 'chaque semaine');
    await solution(page, 'Binôme de lecture');
    await solution(page, 'Permanence CAF', 'avec partenaire', 'chaque mois');
    for (const t of ['Atelier courriers du mardi', 'Binôme de lecture', 'Permanence CAF']) await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
    await expect(page.getByText('binôme · chaque semaine')).toBeVisible();
  });

  test('Placées sur deux lignes : effet, faisabilité.', async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await ours(page, /Actions/);
    await solution(page, 'Atelier courriers du mardi');
    await expect(page.getByText('REGARDS RÉUNIS · effet pour les personnes')).toBeVisible();
    await expect(page.getByText("REGARDS RÉUNIS · faisabilité pour l'équipe")).toBeVisible();
    await page.getByRole('button', { name: 'Aïcha, effet : beaucoup' }).click();
    await page.getByRole('radio', { name: 'Bruno' }).click();
    await page.getByRole('button', { name: 'Bruno, faisabilité : peu' }).click();
    await expect(page.getByText('Aïcha', { exact: true }).last()).toBeVisible();
  });

  test('Engagement : un atelier chaque mardi.', async ({ page }) => {
    await enter(page, 'Aïcha', null);
    await ours(page, /Actions/);
    await solution(page, 'Atelier courriers du mardi');
    await fill(page, "Texte de l'engagement", 'un atelier courriers chaque mardi');
    // Le groupe dit d'où vient l'engagement : ici, une parole consentie.
    await page.getByRole('checkbox', { name: 'Les horaires de la laverie' }).click();
    await page.getByRole('radio', { name: 'Atelier courriers du mardi' }).click();
    await tap(page, 'Validée par le groupe');
    await expect(page.getByText('✓ un atelier courriers chaque mardi')).toBeVisible();
    // Le fil part de la parole consentie, passe par la solution, finit à l'engagement.
    await expect(page.getByText(/fil : Les horaires de la laverie → .*Atelier courriers du mardi → engagement/)).toBeVisible();
  });
});

// ── 12 Suivi ───────────────────────────────────────────────────────────────────────────────────────

async function committed(page: Page, pro = 'Aïcha', person: string | null = null) {
  await enter(page, pro, person);
  await ours(page, /Actions/);
  await solution(page, 'Atelier courriers du mardi');
  await fill(page, "Texte de l'engagement", 'un atelier courriers chaque mardi');
  await page.getByRole('radio', { name: 'Atelier courriers du mardi' }).click();
  await tap(page, 'Validée par le groupe');
  await link(page, /Suivi/).click();
}

test.describe('12 Suivi', () => {
  test('Le suivi : qui porte quoi, et quand.', async ({ page }) => {
    await committed(page);
    await tap(page, '＋ Une étape');
    await fill(page, "L'étape", 'premier mardi');
    await tap(page, 'Poser l’étape');
    await expect(page.getByText('premier mardi').first()).toBeVisible();
    await fill(page, 'Nouvelle charge', "L'atelier du mardi");
    await fill(page, 'Rythme de la charge', 'chaque semaine');
    await page.getByRole('checkbox', { name: 'Léa' }).click();
    await tap(page, '＋ Une charge');
    await expect(page.getByText('On remarque les prénoms : chacun apporte ce qu’il peut.')).toBeVisible();
    // Le geste : prendre le prénom de Léa, le poser sur Bruno.
    await drop(page, "Léa porte L'atelier du mardi", "Bruno, pour L'atelier du mardi");
    await expect(page.getByText("L'atelier du mardi : Léa passe la main à Bruno.")).toBeVisible();
  });

  test("Amina relie l'atelier à son chemin.", async ({ page }) => {
    await committed(page, 'Sarah', 'Amina');
    await tap(page, 'CHRS Les Lilas propose : un atelier courriers chaque mardi');
    await expect(page.getByText('Bonjour Amina 👋').filter({ visible: true })).toBeVisible();
    await mine(page, /Chemin/);
    await expect(page.getByText('CHRS Les Lilas propose : un atelier courriers chaque mardi.', { exact: true })).toBeVisible();
    await tap(page, 'Je le relie à mon chemin');
    await expect(page.getByText('CHRS Les Lilas propose : un atelier courriers chaque mardi.', { exact: true })).toHaveCount(0);
  });

  test('Au printemps, trois personnes comprennent seules leurs courriers.', async ({ page }) => {
    await committed(page);
    await fill(page, 'Résultat', 'au printemps trois personnes comprennent seules leurs courriers');
    await tap(page, '✨ Mettre en mots le résultat');
    await tap(page, '🔁 Retour au constat');
    // Le résultat ne suffit pas : on revient au constat, puis le suivi le garde, en mots.
    await expect(page).toHaveURL(/notre-projet\/constat/);
    await link(page, /Suivi/).click();
    await tap(page, 'Validé par le groupe · Aïcha');
    await expect(page.getByText(/📊 .*Au printemps trois personnes comprennent seules leurs courriers. → retour au constat 🔁/).filter({ visible: true })).toBeVisible();
  });
});
