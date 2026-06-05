# Fiche R&D — Mémoire de séance, chrono élapsé, repos éditable, volume — 2026-05-25

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `6f77264` | branche `main` | date push `2026-05-25`
- 🎯 Dispositif : **CII**
- 🏷️ Imputabilité IP : `wefit`
- 🏷️ Types CII : `ergonomie-cognitive` · `nouvelle-fonctionnalité` · `ergonomie-physique`

---

## 🔬 Nature des travaux

Développement de quatre améliorations ergonomiques majeures de l'interface de séance : (1) mémorisation des répétitions entre séries au sein d'une même session (persistance en mémoire du store Zustand) ; (2) chronomètre élapsé MM:SS affiché en position primaire et très visible pendant toute la séance ; (3) temps de repos modifiable par exercice en temps réel via boutons +/-15s sans quitter le flux de séance ; (4) affichage du volume total soulevé (poids × répétitions) en fin de séance.

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou 1 — Continuité de la saisie entre séries**
Incertitude : comment éviter que l'utilisateur resaisisse le même nombre de répétitions à chaque série, dans un contexte où la mémoire de session doit survivre aux re-renders React sans persistance serveur ?
Résolution : extension du `WeightMemory` dans le store Zustand pour inclure `reps`, lu en priorité sur l'historique DB lors de l'initialisation du composant. Les reps de la série précédente deviennent le point de départ de la série suivante.

**Verrou 2 — Chronomètre temps réel sans dégradation de performance**
Incertitude : comment implémenter un timer élapsé à la seconde dans une page React Active (avec des états fréquemment mis à jour) sans provoquer de re-renders inutiles ?
Résolution : hook `useElapsedTimer` isolé avec `setInterval` lié au `sessionStartedAt` (timestamp Unix), mis à jour via `useState` local — les re-renders du timer sont isolés du reste de la page.

**Verrou 3 — Modification du temps de repos sans interruption du flux**
Incertitude : comment permettre à l'utilisateur de modifier le temps de repos d'un exercice spécifique en cours de séance, sans navigation supplémentaire ni risque de perdre la série en cours ?
Résolution : `restOverride` map dans le store (keyed par `sets_config_id`), modifiable via deux boutons inline dans le badge repos. La modification est locale à la session et prend effet dès la prochaine série.

---

## 🌐 État de l'art au moment des travaux

Les applications de suivi de musculation (Strong, Hevy) nécessitent généralement une navigation vers les paramètres pour modifier le temps de repos. La mémorisation des répétitions entre séries dans la même session est rare. L'affichage du volume total en fin de séance est absent de la plupart des solutions gratuites. L'approche de WeFit est de réduire le nombre d'interactions nécessaires pendant l'effort physique.

---

## 💎 Valeur IP créée

- **Pattern `WeightMemory` étendu** : persistance multi-paramètres (poids G/D + reps) en mémoire de session — généralisable à tout formulaire de saisie répétitive sous contrainte physique.
- **Hook `useElapsedTimer`** : composant réutilisable de mesure de durée d'activité — applicable à tout contexte de suivi d'effort (sport, rééducation, productivité).
- **`restOverride` store pattern** : surcharge locale de paramètres sans mutation de la config persistante — pattern réutilisable pour tout système de prescription adaptative.

---

## 👨‍💻 Moyens mobilisés

- Langages : TypeScript 5.x
- Frameworks : React 19, Zustand 5, Next.js 16
- Estimation : ~2 jours·homme

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Ces travaux ont porté sur l'amélioration des caractéristiques ergonomiques de l'interface de séance d'entraînement, avec pour objectif de réduire la charge cognitive et le nombre d'interactions nécessaires lors d'une utilisation sous effort physique. Trois améliorations sensibles ont été apportées par rapport à l'état de l'art des applications disponibles sur le marché : la mémorisation automatique des paramètres de saisie entre séries consécutives (réduction d'une interaction par série), la modification en temps réel du temps de repos sans navigation supplémentaire (réduction de deux interactions par exercice), et l'affichage continu de la durée d'effort en position primaire (élimination du besoin de consultation d'une montre externe). Ces améliorations constituent des innovations ergonomiques cognitives au sens des critères d'éligibilité au Crédit d'Impôt Innovation.
