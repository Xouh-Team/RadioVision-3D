import React, { useState, useRef, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const TUMOR_DATA = [
  { session: 1, date: '15 Jan 2025', size: 1.0, label: 'Diagnostic initial' },
  { session: 2, date: '29 Jan 2025', size: 0.85, label: 'Séance 3' },
  { session: 3, date: '12 Fév 2025', size: 0.78, label: 'Séance 6' },
  { session: 4, date: '26 Fév 2025', size: 0.71, label: 'Séance 9' },
  { session: 5, date: '12 Mar 2025', size: 0.65, label: 'Séance 12' },
  { session: 6, date: '26 Mar 2025', size: 0.59, label: 'Séance 15' },
  { session: 7, date: '09 Avr 2025', size: 0.41, label: 'Dernier contrôle' },
];

const C = {
  bg: '#050a12', bgCard: '#0c1220', accent: '#06d6a0', accentDim: 'rgba(6,214,160,0.12)',
  tumor: '#ef4444', tumorGlow: '#ff6b6b',
  text: '#e8edf5', textMuted: '#6b7a90', border: '#141e30', sliderTrack: '#1a2540',
  positive: '#06d6a0', warning: '#f59e0b',
};

/* ═══ Optimized material — MeshPhong (no transmission = huge perf gain) ═══ */
function makeTranspMat(color, opacity = 0.3) {
  return new THREE.MeshPhongMaterial({
    color: color || new THREE.Color('#aabbcc'),
    transparent: true,
    opacity,
    side: THREE.FrontSide,
    depthWrite: false,
    shininess: 40,
    specular: new THREE.Color('#335577'),
  });
}

/* ── Tumor ── */
function Tumor({ scale }) {
  const groupRef = useRef();
  const coreRef = useRef();

  const tumorGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.04, 32, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = 1 + 0.12 * Math.sin(x * 15) * Math.cos(y * 12) * Math.sin(z * 10);
      pos.setXYZ(i, x * n, y * n, z * n);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.scale.setScalar(scale * (1 + Math.sin(t * 2.5) * 0.035));
    if (coreRef.current) coreRef.current.material.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.2;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef} geometry={tumorGeo}>
        <meshStandardMaterial color={C.tumor} emissive={C.tumor} emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={C.tumorGlow} transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

/* ═══ GLB Model Loader — Optimized ═══ */
function LoadedModel({ glbUrl, onBoundsCalculated }) {
  const [model, setModel] = useState(null);

  useEffect(() => {
    if (!glbUrl) return;
    const loader = new GLTFLoader();
    loader.load(glbUrl, (gltf) => {
      const root = gltf.scene;

      // Bounds before transform
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 3.0 / maxDim;

      // Adaptive opacity based on mesh count
      let meshCount = 0;
      root.traverse((child) => { if (child.isMesh) meshCount++; });
      const baseOpacity = meshCount > 50 ? 0.15 : meshCount > 20 ? 0.25 : 0.35;

      root.traverse((child) => {
        if (child.isMesh) {
          const origColor = child.material.color ? child.material.color.clone() : new THREE.Color('#aabbcc');
          // Free GPU resources from original materials
          if (child.material.map) { child.material.map.dispose(); }
          if (child.material.normalMap) { child.material.normalMap.dispose(); }
          child.material.dispose();
          child.material = makeTranspMat(origColor, baseOpacity);
          child.frustumCulled = true;
          child.raycast = () => {}; // disable raycasting for perf
        }
      });

      root.scale.multiplyScalar(scaleFactor);
      root.position.sub(center.multiplyScalar(scaleFactor));
      root.position.y += (size.y * scaleFactor) / 2;

      setModel(root);

      if (onBoundsCalculated) {
        const h = size.y * scaleFactor;
        const w = size.x * scaleFactor;
        const d = size.z * scaleFactor;
        onBoundsCalculated({
          height: h, width: w, depth: d,
          // Right lung position: 68% height, 15% right, slightly forward
          tumorPosition: [w * 0.10, h * 0.70, d * 0.05],
        });
      }
    }, undefined, (err) => console.error('GLB error:', err));

    return () => { if (glbUrl.startsWith('blob:')) URL.revokeObjectURL(glbUrl); };
  }, [glbUrl, onBoundsCalculated]);

  if (!model) return null;
  return <primitive object={model} />;
}

/* ── Fallback body ── */
function FallbackBody() {
  const heartRef = useRef();
  useFrame(({ clock }) => {
    if (heartRef.current) heartRef.current.scale.setScalar(1 + Math.abs(Math.sin(clock.getElapsedTime() * 4)) * 0.1);
  });

  const mat = useMemo(() => makeTranspMat(new THREE.Color('#c4a882'), 0.22), []);
  const armMat = useMemo(() => makeTranspMat(new THREE.Color('#c4a882'), 0.18), []);
  const lungMat = useMemo(() => makeTranspMat(new THREE.Color('#4a8ab5'), 0.12), []);
  const heartMat = useMemo(() => makeTranspMat(new THREE.Color('#c45555'), 0.2), []);
  const boneMat = useMemo(() => makeTranspMat(new THREE.Color('#8899aa'), 0.08), []);

  const profile = useMemo(() => [
    [0.0,2.95],[0.12,2.92],[0.25,2.80],[0.28,2.65],[0.27,2.50],
    [0.24,2.35],[0.22,2.20],[0.13,2.10],[0.12,2.02],[0.20,1.92],
    [0.42,1.84],[0.46,1.78],[0.43,1.68],[0.40,1.55],[0.36,1.42],
    [0.33,1.28],[0.36,1.12],[0.40,1.0],[0.42,0.90],[0.38,0.80],
    [0.22,0.75],[0.19,0.65],[0.18,0.50],[0.16,0.38],[0.14,0.28],
    [0.13,0.18],[0.08,0.06],[0.09,0.01],[0.06,0.0],
  ].map(([r,y]) => new THREE.Vector2(r,y)), []);
  const latheGeo = useMemo(() => new THREE.LatheGeometry(profile, 48), [profile]);

  return (
    <group>
      <mesh geometry={latheGeo} material={mat} />
      {[-1,1].map(s => (
        <group key={s}>
          <mesh position={[s*0.48,1.88,0]} material={armMat}><sphereGeometry args={[0.1,16,16]}/></mesh>
          <mesh position={[s*0.55,1.58,0]} rotation={[0,0,s*0.1]} material={armMat}><cylinderGeometry args={[0.075,0.065,0.5,12]}/></mesh>
          <mesh position={[s*0.58,1.3,0]} material={armMat}><sphereGeometry args={[0.065,12,12]}/></mesh>
          <mesh position={[s*0.60,1.02,0]} rotation={[0,0,s*0.06]} material={armMat}><cylinderGeometry args={[0.06,0.045,0.48,12]}/></mesh>
        </group>
      ))}
      <mesh position={[-0.18,1.72,0.02]} scale={[0.75,1.1,0.65]} material={lungMat}><sphereGeometry args={[0.16,20,20]}/></mesh>
      <mesh position={[0.18,1.72,0.02]} scale={[0.85,1.1,0.65]} material={lungMat}><sphereGeometry args={[0.16,20,20]}/></mesh>
      <mesh ref={heartRef} position={[-0.04,1.68,0.1]} scale={[1,1.2,0.9]} material={heartMat}><sphereGeometry args={[0.07,16,16]}/></mesh>
      <mesh position={[0,1.4,-0.18]} material={boneMat}><cylinderGeometry args={[0.025,0.025,1.4,8]}/></mesh>
    </group>
  );
}


/* ── Scene ── */
function SceneContent({ tumorScale, glbUrl, tumorPosition, onBoundsCalculated }) {
  return (
    <>
      <ambientLight intensity={0.7} color="#445566" />
      <directionalLight position={[3,5,4]} intensity={1.2} color="#ffeedd" />
      <directionalLight position={[-3,2,3]} intensity={0.4} color="#4a90d9" />
      {glbUrl ? <LoadedModel glbUrl={glbUrl} onBoundsCalculated={onBoundsCalculated}/> : <FallbackBody/>}
      <group position={tumorPosition}><Tumor scale={tumorScale}/></group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.05,0]}>
        <planeGeometry args={[6,6,20,20]}/>
        <meshBasicMaterial color={C.accent} wireframe transparent opacity={0.03}/>
      </mesh>
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={1.5} maxDistance={12} target={[0,1.3,0]} maxPolarAngle={Math.PI*0.85}/>
    </>
  );
}

