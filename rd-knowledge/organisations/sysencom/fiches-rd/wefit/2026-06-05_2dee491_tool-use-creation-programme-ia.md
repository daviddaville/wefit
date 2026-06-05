# Fiche R&D — Tool use OpenAI : création de programme IA directement en BDD — 2026-06-05

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `2dee491` | branche `main` | date push `2026-06-05`
- 🎯 Dispositif : **CIR + CII** (activité prépondérante)
- 🏷️ Imputabilité IP : `wefit` | `partagée`
- 🏷️ Types CII : `nouvelle-fonctionnalité` · `technique`

---

## 🔬 Nature des travaux

Implémentation du mécanisme de **tool use** (appel de fonctions par un LLM) dans la route de chat du coach IA, permettant au modèle d'exécuter des actions réelles en base de données pendant une conversation. Deux outils ont été définis et implémentés : `get_exercise_catalog` (consultation du catalogue d'exercices avec filtrage par groupe musculaire) et `create_program` (création complète d'un programme personnalisé en Supabase : programme + séances + exercices configurés). Le système implémente une boucle d'appel multi-tours (max 5 itérations) permettant au modèle d'enchaîner consultation du catalogue et création du programme en une seule interaction utilisateur.

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou 1 — Cohérence entre les exercices générés par le LLM et le catalogue réel**
Incertitude : comment garantir que le modèle de langage utilise exclusivement des exercices existants dans la BDD WeFit lors de la génération d'un programme via conversation, sans hallucination de noms d'exercices ?
Résolution : outil `get_exercise_catalog` appelé en premier par le modèle avant `create_program`. Le catalogue réel (200 exercices) est injecté dans le contexte du modèle au moment de la génération, contraignant son espace de réponse aux seuls exercices disponibles. Correspondance par `ilike` côté serveur pour tolérer les variations de casse.

**Verrou 2 — Exécution d'actions persistantes depuis une conversation LLM**
Incertitude : comment permettre à un LLM conversationnel d'exécuter des opérations de base de données (création multi-entités : programme → séances → exercices configurés) de façon atomique et sécurisée, depuis une API route Next.js ?
Résolution : architecture tool use avec boucle de 5 tours maximum : le modèle retourne des `tool_calls`, le serveur exécute les fonctions via Supabase service role key (côté serveur uniquement, jamais exposé au client), retourne les résultats, le modèle poursuit. Le `userId` est transmis dans le body de la requête pour l'attribution en BDD.

**Verrou 3 — Atomicité de la création programme multi-entités**
Incertitude : comment créer un programme complet (N séances × M exercices) depuis un LLM dont la sortie JSON peut être incomplète ou partiellement erronée ?
Résolution : création séquentielle avec `continue` sur erreur par entité (un exercice non trouvé ne bloque pas les suivants), désactivation des programmes précédents avant création du nouveau pour garantir un seul programme actif.

---

## 🌐 État de l'art au moment des travaux

L'utilisation du tool use LLM pour déclencher des opérations de base de données en production depuis un chat conversationnel est une approche émergente (2024-2025). Les applications de coaching IA existantes (FitBod AI, Freeletics) utilisent des modèles de recommandation, pas de LLM avec accès direct à la BDD. WeFit implémente un pattern original combinant : chat naturel → consultation catalogue contrainte → persistance BDD via tool use → confirmation conversationnelle.

---

## 💎 Valeur IP créée

- **Pattern "LLM-to-database via tool use"** : architecture permettant à un LLM de créer des entités complexes (multi-tables, multi-niveaux) en BDD depuis une conversation — brevetable comme méthode de génération de contenu personnalisé persistant via IA conversationnelle.
- **Boucle multi-tours catalog → create** : méthode de contrainte de génération LLM par consultation préalable du catalogue réel — généralise le pattern de filtrage pré-LLM à un contexte conversationnel dynamique.
- **Tool `get_exercise_catalog` + `create_program`** : interface programmatique du moteur WeFit exposable comme API publique pour partenariats (coachs, applications tierces).

---

## 👨‍💻 Moyens mobilisés

- Langages : TypeScript 5.x
- Frameworks : Next.js 16 (API Routes), OpenAI SDK v6 (tool use), Supabase service role
- Dépenses API : OpenAI GPT-4o-mini (facturation à l'usage — éligible CIR, appels R&D)
- Estimation : ~2 jours·homme

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Cette phase constitue une avancée technique significative dans le système de coaching IA de WeFit. Les travaux ont porté sur la résolution d'une double incertitude technique : d'une part, garantir la cohérence entre les prescriptions générées par un modèle de langage de grande taille et le catalogue d'exercices réel de l'application (problème d'hallucination dans un contexte de génération contrainte) ; d'autre part, permettre l'exécution d'opérations de persistance multi-entités en base de données depuis un agent conversationnel (problème de fiabilité des actions agentic dans un contexte de production). La solution développée repose sur une architecture de tool use originale intégrant une boucle d'appels multi-tours avec consultation préalable du catalogue et création atomique du programme. Ce pattern, combinant génération contrainte par LLM et persistance directe en BDD depuis une interface conversationnelle, constitue un apport nouveau par rapport à l'état de l'art des systèmes de coaching sportif automatisé.
