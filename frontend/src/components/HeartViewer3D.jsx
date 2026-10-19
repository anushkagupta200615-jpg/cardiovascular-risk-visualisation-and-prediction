import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';

// Helper function to map risk probability (0.0 to 1.0) to color
// < 0.3 = Green (Healthy), 0.3 - 0.6 = Yellow/Amber (Moderate), > 0.6 = Red (Critical)
function getRiskColor(risk) {
    if (risk > 0.6) return '#ef4444'; // Red
    if (risk > 0.3) return '#eab308'; // Amber
    return '#22c55e';                 // Green
}

// 3D Anatomical Heart Model Representation with dynamic coronary branch colors
function HeartMesh({ vesselRisks }) {
    const groupRef = useRef();

    // Gentle floating animation to make it look alive
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(t / 4) * 0.2;
        }
    });

    const ladColor = getRiskColor(vesselRisks?.LAD || 0);
    const lcxColor = getRiskColor(vesselRisks?.LCX || 0);
    const rcaColor = getRiskColor(vesselRisks?.RCA || 0);

    return (
        <group ref={groupRef}>
            {/* Main Myocardium (Heart Muscle) */}
            <mesh position={[0, 0, 0]}>
                <dodecahedronGeometry args={[1.5, 2]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.3} metalness={0.2} />
            </mesh>

            {/* LAD Branch (Left Anterior Descending - Front) */}
            <mesh position={[0.2, 0.4, 1.2]} rotation={[0.5, 0.2, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 1.8, 16]} />
                <meshStandardMaterial color={ladColor} emissive={ladColor} emissiveIntensity={0.4} />
            </mesh>

            {/* LCX Branch (Left Circumflex - Side) */}
            <mesh position={[-0.9, 0.6, 0.4]} rotation={[0.2, -0.8, 0.5]}>
                <cylinderGeometry args={[0.07, 0.07, 1.4, 16]} />
                <meshStandardMaterial color={lcxColor} emissive={lcxColor} emissiveIntensity={0.4} />
            </mesh>

            {/* RCA Branch (Right Coronary Artery - Right Side) */}
            <mesh position={[0.9, 0.2, 0.2]} rotation={[-0.2, 0.8, -0.5]}>
                <cylinderGeometry args={[0.07, 0.07, 1.6, 16]} />
                <meshStandardMaterial color={rcaColor} emissive={rcaColor} emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
}

export default function HeartViewer3D({ vesselRisks }) {
    return (
        <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 min-h-[420px] h-[50vh] relative flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-cyan-400">Interactive 3D Coronary Risk Mapping</h3>
                {/* Legend */}
                <div className="flex space-x-3 text-xs">
                    <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full inline-block mr-1"></span>Normal (&lt;30%)</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-full inline-block mr-1"></span>Moderate (30-60%)</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full inline-block mr-1"></span>Stenotic (&gt;60%)</span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[350px] bg-slate-950 rounded-lg overflow-hidden relative">
                <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} />
                    <directionalLight position={[-10, -10, -5]} intensity={0.5} />
                    <Suspense fallback={null}>
                        <Center>
                            <HeartMesh vesselRisks={vesselRisks} />
                        </Center>
                    </Suspense>
                    <OrbitControls enableZoom={true} autoRotate={false} />
                </Canvas>
            </div>
        </div>
    );
}
