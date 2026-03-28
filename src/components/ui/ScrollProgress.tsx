"use client";

import { useScroll, useSpring, motion } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: "left",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "2px",
        pointerEvents: "none",
        background: "linear-gradient(90deg, #0F4FE8 0%, #00D4FF 50%, #7B61FF 100%)",
        boxShadow: "0 0 12px rgba(0,212,255,0.8), 0 0 24px rgba(15,79,232,0.4)",
      }}
    />
  );
}
