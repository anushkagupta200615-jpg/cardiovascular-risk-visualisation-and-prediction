import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Activity, 
  RotateCw, 
  Eye, 
  Layers, 
  Compass, 
  Sparkles, 
  HelpCircle, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

// Preload 3D models
useGLTF.preload('/models/realistic_heart.glb');
useGLTF.preload('/models/heart.glb');

// Clinical Risk Band Definitions (based on standard ESC/AHA cardiology criteria)
export function getRiskDetails(risk = 0) {
  if (risk > 0.6) {
    return {
      band: 'Critical Stenosis (>60%)',
      severity: 'Critical',
      color: '#dc2626',      // Clinical Crimson
      glowColor: '#ef4444',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      pulseSpeed: 4.0,
      clinicalAction: 'High probability of ≥50% lumen occlusion. Urgent invasive coronary angiography (Cath lab) or FFR evaluation indicated.'
    };
  }
  if (risk > 0.3) {
    return {
      band: 'Moderate Stenosis (30–60%)',
      severity: 'Moderate',
      color: '#d97706',      // Clinical Amber
      glowColor: '#f59e0b',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      pulseSpeed: 2.0,
      clinicalAction: 'Intermediate atherosclerotic burden. Intensive statin therapy, antiplatelet regimen, and stress echocardiography recommended.'
    };
  }
  return {
    band: 'Patent Vessel (<30%)',
    severity: 'Normal',
    color: '#059669',        // Clinical Emerald
    glowColor: '#10b981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pulseSpeed: 1.0,
    clinicalAction: 'Normal hemodynamic flow with no hemodynamically significant stenosis detected. Routine preventive follow-up.'
  };
}

// Anatomical Coronary Landmarks (Scaled to adhere tightly to the realistic heart mesh surface)
const VASCULAR_NETWORK = {
  LAD: {
    type: 'artery',
    name: 'Left Anterior Descending',
    acronym: 'LAD',
    territory: 'Anterior LV Free Wall, Anterior 2/3 of Interventricular Septum & Cardiac Apex',
    clinicalSignificance: 'Widowmaker Artery: Supplies ~50% of the entire left ventricle myocardium. Acute occlusion causes extensive anterior wall myocardial infarction (MI).',
    landmarkPos: [0.12, 0.15, 0.52], // Surface hotspot beacon
    curvePoints: [
      [0.08, 0.70, 0.38],
      [0.12, 0.45, 0.46],
      [0.14, 0.15, 0.52],
      [0.10, -0.20, 0.48],
      [0.06, -0.55, 0.38],
      [0.02, -0.90, 0.24],
      [0.00, -1.18, 0.10]
    ]
  },
  LCX: {
    type: 'artery',
    name: 'Left Circumflex Artery',
    acronym: 'LCX',
    territory: 'Lateral & Posterior Left Ventricular Free Wall, Left Atrium',
    clinicalSignificance: 'Curves along the left atrioventricular sulcus to supply the posterolateral myocardium via obtuse marginal branches.',
    landmarkPos: [-0.62, 0.20, 0.22],
    curvePoints: [
      [-0.08, 0.65, 0.36],
      [-0.32, 0.52, 0.35],
      [-0.58, 0.30, 0.24],
      [-0.68, 0.05, 0.08],
      [-0.60, -0.30, -0.15],
      [-0.42, -0.65, -0.28],
      [-0.22, -0.95, -0.25]
    ]
  },
  RCA: {
    type: 'artery',
    name: 'Right Coronary Artery',
    acronym: 'RCA',
    territory: 'Right Ventricle, Inferior Left Ventricle & SA/AV Nodal Conduction System',
    clinicalSignificance: 'Courses down the right coronary sulcus, acute margin, and continues underneath the diaphragmatic surface as the Posterior Descending Artery (PDA).',
    landmarkPos: [0.55, 0.10, 0.18],
    curvePoints: [
      [0.25, 0.62, 0.32],
      [0.50, 0.42, 0.26],
      [0.65, 0.10, 0.15],
      [0.62, -0.25, 0.04],
      [0.52, -0.58, -0.12],
      [0.34, -0.85, -0.24],
      [0.15, -1.08, -0.28] // Underneath diaphragmatic surface!
    ]
  },
  VEINS: {
    type: 'vein',
    name: 'Coronary Sinus & Great Cardiac Vein',
    acronym: 'Veins',
    territory: 'Myocardial Venous Drainage into the Right Atrium',
    clinicalSignificance: 'Collects deoxygenated blood from the coronary circulation and empties directly into the right atrium via the posterior coronary sinus underneath the heart.',
    landmarkPos: [-0.20, -0.45, -0.38],
    curvePoints: [
      [0.18, -0.40, 0.46],
      [0.18, 0.05, 0.50],
      [0.04, 0.55, 0.38],
      [-0.22, 0.48, 0.34],
      [-0.48, 0.15, 0.14],
      [-0.50, -0.25, -0.18],
      [-0.22, -0.45, -0.38],
      [0.08, -0.52, -0.35]
    ]
  }
};

