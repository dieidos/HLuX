//! Le vocabulaire d'HLuX, tel que l'Atlas V4 le montre.
//!
//! ⛔ Aucun champ numérique de score ici : une position est un **ordre** ou un **penchant**
//! (moins · milieu · plus), jamais une valeur. Le test `aucun_score_dans_le_modele` le vérifie.

use serde::{Deserialize, Serialize};

/// Identifiant métier, choisi par l'appareil (dérivé, jamais tiré au sort côté cœur).
pub type Id = String;

/// Écran 02 — les trois lieux du Ressenti.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Feeling {
    /// 😊 ça va
    Fine,
    /// 🤔 je ne sais pas
    Unsure,
    /// 😟 c'est difficile
    Hard,
}

/// Écran 01 — comment la Carte est née.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Origin {
    /// je parle
    Spoken,
    /// j'écris
    Written,
    /// je choisis une image
    Picture,
}

/// Langue d'un verbatim.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Lang {
    /// français
    Fr,
    /// arabe
    Ar,
}

/// Écran 03 — les quatre cercles (au singulier pour Amina, au pluriel pour le collectif).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Circle {
    /// J'aime · Nous aimons
    Love,
    /// J'en suis capable · Nous en sommes capables
    Able,
    /// Je suis utile · Nous sommes utiles
    Useful,
    /// J'en vis · Nous en vivons
    Living,
}

/// Les croisements, nommés avec des mots, jamais des coordonnées.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Crossing {
    /// Passion
    Passion,
    /// Mission
    Mission,
    /// Profession
    Profession,
    /// Vocation
    Vocation,
}

/// Où une idée est posée sur l'Ikigai.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "at", content = "which")]
pub enum Spot {
    /// dans la réserve, à placer
    Tray,
    /// dans un cercle
    Circle(Circle),
    /// sur un croisement
    Crossing(Crossing),
    /// écartée par le bord — seul geste irréversible
    Discarded,
}

/// Écran 04 / 10 — les rangs : un ordre dit avec des mots.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Rank {
    /// D'abord
    First,
    /// Ensuite
    Then,
    /// Aussi
    Also,
    /// Moins
    Less,
    /// Je ne sais pas encore — une réponse à part entière
    NotYet,
}

/// Un penchant sur une ligne (page invité) : peu ←→ beaucoup, sans chiffre.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Lean {
    /// peu
    Little,
    /// entre les deux
    Middle,
    /// beaucoup
    Much,
}

/// Écran 06 — nature d'un nœud du chemin.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NodeKind {
    /// ◆ une décision de la personne (ou « décidé ensemble »)
    Decision,
    /// ● un événement du monde
    Event,
}

/// Écran 06 — nature d'un lien entre deux nœuds.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "kind", content = "words")]
pub enum LinkKind {
    /// chemin choisi
    Chosen,
    /// alternative ouverte — jamais grise
    Open,
    /// condition écrite sur sa branche
    Condition(String),
    /// dépendance tracée (« ceci attend… »)
    Dependency(String),
}

/// Écran 08 — l'échelle de qualification d'un constat.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Qualification {
    /// situation individuelle
    Individual,
    /// signal à vérifier
    Signal,
    /// difficulté répétée
    Repeated,
    /// enjeu collectif confirmé
    Confirmed,
}

/// Écran 08 — d'où vient une carte du constat.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Source {
    /// 🗣️ parole consentie d'une personne
    ConsentedWord,
    /// 👥 l'équipe
    Team,
    /// 🏛️ le CVS
    Cvs,
}

/// Écran 10 — les six critères du métier.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Criterion {
    /// 👤 effet attendu pour les personnes
    Effect,
    /// ⚖️ respect des droits
    Rights,
    /// 🛠️ faisabilité
    Feasibility,
    /// ⏱️ urgence
    Urgency,
    /// 🤝 coopération nécessaire
    Cooperation,
    /// 📦 ressources disponibles
    Resources,
}

/// Rôles du collectif.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    /// accompagnatrice
    Companion,
    /// équipe
    Team,
    /// cheffe de service
    Head,
    /// personne accompagnée
    Supported,
    /// conseil de la vie sociale
    Cvs,
}

/// Les quatre cases du plan (écran 06).
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Plan {
    /// 🥇 D'abord
    pub first: Vec<String>,
    /// ⏳ Ça attend (quoi, ce qu'on attend)
    pub waiting: Vec<(String, String)>,
    /// 👥 Avec qui
    pub with_whom: Vec<String>,
    /// 🌱 Reste ouvert
    pub open: Vec<String>,
}
