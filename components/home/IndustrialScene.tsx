"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";

// ─── Materials ─────────────────────────────────────────────────────────────

const METAL_DARK = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x1a2332),
  metalness: 0.85,
  roughness: 0.35,
});

const METAL_MID = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x263347),
  metalness: 0.75,
  roughness: 0.45,
});

const METAL_LIGHT = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x3a4d66),
  metalness: 0.65,
  roughness: 0.55,
});

const ACCENT_BLUE = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x1a5fad),
  metalness: 0.4,
  roughness: 0.3,
  emissive: new THREE.Color(0x0a2a55),
  emissiveIntensity: 0.3,
});

const BELT_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x222222),
  metalness: 0.1,
  roughness: 0.9,
});

const BOX_COLORS = [
  new THREE.MeshStandardMaterial({ color: new THREE.Color(0xe8c840), metalness: 0.2, roughness: 0.6 }),
  new THREE.MeshStandardMaterial({ color: new THREE.Color(0x1a5fad), metalness: 0.3, roughness: 0.5 }),
  new THREE.MeshStandardMaterial({ color: new THREE.Color(0xc23b2a), metalness: 0.2, roughness: 0.6 }),
  new THREE.MeshStandardMaterial({ color: new THREE.Color(0x3a8a52), metalness: 0.2, roughness: 0.6 }),
];

// ─── Conveyor Belt ──────────────────────────────────────────────────────────

function ConveyorBelt() {
  const beltRef = useRef<THREE.Group>(null);
  const boxesRef = useRef<THREE.Mesh[]>([]);

  // Belt frame
  const frameGeo = new THREE.BoxGeometry(8, 0.18, 1.1);
  // Belt surface
  const surfaceGeo = new THREE.BoxGeometry(8, 0.08, 0.9);
  // Support legs
  const legGeo = new THREE.BoxGeometry(0.14, 1.2, 0.14);
  // Roller end
  const rollerGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.0, 12);
  // Box geometry
  const boxGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);

  useFrame((_, delta) => {
    // Move boxes along belt (x axis, right to left)
    boxesRef.current.forEach((box) => {
      box.position.x -= delta * 1.1;
      // Reset to right when off-screen
      if (box.position.x < -4.5) {
        box.position.x = 4.5;
      }
    });
  });

  return (
    <group ref={beltRef} position={[0, -1.4, 0]}>
      {/* Belt frame */}
      <mesh geometry={frameGeo} material={METAL_DARK} position={[0, 0, 0]} />
      {/* Belt surface */}
      <mesh geometry={surfaceGeo} material={BELT_MAT} position={[0, 0.12, 0]} />

      {/* End rollers */}
      <mesh geometry={rollerGeo} material={METAL_MID} position={[-4, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={rollerGeo} material={METAL_MID} position={[4, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} />

      {/* Support legs */}
      {[-3.2, -1.0, 1.0, 3.2].map((x, i) => (
        <group key={i} position={[x, -0.7, 0]}>
          <mesh geometry={legGeo} material={METAL_MID} position={[0, 0, 0.45]} />
          <mesh geometry={legGeo} material={METAL_MID} position={[0, 0, -0.45]} />
        </group>
      ))}

      {/* Moving boxes on belt */}
      {[0, 1.5, 3.0, -1.5].map((xOffset, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) boxesRef.current[i] = el; }}
          geometry={boxGeo}
          material={BOX_COLORS[i % BOX_COLORS.length]}
          position={[xOffset, 0.51, 0]}
        />
      ))}
    </group>
  );
}

// ─── Robot Arm ──────────────────────────────────────────────────────────────

