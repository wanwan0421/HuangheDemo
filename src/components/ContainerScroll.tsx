'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

interface HeaderProps {
  translate: MotionValue<number>;
}

export function Header({ translate}: HeaderProps) {
  return (
    <motion.div className="max-w-5xl mx-auto text-center" style={{ translateY: translate }}>
    </motion.div>
  );
}

interface CardProps {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  content: React.ReactNode;
}

export function Card({ rotate, scale, translate, content }: CardProps) {
  return (
    <motion.div
      className="-mt-2 mx-auto w-full rounded-[30px] max-w-5xl block"
      style={{
        rotateX: rotate,
        scale,
      }}
    >
      <motion.div
        className="w-full h-full"
        style={{
          translateY: translate,
          boxShadow:
            '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
        }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

interface ContainerScrollProps {
  content: React.ReactNode;
}

export function ContainerScroll({ content }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 1] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      ref={containerRef}
      className="flex items-start sm:items-center justify-center relative p-10"
    >
      <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
        <Card content={content} rotate={rotate} scale={scale} translate={translate} />
      </div>
    </div>
  );
}
