import { useState, useEffect } from "react";

const CONFETTI_COLORS = [
  "#00f2fe", "#4facfe", "#8b5cf6", "#ec4899", "#10b981",
  "#f59e0b", "#ef4444", "#a78bfa", "#34d399", "#f472b6"
];

function Confetti({ trigger }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return;

    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.8 + Math.random() * 1.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      shape: Math.random() > 0.5 ? "circle" : "rect",
      drift: (Math.random() - 0.5) * 200
    }));

    setPieces(newPieces);

    const timer = setTimeout(() => setPieces([]), 3500);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: p.shape === "circle" ? `${p.size}px` : `${p.size}px`,
            height: p.shape === "circle" ? `${p.size}px` : `${p.size * 0.4}px`,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            background: p.color,
            transform: `translateX(${p.drift}px)`
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;
