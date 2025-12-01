import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { 
  FaVideo, 
  FaMicrophone, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock, 
  FaStopCircle, 
  FaRedo 
} from 'react-icons/fa';

import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

import '../css/Record.css';

// --- CONFIG ---
const TOTAL_TIME_SECONDS = 600; 
const TOTAL_QUESTIONS = 5;
const HEARTBEAT_INTERVAL_S = 8;
const FACE_MISSING_SECONDS = 3;
const OCCLUSION_BRIGHTNESS_THRESHOLD = 18;
const OCCLUSION_DROP_PERCENT = 0.6;
const nowISO = () => new Date().toISOString();

export default function Record() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- STATE ---
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [questionCount, setQuestionCount] = useState(0);
  const [question, setQuestion] = useState("");
  const [question_id, setquestion_id] = useState("");
  const cardName = location.state?.cardName || "dbms";

  // Video State
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [previewURL, setPreviewURL] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoRef = useRef(null);

  // Proctoring State
  const [events, setEvents] = useState([]);
  const [warnings, setWarnings] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [allReports, setAllReports] = useState([]);

  // Refs
  const faceMeshRef = useRef(null);
  const cameraRunnerRef = useRef(null);
  const canvasRef = useRef(null);
  const mpCanvasCtxRef = useRef(null);
  const noFaceSinceRef = useRef(null);
  const lastBrightnessRef = useRef(null);
  const tabHiddenSinceRef = useRef(null);
  const heartbeatTimerRef = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchQuestion();
    window.scrollTo(0, 0);

    const timerId = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerId);
          finishInterview();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // --- PROCTORING LOGIC (ENHANCED) ---
  useEffect(() => {
    // 1. Heartbeat
    heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_S * 1000);
    
    // 2. Tab Switching (Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabHiddenSinceRef.current = Date.now();
        // Immediate Alert
        emitEvent("tab_switch", "major", { message: "User switched tabs!" });
      } else {
        if (tabHiddenSinceRef.current) {
          const duration = Math.round((Date.now() - tabHiddenSinceRef.current) / 1000);
          emitEvent("tab_return", "info", { message: `Returned after ${duration}s` });
          tabHiddenSinceRef.current = null;
        }
      }
    };

    // 3. Window Blurring (Alt-Tab / Click Outside)
    const handleWindowBlur = () => {
      // Only trigger if not already hidden (to avoid double logging with visibility change)
      if (!document.hidden) {
        emitEvent("window_blur", "medium", { message: "Window lost focus (Alt-Tab?)" });
      }
    };

    const handleWindowFocus = () => {
       // Optional: Log when they come back
       // emitEvent("window_focus", "info", { message: "Focus regained" });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearInterval(heartbeatTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []); // Run once on mount

  // --- ACTIONS ---
  const fetchQuestion = async () => {
    try {
      const url = `http://127.0.0.1:8000/my_app/api/get-random-question/${cardName}/?t=${new Date().getTime()}`;
      const response = await axios.get(url);
      if (response.status === 200) {
        setQuestion(response.data.question);
        setquestion_id(response.data.id);
        setQuestionCount(prev => (prev < TOTAL_QUESTIONS ? prev + 1 : prev));
      }
    } catch (err) {
      toast.error("Network Error: Could not fetch question.");
    }
  };

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, frameRate: 30 }, 
        audio: true 
      });
      setStream(s);
      
      if (!canvasRef.current) {
        const c = document.createElement("canvas");
        c.width = 640; c.height = 360;
        canvasRef.current = c;
        mpCanvasCtxRef.current = c.getContext("2d", { willReadFrequently: true });
      }

      await initFaceMesh(videoRef.current);
      toast.success("Camera Active");
    } catch (err) {
      toast.error("Camera access denied.");
    }
  };

  async function initFaceMesh(videoEl) {
    if (!videoEl) return;
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({
      maxNumFaces: 2, refineLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6
    });
    faceMesh.onResults(onFaceMeshResults);
    faceMeshRef.current = faceMesh;

    try {
      const cameraRunner = new Camera(videoEl, {
        onFrame: async () => { 
          if (!submitting && faceMeshRef.current) {
            try { await faceMeshRef.current.send({ image: videoEl }); } catch (e) {} 
          }
        },
        width: 1280, height: 720
      });
      cameraRunner.start();
      cameraRunnerRef.current = cameraRunner;
    } catch (err) { console.warn("Camera Helper failed"); }
  }

  // --- MEDIAPIPE LOGIC ---
  function onFaceMeshResults(results) {
    if(submitting) return;

    const multi = results.multiFaceLandmarks || [];
    const facesCount = multi.length;

    try {
      const ctx = mpCanvasCtxRef.current;
      const v = videoRef.current;
      if (ctx && v && v.readyState === 4) {
        ctx.drawImage(v, 0, 0, ctx.canvas.width, ctx.canvas.height);
        const img = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        let sum = 0;
        for (let i = 0; i < img.data.length; i += 4) sum += 0.2126 * img.data[i] + 0.7152 * img.data[i + 1] + 0.0722 * img.data[i + 2];
        const avg = sum / (ctx.canvas.width * ctx.canvas.height);
        
        if (lastBrightnessRef.current != null) {
          const drop = (lastBrightnessRef.current - avg) / (lastBrightnessRef.current || 1);
          if (drop > OCCLUSION_DROP_PERCENT || avg < OCCLUSION_BRIGHTNESS_THRESHOLD) {
            emitEvent("occluded", "medium", { avg: avg.toFixed(1) }, false);
          }
        }
        lastBrightnessRef.current = avg;
      }
    } catch (e) {}

    if (facesCount === 0) {
      if (!noFaceSinceRef.current) noFaceSinceRef.current = Date.now();
      const elapsed = (Date.now() - noFaceSinceRef.current) / 1000;
      if (elapsed >= FACE_MISSING_SECONDS) emitEvent("face_missing", "medium", { duration: Math.round(elapsed) }, true);
    } else {
      noFaceSinceRef.current = null;
    }

    if (facesCount > 1) emitEvent("multi_face", "major", { count: facesCount }, true);
  }

  function emitEvent(type, severity = "info", meta = {}, captureSnapshot = false) {
    if(submitting) return;

    const ev = { id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`, type, severity, meta, ts: nowISO() };
    
    // Updates UI immediately
    setEvents((prev) => [ev, ...prev]);

    if (["minor", "medium", "major"].includes(severity)) {
      setWarnings((w) => w + 1);
      // Force toast to show immediately
      toast.warn(`⚠️ Warning: ${type.replace('_', ' ').toUpperCase()}`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
    const fd = new FormData();
    fd.append("event", JSON.stringify(ev));
    sendEventToServer(fd);
  }

  async function sendEventToServer(formData) {
    try { await fetch("http://127.0.0.1:8000/my_app/events/", { method: "POST", body: formData }); } catch (e) {}
  }

  async function sendHeartbeat() {
    try {
      await fetch("http://127.0.0.1:8000/my_app/heartbeat/", {
        method: "POST", body: JSON.stringify({ ts: nowISO() }), headers: { "Content-Type": "application/json" }
      });
    } catch (e) { }
  }

  function stopAllTrackAndClean() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    if (previewURL) { URL.revokeObjectURL(previewURL); setPreviewURL(null); }
  }

  const startRecording = () => {
    if (!stream) return toast.error("Open Camera First!");
    chunksRef.current = [];
    const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? { mimeType: "video/webm;codecs=vp9" } : { mimeType: "video/webm" };
    
    try {
      const mr = new MediaRecorder(stream, options);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        setPreviewURL(URL.createObjectURL(blob));
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      toast.info("Recording Started");
    } catch (e) { toast.error("Recorder failed"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setRecording(false);
    }
  };

  const retake = () => {
    setPreviewURL(null);
    chunksRef.current = [];
  };

  const submitAnswerAndNext = async () => {
    if (chunksRef.current.length === 0) return toast.error("Please record an answer first.");
    setSubmitting(true);
    
    try {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const fd = new FormData();
        fd.append("video", blob, "answer.webm");
        fd.append("question_id", question_id);
        fd.append("events", JSON.stringify(events));

        const res = await fetch("http://127.0.0.1:8000/my_app/", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Server Error");
        const data = await res.json();

        const newReport = { 
            question_id, question, rating: data.rating, feedback: data.feedback, 
            strengths: data.strengths, model_answer: data.model_answer, user_answer: data.user_answer 
        };
        const updatedReports = [...allReports, newReport];
        setAllReports(updatedReports);

        setPreviewURL(null);
        chunksRef.current = [];

        if (questionCount >= TOTAL_QUESTIONS) {
            finishInterview(updatedReports);
        } else {
            fetchQuestion();
        }
        
        toast.success("Answer Submitted Successfully!");
    } catch (e) { 
        toast.error("Submission failed. Please try again."); 
        console.error(e);
    } 
    finally { 
        setSubmitting(false); 
    }
  };

  const finishInterview = (finalReports = allReports) => {
    if (sessionEnded) return;
    setSessionEnded(true);
    stopAllTrackAndClean();
    toast.info("Interview Complete! Generating Report...");
    setTimeout(() => navigate("/report", { state: { allReports: finalReports } }), 1000);
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="record-wrapper">
      <div className="bg-gradient-orb"></div>
      
      <div className="record-grid">
        
        {/* --- LEFT: TASK PANEL --- */}
        <div className="panel task-panel">
          <div className="task-header">
            <span className="module-tag">{cardName}</span>
            <span className="q-counter">Q{questionCount} / {TOTAL_QUESTIONS}</span>
          </div>

          <div className="question-box">
            <h3>Current Question:</h3>
            <p className="question-text">{question || "Loading..."}</p>
          </div>

          <div className="timer-box">
            <FaClock className={timeLeft < 60 ? "icon-blink" : ""} />
            <span className={timeLeft < 60 ? "time-critical" : ""}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* --- CENTER: VIDEO FEED --- */}
        <div className="panel video-panel">
          <div className="video-frame">
            {recording && <div className="rec-indicator">REC</div>}
            
            {!previewURL ? (
                <video ref={videoRef} autoPlay muted playsInline className="main-video" />
            ) : (
                <video src={previewURL} controls className="main-video preview-mode" />
            )}

            {!stream && !previewURL && (
                <div className="camera-placeholder">
                    <FaVideo size={40} />
                    <p>Camera is Offline</p>
                    <button className="btn-glow" onClick={openCamera}>Activate Camera</button>
                </div>
            )}

            {/* FIX: Processing Overlay Centered */}
            {submitting && (
                <div className="processing-overlay">
                    <ClipLoader size={50} color="#d946ef" />
                    <h3>Analyzing Answer...</h3>
                    <p>Please wait while our AI grades your response.</p>
                </div>
            )}
          </div>

          <div className="controls-row">
            {stream && !recording && !previewURL && !sessionEnded && !submitting && (
              <button className="ctrl-btn start" onClick={startRecording}>
                <FaMicrophone /> Start Answer
              </button>
            )}
            
            {recording && !sessionEnded && (
              <button className="ctrl-btn stop" onClick={stopRecording}>
                <FaStopCircle /> Stop Recording
              </button>
            )}
            
            {previewURL && !sessionEnded && !submitting && (
              <button className="ctrl-btn retake" onClick={retake}>
                <FaRedo /> Retake
              </button>
            )}
            
            <button 
              className="ctrl-btn submit" 
              onClick={submitAnswerAndNext} 
              disabled={!previewURL || submitting}
            >
              {submitting ? "Processing..." : <><FaCheckCircle /> {questionCount >= TOTAL_QUESTIONS ? "Finish Interview" : "Submit & Next"}</>}
            </button>
          </div>
        </div>

        {/* --- RIGHT: PROCTORING LOG --- */}
        <div className="panel log-panel">
          <div className="log-header">
            <h4><FaExclamationTriangle /> Proctoring Log</h4>
            <div className="warning-badge" style={{ opacity: warnings > 0 ? 1 : 0.5 }}>
              {warnings} Warnings
            </div>
          </div>
          
          <div className="events-list">
            {events.length === 0 && <div className="empty-log">System Normal</div>}
            {events.map(e => (
              <div key={e.id} className={`event-item ${e.severity}`}>
                <span className="ev-time">{e.ts.split('T')[1].slice(0,8)}</span>
                <span className="ev-type">{e.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
}