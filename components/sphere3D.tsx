
import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { OrbitControls } from '@react-three/drei/native';
import * as THREE from 'three';
import { DeviceData } from '@/lib/types';
import { useSmartWatt } from '@/lib/context';

// type DeviceData = {
//   id: number;
//   name: string;
//   color: string;
//   power: string;
//   percentage: number;
// };

// const device: DeviceData[] = [
//   {
//     id: 1,
//     name: 'Oven',
//     color: '#3b82f6',
//     power: '4.2kW',
//     percentage: 10
//   },
//   {
//     id: 2,
//     name: 'PC',
//     color: '#10b981',
//     power: '8.2kW',
//     percentage: 25
//   }
// ]

type EnergySphereProps = {
  devices: DeviceData[];
  totalUsage: number;
  powerLimit: number;
};

function SmallSphere({
  size,
  color,
  position
}: {
  size: number;
  color: string;
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const targetColor = useRef(new THREE.Color(color));
  const currentColor = useRef(new THREE.Color(color));

  const targetScale = useRef(size); // the new size target
  const currentScale = useRef(size); // current smooth scale value

  useEffect(() => {
    targetColor.current.set(color);
    targetScale.current = size; // when percentage changes, update target size
  }, [color, size]);

  useFrame((state, delta) => {
    if (meshRef.current && matRef.current) {
      // smooth color transition
      currentColor.current.lerp(targetColor.current, 0.1);
      matRef.current.color.copy(currentColor.current);

      // smooth scale transition (lerp size)
      currentScale.current = THREE.MathUtils.lerp(
        currentScale.current,
        targetScale.current,
        0.1 // adjust for speed (0.05 slower, 0.2 faster)
      );

      // apply a gentle pulse on top of smooth scale
      const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.05 + 1;
      meshRef.current.scale.setScalar(currentScale.current * pulse);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial ref={matRef} transparent opacity={0.85} />
    </mesh>
  );
}

function EnergyCore({ totalUsage }: DeviceData) {

  const { powerLimit, setPowerLimit } = useSmartWatt();
  const { anomalyLevel, setAnomalyLevel } = useSmartWatt();

  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const colorRef = useRef(new THREE.Color('#10b981')); // start green
  const targetColorRef = useRef(new THREE.Color('#10b981'));
  const pulseSpeedRef = useRef(0);

  // compute percentage and decide color
  useEffect(() => {
    console.log(totalUsage,powerLimit);
    const usage = (totalUsage / powerLimit) * 100;
    console.log(usage)
    if (usage >= 100){
      targetColorRef.current.set('#ef4444'); // red
      pulseSpeedRef.current = 6;  
      setAnomalyLevel("warning")
    } else if (usage >= 80) {
      targetColorRef.current.set('#f59e0b'); // yellow
      pulseSpeedRef.current = 2;    
      setAnomalyLevel("warning")
    } else targetColorRef.current.set('#10b981'); // green
  }, [totalUsage, powerLimit]);

  useFrame((state) => {
    if (!meshRef.current || !matRef.current) return;

    // smooth color transition
    colorRef.current.lerp(targetColorRef.current, 0.1);
    matRef.current.color.copy(colorRef.current);

    // pulsation animation
    if (pulseSpeedRef.current > 0) {
      const t = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(t * pulseSpeedRef.current) * 0.015; // 10% pulse
      meshRef.current.scale.set(scale, scale, scale);
    } else {
      // ensure scale resets when green
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 25, 25]} />
      <meshBasicMaterial
        ref={matRef}
        color={targetColorRef.current}
        transparent
        wireframeLinewidth={0}
        wireframe
      />
    </mesh>
  );
}

const getSphereSize = (percentage: number) => {
  // Exponential scaling for more dramatic size differences
  const normalizedPercentage = percentage / 100;
  return 0.1 + Math.pow(normalizedPercentage, 0.7) * 0.8; // Size between 0.1 and 0.9 with exponential curve
};

// Calculate radius from center - devices stick to limiter edge with subtle variations
const getRadiusFromCenter = (percentage: number) => {
  const normalizedPercentage = percentage / 100;
  // Base radius at limiter edge (1.0) with subtle proximity effect
  const proximityVariation = normalizedPercentage * 0.15; // Small variation for higher usage
  return 1.0 - proximityVariation; // Radius between 0.85 and 1.0 (staying close to limiter edge)
};

function OrbitingGroup({ devices, totalUsage }: DeviceData) {

  const groupRef = useRef<THREE.Group>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
      <group ref={orbitGroupRef}>
        <EnergyCore devices={devices} totalUsage={totalUsage} />
        {devices.map((device, index) => {
          const angle = (index / devices.length) * Math.PI * 2;
          const radius = getRadiusFromCenter(device.percentage);
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const size = getSphereSize(device.percentage);

          return (
            <SmallSphere
              key={device.id}
              size={size}
              color={device.color}
              position={[x, 0, z]}
            />
          );
        })}
      </group>
  );
}


export default function EnergySphere3D({ devices, totalUsage }: DeviceData) {

  return (
    <View style={{ width: 325, height: 325, backgroundColor: 'transparent', borderRadius: 12 }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
      >
        <color attach="background" args={['#09090B']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1} />
        <pointLight position={[-3, -3, -3]} intensity={0.3} />
        
        <OrbitingGroup devices={devices} totalUsage={totalUsage} />

        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate
          autoRotateSpeed={0.7}
        />
      </Canvas>
    </View>
  );
}
