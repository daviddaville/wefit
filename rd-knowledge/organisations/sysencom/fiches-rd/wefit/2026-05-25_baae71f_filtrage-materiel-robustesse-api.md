# Fiche R&D — Filtrage matériel dynamique + robustesse API coach — 2026-05-25

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `baae71f` | branche `main` | date push `2026-05-25`
- 🎯 Dispositif : **CII**
- 🏷️ Imputabilité IP : `wefit`
- 🏷️ Types CII : `technique` · `nouvelle-fonctionnalité`

---

## 🔬 Nature des travaux

Développement d'un mécanisme de filtrage dynamique du catalogue d'exercices par contraintes matériel, appliqué côté serveur avant injection dans le prompt LLM, afin d'éliminer les suggestions d'exercices nécessitant du matériel non disponible. Implémentation d'une table de correspondance `keyword → equipmentId` avec correspondance par expression régulière. Renforcement de la robustesse des routes API (gestion d'erreurs explicite, headers Content-Type corrects, export `dynamic = 'force-dynamic'`).

---

## 🚧 Verrous technologiques / incertitudes levées

**Verrou — Fiabilité des contraintes matériel dans la génération LLM**
Incertitude : les LLMs, même avec une instruction explicite, violent parfois les contraintes de liste fermée (exercices avec poulie suggérés sans que l'utilisateur ait sélectionné de poulie). Comment garantir le respect des contraintes matériel sans post-traitement incertain sur la sortie du modèle ?
Résolution : approche préventive — filtrage du catalogue d'entrée avant injection dans le prompt, réduisant l'espace de recherche du modèle aux seuls exercices réalisables. Table de correspondance `EQUIPMENT_KEYWORDS` : `{ pattern: /poulie/i, ids: ['poulie_haute', 'poulie_basse'] }` etc. Double protection : filtrage côté serveur + instruction renforcée dans le prompt (`INTERDIT ABSOLU`). Le modèle ne peut pas suggérer un exercice qu'il n'a pas vu dans le catalogue fourni.

---

## 🌐 État de l'art au moment des travaux

Les approches classiques de contrainte LLM reposent sur le post-traitement ou la validation de la sortie (ex. : parser JSON + vérifier les noms d'exercices). L'approche préventive par filtrage de l'espace d'entrée est moins documentée dans la littérature de prompt engineering appliqué à la génération de contenu contrainte.

---

## 💎 Valeur IP créée

- **Module `filterByEquipment`** : fonction de filtrage de catalogue d'exercices par contraintes matériel via table de correspondance keyword/regex — généralisable à tout système de recommandation avec contraintes de ressources (nutrition, rééducation, sport collectif).
- **Pattern « filtrage préventif pré-LLM »** : méthode de garantie de cohérence des sorties LLM par réduction de l'espace d'entrée plutôt que validation de sortie — actif méthodologique documenté et reproductible.

---

## 👨‍💻 Moyens mobilisés

- Langages : TypeScript 5.x
- Frameworks : Next.js 16 (API Routes), OpenAI API
- Estimation : ~1 jour·homme

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Dans le cadre de l'amélioration de la fiabilité du moteur de génération de programme, les travaux ont porté sur la résolution d'une incertitude technique concernant le respect des contraintes de ressources matérielles par les modèles de langage de grande taille lors de la génération de prescriptions sportives. L'approche retenue, consistant à réduire l'espace d'entrée soumis au modèle par filtrage préalable du catalogue d'exercices aux seuls exercices compatibles avec le matériel déclaré par l'utilisateur, constitue une méthode originale de garantie de cohérence pour les systèmes de génération contrainte par LLM. Cette approche préventive se distingue des méthodes conventionnelles de validation post-génération et présente un potentiel de généralisation à tout domaine de recommandation personnalisée avec contraintes de ressources.
