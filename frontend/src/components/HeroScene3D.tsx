'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════
   AGENT NODE — Glowing sphere representing one AI agent
   with orbiting ring and pulsing glow
   ═══════════════════════════════════════════════════════ */
function AgentNode({ position, color, pulseSpeed = 1 }: {
  position: [number, number, number]; color: string; pulseSpeed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * pulseSpeed * 0.8 + position[0]) * 0.12;
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t * pulseSpeed * 2) * 0.18;
      glowRef.current.scale.setScalar(s);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * pulseSpeed * 0.5;
      ringRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.32, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbiting ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.4, 0.005, 8, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   DATA STREAM — Particles flowing between two nodes
   along curved Bezier paths (reasoning data flow)
   ═══════════════════════════════════════════════════════ */
function DataStream({ from, to, color, count = 10, speed = 1 }: {
  from: [number, number, number]; to: [number, number, number];
  color: string; count?: number; speed?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2 + (from[1] > to[1] ? 0.4 : -0.4),
      (from[1] + to[1]) / 2 + 0.5,
      (from[2] + to[2]) / 2 + 0.3,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
  }, [from, to]);

  // Precompute 100 points along the curve on mount/memo to avoid getPoint math overhead during render
  const precomputedPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      pts.push(curve.getPoint(i / 100));
    }
    return pts;
  }, [curve]);

  const offsets = useMemo(() => Array.from({ length: count }, (_, i) => i / count), [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed * 0.3;
    offsets.forEach((offset, i) => {
      const progress = (t + offset) % 1;
      const pointIndex = Math.floor(progress * 100);
      const point = precomputedPoints[pointIndex] || precomputedPoints[0];
      dummy.position.copy(point);
      const sizePulse = 0.025 + Math.sin(progress * Math.PI) * 0.018;
      dummy.scale.setScalar(sizePulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════
   CONNECTION LINE — Curved line between connected nodes
   ═══════════════════════════════════════════════════════ */
function ConnectionLine({ from, to, color }: {
  from: [number, number, number]; to: [number, number, number]; color: string;
}) {
  const lineRef = useRef<THREE.Line>(null!);

  const geometry = useMemo(() => {
    const mid = new THREE.Vector3(
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.3,
      (from[2] + to[2]) / 2
    );
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      mid,
      new THREE.Vector3(...to)
    );
    const points = curve.getPoints(12);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [from, to]);

  return (
    // @ts-ignore
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </line>
  );
}

/* ═══════════════════════════════════════════════════════
   ORCHESTRATOR HUB — Central pulsing wireframe node
   ═══════════════════════════════════════════════════════ */
function OrchestratorHub() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
      meshRef.current.rotation.x = t * 0.15;
      const s = 1 + Math.sin(t * 1.5) * 0.06;
      meshRef.current.scale.setScalar(s);
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.4;
      ring1Ref.current.rotation.z = t * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 2 + t * -0.3;
      ring2Ref.current.rotation.y = t * 0.15;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.25;
      ring3Ref.current.rotation.z = Math.PI / 3 + t * -0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Core wireframe octahedron */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color="#7C3AED"
          emissive="#7C3AED"
          emissiveIntensity={4}
          wireframe
          toneMapped={false}
        />
      </mesh>

      {/* Inner core glow */}
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial
          color="#8B5CF6"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Three orbital rings at different angles */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.55, 0.008, 8, 32]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.7, 0.006, 8, 32]} />
        <meshBasicMaterial color="#00E5A8" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[0.85, 0.005, 8, 32]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   AMBIENT PARTICLES — Floating dust in the background
   ═══════════════════════════════════════════════════════ */
function AmbientParticles({ count = 30 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 18,
      y: (Math.random() - 0.5) * 12,
      z: (Math.random() - 0.5) * 8 - 2,
      sx: (Math.random() - 0.5) * 0.15,
      sy: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
      scale: Math.random() * 0.015 + 0.005,
    })), [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * 0.2 + p.phase) * p.sx,
        p.y + Math.cos(t * 0.3 + p.phase) * p.sy,
        p.z
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 3, 3]} />
      <meshBasicMaterial
        color="#6D28D9"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════
   MOUSE PARALLAX — Camera gently follows cursor
   ═══════════════════════════════════════════════════════ */
