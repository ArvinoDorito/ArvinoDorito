"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

function Model() {
  const { scene, animations } = useGLTF("/model.glb");
  const ref = useRef<any>();

  // Manage animations
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        if (!action) return; // ✅ skip null actions
        action.reset();
        action.play();
        action.setLoop(THREE.LoopRepeat, Infinity);
      });
    }
  }, [actions]);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime;

      // Smooth back-and-forth rotation around Y
      ref.current.rotation.y = Math.sin(t / 5) * Math.PI;

      // Slight X/Z tilts
      ref.current.rotation.x = Math.sin(t / 7) * 0.2;
      ref.current.rotation.z = Math.sin(t / 9) * 0.15;

      // Tiny floating effect
      ref.current.position.y = Math.sin(t / 3) * 0.1;
      ref.current.position.x = Math.sin(t / 6) * 0.05;
    }
  });

  return <primitive ref={ref} object={scene} scale={10} />;
}

export default function Background3D() {
  return (
    <Canvas
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
      camera={{ position: [0, 0, 6] }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <Model />
    </Canvas>
  );
}