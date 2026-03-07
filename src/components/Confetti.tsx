import React from 'react';

const Confetti = () => {
  const colors = ['#c8c0ff', '#d7ff00', '#ff90e8', '#ffffff', '#4ade80'];
  const pieces = Array.from({ length: 80 }).map((_, i) => {
    const left = Math.random() * 100;
    const width = Math.random() * 15 + 10;
    const height = Math.random() * 15 + 10;
    const bg = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 0.5;
    const duration = Math.random() * 2 + 2;
    const isCircle = Math.random() > 0.5;
    
    return (
      <div
        key={i}
        className="confetti-piece brutalist-border"
        style={{
          left: `${left}vw`,
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: bg,
          borderRadius: isCircle ? '50%' : '0px',
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    );
  });
  return <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">{pieces}</div>;
};

export default Confetti;