function RobotArm() {
  const baseRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const forearmRef = useRef<THREE.Group>(null);
  const gripperRef = useRef<THREE.Group>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Geometries
  const basePedestalGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.28, 16);
  const baseTurretGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.55, 16);
  const upperArmGeo = new THREE.BoxGeometry(0.22, 1.45, 0.22);
  const elbowGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const forearmGeo = new THREE.BoxGeometry(0.18, 1.1, 0.18);
  const wristGeo = new THREE.SphereGeometry(0.14, 10, 10);
  const gripperBodyGeo = new THREE.BoxGeometry(0.12, 0.3, 0.12);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Proxy objects for GSAP to animate
      const shoulder = { rotation: -0.3 };
      const forearm = { rotation: 0.6 };
      const base = { rotation: 0 };
      const gripper = { open: 1 };

      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.3,
        defaults: { ease: "power2.inOut" },
        onUpdate: () => {
          if (baseRef.current) baseRef.current.rotation.y = base.rotation;
          if (shoulderRef.current) shoulderRef.current.rotation.z = shoulder.rotation;
          if (forearmRef.current) forearmRef.current.rotation.z = forearm.rotation;
          if (gripperRef.current) {
            const g = gripperRef.current.children;
            if (g[0]) g[0].position.x = -gripper.open * 0.12;
            if (g[1]) g[1].position.x = gripper.open * 0.12;
          }
        },
      });

      // Phase 1: Reach out over conveyor
      tl.to(base, { rotation: 0.45, duration: 1.4 }, 0)
        .to(shoulder, { rotation: 0.5, duration: 1.2 }, 0.2)
        .to(forearm, { rotation: -0.8, duration: 1.2 }, 0.2)
        // Phase 2: Close gripper (pick up box)
        .to(gripper, { open: 0.15, duration: 0.35 }, 1.4)
        // Phase 3: Lift up
        .to(shoulder, { rotation: 0.0, duration: 0.9 }, 1.8)
        .to(forearm, { rotation: 0.4, duration: 0.9 }, 1.8)
        // Phase 4: Rotate to place position
        .to(base, { rotation: -0.6, duration: 1.2 }, 2.8)
        .to(shoulder, { rotation: 0.45, duration: 1.0 }, 3.4)
        .to(forearm, { rotation: -0.55, duration: 1.0 }, 3.4)
        // Phase 5: Release
        .to(gripper, { open: 1, duration: 0.35 }, 4.5)
        // Phase 6: Return home
        .to(base, { rotation: 0, duration: 1.2 }, 4.9)
        .to(shoulder, { rotation: -0.3, duration: 1.0 }, 5.0)
        .to(forearm, { rotation: 0.6, duration: 1.0 }, 5.0);

      tlRef.current = tl;
    });

    return () => ctx.revert();
  }, []);

  return (
    <group position={[-1.5, -0.8, 0.3]}>
      {/* Base pedestal */}
      <mesh geometry={basePedestalGeo} material={METAL_DARK} position={[0, 0, 0]} />

      {/* Rotating turret */}
      <group ref={baseRef}>
        <mesh geometry={baseTurretGeo} material={METAL_MID} position={[0, 0.4, 0]} />

        {/* Upper arm (shoulder joint) */}
        <group position={[0, 0.7, 0]}>
          <group ref={shoulderRef}>
            <mesh geometry={upperArmGeo} material={METAL_LIGHT} position={[0, 0.72, 0]} />
            <mesh geometry={elbowGeo} material={ACCENT_BLUE} position={[0, 1.45, 0]} />

            {/* Forearm (elbow joint) */}
            <group position={[0, 1.45, 0]} ref={forearmRef}>
              <mesh geometry={forearmGeo} material={METAL_MID} position={[0, 0.55, 0]} />
              <mesh geometry={wristGeo} material={ACCENT_BLUE} position={[0, 1.1, 0]} />

              {/* Gripper */}
              <group position={[0, 1.25, 0]} ref={gripperRef}>
                <mesh geometry={gripperBodyGeo} material={METAL_DARK} position={[-0.12, 0, 0]} />
                <mesh geometry={gripperBodyGeo} material={METAL_DARK} position={[0.12, 0, 0]} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// ─── Floor Grid ─────────────────────────────────────────────────────────────

function FloorGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);
  return (
    <gridHelper
      ref={gridRef}
      args={[14, 14, 0x1a3a6a, 0x1a3a6a]}
      position={[0, -2.0, 0]}
    />
  );
}

// ─── Scene Lights ───────────────────────────────────────────────────────────

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.35} color={0xc8d8f0} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.6}
        color={0xffffff}
        castShadow
      />
      <directionalLight
        position={[-4, 3, -3]}
        intensity={0.45}
        color={0xb0c4de}
      />
      {/* Brand blue accent fill */}
      <pointLight position={[0, 2, 2]} intensity={1.2} color={0x1a5fad} distance={8} decay={2} />
      {/* Warm key from right */}
      <pointLight position={[4, 4, 1]} intensity={0.7} color={0xfff4e0} distance={10} decay={2} />
    </>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────

const IndustrialScene = () => {
  return (
    <div className="h-full w-full" aria-hidden="true">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <SceneLights />
        <OrthographicCamera
          makeDefault
          position={[0, 1.2, 8]}
          zoom={55}
          near={0.1}
          far={80}
        />
        <FloorGrid />
        <ConveyorBelt />
        <RobotArm />
      </Canvas>
    </div>
  );
};

export default IndustrialScene;
