# RadioVision 3D

<div align="center">

**Visualisation 3D interactive de l'évolution tumorale pour patients en radiothérapie**

[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.162-000000?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646cff?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/Demo-Live-06d6a0?logo=github)](https://xouh-team.github.io/RadioVision-3D/)

**[Voir la démo en ligne](https://xouh-team.github.io/RadioVision-3D/)**

</div>

---

## À propos

**RadioVision 3D** est une application web interactive conçue pour visualiser l'évolution d'une tumeur au cours d'un traitement de radiothérapie. L'outil facilite la communication entre médecins et patients en offrant une représentation 3D claire et animée de la progression thérapeutique sur plusieurs séances.

### Fonctionnalités principales

- **Visualisation 3D double panneau** : Vue anatomique complète et vue isolée de la tumeur en simultané
- **Timeline animée** : Suivi de l'évolution tumorale sur 7 sessions (du diagnostic initial au contrôle final)
- **Contrôles interactifs** : Navigation 3D fluide (rotation, zoom, panoramique) via OrbitControls
- **Statistiques en temps réel** : Volume, diamètre et taux de réduction affichés par session
- **Authentification par rôle** : Vues distinctes pour médecins et patients
- **Interprétations médicales** : Les médecins peuvent annoter chaque session (sauvegarde automatique en localStorage)
- **Design responsive** : Optimisé pour mobile, tablette et desktop

---

## Démarrage rapide

### Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur **`http://localhost:5173`**

### Scripts disponibles

```bash
npm run dev       # Serveur de développement avec HMR
npm run build     # Build de production (dossier dist/)
npm run preview   # Aperçu local du build de production
```

---

## Utilisation

### Connexion

L'application dispose d'un système d'authentification avec deux rôles :

| Rôle | Identifiant | Mot de passe | Accès |
|------|-------------|--------------|-------|
| **Médecin** | `dr.martin` | `radiologie` | Lecture + annotations médicales |
| **Patient** | `patient-2847` | `patient2847` | Lecture seule |

### Timeline et navigation

- **Slider temporel** : Naviguez manuellement entre les 7 sessions de traitement
- **Play / Pause** : Lance l'animation automatique (1,8 secondes par session)
- **Double vue** : La vue gauche montre la tumeur dans son contexte anatomique, la vue droite l'isole

### Navigation 3D

- **Rotation** : Clic gauche + glisser
- **Zoom** : Molette de la souris
- **Panoramique** : Clic droit + glisser (ou Ctrl + clic gauche)

---

## Stack technique

| Technologie | Version | Rôle |
|------------|---------|------|
| **Vite** | 5.2 | Build tool & dev server |
| **React** | 18.2 | Framework UI |
| **React Three Fiber** | 8.15 | Intégration React ↔ Three.js |
| **Three.js** | 0.162 | Moteur de rendu 3D WebGL |
| **@react-three/drei** | 9.96 | Composants 3D (OrbitControls, etc.) |

### Choix d'architecture

- **MeshPhongMaterial** pour un rendu performant (sans physically-based rendering)
- **Opacité adaptative** calculée en fonction du nombre de meshes du modèle
- **Tone mapping ACES Filmic** pour un rendu visuel réaliste
- **Raycasting désactivé** sur les meshes non interactifs pour de meilleures performances
- **DPR adaptatif** : 1.0 sur mobile, 1.5 sur desktop

---

## Structure du projet

```
RadioVision-3D/
├── public/
│   └── models/
│       └── female_body.glb         # Modèle anatomique 3D par défaut
├── src/
│   ├── index.jsx                   # Point d'entrée React
│   └── App.jsx                     # Application complète (composants + logique)
├── index.html                      # Point d'entrée HTML (Vite)
├── vite.config.js                  # Configuration Vite (base GitHub Pages)
├── package.json                    # Dépendances et scripts
├── README.md                       # Documentation
└── LICENSE                         # Licence Apache 2.0
```

---

## Données de simulation

L'évolution tumorale est modélisée sur 7 sessions avec les données suivantes :

| Session | Date | Taille relative | Réduction | Étape |
|---------|------|-----------------|-----------|-------|
| 1 | 15 Jan 2025 | 100% | — | Diagnostic initial |
| 2 | 29 Jan 2025 | 85% | -15% | Séance 3 |
| 3 | 12 Fév 2025 | 78% | -22% | Séance 6 |
| 4 | 26 Fév 2025 | 71% | -29% | Séance 9 |
| 5 | 12 Mar 2025 | 65% | -35% | Séance 12 |
| 6 | 26 Mar 2025 | 59% | -41% | Séance 15 |
| 7 | 09 Avr 2025 | 41% | -59% | Dernier contrôle |

> Ces données sont simulées à des fins de démonstration. Dans un contexte clinique réel, les valeurs seraient issues d'imageries médicales (IRM, CT scan).

### Persistance des données

Les annotations médicales saisies par le médecin sont sauvegardées automatiquement dans le `localStorage` du navigateur (clé `rv3d_interpretations`).

---

## Déploiement

Le projet est préconfiguré pour GitHub Pages via la base `/RadioVision-3D/` dans `vite.config.js` :

```bash
npm run build
# Déployer le dossier dist/ sur GitHub Pages
```

---

## Licence

Ce projet est sous licence **Apache 2.0**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**Développé pour améliorer la communication patient-médecin en oncologie**

</div>
