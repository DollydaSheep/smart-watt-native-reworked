
import React, { useMemo, useRef, useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { OrbitControls } from '@react-three/drei/native';
import * as THREE from 'three';
import { Device } from '@/lib/types';
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
  devices: Device[];
  totalUsage: number;
  powerLimit: number;
};

const NEAR_LIMIT_THRESHOLD = 90;

function PowerLimiter({ totalUsage, powerLimit, devices }: { totalUsage: number; powerLimit: number; devices: Device[] }) {
  const { setAnomalyLevel } = useSmartWatt();

  const particlesRef = useRef<THREE.Points | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const gridMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const gridMeshRef = useRef<THREE.Mesh | null>(null);

  const particleCount = 1500;

  const targetColorRef = useRef<THREE.Color>(new THREE.Color('#10b981'));
  const currentColorRef = useRef<THREE.Color>(new THREE.Color('#10b981'));

  const usagePercentage = powerLimit > 0 ? (totalUsage / powerLimit) * 100 : 0;
  const isOverLimit = usagePercentage >= 100;
  const isNearLimit = usagePercentage >= NEAR_LIMIT_THRESHOLD;

  const highestUsageDeviceColor = useMemo(() => {
    if (!devices || devices.length === 0) return '#10b981';
    const highest = devices.reduce((acc, cur) => (cur.percentage > acc.percentage ? cur : acc), devices[0]);
    return highest?.color ?? '#10b981';
  }, [devices]);

  const particleState = useRef<{
    positions: Float32Array;
    velocities: THREE.Vector3[];
    accelerations: THREE.Vector3[];
    lastTime: number;
  } | null>(null);

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    const accelerations: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 0.3 + Math.random() * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        )
      );
      accelerations.push(new THREE.Vector3(0, 0, 0));
    }

    particleState.current = {
      positions: new Float32Array(positions),
      velocities,
      accelerations,
      lastTime: 0,
    };

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [particleCount]);

  useEffect(() => {
    if (isOverLimit) {
      targetColorRef.current.set('#ef4444');
      setAnomalyLevel('critical');
    } else if (isNearLimit) {
      targetColorRef.current.set('#f59e0b');
      setAnomalyLevel('warning');
    } else {
      targetColorRef.current.set(highestUsageDeviceColor);
      setAnomalyLevel('normal');
    }
  }, [highestUsageDeviceColor, isNearLimit, isOverLimit, setAnomalyLevel]);

  const getPhysicsConstants = (usage: number) => {
    if (usage >= 100) {
      return {
        DAMPING: 0.97,
        MAX_SPEED: 0.1,
        ATTRACTION_TO_CENTER: 0.0001,
        CHAOS_FORCE: 0.0015,
        BOUNDARY_BREACH: 0.8,
        MOVEMENT_SCALE: 0.8,
        REPULSION: 0.0008,
        BOUNDARY_ELASTICITY: 0.6,
      };
    }
    if (usage >= NEAR_LIMIT_THRESHOLD) {
      return {
        DAMPING: 0.99,
        MAX_SPEED: 0.02,
        ATTRACTION_TO_CENTER: 0.0001,
        CHAOS_FORCE: 0.0003,
        BOUNDARY_BREACH: 0.95,
        MOVEMENT_SCALE: 0.3,
        REPULSION: 0.0001,
        BOUNDARY_ELASTICITY: 0.9,
      };
    }
    return {
      DAMPING: 0.995,
      MAX_SPEED: 0.01,
      ATTRACTION_TO_CENTER: 0.0002,
      CHAOS_FORCE: 0,
      BOUNDARY_BREACH: 0.9,
      MOVEMENT_SCALE: 0.1,
      REPULSION: 0.00005,
      BOUNDARY_ELASTICITY: 0.95,
    };
  };

  useFrame((state) => {
    if (!particlesRef.current || !materialRef.current || !particleState.current) return;

    const currentTime = state.clock.getElapsedTime();
    const PHYSICS = getPhysicsConstants(usagePercentage);

    currentColorRef.current.lerp(targetColorRef.current, 0.05);
    materialRef.current.color.copy(currentColorRef.current);

    if (gridMaterialRef.current && gridMeshRef.current) {
      gridMaterialRef.current.color.copy(currentColorRef.current);

      if (isOverLimit) {
        const opacityPulse = Math.sin(currentTime * 8) * 0.1 + 0.15;
        const scalePulse = Math.sin(currentTime * 6) * 0.15 + 1;
        const systemPulse = Math.sin(currentTime * 5) * 0.1 + 1;
        gridMaterialRef.current.opacity = opacityPulse;
        gridMeshRef.current.scale.set(scalePulse, scalePulse, scalePulse);
        particlesRef.current.scale.set(systemPulse, systemPulse, systemPulse);
      } else if (isNearLimit) {
        const opacityPulse = Math.sin(currentTime * 3) * 0.04 + 0.08;
        const scalePulse = Math.sin(currentTime * 2.5) * 0.05 + 1;
        gridMaterialRef.current.opacity = opacityPulse;
        gridMeshRef.current.scale.set(scalePulse, scalePulse, scalePulse);
        particlesRef.current.scale.set(1, 1, 1);
      } else {
        const opacityPulse = Math.sin(currentTime * 0.5) * 0.015 + 0.06;
        const scalePulse = Math.sin(currentTime * 0.4) * 0.02 + 1;
        gridMaterialRef.current.opacity = opacityPulse;
        gridMeshRef.current.scale.set(scalePulse, scalePulse, scalePulse);
        particlesRef.current.scale.set(1, 1, 1);
      }
    }

    const { positions, velocities, accelerations, lastTime } = particleState.current;
    const positionsAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
    const deltaTime = lastTime ? Math.min(0.1, currentTime - lastTime) : 0.016;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const position = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      const velocity = velocities[i];
      const acceleration = accelerations[i];

      acceleration.set(0, 0, 0);

      const distanceToCenter = position.length();
      if (distanceToCenter > 0.01) {
        const directionToCenter = position.clone().multiplyScalar(-1 / distanceToCenter);
        const attractionForce = Math.min(distanceToCenter * 0.5, 0.1);
        acceleration.add(directionToCenter.multiplyScalar(attractionForce * PHYSICS.ATTRACTION_TO_CENTER));
      }

      if (PHYSICS.CHAOS_FORCE > 0) {
        acceleration.add(
          new THREE.Vector3(
            (Math.random() - 0.5) * PHYSICS.CHAOS_FORCE * PHYSICS.MOVEMENT_SCALE,
            (Math.random() - 0.5) * PHYSICS.CHAOS_FORCE * PHYSICS.MOVEMENT_SCALE,
            (Math.random() - 0.5) * PHYSICS.CHAOS_FORCE * PHYSICS.MOVEMENT_SCALE
          )
        );
      }

      if (i % 10 === 0) {
        for (let j = 0; j < Math.min(5, particleCount); j++) {
          if (i === j) continue;
          const j3 = j * 3;
          const otherPos = new THREE.Vector3(positions[j3], positions[j3 + 1], positions[j3 + 2]);
          const diff = new THREE.Vector3().subVectors(position, otherPos);
          const distance = diff.length();

          if (distance < 0.3 && distance > 0.01) {
            const repulsionForce = (1 / (distance * distance)) * PHYSICS.REPULSION;
            diff.normalize().multiplyScalar(repulsionForce);
            acceleration.add(diff);
            accelerations[j].sub(diff);
          }
        }
      }

      velocity.add(acceleration);
      velocity.multiplyScalar(PHYSICS.DAMPING);

      if (velocity.length() > PHYSICS.MAX_SPEED) {
        velocity.normalize().multiplyScalar(PHYSICS.MAX_SPEED);
      }

      position.add(velocity.clone().multiplyScalar(deltaTime * 60));

      const radius = position.length();
      const maxRadius = PHYSICS.BOUNDARY_BREACH;

      if (radius > maxRadius && usagePercentage < 100) {
        const normal = position.clone().normalize();
        const dot = velocity.dot(normal);
        velocity.sub(normal.multiplyScalar(2 * dot * PHYSICS.BOUNDARY_ELASTICITY));
        position.copy(normal.multiplyScalar(maxRadius * 0.99));
      } else if (radius > 2.0) {
        const resetRadius = 0.3 + Math.random() * 0.7;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        position.set(
          resetRadius * Math.sin(phi) * Math.cos(theta),
          resetRadius * Math.sin(phi) * Math.sin(theta),
          resetRadius * Math.cos(phi)
        );
        const velocityScale = PHYSICS.MOVEMENT_SCALE * 0.02;
        velocity.set(
          (Math.random() - 0.5) * velocityScale,
          (Math.random() - 0.5) * velocityScale,
          (Math.random() - 0.5) * velocityScale
        );
      } else if (radius < 0.3 && usagePercentage < 100) {
        position.normalize().multiplyScalar(0.3);
        velocity.add(position.clone().multiplyScalar(0.1 * PHYSICS.MOVEMENT_SCALE));
      }

      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
    }

    (positionsAttr.array as Float32Array).set(positions);
    positionsAttr.needsUpdate = true;

    particleState.current.lastTime = currentTime;

    particlesRef.current.rotation.y = currentTime * 0.05;
  });

  return (
    <group>
      <points ref={particlesRef}>
        <primitive object={particleGeometry} attach="geometry" />
        <pointsMaterial
          ref={materialRef}
          size={0.03}
          sizeAttenuation={true}
          transparent
          opacity={0.8}
          alphaTest={0.01}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh ref={gridMeshRef}>
        <sphereGeometry args={[1, 25, 25]} />
        <meshBasicMaterial
          ref={gridMaterialRef}
          wireframe
          transparent
          opacity={0.02}
          color="#10b981"
        />
      </mesh>
    </group>
  );
}

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

