'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   AGENT DEFINITIONS — positions in orbital layout
   ═══════════════════════════════════════════════════════ */
const AGENT_DEFS = [
  { id: 'workflow',  color: '#00E5A8', angle: 0 },
  { id: 'research',  color: '#3B82F6', angle: Math.PI / 3 },
  { id: 'sentiment', color: '#F59E0B', angle: (2 * Math.PI) / 3 },
  { id: 'trend',     color: '#22C55E', angle: Math.PI },
  { id: 'roi',       color: '#EF4444', angle: (4 * Math.PI) / 3 },
  { id: 'strategy',  color: '#D946EF', angle: (5 * Math.PI) / 3 },
];

const ORBIT_RADIUS = 2.8;

/* ═══════════════════════════════════════════════════════
   ORCHESTRATOR CORE — central glowing sphere
   ═══════════════════════════════════════════════════════ */
function OrchestratorCore() {
  const coreRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.3;
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 1.5) * 0.15;
      glowRef.current.scale.setScalar(s);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Core sphere */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.35, 2]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={2.5}
          toneMapped={false}
          wireframe
        />
      </mesh>

      {/* Inner solid */}
      <mesh>
        <icosahedronGeometry args={[0.25, 1]} />
        <meshStandardMaterial
          color="#7C3AED"
          emissive="#7C3AED"
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial
          color="#8B5CF6"
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.5, 0.012, 8, 64]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   AGENT NODE — orbiting sphere for each agent
   ═══════════════════════════════════════════════════════ */
function AgentNode({
  agentId, color, angle, status, isSelected, onClick,
}: {
  agentId: string;
  color: string;
  angle: number;
  status: 'idle' | 'active' | 'done' | 'error' | undefined;
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  const x = Math.cos(angle) * ORBIT_RADIUS;
  const z = Math.sin(angle) * ORBIT_RADIUS;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      // Gentle float
      groupRef.current.position.y = Math.sin(t * 0.8 + angle) * 0.15;
    }

    if (glowRef.current) {
      const isActive = status === 'active';
      const baseScale = isActive ? 1.4 : isSelected ? 1.2 : 1.0;
      const pulse = isActive ? Math.sin(t * 4) * 0.3 : Math.sin(t * 1.2 + angle) * 0.1;
      glowRef.current.scale.setScalar(baseScale + pulse);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * (status === 'active' ? 2.0 : 0.5);
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.5 + angle) * 0.15;
    }
  });

  const emissiveIntensity = status === 'active' ? 5 : status === 'done' ? 3 : isSelected ? 3.5 : 2;
  const nodeColor = status === 'done' ? '#22C55E' : status === 'error' ? '#EF4444' : color;

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {/* Clickable invisible hitbox */}
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={emissiveIntensity}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={status === 'active' ? 0.2 : 0.06}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.3, 0.008, 8, 32]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={status === 'active' ? 0.8 : 0.3}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   CONNECTION BEAM — line from orchestrator to agent
   ═══════════════════════════════════════════════════════ */
function ConnectionBeam({
  angle, color, status,
}: {
  angle: number;
  color: string;
  status: 'idle' | 'active' | 'done' | 'error' | undefined;
}) {
  const lineRef = useRef<THREE.Line>(null!);

  const points = useMemo(() => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(
      Math.cos(angle) * (ORBIT_RADIUS - 0.35),
      0,
      Math.sin(angle) * (ORBIT_RADIUS - 0.35),
    );
    // Create a curve with a slight arc
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      0.3,
      (start.z + end.z) / 2,
    );
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(20);
  }, [angle]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  const beamColor = status === 'done' ? '#22C55E' : status === 'active' ? color : status === 'error' ? '#EF4444' : color;
  const opacity = status === 'active' ? 0.6 : status === 'done' ? 0.4 : 0.12;

  return (
    // @ts-ignore
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={beamColor}
        transparent
        opacity={opacity}
        linewidth={1}
      />
    </line>
  );
}

/* ═══════════════════════════════════════════════════════
   DATA PULSE — animated pulse traveling along beam
   ═══════════════════════════════════════════════════════ */
