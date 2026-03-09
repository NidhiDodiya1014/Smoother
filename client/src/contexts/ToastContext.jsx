import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastStack({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: "fixed",
      top: "72px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      pointerEvents: "none"
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.45)",
            color: "#10b981",
            padding: "8px 20px",
            borderRadius: "100px",
            fontSize: "0.88rem",
            fontWeight: "600",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 16px rgba(16, 185, 129, 0.2)",
            animation: "toastIn 0.3s ease",
            whiteSpace: "nowrap",
            maxWidth: "80vw",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          ✓ &quot;{toast.message}&quot; added
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