function EnergyCore({ totalUsage, powerLimit, devices }: { totalUsage: number; powerLimit: number; devices: Device[] }) {
  return <PowerLimiter totalUsage={totalUsage} powerLimit={powerLimit} devices={devices} />;
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

function OrbitingGroup({ devices, totalUsage, powerLimit }: EnergySphereProps) {
  const orbitGroupRef = useRef<THREE.Group>(null);

  const usagePercentage = powerLimit > 0 ? (totalUsage / powerLimit) * 100 : 0;
  const isOverLimit = usagePercentage >= 100;
  const isNearLimit = usagePercentage >= NEAR_LIMIT_THRESHOLD;

  useFrame((state) => {
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
      <group ref={orbitGroupRef}>
        <EnergyCore devices={devices} totalUsage={totalUsage} powerLimit={powerLimit} />
        {devices.map((device, index) => {
          const angle = (index / devices.length) * Math.PI * 2;
          const radius = getRadiusFromCenter(device.percentage);
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const size = getSphereSize(device.percentage);

          const displayColor = isOverLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : device.color;

          return (
            <SmallSphere
              key={device.id}
              size={size}
              color={displayColor}
              position={[x, 0, z]}
            />
          );
        })}
      </group>
  );
}


export default function EnergySphere3D({ devices, totalUsage }: { devices: Device[]; totalUsage: number }) {

  const { powerLimit } = useSmartWatt();

  return (
    <View style={{ width: 325, height: 325, backgroundColor: 'transparent', borderRadius: 12 }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
      >
        <color attach="background" args={['#0A0A0A']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1} />
        <pointLight position={[-3, -3, -3]} intensity={0.3} />
        
        <OrbitingGroup devices={devices} totalUsage={totalUsage} powerLimit={powerLimit} />

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
