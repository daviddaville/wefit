# Fiche R&D — Catalogue d'exercices, profil biométrique, session augmentée — 2026-05-24

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `e59a87b` | branche `main` | date push `2026-05-24`
- 🎯 Dispositif : **CII**
- 🏷️ Imputabilité IP : `wefit`
- 🏷️ Types CII : `nouvelle-fonctionnalité` · `ergonomie-cognitive` · `ergonomie-physique`

---

## 🔬 Nature des travaux

Développement de trois modules fonctionnels nouveaux : (1) un catalogue d'exercices structuré par groupe musculaire avec descriptions et niveaux de difficulté, alimenté par extraction automatisée depuis des sources spécialisées ; (2) une page de profil biométrique intégrant les données anthropométriques nécessaires à la personnalisation de la progression ; (3) une interface de séance augmentée intégrant un minuteur de repos avec signal sonore, un indicateur de charge suggérée basé sur la dernière performance, et un flux de saisie optimisé pour une utilisation sous effort physique.

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou 1 — Extraction et normalisation du catalogue d'exercices**
Incertitude : comment constituer un catalogue structuré (nom, groupe musculaire, niveau, description) à partir de sources textuelles hétérogènes, avec normalisation des catégories (accents, variantes orthographiques) pour garantir la cohérence des filtres ?
Résolution : scripts d'extraction (`import-sp-exercises.mjs`, `scrape-descriptions.mjs`) + fonction `normStr()` pour comparaison accent-insensitive ; migration SQL `004_exercise_catalog.sql` avec contrainte d'unicité sur le nom.

**Verrou 2 — Interface de séance utilisable sous effort physique**
Incertitude : comment concevoir une interface de saisie de performance (poids × répétitions) utilisable avec une seule main, sous fatigue musculaire, sans risque d'erreur de saisie ?
Résolution : composant `WeightRepInput` avec grandes zones de tap, suggestion automatique de la charge (dernière performance + delta progression), confirmation en un tap. Composant `RestTimerOverlay` avec minuteur visuel circulaire + signal sonore Tone.js (880 Hz, 200 ms) pour éviter la consultation de l'écran.

**Verrou 3 — Personnalisation de la progression via profil biométrique**
Incertitude : quelles données anthropométriques sont nécessaires et suffisantes pour personnaliser les suggestions de charge et les objectifs de progression sans recueillir de données médicales sensibles ?
Résolution : modèle profil retenu — prénom, âge, taille, poids actuel, poids objectif, programme actif. Stockage Supabase avec RLS par user_id.

---

## 🌐 État de l'art au moment des travaux

Les applications de musculation disponibles proposent des catalogues d'exercices soit verrouillés (non extensibles), soit génériques sans structuration par niveau. L'utilisation de ces interfaces sous effort physique est reconnue comme problématique (petites zones de tap, saisie numérique sans suggestion contextuelle). WeFit innove par la combinaison : suggestion de charge automatique + signal sonore de fin de repos + interface optimisée pour la contrainte physiologique de l'utilisateur en séance.

---

## 💎 Valeur IP créée

- **Système de suggestion de charge contextuelle** : calcul en temps réel de la charge recommandée à partir de la dernière performance et de la règle de progression — généralisable à tout protocole de rééducation progressive.
- **Catalogue exercices normalisé** : base de données structurée de +200 exercices avec métadonnées (groupe musculaire, niveau, description) — actif réutilisable pour une API publique ou un partenariat.
- **Pattern UX « interface sous effort »** : composants optimisés pour l'utilisation physique (tap zones, signal auditif, confirmation rapide) — valorisable dans d'autres contextes (sport, rééducation, industrie).

---

## 👨‍💻 Moyens mobilisés

- Langages : TypeScript 5.x, SQL, JavaScript (scripts Node.js)
- Frameworks : Next.js 16, React 19, Tone.js, Supabase
- Estimation : ~5 jours·homme (catalogue + scraping + profil + session augmentée)

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Cette phase de développement a permis de lever plusieurs verrous techniques liés à la conception d'interfaces utilisateur pour des environnements d'utilisation contraignants. En particulier, les travaux ont porté sur la modélisation d'une interface de saisie de performance sportive utilisable sous effort physique intense, sans recours à des dispositifs matériels spécifiques (capteurs, wearables). La solution développée combine une suggestion automatique de la charge d'entraînement basée sur les performances antérieures, une interface à grandes zones d'interaction adaptée aux capacités motrices réduites sous fatigue, et un retour sonore paramétrable se substituant à la consultation visuelle de l'écran. Ces caractéristiques constituent des améliorations fonctionnelles et ergonomiques sensibles par rapport aux solutions disponibles sur le marché, dans le sens des critères d'éligibilité au Crédit d'Impôt Innovation définis par le MESR.