/* ── Tumor-only scene ── */
function TumorOnlyScene({ tumorScale }) {
  return (
    <>
      <ambientLight intensity={1.2} color="#334455" />
      <directionalLight position={[2, 3, 2]} intensity={1.5} color="#ffeedd" />
      <pointLight position={[0, 0, 0.5]} intensity={1.0} color={C.tumorGlow} distance={2} />
      <Tumor scale={tumorScale} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={0.05} maxDistance={1} />
    </>
  );
}

/* ── Responsive hook ── */
function useResponsive() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  // mobile: <640, tablet: 640-1024, desktop: >1024
  return { isMobile: size.w < 640, isTablet: size.w >= 640 && size.w < 1024, isDesktop: size.w >= 1024, width: size.w, height: size.h };
}

/* ── Stat ── */
function Stat({label,value,unit,trend,color,compact}) {
  return (
    <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:compact?'8px':'12px',padding:compact?'10px 12px':'14px 16px',flex:compact?1:undefined,minWidth:compact?0:undefined}}>
      <div style={{fontSize:compact?'8px':'10px',textTransform:'uppercase',letterSpacing:'0.1em',color:C.textMuted,marginBottom:compact?'3px':'5px',fontFamily:'monospace'}}>{label}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:'3px'}}>
        <span style={{fontSize:compact?'18px':'24px',fontWeight:700,color:color||C.text}}>{value}</span>
        <span style={{fontSize:compact?'9px':'11px',color:C.textMuted,fontFamily:'monospace'}}>{unit}</span>
      </div>
      {trend&&<div style={{marginTop:'2px',fontSize:compact?'9px':'11px',color:trend.startsWith('-')?C.positive:C.warning,fontFamily:'monospace'}}>{trend}</div>}
    </div>
  );
}

