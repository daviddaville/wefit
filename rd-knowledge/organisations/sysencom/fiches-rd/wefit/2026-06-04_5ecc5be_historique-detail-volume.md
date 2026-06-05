# Fiche R&D — Historique de séance enrichi — volume, repos, tableau séries — 2026-06-04

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `5ecc5be` | branche `main` | date push `2026-06-04`
- 🎯 Dispositif : **CII**
- 🏷️ Imputabilité IP : `wefit`
- 🏷️ Types CII : `nouvelle-fonctionnalité` · `ergonomie-cognitive`

---

## 🔬 Nature des travaux

Refonte de la vue historique de séance pour exposer l'ensemble des données de performance enregistrées : tableau séries par exercice (poids, répétitions réalisées vs objectif), badge groupe musculaire, temps de repos configuré, volume par exercice et volume total de la séance. Codage couleur des répétitions (vert ≥ objectif minimum, ambre < objectif) pour une lecture rapide de la performance.

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou — Lecture de performance en un coup d'œil sous fatigue post-effort**
Incertitude : comment présenter a posteriori les données de performance d'une séance (potentiellement 30-50 séries) de façon lisible et actionnable par un utilisateur en période de récupération, sans surcharge cognitive ?
Résolution : hiérarchie visuelle à 3 niveaux — header (nom + durée + volume total), section exercice (groupe musculaire + objectif + temps repos + volume exercice), tableau séries (codage couleur binaire vert/ambre sur les reps). La comparaison objectif/réalisé est immédiate sans calcul mental.

---

## 🌐 État de l'art au moment des travaux

Les applications de musculation grand public (Strong, Hevy) affichent l'historique sous forme de liste de séries sans comparaison objective/réalisé ni agrégation de volume par exercice. Le codage couleur de la performance par série est absent des solutions disponibles à ce prix.

---

## 💎 Valeur IP créée

- **Tableau de performance séance avec codage couleur objectif/réalisé** : visualisation originale de la performance sportive par série — généralisable à tout contexte de suivi de prescription (rééducation, sport professionnel).
- **Agrégation volume multi-niveaux** (par série → par exercice → par séance) : base pour les analytics de progression à venir (Phase analytique WeFit).

---

## 👨‍💻 Moyens mobilisés

- Langages : TypeScript 5.x, recharts
- Estimation : ~1 jour·homme

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Les travaux ont porté sur la conception d'un module de visualisation des performances sportives post-séance intégrant une comparaison automatique entre les paramètres prescrits et les paramètres réalisés pour chaque série individuelle. Le codage couleur binaire retenu (vert pour les répétitions atteignant l'objectif minimum, ambre pour les répétitions en deçà) constitue une amélioration sensible de la lisibilité de l'historique de performance par rapport aux représentations tabulaires sans différenciation visuelle disponibles dans les solutions concurrentes.
