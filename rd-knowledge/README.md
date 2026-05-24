# WeFit — Dossier R&D Fiscale CIR / CII

Base de connaissance R&D pour la constitution des dossiers fiscaux CIR (Crédit Impôt Recherche) et CII (Crédit Impôt Innovation).

## Structure

```
rd-knowledge/
├── organisations/
│   ├── sysencom/               ← entité déclarante Phase 1
│   │   ├── fiches-rd/wefit/    ← une fiche Markdown par push R&D
│   │   ├── dossiers/
│   │   │   ├── CIR-2026/       ← sections narratives dossier CIR
│   │   │   └── CII-2026/       ← sections narratives dossier CII
│   │   └── syntheses/          ← bilans périodiques
│   └── wefit-sas/              ← structure future (Phase 2)
└── ip-registry/wefit/
    ├── composants/             ← modules réutilisables documentés
    └── innovations/            ← innovations brevetables ou différenciantes
```

## Commandes (depuis Claude Code)

| Commande | Action |
|----------|--------|
| `/fiche` | Génère une fiche R&D à partir du dernier push |
| `/fiche [hash]` | Fiche à partir d'un commit spécifique |
| `/eligible` | Analyse l'éligibilité CIR/CII du dernier push |
| `/bilan` | Synthèse de toutes les fiches de la session |
| `/dossier CIR` | Génère les sections narratives du dossier CIR |
| `/dossier CII` | Génère les sections narratives du dossier CII |
| `/ip` | Fiche de valorisation IP (registre IP, hors CIR) |

## Structure juridique

| Phase | Entité | Statut |
|-------|--------|--------|
| 1 — actuelle | Sysencom | WeFit = produit/marque |
| 2 — croissance | WeFit SAS (filiale) | Spin-off si justifié |
| 3 — scale | WeFit SAS multi-actionnaires | Levée de fonds |
