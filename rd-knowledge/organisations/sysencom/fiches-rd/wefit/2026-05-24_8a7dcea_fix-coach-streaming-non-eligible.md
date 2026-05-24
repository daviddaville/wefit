# Fiche R&D — Fix compatibilité OpenAI SDK v6 / streaming — 2026-05-24

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `8a7dcea` | branche `main` | date push `2026-05-24`
- 🎯 Dispositif : **Non éligible**
- 🏷️ Imputabilité IP : `sysencom`
- 🏷️ Note : correction de bug de compatibilité — pas d'innovation nouvelle, pas de verrou R&D

---

## 🔬 Nature des travaux

Correction d'une incompatibilité entre l'implémentation du streaming de réponse OpenAI et le SDK `openai` v6 dans un contexte Next.js 16 App Router. Migration vers une réponse non-streamée (`chat.completions.create` sans `stream: true`), amélioration de la visibilité des erreurs côté client.

---

## ⚠️ Motif de non-éligibilité

Ce commit correspond à une correction de bug (incompatibilité de version de bibliothèque tierce), sans apport de nouvelle connaissance technique ni résolution d'une incertitude scientifique ou technologique au sens du MESR. Il ne génère pas de valeur IP nouvelle isolable. Il ne constitue pas un prototype ou une amélioration fonctionnelle sensible du produit.

**À ne pas inclure dans la déclaration CIR/CII.**

---

## 💎 Valeur IP créée

Aucune. Correction de maintenance.

---

## 👨‍💻 Moyens mobilisés

- Estimation : ~0,5 jour·homme (diagnostic + correction)
