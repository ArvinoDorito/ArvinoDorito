"use client";

import dynamic from "next/dynamic";

const Milkway = dynamic(() => import("@/components/Milkway"), {
  ssr: false,
});

export default function GalaxyPage() {
  return <Milkway />;
}
