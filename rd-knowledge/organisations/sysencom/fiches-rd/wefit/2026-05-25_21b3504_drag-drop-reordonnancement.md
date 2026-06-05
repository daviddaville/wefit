# Fiche R&D — Drag & drop réordonnancement des exercices — 2026-05-25

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `21b3504` | branche `main` | date push `2026-05-25`
- 🎯 Dispositif : **CII**
- 🏷️ Imputabilité IP : `wefit`
- 🏷️ Types CII : `ergonomie-cognitive` · `ergonomie-physique`

---

## 🔬 Nature des travaux

Implémentation d'un système de réordonnancement des exercices par glisser-déposer dans l'éditeur de programme, compatible souris et écran tactile (mobile). Le système utilise une mise à jour optimiste (l'ordre change immédiatement visuellement) avant persistance en base de données, avec resynchronisation automatique en cas d'erreur réseau.

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou — Drag & drop tactile fiable sur mobile fitness**
Incertitude : les implémentations natives de drag & drop HTML5 ne fonctionnent pas sur mobile (touch events). Comment implémenter un réordonnancement intuitif sur un appareil tactile utilisé en contexte sportif (mains potentiellement humides, interactions rapides) ?
Résolution : `@dnd-kit/sortable` avec `PointerSensor` (activation après 5px de déplacement pour éviter les faux positifs) et `TouchSensor` (activation après 200ms hold + 5px de tolérance). Mise à jour optimiste locale via `arrayMove` avant la requête Supabase.

---

## 💎 Valeur IP créée

- **Pattern mise à jour optimiste + resync** : pattern de cohérence UI/BDD pour drag & drop mobile — réutilisable pour tout réordonnancement de listes dans WeFit (séances, exercices, plans).

---

## 👨‍💻 Moyens mobilisés

- Librairies : @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- Estimation : ~0,5 jour·homme

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> L'implémentation du réordonnancement par glisser-déposer a nécessité de résoudre une incompatibilité entre les API de drag & drop HTML5 standard et les environnements d'utilisation mobiles tactiles. La solution retenue combine des capteurs d'activation différenciés (délai et tolérance de déplacement distincts selon le type de pointeur) avec un mécanisme de mise à jour optimiste garantissant une réactivité immédiate de l'interface indépendamment de la latence réseau. Cette approche améliore sensiblement l'ergonomie physique de l'édition de programme sur appareil mobile.
