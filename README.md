# RadioVision 3D — Prototype

Visualisation 3D interactive de l'évolution tumorale pour patients en radiothérapie.

## 🚀 Installation & Lancement

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm start
```

L'app s'ouvre automatiquement sur `http://localhost:3000`

## 📂 Charger un modèle 3D

1. **Glisser-déposer** un fichier `.glb` directement sur la vue 3D
2. **Ou** cliquer le bouton **"📂 Charger .glb"** en haut

L'app applique automatiquement :
- Transparence sur tous les meshes
- Auto-centrage et mise à l'échelle
- Positionnement de la tumeur

## 🛠 Stack technique

- **React 18** + **React Three Fiber**
- **Three.js** + **GLTFLoader** (vrai loader, pas de parser custom)
- **@react-three/drei** pour OrbitControls

## 📁 Structure

```
radiovision-3d/
├── public/
│   ├── index.html
│   └── models/          ← placer vos .glb ici (optionnel)
├── src/
│   ├── index.js
│   └── App.js           ← tout le code de l'app
└── package.json
```
