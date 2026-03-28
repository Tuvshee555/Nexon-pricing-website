"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);

  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);

  // Main cursor: very responsive
  const x = useSpring(rawX, { stiffness: 500, damping: 28 });
  const y = useSpring(rawY, { stiffness: 500, damping: 28 });

  // Trailing glow: laggy
  const trailX = useSpring(rawX, { stiffness: 80, damping: 20 });
  const trailY = useSpring(rawY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      setVisible(true);
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);
    const leave = () => setVisible(false);
    const enter = () => setVisible(true);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, [rawX, rawY]);

  if (!visible) return null;

  return (
    <>
      {/* Big trailing glow blob */}
      <motion.div
        style={{
          position: "fixed",
          left: trailX,
          top: trailY,
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
          zIndex: 9998,
          width: clicking ? 180 : 220,
          height: clicking ? 180 : 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
          filter: "blur(20px)",
          transition: "width 0.2s, height 0.2s",
        }}
      />

      {/* Small sharp dot */}
      <motion.div
        style={{
          position: "fixed",
          left: x,
          top: y,
          translateX: "-50%",
          translateY: "-50%",
          pointerEvents: "none",
          zIndex: 9999,
          width: clicking ? 8 : 10,
          height: clicking ? 8 : 10,
          borderRadius: "50%",
          background: clicking
            ? "rgba(15,79,232,1)"
            : "rgba(0,212,255,0.9)",
          boxShadow: clicking
            ? "0 0 20px rgba(15,79,232,0.8)"
            : "0 0 12px rgba(0,212,255,0.7)",
          transition: "width 0.15s, height 0.15s, background 0.15s",
        }}
      />
    </>
  );
}
