# Décision — dieidos-technology : déc. 811 (versée)

> **Versée le 2026-10-14** dans `dieidos-technology/gouvernance/DECISIONS.md`, commit `0f4ffe6`, sous le
> n° 811 (le 810 avait été pris entre-temps). Le texte versé fait foi ; celui-ci en est la copie.

### déc. 811 — HLuX redevient un produit autonome, client des services dieidos

_Tranché par le propriétaire le 2026-10-14 (source : `CDC - HLuX.md`, arbitrages du 2026-10-14) ; versée par Claude le 2026-10-14._

- HLuX (Harmonia LuX) sort du gel prononcé par la déc. 589 **pour lui seul** : produit autonome, dépôt
  propre `dieidos/HLuX` (GitHub), sans back-end propre
- dieidos-technology est **son seul serveur** : authentification des professionnels
  (`/api/auth/native/exchange`), un tenant par établissement, tableau partagé trinity-mcp, aides IA
- La déc. 711 (liste fermée de mots) **reste en vigueur dans ce dépôt** : les mots du produit vivent
  dans le dépôt `hlux` ; les ajouts côté dieidos sont nommés en vocabulaire neutre
- Ajouts à faire côté dieidos, à planifier : (1) un manifest de tenant type « établissement » ;
  (2) un module d'aides de reformulation (simplification, traduction, reformulation) sans rétention,
  avec pseudonymisation et garde PII en entrée et en sortie ; (3) des jetons éphémères (invitation,
  séance) et deux routes relais ; (4) un geste de révélation (descellement collectif)
- Conservation des données collectives : durée du projet de l'établissement + 1 an, puis export
  remis et purge
- Coût des appels IA : clé dieidos, consommation suivie par établissement (`llm_usage_events`),
  incluse dans l'abonnement
- Aucune donnée personnelle de la personne accompagnée n'est stockée chez dieidos ; un texte ne
  transite que sur geste explicite, pseudonymisé, sans donnée de santé, sans conservation
