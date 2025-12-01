import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';

export const useProctoring = (isActive, onViolation) => {
  const [warnings, setWarnings] = useState(0);
  
  // Browser Visibility (Tab Switching)
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation("Tab switch detected!");
      }
    };

    const handleBlur = () => {
      triggerViolation("Window focus lost!");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isActive]);

  // Fullscreen Enforcement
  useEffect(() => {
    if (!isActive) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation("You exited fullscreen mode!");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isActive]);

  // Disable Copy/Paste/Right Click
  useEffect(() => {
    if (!isActive) return;

    const preventMenu = (e) => {
      e.preventDefault();
      triggerViolation("Right-click is disabled.");
    };

    const preventCopy = (e) => {
      e.preventDefault();
      triggerViolation("Copy/Paste is disabled.");
    };

    document.addEventListener("contextmenu", preventMenu);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("paste", preventCopy);

    return () => {
      document.removeEventListener("contextmenu", preventMenu);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("paste", preventCopy);
    };
  }, [isActive]);

  const triggerViolation = (message) => {
    setWarnings(prev => prev + 1);
    toast.warning(`⚠️ Warning ${warnings + 1}: ${message}`, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
    
    if (onViolation) onViolation(message, warnings + 1);
  };

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Error entering fullscreen:", err);
    }
  };

  return { warnings, enterFullscreen };
};