function MouseParallax() {
  const { camera } = useThree();

  useFrame((state) => {
    const p = state.pointer;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, p.x * 0.7, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, p.y * 0.4 + 0.3, 0.03);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ═══════════════════════════════════════════════════════
   AGENT POSITIONS — Hexagonal layout around center
   ═══════════════════════════════════════════════════════ */
const AGENTS: { pos: [number, number, number]; color: string; speed: number }[] = [
  { pos: [-2.5, 1.5, -0.5],   color: '#8B5CF6', speed: 0.9 },  // Workflow
  { pos: [2.5, 1.5, -0.5],    color: '#00E5A8', speed: 1.1 },  // Research
  { pos: [-3.0, -1.0, -0.5],  color: '#3B82F6', speed: 0.8 },  // Sentiment
  { pos: [3.0, -1.0, -0.5],   color: '#F59E0B', speed: 1.0 },  // Trend
  { pos: [-1.3, -2.3, -0.3],  color: '#EF4444', speed: 1.2 },  // ROI
  { pos: [1.3, 2.3, -0.3],    color: '#22C55E', speed: 0.7 },  // Strategy
];

const CENTER: [number, number, number] = [0, 0, 0];

/* ═══════════════════════════════════════════════════════
   SCENE CONTENT — Wrapped so Canvas error boundary works
   ═══════════════════════════════════════════════════════ */
function SceneContent() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#8B5CF6" />
      <pointLight position={[-5, -3, 3]} intensity={0.3} color="#00E5A8" />

      {/* Star background */}
      <Stars radius={80} depth={50} count={500} factor={2.5} fade speed={0.3} />

      {/* Central Orchestrator */}
      <OrchestratorHub />

      {/* Agent Nodes */}
      {AGENTS.map((a, i) => (
        <AgentNode key={i} position={a.pos} color={a.color} pulseSpeed={a.speed} />
      ))}

      {/* Connection lines from each agent to center */}
      {AGENTS.map((a, i) => (
        <ConnectionLine key={`cl-${i}`} from={a.pos} to={CENTER} color={a.color} />
      ))}

      {/* Data streams flowing FROM agents TO orchestrator */}
      {AGENTS.map((a, i) => (
        <DataStream key={`ds-${i}`} from={a.pos} to={CENTER} color={a.color} count={4} speed={a.speed * 1.2} />
      ))}

      {/* Return streams FROM orchestrator BACK to some agents */}
      <DataStream from={CENTER} to={AGENTS[0].pos} color="#8B5CF6" count={3} speed={0.6} />
      <DataStream from={CENTER} to={AGENTS[1].pos} color="#00E5A8" count={3} speed={0.7} />
      <DataStream from={CENTER} to={AGENTS[5].pos} color="#22C55E" count={3} speed={0.5} />

      {/* Cross-agent collaboration streams */}
      <DataStream from={AGENTS[0].pos} to={AGENTS[1].pos} color="#6D28D9" count={3} speed={0.8} />
      <DataStream from={AGENTS[2].pos} to={AGENTS[3].pos} color="#0EA5E9" count={3} speed={0.9} />
      <DataStream from={AGENTS[4].pos} to={AGENTS[5].pos} color="#D946EF" count={3} speed={0.7} />
      <ConnectionLine from={AGENTS[0].pos} to={AGENTS[1].pos} color="#6D28D9" />
      <ConnectionLine from={AGENTS[2].pos} to={AGENTS[3].pos} color="#0EA5E9" />
      <ConnectionLine from={AGENTS[4].pos} to={AGENTS[5].pos} color="#D946EF" />

      {/* Ambient floating particles */}
      <AmbientParticles count={15} />

      {/* Mouse parallax camera */}
      <MouseParallax />

      {/* Post-processing bloom */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.5}
          mipmapBlur={false}
        />
      </EffectComposer>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT — Canvas with error handling
   ═══════════════════════════════════════════════════════ */
export default function HeroScene3D() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Canvas
        camera={{ position: [0, 0.3, 6.5], fov: 50 }}
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
        <SceneContent />
      </Canvas>
    </div>
  );
}
