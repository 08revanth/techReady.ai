import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import '../css/LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  
  // Stages: 'logo' -> 'text' -> 'exit'
  const [stage, setStage] = useState('logo');

  const title = "techReady.ai";
  const subtitle = "The Future of Interview Preparation".split(" ");

  // --- LOGO ANIMATION TIMING ---
  useEffect(() => {
    if (stage === 'logo') {
      const timer = setTimeout(() => {
        setStage('text'); // Auto-switch to text after logo finishes
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // --- HANDLE BUTTON CLICK ---
  const handleStart = () => {
    setStage('exit'); // Trigger exit animation
    
    // Wait for animation to finish (1.2s) then navigate
    setTimeout(() => {
      // FIX: Restored to '/start' based on your previous code.
      // Make sure your App.js has a <Route path="/start" element={<Home />} />
      navigate('/start'); 
    }, 1200);
  };

  // --- SCATTER ANIMATION LOGIC ---
  const randomScatter = () => ({
    x: Math.random() * 1500 - 750, 
    y: Math.random() * 1500 - 750, 
    rotate: Math.random() * 720 - 360, 
    opacity: 0,
    scale: 0,
    filter: "blur(10px)",
    transition: { duration: 0.8, ease: "easeInOut" }
  });

  return (
    <div className="landing-container">
      {/* Background Elements */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="grid-overlay"></div>

      <AnimatePresence mode="wait">
        
        {/* === STAGE 1: LOGO ANIMATION === */}
        {stage === 'logo' && (
          <motion.div 
            className="logo-stage"
            key="logo-stage"
            exit={{ scale: 10, opacity: 0, filter: "blur(20px)" }} 
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 100 100" className="animated-svg">
              <motion.path 
                d="M25 50 L40 50 L50 65 L75 30" 
                fill="none" 
                stroke="#d946ef" 
                strokeWidth="6" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <motion.circle cx="25" cy="50" r="4" fill="#fff" 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }}
              />
              <motion.circle cx="75" cy="30" r="5" fill="#fff" 
                 initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.3 }}
              />
              <motion.circle cx="50" cy="65" r="4" fill="#fff" 
                 initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4 }}
              />
            </svg>
          </motion.div>
        )}

        {/* === STAGE 2 & 3: TEXT & EXIT === */}
        {(stage === 'text' || stage === 'exit') && (
          <motion.div className="content-stage" key="text-stage">
            
            {/* TITLE */}
            <h1 className="brand-title">
              {title.split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 50, rotateX: 90 }}
                  animate={stage === 'exit' ? randomScatter() : { opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.5 }}
                  className={char === "." ? "dot" : index > 9 ? "ai" : ""}
                >
                  {char}
                </motion.span>
              ))}
            </h1>

            {/* SUBTITLE */}
            <div className="brand-subtitle">
              {subtitle.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={stage === 'exit' ? randomScatter() : { opacity: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.8 + (index * 0.1), duration: 0.5 }}
                  style={{ display: "inline-block", marginRight: "8px" }}
                >
                  {word}
                </motion.span>
              ))}
            </div>

            {/* BUTTON */}
            <motion.div 
              className="cta-wrapper"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={stage === 'exit' ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.5, type: "spring" }}
            >
              <button className="enter-btn" onClick={handleStart}>
                Initialize <FaArrowRight />
              </button>
            </motion.div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}