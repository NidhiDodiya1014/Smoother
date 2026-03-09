import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    const duration = type === "error" ? 6000 : 4000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
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
      {toasts.map(toast => {
        const isError = toast.type === "error";
        return (
          <div
            key={toast.id}
            style={{
              background: isError ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
              border: `1px solid ${isError ? "rgba(239,68,68,0.45)" : "rgba(16,185,129,0.45)"}`,
              color: isError ? "#ef4444" : "#10b981",
              padding: "8px 20px",
              borderRadius: "100px",
              fontSize: "0.88rem",
              fontWeight: "600",
              backdropFilter: "blur(12px)",
              boxShadow: `0 0 16px ${isError ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
              animation: "toastIn 0.3s ease",
              whiteSpace: "nowrap",
              maxWidth: "80vw",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {isError ? `✕ Failed to download "${toast.message}"` : `✓ "${toast.message}" added`}
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
