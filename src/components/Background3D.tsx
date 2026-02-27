"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

// Define the type for GLTF result
type GLTFResult = {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
};

function Model() {
  const gltf = useGLTF("/model.glb") as GLTFResult;
  const ref = useRef<THREE.Object3D>(null); // properly typed ref

  const { actions } = useAnimations(gltf.animations, ref);

  // Play all animations once on mount
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        if (!action) return;
        action.reset();
        action.play();
        action.setLoop(THREE.LoopRepeat, Infinity);
      });
    }
  }, [actions]);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime;

      // Smooth back-and-forth rotation
      ref.current.rotation.y = Math.sin(t / 5) * Math.PI;
      ref.current.rotation.x = Math.sin(t / 7) * 0.2;
      ref.current.rotation.z = Math.sin(t / 9) * 0.15;

      // Tiny floating
      ref.current.position.y = Math.sin(t / 3) * 0.1;
      ref.current.position.x = Math.sin(t / 6) * 0.05;
    }
  });

  return <primitive ref={ref} object={gltf.scene} scale={10} />;
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