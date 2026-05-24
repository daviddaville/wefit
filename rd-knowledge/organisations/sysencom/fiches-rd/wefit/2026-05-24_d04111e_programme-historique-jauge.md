# Fiche R&D — Gestion de programme, historique quotidien, jauge de progression — 2026-05-24

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `d04111e` | branche `main` | date push `2026-05-24`
- 🎯 Dispositif : **CII**
- 🏷️ Imputabilité IP : `wefit`
- 🏷️ Types CII : `nouvelle-fonctionnalité` · `ergonomie-cognitive`

---

## 🔬 Nature des travaux

Développement de trois fonctionnalités structurantes : (1) un système complet de gestion de programme d'entraînement (création, édition de séances, ajout/suppression d'exercices avec configuration sets/répétitions/repos) ; (2) une vue d'historique quotidien groupant les séances réalisées par jour avec résumé de volume et accès au détail ; (3) une jauge de complétion de séance calculée au niveau des séries (et non des exercices) pour une représentation précise de l'avancement.

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou 1 — Granularité de la jauge de progression**
Incertitude : comment représenter de façon précise et motivante l'avancement d'une séance, sachant que les exercices ont des nombres de séries hétérogènes (3 à 5) et que la progression par exercice entier introduit des sauts de 20-33 % peu représentatifs de l'effort réel ?
Résolution : calcul au niveau série (`completedSets / totalSets * 100`) — les séries complétées des exercices précédents + les séries de l'exercice courant moins la série en cours. Résultat : granularité de 1 à 2 % par série, représentation fidèle de l'effort.

**Verrou 2 — Édition de programme sans rechargement**
Incertitude : comment permettre la modification d'un programme (ajout/suppression d'exercices, modification de l'ordre des séances) sans perte de l'état en cours de séance ni rechargement de page complet ?
Résolution : architecture React Query (invalidation ciblée par queryKey) + mutations optimistes ; séparation des contextes programme (planification) et session (exécution).

**Verrou 3 — Historique groupé par journée**
Incertitude : comment présenter l'historique des séances de façon lisible et actionnable, en tenant compte des jours sans entraînement (repos actif) et des séances multiples par journée ?
Résolution : groupement côté client par `logged_date`, tri antéchronologique, indicateurs de volume total (séries × exercices) par journée, accès au détail en un tap.

---

## 🌐 État de l'art au moment des travaux

La majorité des applications de musculation proposent des jauges de progression par exercice, ce qui entraîne des variations de progression non linéaires peu représentatives de l'effort réel. La jauge par série est une approche peu répandue dans les solutions grand public. La gestion de programme intégrant un éditeur visuel de séances (versus import de templates statiques) reste rare dans les applications gratuites ou à bas coût.

---

## 💎 Valeur IP créée

- **Algorithme de jauge série-level** : calcul de progression par série plutôt que par exercice — approche plus précise, motivationnellement supérieure, brevetable comme méthode d'affichage de progression sportive.
- **Éditeur de programme dynamique** : interface de création/édition de programme d'entraînement structurée (nom, séances, exercices, sets/reps/repos) avec persistance Supabase — réutilisable pour tout système de prescription d'activité physique.
- **Vue historique agrégée** : synthèse quotidienne de volume d'entraînement — base pour les analyses de charge hebdomadaire (Phase analytique).

---

## 👨‍💻 Moyens mobilisés

- Langages : TypeScript 5.x
- Frameworks : Next.js 16, React Query 5, shadcn/ui
- Estimation : ~4 jours·homme (programme CRUD + historique + jauge + routes)

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Les travaux de cette phase ont notamment porté sur la conception d'un indicateur de complétion de séance d'entraînement à granularité fine. Contrairement aux approches conventionnelles mesurant l'avancement au niveau de l'exercice — unité trop grossière introduisant des sauts de progression de l'ordre de 20 à 33 % par étape — la solution développée calcule la progression au niveau de la série individuelle, aboutissant à une représentation continue de l'effort réalisé avec une résolution de 1 à 2 % par série. Cette approche constitue une amélioration sensible des caractéristiques fonctionnelles des indicateurs de progression sportive disponibles sur le marché, dans la mesure où elle réduit significativement le nombre d'étapes d'affichage non représentatives de l'effort réel de l'utilisateur.