function DataPulse({
  angle, color, status,
}: {
  angle: number;
  color: string;
  status: 'idle' | 'active' | 'done' | 'error' | undefined;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!meshRef.current || status !== 'active') {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;
    const t = (state.clock.elapsedTime * 1.5) % 1;
    const x = Math.cos(angle) * ORBIT_RADIUS * t;
    const z = Math.sin(angle) * ORBIT_RADIUS * t;
    const y = Math.sin(t * Math.PI) * 0.3; // arc
    meshRef.current.position.set(x, y, z);
    meshRef.current.scale.setScalar(0.6 + Math.sin(state.clock.elapsedTime * 8) * 0.3);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   ORBIT RING — the circular path
   ═══════════════════════════════════════════════════════ */
function OrbitRing() {
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[ORBIT_RADIUS, 0.005, 8, 128]} />
      <meshBasicMaterial color="#8B5CF6" transparent opacity={0.1} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   AMBIENT PARTICLES
   ═══════════════════════════════════════════════════════ */
function AmbientParticles({ count = 40 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        {/* @ts-ignore */}
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8B5CF6"
        size={0.03}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   CAMERA CONTROLLER — slow auto-rotation
   ═══════════════════════════════════════════════════════ */
function CameraController() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const radius = 6.0; // Compact radius so nodes do not increase in size/overlap
    const speed = 0.08;
    state.camera.position.x = Math.sin(t * speed) * radius;
    state.camera.position.z = Math.cos(t * speed) * radius;
    state.camera.position.y = 2.5 + Math.sin(t * 0.15) * 0.3; // Reverted elevation
    state.camera.lookAt(0, 0.5, 0); // Focus camera perfectly on the shifted group!
  });

  return null;
}

/* ═══════════════════════════════════════════════════════
   SCENE CONTENT
   ═══════════════════════════════════════════════════════ */
function SceneContent({
  agentStatuses,
  onAgentClick,
  selectedAgent,
}: {
  agentStatuses: Record<string, string>;
  onAgentClick: (id: string) => void;
  selectedAgent: string | null;
}) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#8B5CF6" />
      <pointLight position={[3, -2, 3]} intensity={0.3} color="#00E5A8" />

      <group position={[0, 0.5, 0]}>
        {/* Central Orchestrator */}
        <OrchestratorCore />

        {/* Orbit Ring */}
        <OrbitRing />

        {/* Agent Nodes */}
        {AGENT_DEFS.map((agent) => (
          <AgentNode
            key={agent.id}
            agentId={agent.id}
            color={agent.color}
            angle={agent.angle}
            status={agentStatuses[agent.id] as any}
            isSelected={selectedAgent === agent.id}
            onClick={() => onAgentClick(agent.id)}
          />
        ))}

        {/* Connection Beams */}
        {AGENT_DEFS.map((agent) => (
          <ConnectionBeam
            key={`beam-${agent.id}`}
            angle={agent.angle}
            color={agent.color}
            status={agentStatuses[agent.id] as any}
          />
        ))}

        {/* Data Pulses (only during active) */}
        {AGENT_DEFS.map((agent) => (
          <DataPulse
            key={`pulse-${agent.id}`}
            angle={agent.angle}
            color={agent.color}
            status={agentStatuses[agent.id] as any}
          />
        ))}

        {/* Ambient particles */}
        <AmbientParticles count={25} />
      </group>

      {/* Camera */}
      <CameraController />
    </>
  );
}

function isWebGLAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT — Canvas wrapper
   ═══════════════════════════════════════════════════════ */
