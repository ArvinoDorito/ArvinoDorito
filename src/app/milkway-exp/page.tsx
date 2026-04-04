"use client";

import dynamic from "next/dynamic";

const milkway = dynamic(() => import("@/components/milkway.tsx"), {
  ssr: false,
});

export default function GalaxyPage() {
  return <milkway />;
}