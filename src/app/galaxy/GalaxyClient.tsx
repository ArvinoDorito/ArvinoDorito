"use client";

import { Canvas } from "@react-three/fiber";
import Galaxy from "@/components/galaxy/galaxy";

export default function GalaxyClient() {
  return (
    <Canvas>
      <Galaxy />
    </Canvas>
  );
}