/* ═══ LOGIN ═══ */
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: `1px solid ${C.border}`, background: 'rgba(5,10,18,0.6)',
    color: C.text, fontSize: '13px', fontFamily: 'monospace',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user || !pass) { setError('Identifiants requis.'); return; }
    const isDr = user.trim().toLowerCase() === 'dr.martin' && pass === 'radiologie';
    const isPatient = user.trim().toLowerCase() === 'patient-2847' && pass === 'patient2847';
    if (!isDr && !isPatient) { setError('Identifiants incorrects.'); return; }
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); onLogin(isDr ? 'doctor' : 'patient'); }, 900);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: C.bg, color: C.text, fontFamily: "-apple-system,'Segoe UI',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>

      {/* Fond grille */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(6,214,160,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(6,214,160,0.03) 1px,transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Halo central */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '500px', background: 'radial-gradient(circle,rgba(6,214,160,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '380px', margin: '0 16px', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '36px 32px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg,${C.accent},#4a90d9)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff', flexShrink: 0 }}>◎</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>RadioVision 3D</div>
            <div style={{ fontSize: '10px', color: C.textMuted, fontFamily: 'monospace', marginTop: '1px' }}>Accès sécurisé — Espace clinique</div>
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ height: '1px', background: C.border, marginBottom: '28px' }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, fontFamily: 'monospace', marginBottom: '6px' }}>Identifiant</div>
            <input
              type="text" value={user} onChange={e => { setUser(e.target.value); setError(''); }}
              placeholder="Dr. Dupont" autoComplete="username"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, fontFamily: 'monospace', marginBottom: '6px' }}>Mot de passe</div>
            <input
              type="password" value={pass} onChange={e => { setPass(e.target.value); setError(''); }}
              placeholder="••••••••" autoComplete="current-password"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '11px', color: '#ef4444', fontFamily: 'monospace' }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '4px', padding: '11px', borderRadius: '9px', border: 'none', background: loading ? C.accentDim : `linear-gradient(135deg,${C.accent},#4a90d9)`, color: loading ? C.accent : '#fff', fontWeight: 700, fontSize: '13px', cursor: loading ? 'default' : 'pointer', fontFamily: 'monospace', letterSpacing: '0.05em', transition: 'opacity 0.2s' }}>
            {loading ? '⏳ Connexion…' : 'Se connecter'}
          </button>

        </form>

        {/* Footer */}
        <div style={{ marginTop: '24px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(6,214,160,0.04)', border: '1px solid rgba(6,214,160,0.1)', fontSize: '9px', color: C.textMuted, lineHeight: 1.7, fontFamily: 'monospace' }}>
          ⓘ Comptes démo :<br />
          Médecin — <span style={{color:C.accent}}>dr.martin</span> / <span style={{color:C.accent}}>radiologie</span><br />
          Patient — <span style={{color:'#4a90d9'}}>patient-2847</span> / <span style={{color:'#4a90d9'}}>patient2847</span>
        </div>

        {/* Coin décoratif */}
        <div style={{ position: 'absolute', top: '14px', right: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
          <span style={{ fontSize: '9px', color: C.accent, fontFamily: 'monospace' }}>SECURE</span>
        </div>

      </div>
    </div>
  );
}

