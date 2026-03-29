"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    gsap.set(el, { xPercent: -50, yPercent: -50 });

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...mouse };

    const speed = 1; // 1 = instant, 0.2 = smooth lag

    const move = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const render = () => {
      // interpolate (set speed=1 for no lag)
      pos.x += (mouse.x - pos.x) * speed;
      pos.y += (mouse.y - pos.y) * speed;

      gsap.set(el, {
        x: pos.x,
        y: pos.y,
      });

      requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", move);
    render();

    return () => {
      window.removeEventListener("mousemove", move);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "white",
        pointerEvents: "none",
        zIndex: 999999,
        mixBlendMode: "difference",
        willChange: "transform",
      }}
    />
  );
}