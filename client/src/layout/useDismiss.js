import { useEffect } from "react";

// Closes a popover on outside press, Escape, scroll or resize.
export function useDismiss(containerRef, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointer = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [containerRef, isOpen, onClose]);
}