// Sleek Anatomical Landmark Pin / Beacon (sitting right on the heart surface)
function AnatomicalBeacon({ vesselKey, risk = 0, isSelected, onClick }) {
  const vData = VASCULAR_NETWORK[vesselKey];
  const isVein = vData.type === 'vein';
  const riskMeta = isVein ? null : getRiskDetails(risk);
  const color = isVein ? '#0284c7' : riskMeta.color;

  return (
    <group position={vData.landmarkPos} onClick={(e) => { e.stopPropagation(); onClick(vesselKey); }}>
      {/* Outer Pulse Ring */}
      <mesh>
        <ringGeometry args={[0.04, 0.065, 24]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={isSelected ? 0.9 : 0.6} />
      </mesh>
      {/* Center Spherical Hotspot */}
      <mesh>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isSelected ? 1.2 : 0.6} 
        />
      </mesh>
    </group>
  );
}

// Thin, Subtle Vascular Overlay Trace (clinging tightly to the heart surface)
function VascularTrace({ vesselKey, risk = 0, isSelected, isXRay }) {
  const meshRef = useRef();
  const vData = VASCULAR_NETWORK[vesselKey];
  const isVein = vData.type === 'vein';
  const riskMeta = isVein ? null : getRiskDetails(risk);

  const tubeGeometry = useMemo(() => {
    const points = vData.curvePoints.map(p => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(points);
    // Thin, realistic anatomical caliber (0.018 for arteries, 0.015 for veins)
    const radius = isVein ? 0.015 : 0.018;
    return new THREE.TubeGeometry(curve, 48, radius, 12, false);
  }, [vesselKey, isVein]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      if (!isVein && risk > 0.6) {
        const pulse = (Math.sin(t * riskMeta.pulseSpeed) + 1) / 2;
        meshRef.current.material.emissiveIntensity = 0.5 + pulse * 0.7;
      } else {
        meshRef.current.material.emissiveIntensity = isSelected ? 0.8 : 0.4;
      }
    }
  });

  const baseColor = isVein ? '#0284c7' : (isSelected ? riskMeta.glowColor : riskMeta.color);

  return (
    <mesh ref={meshRef} geometry={tubeGeometry}>
      <meshStandardMaterial
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={isSelected ? 0.8 : 0.4}
        roughness={0.25}
        metalness={0.4}
        transparent
        opacity={isXRay ? 0.95 : 0.85}
      />
    </mesh>
  );
}

