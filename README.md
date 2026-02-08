# RadioVision 3D

<div align="center">

**Visualisation 3D interactive de l'évolution tumorale pour patients en radiothérapie**

[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.162-000000?logo=three.js)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

</div>

---

## 📋 À propos

**RadioVision 3D** est une application web interactive permettant de visualiser l'évolution d'une tumeur au cours d'un traitement de radiothérapie. L'outil combine des modèles anatomiques 3D avec une simulation temporelle de la réduction tumorale, offrant une représentation visuelle claire et pédagogique du processus thérapeutique.

### Fonctionnalités principales

- 🎯 **Visualisation 3D** : Rendu interactif de modèles anatomiques au format GLB/GLTF
- ⏱️ **Timeline temporelle** : Suivi de l'évolution tumorale sur 7 sessions de traitement
- 🎨 **Rendu optimisé** : Transparence intelligente et effets visuels pour une meilleure compréhension
- 📤 **Import simple** : Glisser-déposer de modèles 3D directement dans l'interface
- 🔄 **Contrôles intuitifs** : Navigation 3D fluide (rotation, zoom, panoramique)

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0

### Installation

```bash

# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm start
```

L'application s'ouvrira automatiquement sur **`http://localhost:3000`**

---

## 📖 Utilisation

### Charger un modèle 3D

Deux méthodes pour importer vos modèles anatomiques :

1. **Glisser-déposer** : Déposez un fichier `.glb` ou `.gltf` directement sur la vue 3D
2. **Bouton d'import** : Cliquez sur **"📂 Charger .glb"** en haut de l'interface

> **Note** : L'application applique automatiquement la transparence, le centrage et l'échelle optimale au modèle importé.

### Contrôles de la timeline

- **Slider temporel** : Naviguez entre les 7 sessions de traitement (diagnostic initial → contrôle final)
- **Boutons Play/Pause** : Animation automatique de l'évolution tumorale
- **Affichage des données** : Date, taille relative et progression du traitement

### Navigation 3D

- **Rotation** : Clic gauche + glisser
- **Zoom** : Molette de la souris
- **Panoramique** : Clic droit + glisser (ou Ctrl + clic gauche)

---

## 🛠️ Stack technique

| Technologie | Version | Rôle |
|------------|---------|------|
| **React** | 18.2 | Framework UI |
| **React Three Fiber** | 8.15 | Intégration React ↔ Three.js |
| **Three.js** | 0.162 | Moteur de rendu 3D WebGL |
| **@react-three/drei** | 9.96 | Composants et utilitaires 3D |
| **GLTFLoader** | - | Chargement de modèles 3D |

### Architecture

- **MeshPhongMaterial** pour un rendu performant avec transparence
- **Geometry déformée** pour une tumeur à l'aspect organique
- **Optimisations** : depthWrite désactivé, front-face culling

---

## 📁 Structure du projet

```
RadioVision-3D/
├── public/
│   ├── index.html              # Point d'entrée HTML
│   └── models/                 # Dossier pour modèles 3D (optionnel)
├── src/
│   ├── index.js                # Bootstrap React
│   └── App.js                  # Composant principal (logique 3D + UI)
├── package.json                # Dépendances et scripts
├── README.md                   # Documentation
└── LICENSE                     # Licence Apache 2.0
```

---

## 📊 Données de simulation

L'évolution tumorale est modélisée sur 7 sessions :

| Session | Date | Taille relative | Étape |
|---------|------|-----------------|-------|
| 1 | 15 Jan 2025 | 100% | Diagnostic initial |
| 2 | 29 Jan 2025 | 92% | Séance 3 |
| 3 | 12 Fév 2025 | 78% | Séance 6 |
| 4 | 26 Fév 2025 | 61% | Séance 9 |
| 5 | 12 Mar 2025 | 45% | Séance 12 |
| 6 | 26 Mar 2025 | 28% | Séance 15 |
| 7 | 09 Avr 2025 | 12% | Contrôle final |

> Ces données sont simulées à des fins de démonstration. Dans un contexte clinique réel, les valeurs seraient issues d'imageries médicales (IRM, CT scan).

---

## 📝 Licence

Ce projet est sous licence **Apache 2.0**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**Développé avec ❤️ pour améliorer la communication patient-médecin**

</div>
