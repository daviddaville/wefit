# Fiche R&D — Scaffolding MVP AI-RepCoach — 2026-05-23

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `4a3d224` | branche `main` | date push `2026-05-23`
- 🎯 Dispositif : **CIR + CII**
- 🏷️ Imputabilité IP : `wefit` | `partagée`
- 🏷️ Types CII : `nouvelle-fonctionnalité` · `technique` · `ergonomie-cognitive`

---

## 🔬 Nature des travaux

Conception et implémentation de l'architecture fondatrice d'une application SaaS de coaching de progression en musculation. Les travaux portent sur deux niveaux distincts : (1) la modélisation d'un algorithme de double progression adapté aux contraintes bioméchaniques des exercices aux haltères, et (2) la structuration d'une architecture logicielle découplée (`src/core/` DOM-free) permettant la réutilisation intégrale du moteur métier en phase de portage React Native.

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou 1 — Algorithme de double progression adaptatif**
Incertitude : comment modéliser automatiquement la progression de charge en musculation sans capteurs physiologiques, en tenant compte des contraintes biomécaniques spécifiques à chaque groupe musculaire (notamment la vulnérabilité articulaire des épaules) ?
Résolution : implémentation d'un moteur de décision (`progressionEngine.ts`) appliquant les règles suivantes :
- Toutes séries ≥ rep_range_max → progression +1,25 kg
- ≥ 2 séries < rep_range_min → régression −5 %
- Épaules : plafond +2,5 kg/semaine (protection articulaire)
- Arrondi aux haltères disponibles (pas de 0,5 kg)

**Verrou 2 — Synchronisation état session temps réel**
Incertitude : comment maintenir la cohérence de l'état d'une séance (exercice courant, série courante, historique de charge) sans backend temps réel, tout en garantissant la persistance en cas de fermeture du navigateur ?
Résolution : store Zustand (`sessionStore.ts`) avec sérialisation locale ; séparation stricte des couches store (état) / service (Supabase) / hook (logique UI).

**Verrou 3 — Architecture découplée core/features**
Incertitude : comment concevoir une base de code web qui soit réutilisable à 100 % dans une app mobile React Native sans duplication de la logique métier ?
Résolution : convention architecturale `src/core/` (types, hooks, stores, services, utils) strictement DOM-free, testable en isolation, vs `src/features/` (UI web spécifique).

---

## 🌐 État de l'art au moment des travaux

Les applications de suivi de musculation existantes sur le marché (Strong, Hevy, FitBod) proposent des suggestions de progression basées soit sur des règles statiques, soit sur des modèles d'apprentissage automatique nécessitant un historique de plusieurs mois. Aucune n'implémente une progression à deux seuils (min/max de répétitions) avec correction biomécanique par groupe musculaire, accessible sans abonnement premium et utilisable offline.

---

## 💎 Valeur IP créée

- **`progressionEngine.ts`** : algorithme propriétaire de double progression adaptatif avec correction biomécanique. Généralisable à tout contexte de prescription d'effort progressif (rééducation, sport de haut niveau).
- **Architecture `core/features`** : pattern de découplage web/mobile validé, réutilisable pour tout SaaS à ambition multi-plateforme sous licence Sysencom.
- **Schéma BDD** (`001_init_schema.sql`) : modèle de données musculation avec RLS Supabase — actif IP structurant pour la Phase 2 mobile.

---

## 👨‍💻 Moyens mobilisés

- Langages : TypeScript 5.x, SQL (PostgreSQL)
- Frameworks : Next.js 16.2.6, React 19, Zustand 4, TanStack Query 5, Supabase
- Estimation : ~8 jours·homme (conception architecture + implémentation moteur + schéma BDD + UI session)

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Dans le cadre du développement de la plateforme WeFit, les travaux réalisés lors de cette phase ont porté sur la résolution d'une incertitude technique concernant la modélisation automatique de la progression de charge en musculation sans recours à des capteurs physiologiques. La société Sysencom a développé un algorithme original, dénommé « moteur de double progression », implémentant une logique de décision à deux seuils (minimum et maximum de répétitions réalisées) assortie de corrections différenciées par groupe musculaire, notamment une limitation de la progression hebdomadaire pour les exercices sollicitant les articulations des épaules. Cette approche, qui ne trouve pas d'équivalent direct dans l'état de l'art des applications de coaching sportif accessibles au grand public, constitue un apport nouveau à la connaissance dans le domaine de la prescription automatisée de l'effort progressif. En parallèle, une architecture logicielle découplée a été conçue pour permettre la réutilisation intégrale du moteur métier dans une phase ultérieure de portage sur plateforme mobile, sans duplication du code applicatif.