// 3D Realistic Heart Mesh with dynamic normalization and lighting
function RealisticHeartMesh({ 
  modelPath, 
  vesselRisks, 
  selectedVessel, 
  onClickVessel,
  enableHeartbeat,
  isXRay,
  showTraces,
  showPins
}) {
  const groupRef = useRef();
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => {
    const s = scene.clone(true);
    
    // Compute bounding box & normalize center
    const bbox = new THREE.Box3().setFromObject(s);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    s.position.x -= center.x;
    s.position.y -= center.y;
    s.position.z -= center.z;

    // Scale heart to a prominent, commanding size
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.6 / (maxDim || 1);
    s.scale.set(scale, scale, scale);

    // Apply materials
    s.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          if (isXRay) {
            child.material.transparent = true;
            child.material.opacity = 0.28;
            child.material.roughness = 0.1;
            child.material.metalness = 0.2;
            child.material.color = new THREE.Color('#991b1b');
          } else {
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.roughness = 0.35;
            child.material.metalness = 0.15;
          }
        }
      }
    });

    return s;
  }, [scene, isXRay]);

  // Cardiac cycle heartbeat simulation
  useFrame(({ clock }) => {
    if (groupRef.current && enableHeartbeat) {
      const t = clock.getElapsedTime();
      const cycle = (t * 1.25) % 1;
      let scale = 1.0;
      if (cycle < 0.12) {
        scale = 1.0 + Math.sin(cycle / 0.12 * Math.PI) * 0.038;
      } else if (cycle < 0.26) {
        scale = 1.0 + Math.sin((cycle - 0.12) / 0.14 * Math.PI) * 0.02;
      }
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Anatomical Heart */}
      <primitive object={clonedScene} />

      {/* Surface Vascular Traces (Subtle, elegant anatomical overlays) */}
      {showTraces && Object.keys(VASCULAR_NETWORK).map((vKey) => (
        <VascularTrace
          key={vKey}
          vesselKey={vKey}
          risk={vesselRisks?.[vKey] || 0}
          isSelected={selectedVessel === vKey}
          isXRay={isXRay}
        />
      ))}

      {/* Surface Anatomical Landmark Pins */}
      {showPins && Object.keys(VASCULAR_NETWORK).map((vKey) => (
        <AnatomicalBeacon
          key={vKey}
          vesselKey={vKey}
          risk={vesselRisks?.[vKey] || 0}
          isSelected={selectedVessel === vKey}
          onClick={onClickVessel}
        />
      ))}
    </group>
  );
}

// Camera View Controller
function CameraController({ viewTarget }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!viewTarget) return;

    if (viewTarget === 'anterior') {
      camera.position.set(0, 0, 3.4);
    } else if (viewTarget === 'underneath') {
      camera.position.set(0, -3.2, 1.2);
    } else if (viewTarget === 'lateral') {
      camera.position.set(-3.2, 0.4, 1.0);
    } else if (viewTarget === 'posterior') {
      camera.position.set(0, 0.5, -3.4);
    }
    camera.lookAt(0, 0, 0);
  }, [viewTarget, camera]);

  return null;
}

