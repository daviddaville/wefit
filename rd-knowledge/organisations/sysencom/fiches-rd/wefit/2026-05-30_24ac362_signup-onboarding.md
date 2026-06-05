# Fiche R&D — Onboarding utilisateur / page inscription — 2026-05-30

- 📁 Organisation : sysencom | Projet : WeFit
- 🔖 Référence : commit `24ac362` | branche `main` | date push `2026-05-30`
- 🎯 Dispositif : **CII**
- 🏷️ Imputabilité IP : `wefit`
- 🏷️ Types CII : `nouvelle-fonctionnalité`

---

## 🔬 Nature des travaux

Développement du flux d'inscription autonome : page `/signup` avec collecte du prénom, email et mot de passe, validation côté client (longueur, correspondance), appel `supabase.auth.signUp` avec injection du prénom en metadata utilisateur, écran de confirmation post-inscription, et lien bidirectionnel avec la page de connexion.

---

## 💎 Valeur IP créée

- **Flux d'onboarding avec pré-remplissage profil** : le prénom saisi à l'inscription est injecté en metadata Supabase et récupéré automatiquement dans le profil athlète — réduit la friction d'onboarding d'une étape.

---

## 👨‍💻 Moyens mobilisés

- Estimation : ~0,5 jour·homme

---

## 📄 Extrait injectable dossier fiscal (ton MESR)

> Développement du parcours d'inscription autonome permettant aux nouveaux utilisateurs de créer un compte WeFit sans intervention humaine, avec collecte du profil minimal (prénom) dès l'étape d'inscription afin de personnaliser immédiatement l'expérience de coaching.