/* ═══ MAIN APP ═══ */
function MainApp({ role }) {
  const isDoctor = role === 'doctor';
  const [step,setStep]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [glbUrl,setGlbUrl]=useState(process.env.PUBLIC_URL + 'models/female_body.glb');
  const [modelStatus,setModelStatus]=useState('loading');
  const [dragOver,setDragOver]=useState(false);
  const [tumorPos,setTumorPos]=useState([0,1.5,0.1]);
  const [interpretations,setInterpretations]=useState(()=>{
    try{const s=localStorage.getItem('rv3d_interpretations');return s?JSON.parse(s):Array(TUMOR_DATA.length).fill('');}
    catch{return Array(TUMOR_DATA.length).fill('');}
  });
  const [hoveredSession,setHoveredSession]=useState(null);
  const ivRef=useRef(null);
  const fileRef=useRef(null);
  const {isMobile,isTablet,isDesktop}=useResponsive();
  const isVertical = !isDesktop; // mobile & tablet: layout vertical (3D top, panel bottom)

  const d=TUMOR_DATA[step];
  const vol=(4.2*d.size).toFixed(1);
  const red=((1-d.size)*100).toFixed(0);
  const dia=(32*d.size).toFixed(0);
  const pct=(step/(TUMOR_DATA.length-1))*100;

  const toggle=()=>{
    if(playing){clearInterval(ivRef.current);setPlaying(false);return;}
    setPlaying(true);setStep(0);let s=0;
    ivRef.current=setInterval(()=>{s++;if(s>=TUMOR_DATA.length){clearInterval(ivRef.current);setPlaying(false);return;}setStep(s);},1800);
  };
  useEffect(()=>()=>clearInterval(ivRef.current),[]);

  const handleFile=(file)=>{
    if(!file||!file.name.match(/\.(glb|gltf)$/i))return;
    setModelStatus('loading');
    setGlbUrl(URL.createObjectURL(file));
  };
  const handleDrop=(e)=>{e.preventDefault();setDragOver(false);if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);};
  const onBoundsCalculated=useCallback((bounds)=>{setTumorPos(bounds.tumorPosition);setModelStatus('loaded');},[]);

  const compactStats = isVertical;

  return (
    <div style={{width:'100vw',height:'100vh',background:C.bg,color:C.text,fontFamily:"-apple-system,'Segoe UI',sans-serif",display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* ── Header ── */}
      <header style={{padding:isMobile?'10px 14px':'12px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'rgba(5,10,18,0.85)',backdropFilter:'blur(12px)',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?'8px':'10px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'8px',background:`linear-gradient(135deg,${C.accent},#4a90d9)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',color:'#fff'}}>◎</div>
          <div>
            <div style={{fontSize:'14px',fontWeight:600}}>RadioVision 3D</div>
            {!isMobile&&<div style={{fontSize:'10px',color:C.textMuted,fontFamily:'monospace'}}>Visualisation tumorale</div>}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:isMobile?'6px':'10px'}}>
          <button onClick={()=>fileRef.current?.click()} style={{padding:isMobile?'5px 10px':'6px 14px',borderRadius:'8px',border:`1px solid ${C.accent}`,background:modelStatus==='loaded'?C.accentDim:'transparent',color:C.accent,cursor:'pointer',fontSize:'11px',fontFamily:'monospace'}}>
            {modelStatus==='loaded'?'✓ Chargé':modelStatus==='loading'?'⏳...':'📂 .glb'}
          </button>
          <input ref={fileRef} type="file" accept=".glb,.gltf" style={{display:'none'}} onChange={(e)=>e.target.files[0]&&handleFile(e.target.files[0])}/>
          {!isMobile&&(
            <div style={{display:'flex',alignItems:'center',gap:'7px',padding:'4px 12px',borderRadius:'16px',background:isDoctor?C.accentDim:'rgba(74,144,217,0.12)',border:isDoctor?'1px solid rgba(6,214,160,0.2)':'1px solid rgba(74,144,217,0.2)'}}>
              <div style={{width:'6px',height:'6px',borderRadius:'50%',background:isDoctor?C.accent:'#4a90d9',boxShadow:`0 0 8px ${isDoctor?C.accent:'#4a90d9'}`}}/>
              <span style={{fontSize:'11px',color:isDoctor?C.accent:'#4a90d9',fontFamily:'monospace'}}>{isDoctor?'Dr. Martin':'Patient #2847'}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main content area ── */}
      <div style={{flex:1,display:'flex',flexDirection:isVertical?'column':'row',overflow:'hidden'}}>

        {/* ── 3D Viewport + Timeline ── */}
        <div style={{flex:isVertical?'1 1 0%':'1',minHeight:0,position:'relative',display:'flex',flexDirection:'column'}}
          onDrop={handleDrop} onDragOver={(e)=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}>

          {dragOver&&(
            <div style={{position:'absolute',inset:0,zIndex:100,background:'rgba(6,214,160,0.08)',border:'3px dashed rgba(6,214,160,0.5)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'10px',pointerEvents:'none'}}>
              <div style={{fontSize:'48px'}}>🫁</div>
              <div style={{fontSize:'16px',color:C.accent,fontWeight:600}}>Déposer le modèle .glb ici</div>
            </div>
          )}

          {/* Split canvas area */}
          <div style={{flex:1,minHeight:0,display:'flex',flexDirection:isMobile?'column':'row'}}>

            {/* Panel 1 — Corps + Tumeur */}
            <div style={{flex:1,minHeight:0,position:'relative',borderRight:isMobile?'none':`1px solid ${C.border}`,borderBottom:isMobile?`1px solid ${C.border}`:'none'}}>
              <div style={{position:'absolute',top:'8px',left:'50%',transform:'translateX(-50%)',zIndex:10,padding:'3px 10px',borderRadius:'6px',background:'rgba(5,10,18,0.75)',border:`1px solid ${C.border}`,fontSize:'9px',color:C.textMuted,fontFamily:'monospace',whiteSpace:'nowrap'}}>
                Corps + Tumeur
              </div>
              <div style={{position:'absolute',top:'36px',left:'10px',display:'flex',flexDirection:'column',gap:'5px',zIndex:10}}>
                {[{c:'#c4a882',l:'Corps'},{c:C.tumor,l:'Tumeur'}].map(({c,l})=>(
                  <div key={l} style={{display:'flex',alignItems:'center',gap:'6px',padding:'3px 8px',borderRadius:'6px',background:'rgba(5,10,18,0.8)',border:`1px solid ${C.border}`,fontSize:'10px',color:C.textMuted,fontFamily:'monospace'}}>
                    <div style={{width:'7px',height:'7px',borderRadius:'50%',background:c,boxShadow:`0 0 5px ${c}44`}}/>{l}
                  </div>
                ))}
              </div>
              <Canvas
                camera={{position:[0,1.5,isMobile?6.5:5.2],fov:isMobile?42:38}}
                gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.4,powerPreference:'high-performance'}}
                dpr={[1,isMobile?1:1.5]}
                style={{background:C.bg}}
                performance={{min:0.5}}
              >
                <Suspense fallback={null}>
                  <SceneContent tumorScale={d.size} glbUrl={glbUrl} tumorPosition={tumorPos} onBoundsCalculated={onBoundsCalculated}/>
                </Suspense>
              </Canvas>
            </div>

            {/* Panel 2 — Tumeur seule */}
            <div style={{flex:1,minHeight:0,position:'relative'}}>
              <div style={{position:'absolute',top:'8px',left:'50%',transform:'translateX(-50%)',zIndex:10,padding:'3px 10px',borderRadius:'6px',background:'rgba(5,10,18,0.75)',border:`1px solid ${C.border}`,fontSize:'9px',color:C.textMuted,fontFamily:'monospace',whiteSpace:'nowrap'}}>
                Tumeur isolée
              </div>
              <div style={{position:'absolute',bottom:'10px',left:'50%',transform:'translateX(-50%)',zIndex:10,padding:'4px 12px',borderRadius:'8px',background:'rgba(5,10,18,0.8)',border:`1px solid rgba(239,68,68,0.3)`,fontSize:'10px',color:C.tumor,fontFamily:'monospace',whiteSpace:'nowrap'}}>
                Ø {dia} mm · {vol} cm³
              </div>
              <Canvas
                camera={{position:[0,0,0.25],fov:35}}
                gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.4,powerPreference:'high-performance'}}
                dpr={[1,isMobile?1:1.5]}
                style={{background:C.bg}}
                performance={{min:0.5}}
              >
                <Suspense fallback={null}>
                  <TumorOnlyScene tumorScale={d.size}/>
                </Suspense>
              </Canvas>
            </div>

          </div>

          {/* Timeline */}
          <div style={{padding:isMobile?'8px 12px':'12px 20px',borderTop:`1px solid ${C.border}`,background:C.bgCard,flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:isMobile?'8px':'14px'}}>
              <button onClick={toggle} style={{width:isMobile?'32px':'38px',height:isMobile?'32px':'38px',borderRadius:'50%',border:`2px solid ${C.accent}`,background:playing?C.accentDim:'transparent',color:C.accent,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0}}>
                {playing?'⏸':'▶'}
              </button>
              <div style={{flex:1}}>
                <input type="range" min={0} max={TUMOR_DATA.length-1} value={step}
                  onChange={(e)=>{setStep(Number(e.target.value));if(playing){clearInterval(ivRef.current);setPlaying(false);}}}
                  style={{width:'100%',height:'5px',appearance:'none',background:`linear-gradient(to right,${C.accent} ${pct}%,${C.sliderTrack} ${pct}%)`,borderRadius:'3px',outline:'none',cursor:'pointer'}}
                />
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'6px'}}>
                  {TUMOR_DATA.map((item,i)=>(
                    <button key={i} onClick={()=>setStep(i)}
                      onMouseEnter={()=>setHoveredSession(i)}
                      onMouseLeave={()=>setHoveredSession(null)}
                      style={{background:'none',border:'none',padding:0,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',position:'relative'}}>
                      {/* Tooltip interprétation */}
                      {hoveredSession===i && interpretations[i] && (
                        <div style={{position:'absolute',bottom:'calc(100% + 10px)',left:'50%',transform:'translateX(-50%)',width:'220px',padding:'10px 12px',borderRadius:'9px',background:C.bgCard,border:`1px solid ${isDoctor?'rgba(6,214,160,0.3)':'rgba(74,144,217,0.3)'}`,boxShadow:'0 8px 32px rgba(0,0,0,0.6)',zIndex:200,pointerEvents:'none'}}>
                          <div style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.1em',color:isDoctor?C.accent:'#4a90d9',fontFamily:'monospace',marginBottom:'5px'}}>
                            {isDoctor?'◎ Mon interprétation':'◎ Interprétation médicale'}
                          </div>
                          <div style={{fontSize:'11px',color:C.text,lineHeight:1.55}}>{interpretations[i]}</div>
                          <div style={{fontSize:'9px',color:C.textMuted,fontFamily:'monospace',marginTop:'6px'}}>{item.date} · {item.label}</div>
                          {/* Flèche */}
                          <div style={{position:'absolute',bottom:'-5px',left:'50%',transform:'translateX(-50%)',width:'8px',height:'8px',background:C.bgCard,border:`1px solid ${isDoctor?'rgba(6,214,160,0.3)':'rgba(74,144,217,0.3)'}`,borderTop:'none',borderLeft:'none',rotate:'45deg'}}/>
                        </div>
                      )}
                      <div style={{width:i===step?'8px':'5px',height:i===step?'8px':'5px',borderRadius:'50%',background:i<=step?C.accent:C.sliderTrack,transition:'all 0.3s',boxShadow:i===step?`0 0 8px ${C.accent}`:interpretations[i]?`0 0 6px rgba(74,144,217,0.6)`:'none',outline:interpretations[i]?'2px solid rgba(74,144,217,0.4)':'none',outlineOffset:'2px'}}/>
                      {!isMobile&&(
                        <span style={{fontSize:'8px',color:i===step?C.accent:C.textMuted,fontFamily:'monospace',whiteSpace:'nowrap'}}>
                          {item.date.split(' ').slice(0,2).join(' ')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel — always visible ── */}
        <div style={{
          ...(isDesktop ? {
            width:'290px',
            borderLeft:`1px solid ${C.border}`,
            flexShrink:0,
          } : {
            flexShrink:0,
            borderTop:`1px solid ${C.border}`,
            maxHeight:isMobile?'35vh':'40vh',
            minHeight:isMobile?'140px':'160px',
          }),
          background:C.bgCard,
          padding:isMobile?'12px':'18px',
          display:'flex',
          flexDirection:'column',
          gap:isMobile?'8px':'12px',
          overflowY:'auto',
        }}>
          {/* Session info */}
          <div style={{display:'flex',alignItems:isVertical?'center':'flex-start',justifyContent:isVertical?'space-between':'flex-start',flexDirection:isVertical?'row':'column',gap:isVertical?'8px':'0'}}>
            <div>
              <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.1em',color:C.textMuted,fontFamily:'monospace',marginBottom:'3px'}}>Séance actuelle</div>
              <div style={{fontSize:isMobile?'15px':'18px',fontWeight:700}}>{d.label}</div>
              {!isMobile&&<div style={{fontSize:'12px',color:C.textMuted,marginTop:'2px'}}>{d.date}</div>}
            </div>
            {isVertical&&(
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{fontSize:'11px',color:C.accent,fontFamily:'monospace',fontWeight:600}}>{Math.round(pct)}%</span>
                <div style={{width:isMobile?'50px':'80px',height:'5px',background:C.sliderTrack,borderRadius:'3px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${C.accent},#4a90d9)`,borderRadius:'3px',transition:'width 0.5s'}}/>
                </div>
              </div>
            )}
          </div>

          <div style={{height:'1px',background:C.border,flexShrink:0}}/>

          {/* Stats row/col */}
          <div style={{display:'flex',gap:'8px',flexDirection:compactStats?'row':'column'}}>
            <Stat compact={compactStats} label="Volume" value={vol} unit="cm³" trend={step>0?`-${((1-d.size/TUMOR_DATA[step-1].size)*100).toFixed(0)}%`:null}/>
            <Stat compact={compactStats} label="Réduction" value={red} unit="%" color={Number(red)>50?C.positive:Number(red)>20?C.warning:C.text}/>
            <Stat compact={compactStats} label="Diamètre" value={dia} unit="mm"/>
          </div>

          {/* Progress bar — desktop only (already shown inline above for vertical) */}
          {isDesktop&&(
            <>
              <div style={{height:'1px',background:C.border}}/>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                  <span style={{fontSize:'10px',textTransform:'uppercase',color:C.textMuted,fontFamily:'monospace'}}>Progression</span>
                  <span style={{fontSize:'11px',color:C.accent,fontFamily:'monospace'}}>{Math.round(pct)}%</span>
                </div>
                <div style={{height:'5px',background:C.sliderTrack,borderRadius:'3px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${C.accent},#4a90d9)`,borderRadius:'3px',transition:'width 0.5s'}}/>
                </div>
              </div>
            </>
          )}

          {/* History list */}
          <div style={{height:'1px',background:C.border,flexShrink:0}}/>
          <div style={{flex:1,minHeight:0,overflowY:'auto'}}>
            <div style={{fontSize:'10px',textTransform:'uppercase',color:C.textMuted,fontFamily:'monospace',marginBottom:'6px'}}>Historique</div>
            <div style={{display:'flex',flexDirection:isTablet?'row':'column',flexWrap:isTablet?'wrap':'nowrap',gap:isTablet?'4px':'0'}}>
              {TUMOR_DATA.map((item,i)=>(
                <button key={i} onClick={()=>setStep(i)} style={{display:'flex',alignItems:'center',gap:isMobile?'6px':'9px',padding:isMobile?'5px 8px':'6px 9px',borderRadius:'7px',border:'none',background:i===step?C.accentDim:'transparent',cursor:'pointer',flex:isTablet?'1 1 auto':'unset',minWidth:isTablet?'140px':'unset',textAlign:'left',marginBottom:isTablet?'0':'2px'}}>
                  <div style={{width:'6px',height:'6px',borderRadius:'50%',background:i<=step?C.accent:C.sliderTrack,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:'11px',color:i===step?C.text:C.textMuted,fontWeight:i===step?600:400}}>{item.label}</span>
                  <span style={{fontSize:'10px',fontFamily:'monospace',color:i===step?C.accent:C.textMuted}}>{(item.size*100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interprétation médicale */}
          <div style={{height:'1px',background:C.border,flexShrink:0}}/>
          <div style={{flexShrink:0}}>
            <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.1em',color:isDoctor?C.accent:'#4a90d9',fontFamily:'monospace',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}>
              <span>◎</span>
              <span>{isDoctor?'Interprétation médicale':'Avis du médecin'}</span>
              {interpretations[step]&&!isDoctor&&<span style={{marginLeft:'auto',fontSize:'8px',color:'rgba(74,144,217,0.7)',fontFamily:'monospace'}}>survol timeline</span>}
            </div>
            {isDoctor ? (
              <textarea
                value={interpretations[step]}
                onChange={e=>{const n=[...interpretations];n[step]=e.target.value;setInterpretations(n);try{localStorage.setItem('rv3d_interpretations',JSON.stringify(n));}catch{};}}
                placeholder={`Observations pour "${d.label}"…`}
                rows={4}
                style={{width:'100%',padding:'10px 12px',borderRadius:'8px',border:`1px solid ${interpretations[step]?'rgba(6,214,160,0.35)':C.border}`,background:'rgba(5,10,18,0.5)',color:C.text,fontSize:'11px',fontFamily:'monospace',resize:'vertical',outline:'none',boxSizing:'border-box',lineHeight:1.6,transition:'border-color 0.2s'}}
                onFocus={e=>e.target.style.borderColor=C.accent}
                onBlur={e=>e.target.style.borderColor=interpretations[step]?'rgba(6,214,160,0.35)':C.border}
              />
            ) : interpretations[step] ? (
              <div style={{padding:'10px 12px',borderRadius:'8px',background:'rgba(74,144,217,0.06)',border:'1px solid rgba(74,144,217,0.2)',fontSize:'11px',color:C.text,lineHeight:1.6,fontFamily:'monospace'}}>
                {interpretations[step]}
              </div>
            ) : (
              <div style={{padding:'10px 12px',borderRadius:'8px',background:'rgba(5,10,18,0.3)',border:`1px dashed ${C.border}`,fontSize:'10px',color:C.textMuted,fontFamily:'monospace',textAlign:'center'}}>
                Aucune interprétation pour cette séance.
              </div>
            )}
          </div>

          {/* Footer — desktop only */}
          {isDesktop&&(
            <div style={{marginTop:'auto',padding:'9px 11px',borderRadius:'7px',background:'rgba(6,214,160,0.04)',border:'1px solid rgba(6,214,160,0.1)',fontSize:'9px',color:C.textMuted,lineHeight:1.5,flexShrink:0}}>
              ⓘ Prototype — données simulées. Tumeur au poumon droit.
              {modelStatus==='loaded'&&' Modèle GLB chargé.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ ROOT ═══ */
export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState('patient');
  if (!authenticated) return <LoginScreen onLogin={(r) => { setRole(r); setAuthenticated(true); }} />;
  return <MainApp role={role} />;
}
