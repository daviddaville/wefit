# Fiche R&D — Système de coaching IA multi-personas + diagnostic + suivi poids — 2026-05-24

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `3e93a0c` | branche `main` | date push `2026-05-24`
- 🎯 Dispositif : **CIR + CII** (activité prépondérante)
- 🏷️ Imputabilité IP : `wefit` | `partagée`
- 🏷️ Types CII : `nouvelle-fonctionnalité` · `technique` · `ergonomie-cognitive`

---

## 🔬 Nature des travaux

Conception et développement d'un système de coaching IA original comprenant trois composantes majeures : (1) un moteur de personas IA à 6 profils psychologiques distincts (motivateur, militaire, bienveillant, strict, scientifique, sarcastique), chacun doté d'un prompt système spécialisé définissant ton, style de communication et approche pédagogique ; (2) un flux de diagnostic intelligent en 7 étapes recueillant objectifs, niveau, disponibilités, matériel et limitations pour générer automatiquement un programme personnalisé via LLM avec résolution de contraintes multi-variables ; (3) un module de suivi du poids corporel avec histogramme recharts, tendance calculée et ligne d'objectif visuelle.

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou 1 — Ingénierie de personas IA cohérents pour le coaching sportif**
Incertitude : comment concevoir des personas IA (profils de coach) suffisamment différenciés pour que l'utilisateur perçoive une personnalité distincte, tout en garantissant la qualité et la sécurité des conseils sportifs délivrés ?
Résolution : modélisation de 6 personas avec système de prompt structuré (`coachPersonas.ts`) définissant explicitement : style de communication, niveau d'intensité, type de motivation, contraintes de contenu (pas de conseils médicaux, référence au programme réel de l'athlète). Chaque persona possède un nom propre (APEX, SERGENT, SAM, COACH MAX, DR. FORGE, REX) renforçant l'attachement utilisateur.

**Verrou 2 — Génération de programme par résolution de contraintes multi-variables via LLM**
Incertitude : comment obtenir d'un LLM un programme d'entraînement structuré (JSON valide, exercices existants dans le catalogue, cohérent avec matériel disponible) sans hallucination ni violation de contraintes ?
Résolution : prompt système structuré avec catalogue d'exercices injecté, instructions de format JSON strict (`response_format: json_object`), contraintes explicites (exercices du catalogue uniquement, matériel uniquement disponible, adaptation au niveau). Filtrage côté serveur des exercices par matériel avant injection dans le prompt.

**Verrou 3 — Personnalisation contextuelle des réponses du coach**
Incertitude : comment permettre au coach IA de faire référence au contexte réel de l'athlète (poids, objectif, programme) sans exposer de données personnelles à l'API OpenAI de façon non maîtrisée ?
Résolution : injection contrôlée du contexte utilisateur dans le system prompt côté serveur (`buildSystemPrompt`) ; seules les données strictement nécessaires sont transmises ; la clé API reste strictement côté serveur (Next.js API route).

**Verrou 4 — Visualisation de tendance pondérale avec histogramme adaptatif**
Incertitude : comment représenter visuellement une série temporelle de poids corporel (60 jours) de façon lisible avec mise en évidence de la barre du jour courant et de l'objectif, dans une interface mobile-first ?
Résolution : histogramme recharts avec domaine Y dynamique `[min-2, max+2]`, barre du jour en couleur primaire, `ReferenceLine` pour l'objectif, calcul de tendance (TrendingDown/Up) vs mesure précédente.

---

## 🌐 État de l'art au moment des travaux

Les coaches IA sportifs disponibles (Fitbod AI, Freeletics Coach) utilisent des modèles de recommandation basés sur l'historique et des règles métier, sans personnalité distincte ni adaptation stylistique au profil psychologique de l'utilisateur. La génération de programme personnalisé via LLM avec résolution de contraintes matériel × niveau × objectif en temps réel (moins de 10 secondes) est une approche non documentée dans les applications grand public au moment des travaux.

---

## 💎 Valeur IP créée

- **Système de personas IA coach** (`coachPersonas.ts`) : 6 profils avec prompts système spécialisés — architecture extensible, généralisable à tout domaine de coaching (nutrition, méditation, rééducation). Actif IP différenciant pour la marque WeFit.
- **Moteur de diagnostic et génération de programme IA** (`/api/coach/diagnose`) : résolution de contraintes multi-variables (matériel × disponibilité × niveau × objectif × catalogue d'exercices) via LLM structuré — brevet potentiel sur la méthode de filtrage pré-LLM.
- **DiagnosticFlow** : flux UX en 7 étapes pour la collecte de profil sportif — pattern réutilisable pour tout onboarding personnalisé dans le domaine de la santé/bien-être.

---

## 👨‍💻 Moyens mobilisés

- Langages : TypeScript 5.x
- Frameworks : Next.js 16 (API Routes), React 19, OpenAI API (gpt-4o), recharts
- Dépenses API : OpenAI GPT-4o / GPT-4o-mini (facturation à l'usage — éligible CIR)
- Estimation : ~7 jours·homme (personas + diagnostic flow + génération programme + weight tracker)

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Cette phase constitue le cœur de la valeur R&D du projet WeFit. Les travaux ont porté sur la conception d'un système original de coaching sportif personnalisé par intelligence artificielle, combinant deux innovations techniques majeures. Premièrement, un système de personas conversationnelles différenciées (six profils psychologiques distincts) a été développé, chacun défini par un ensemble de contraintes de style, de ton et de contenu formalisées sous forme de prompts système structurés. Cette approche vise à résoudre l'incertitude technique concernant la capacité des modèles de langage de grande taille à maintenir une cohérence stylistique à travers une conversation longue, tout en respectant des contraintes de sécurité dans le contexte sportif. Deuxièmement, un moteur de génération automatique de programme d'entraînement personnalisé a été développé, reposant sur une méthode originale de pré-filtrage des données d'entrée (catalogue d'exercices filtré par matériel disponible avant injection dans le prompt) visant à réduire le taux d'hallucination du modèle et à garantir la cohérence des prescriptions avec les contraintes réelles de l'utilisateur. Ces deux composantes constituent des apports nouveaux par rapport à l'état de l'art des systèmes de coaching sportif automatisé accessibles au grand public.
