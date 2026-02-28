"use client";

import { useState, useEffect } from "react";

export default function MouseDot() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: mouse.y - 5,
        left: mouse.x - 5,
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: "red",
        pointerEvents: "none",
        zIndex: 9999,
        transition: "transform 0.02s linear",
      }}
    />
  );
}
