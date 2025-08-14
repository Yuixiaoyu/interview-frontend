"use client";

import React, { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

interface ParticleCanvasProps {
  className?: string;
  density?: number; // 粒子密度（每像素）
  baseColor?: string; // 主题颜色
  alpha?: number; // 粒子最大不透明度
  maxParticles?: number; // 上限，避免过多
}

const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  className,
  density = 0.00008,
  baseColor = "#7C3AED",
  alpha = 0.6,
  maxParticles = 60,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const cssWidthRef = useRef<number>(0);
  const cssHeightRef = useRef<number>(0);
  const dprRef = useRef<number>(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const { r, g, b } = hexToRgb(baseColor);

    const setSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      cssWidthRef.current = rect.width;
      cssHeightRef.current = rect.height;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createParticles = () => {
      const width = cssWidthRef.current;
      const height = cssHeightRef.current;
      const area = width * height;
      const targetCount = Math.min(maxParticles, Math.max(12, Math.floor(area * density)));
      const particles: Particle[] = new Array(targetCount).fill(0).map(() => {
        const radius = Math.random() * 1.6 + 0.6;
        const angle = Math.random() * Math.PI * 2;
        const baseSpeed = Math.random() * 0.25 + 0.05; // 轻微流动
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * baseSpeed,
          vy: Math.sin(angle) * baseSpeed,
          radius,
          alpha: alpha * (0.5 + Math.random() * 0.5),
        };
      });
      particlesRef.current = particles;
    };

    const draw = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const width = cssWidthRef.current;
      const height = cssHeightRef.current;
      ctx.clearRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        // 轻微运动
        p.x += p.vx;
        p.y += p.vy;

        // 边缘循环，避免明显反弹
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${Math.min(0.4, p.alpha)})`;
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      setSize();
      createParticles();
    };

    // 初始化
    setSize();
    createParticles();
    draw();

    // ResizeObserver 更平滑
    if (typeof ResizeObserver !== "undefined") {
      roRef.current = new ResizeObserver(handleResize);
      if (canvas.parentElement) roRef.current.observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (roRef.current) roRef.current.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [alpha, baseColor, density, maxParticles]);

  return <canvas ref={canvasRef} className={className} />;
};

export default ParticleCanvas; 