export default function AgentOrbit3D({
  agentStatuses = {},
  onAgentClick = () => {},
  selectedAgent = null,
}: {
  agentStatuses?: Record<string, string>;
  onAgentClick?: (id: string) => void;
  selectedAgent?: string | null;
}) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
    }
  }, []);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-muted)', gap: 12 }}>
        <Loader2 style={{ color: 'var(--primary-light)', animation: 'spin 1s linear infinite' }} size={24} />
        <span style={{ fontSize: 11, letterSpacing: '0.05em' }}>Loading 3D Orbit engine...</span>
      </div>
    );
  }

  if (!hasWebGL) {
    // Return gorgeous, premium interactive CSS-animated orbital system
    return (
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#050409',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Sleek SVG Connection lines orbiting central hub */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}>
          <defs>
            <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Ambient center radial glow */}
          <circle cx="50%" cy="50%" r="140" fill="url(#hub-glow)" />
          
          {/* Main Orbit Ring */}
          <circle cx="50%" cy="50%" r="120" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1.5" fill="none" />
          
          {/* Pulsing connection lines to each agent position */}
          {AGENT_DEFS.map((agent) => {
            const angle = agent.angle;
            // Center is 50%, 50%
            const x2 = `calc(50% + ${Math.cos(angle) * 120}px)`;
            const y2 = `calc(50% + ${Math.sin(angle) * 120}px)`;
            const isActive = agentStatuses[agent.id] === 'active';
            const isDone = agentStatuses[agent.id] === 'done';
            const beamColor = isDone ? '#22C55E' : isActive ? agent.color : 'rgba(139, 92, 246, 0.2)';
            
            return (
              <line
                key={agent.id}
                x1="50%"
                y1="50%"
                x2={x2}
                y2={y2}
                stroke={beamColor}
                strokeWidth={isActive ? 2.5 : 1}
                strokeDasharray={isActive ? "5, 5" : "none"}
                style={{
                  opacity: isActive ? 0.9 : isDone ? 0.6 : 0.25,
                  animation: isActive ? 'dash 1.5s linear infinite' : 'none',
                  transition: 'all 0.5s ease'
                }}
              />
            );
          })}
        </svg>

        {/* Central Orchestrator Core */}
        <div style={{
          position: 'absolute',
          zIndex: 3,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #7C3AED 0%, #1E1B4B 100%)',
          border: '2px solid #8B5CF6',
          boxShadow: '0 0 35px rgba(139, 92, 246, 0.6), inset 0 0 15px rgba(139, 92, 246, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          animation: 'pulse-slow 3s ease-in-out infinite',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#D8B4FE' }}>
            Core
          </span>
          <span style={{ fontSize: 8, color: 'rgba(216, 180, 254, 0.6)' }}>
            Active
          </span>
        </div>

        {/* Orbiting Agent Nodes */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 2,
          animation: 'orbit-spin 60s linear infinite',
          pointerEvents: 'none'
        }}>
          {AGENT_DEFS.map((agent) => {
            const angle = agent.angle;
            const x = `calc(50% + ${Math.cos(angle) * 120}px - 20px)`;
            const y = `calc(50% + ${Math.sin(angle) * 120}px - 20px)`;
            const isSelected = selectedAgent === agent.id;
            const status = agentStatuses[agent.id];
            const isActive = status === 'active';
            const isDone = status === 'done';
            
            const nodeColor = isDone ? '#22C55E' : status === 'error' ? '#EF4444' : agent.color;
            const glowShadow = isSelected 
              ? `0 0 25px ${nodeColor}, inset 0 0 10px ${nodeColor}` 
              : isActive 
                ? `0 0 30px ${nodeColor}, inset 0 0 8px ${nodeColor}` 
                : `0 0 12px rgba(139, 92, 246, 0.3)`;
            
            return (
              <button
                key={agent.id}
                onClick={() => onAgentClick(agent.id)}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: isDone ? 'radial-gradient(circle, #22C55E 0%, #064E3B 100%)' : 'radial-gradient(circle, #1F2937 0%, #111827 100%)',
                  border: `2px solid ${nodeColor}`,
                  boxShadow: glowShadow,
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: isActive ? 'node-pulse 1.2s ease-in-out infinite' : 'float-gentle 4s ease-in-out infinite',
                  animationDelay: `${angle}s`
                }}
              >
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: nodeColor,
                  boxShadow: `0 0 8px ${nodeColor}`
                }} />
              </button>
            );
          })}
        </div>

        {/* CSS Keyframe Animations */}
        <style>{`
          @keyframes orbit-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.08); opacity: 1; }
          }
          @keyframes node-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.25); }
          }
          @keyframes float-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes dash {
            to { stroke-dashoffset: -20; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 45 }}
        dpr={[1, 1.2]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <SceneContent
          agentStatuses={agentStatuses}
          onAgentClick={onAgentClick}
          selectedAgent={selectedAgent}
        />
      </Canvas>

      {/* Central label */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 5,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'rgba(139,92,246,0.6)',
          textTransform: 'uppercase', letterSpacing: '0.15em',
        }}>
          Orchestrator
        </div>
      </div>
    </div>
  );
}