// Main HeartViewer3D Component
export default function HeartViewer3D({ vesselRisks }) {
  const [modelType, setModelType] = useState('realistic');
  const [autoRotate, setAutoRotate] = useState(false);
  const [enableHeartbeat, setEnableHeartbeat] = useState(true);
  const [isXRay, setIsXRay] = useState(false);
  const [showTraces, setShowTraces] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState('LAD');
  const [viewPreset, setViewPreset] = useState('anterior');
  const [showClinicalGuide, setShowClinicalGuide] = useState(false);

  const activeMeta = VASCULAR_NETWORK[selectedVessel] || VASCULAR_NETWORK['LAD'];
  const isVein = activeMeta.type === 'vein';
  const activeRisk = isVein ? 0 : (vesselRisks?.[selectedVessel] || 0);
  const activeDetails = isVein ? null : getRiskDetails(activeRisk);

  const modelPath = modelType === 'realistic' 
    ? '/models/realistic_heart.glb' 
    : '/models/heart.glb';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 flex flex-col relative overflow-hidden transition-all duration-300">
      {/* Professional Clinical Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
            <Activity className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                3D Coronary Anatomy & Localized Stenosis Mapping
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Interactive Digital Twin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Coronary arterial tree risk mapping across LAD, LCX, RCA & venous circulation
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clinical Interpretation Guide Button ("What is this telling?") */}
          <button
            onClick={() => setShowClinicalGuide(g => !g)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition shadow-2xs"
            title="Read Clinical Interpretation Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>What is this telling?</span>
          </button>

          {/* Vascular X-Ray Mode Toggle */}
          <button
            onClick={() => setIsXRay(x => !x)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-2xs ${
              isXRay 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
            title="Toggle Translucent Heart to inspect internal and underneath veins"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>{isXRay ? 'Translucent Myocardium' : 'Vascular X-Ray'}</span>
          </button>

          {/* Heartbeat Animation Toggle */}
          <button
            onClick={() => setEnableHeartbeat(h => !h)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-2xs ${
              enableHeartbeat 
                ? 'bg-slate-100 text-slate-800 border-slate-300' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
            title="Toggle Cardiac Contraction Cycle"
          >
            <Activity className="w-3.5 h-3.5 text-slate-600" />
            <span>Heartbeat</span>
          </button>

          {/* Auto Rotation Toggle */}
          <button
            onClick={() => setAutoRotate(r => !r)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-2xs ${
              autoRotate 
                ? 'bg-sky-50 text-sky-700 border-sky-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
            title="Toggle 360° Continuous Orbit"
          >
            <RotateCw className={`w-3.5 h-3.5 text-sky-600 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>Auto-Rotate</span>
          </button>
        </div>
      </div>

      {/* Clinical Interpretation Guide Drawer (Answers "What exactly is this telling?") */}
      {showClinicalGuide && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-sky-50/80 to-blue-50/40 border border-sky-200 text-slate-800 text-xs shadow-sm relative transition-all">
          <button 
            onClick={() => setShowClinicalGuide(false)}
            className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 bg-white border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>

          <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-sky-600" /> Clinical Diagnostic Interpretation Guide
          </h4>
          <p className="text-slate-600 mb-3">
            This dashboard is an AI-powered <strong>Cardiology Decision Support System</strong> designed to assist clinicians in evaluating suspected <strong>Coronary Artery Disease (CAD)</strong> without immediately requiring invasive surgery. Here is what every metric tells you:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1">1. The 3 Coronary Arteries</span>
              <ul className="space-y-1 text-slate-600 text-[11px]">
                <li><strong className="text-red-600">LAD (Left Anterior Descending):</strong> Known as the <em>"Widowmaker"</em>. Supplies ~50% of the heart's main pumping chamber. Blockage causes severe heart attacks.</li>
                <li><strong className="text-amber-600">LCX (Left Circumflex):</strong> Supplies the lateral and back wall of the heart.</li>
                <li><strong className="text-emerald-600">RCA (Right Coronary Artery):</strong> Runs around and under the heart to supply the bottom wall and pacemaker nodes.</li>
              </ul>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1">2. Stenosis Risk Percentages</span>
              <ul className="space-y-1 text-slate-600 text-[11px]">
                <li><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span><strong>&lt; 30% (Patent):</strong> Healthy blood flow, no significant plaque.</li>
                <li><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span><strong>30% – 60% (Moderate):</strong> Intermediate narrowing; lifestyle and statin medication needed.</li>
                <li><span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-1"></span><strong>&gt; 60% (Critical Stenosis):</strong> Severe obstruction (≥50% lumen loss); patient needs urgent cardiac catheterization.</li>
              </ul>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1">3. SHAP Explainability Drivers</span>
              <p className="text-slate-600 text-[11px]">
                Rather than being a "black-box" AI, the <strong>SHAP attribution engine</strong> reveals exactly <em>which patient vitals</em> (e.g. Chest Pain, ST-Elevation on ECG, or high LDL cholesterol) caused the risk score to increase or decrease.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera View Angle Presets & Vessel Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Camera Angles */}
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
            <Compass className="w-3 h-3 text-slate-400" /> View Angle:
          </span>
          <button
            onClick={() => setViewPreset('anterior')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              viewPreset === 'anterior' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anterior (LAD)
          </button>
          <button
            onClick={() => setViewPreset('underneath')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              viewPreset === 'underneath' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Under Heart (Veins & PDA)
          </button>
          <button
            onClick={() => setViewPreset('lateral')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              viewPreset === 'lateral' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lateral (LCX)
          </button>
        </div>

        {/* Vessel Overlay Toggles & Selector Pills */}
        <div className="flex items-center space-x-2">
          {/* Overlay visibility toggle */}
          <button
            onClick={() => setShowTraces(t => !t)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition shadow-2xs ${
              showTraces ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-400 border-slate-200'
            }`}
            title="Toggle Arterial Traces Overlay"
          >
            Traces: {showTraces ? 'ON' : 'OFF'}
          </button>

          {/* Artery & Vein Buttons */}
          {['LAD', 'LCX', 'RCA', 'VEINS'].map((vKey) => {
            const vData = VASCULAR_NETWORK[vKey];
            const isVKeyVein = vData.type === 'vein';
            const vRisk = isVKeyVein ? null : (vesselRisks?.[vKey] || 0);
            const vDetails = isVKeyVein ? null : getRiskDetails(vRisk);
            const isCurrent = selectedVessel === vKey;

            return (
              <button
                key={vKey}
                onClick={() => setSelectedVessel(vKey)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 shadow-xs ${
                  isCurrent 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{vKey}</span>
                {isVKeyVein ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 border border-sky-200">
                    Vein
                  </span>
                ) : (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    isCurrent ? 'bg-slate-800 text-slate-100 border-slate-700' : vDetails.badgeClass
                  }`}>
                    {Math.round(vRisk * 100)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="w-full h-[580px] lg:h-[680px] bg-gradient-to-b from-slate-50 via-white to-sky-50/20 rounded-2xl overflow-hidden relative border border-slate-200/80 shadow-inner">
        {/* 3D Navigation Instruction Badge */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/80 text-xs font-medium text-slate-600 shadow-xs">
          <Eye className="w-3.5 h-3.5 text-sky-600" />
          <span>Full 360° Spherical Orbit • Scroll to Zoom • Rotate under heart to view posterior veins</span>
        </div>

        {/* Clinical Risk Legend Badge Overlay */}
        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-200/80 shadow-xs text-[11px] space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
            <span className="text-slate-700 font-medium">Patent (&lt;30%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
            <span className="text-slate-700 font-medium">Moderate (30–60%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-xs"></span>
            <span className="text-red-700 font-bold">Critical Stenosis (&gt;60%)</span>
          </div>
          <div className="flex items-center space-x-2 pt-0.5 border-t border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs"></span>
            <span className="text-sky-700 font-medium">Venous Circulation</span>
          </div>
        </div>

        {/* Three.js R3F 3D Canvas */}
        <Canvas 
          camera={{ position: [0, 0, 3.4], fov: 42 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          {/* Medical Studio Illumination */}
          <ambientLight intensity={1.2} />
          <hemisphereLight skyColor="#ffffff" groundColor="#cbd5e1" intensity={1.0} />
          <directionalLight position={[6, 8, 6]} intensity={1.8} castShadow />
          <directionalLight position={[-6, -4, -5]} intensity={0.8} color="#bae6fd" />
          <pointLight position={[0, 3, 3]} intensity={1.5} />
          <pointLight position={[0, -3, -2]} intensity={1.0} color="#e0f2fe" />

          <Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center justify-center p-5 bg-white/95 rounded-2xl border border-slate-200 text-center shadow-lg">
                <Activity className="w-8 h-8 text-sky-600 animate-spin mb-2" />
                <span className="text-sm font-bold text-slate-800">Loading High-Definition 3D Anatomy...</span>
                <span className="text-xs text-slate-500 mt-1">Streaming realistic coronary geometry</span>
              </div>
            </Html>
          }>
            <CameraController viewTarget={viewPreset} />
            <RealisticHeartMesh
              modelPath={modelPath}
              vesselRisks={vesselRisks}
              selectedVessel={selectedVessel}
              onClickVessel={setSelectedVessel}
              enableHeartbeat={enableHeartbeat}
              isXRay={isXRay}
              showTraces={showTraces}
              showPins={showPins}
            />
          </Suspense>

          {/* Full 360° Unconstrained Orbit Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={1.0}
            minDistance={1.8}
            maxDistance={7.5}
            minPolarAngle={0}          // Straight from top
            maxPolarAngle={Math.PI}    // Straight from bottom underneath
            dampingFactor={0.05}
          />
        </Canvas>

        {/* Selected Vessel Clinical Detail HUD (Bottom Card) */}
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200/90 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-base font-black text-slate-900">{activeMeta.name}</span>
              <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                {activeMeta.acronym}
              </span>
              {isVein ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Venous Drainage
                </span>
              ) : (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${activeDetails.badgeClass}`}>
                  {activeDetails.band} • {Math.round(activeRisk * 100)}% Risk
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600">
              <span className="text-slate-400 font-semibold">Perfusion Territory: </span>
              {activeMeta.territory}
            </div>
            <div className="text-xs text-slate-500 italic">
              {activeMeta.clinicalSignificance}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xs font-medium text-slate-600 max-w-sm text-left md:text-right">
              {isVein 
                ? 'Coronary veins return deoxygenated blood from the myocardium into the right atrium via the posterior coronary sinus.'
                : activeDetails.clinicalAction}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
