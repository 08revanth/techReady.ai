import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ReactTyped } from "react-typed";
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "../css/Record.css";

export default function Record() {
  const location = useLocation();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState("");
  const [question_id, setquestion_id] = useState("");
  const [recording, setRecording] = useState(false);
  const [previewURL, setPreviewURL] = useState(null);
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const cardName = location.state?.cardName || "dbms";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchQuestion();
  }, [cardName]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (previewURL) URL.revokeObjectURL(previewURL);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [previewURL, stream]);

  const fetchQuestion = async () => {
    try {
      const url = `http://127.0.0.1:8000/my_app/api/get-random-question/${cardName}/`;
      const response = await axios.get(url);
      if (response.status === 200) {
        setQuestion(response.data.question);
        setquestion_id(response.data.id);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      toast.error("Camera access denied!");
      console.log(err);
    }
  };

  const startRecording = () => {
    if (!stream) return toast.error("Camera not open!");

    // Check if audio track exists
    if (stream.getAudioTracks().length === 0) {
      console.warn("No audio track found in stream!");
      toast.warning("No microphone detected. Video will be silent.");
    }

    chunksRef.current = [];
    
    // Use a MIME type that includes audio explicitly
    // Chrome/Edge usually prefer 'video/webm;codecs=vp8,opus'
    let options = { mimeType: "video/webm" };
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
      options = { mimeType: "video/webm;codecs=vp8,opus" };
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
      options = { mimeType: "video/webm;codecs=vp9,opus" };
    }

    try {
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Create blob with the SAME mime type as recorder
        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewURL(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Recorder Error:", err);
      toast.error("Failed to start recording. Check microphone.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const retake = () => {
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
      chunksRef.current = [];
    }
  };

  const handleSubmit = async () => {
    try {
      if (!previewURL && (chunksRef.current.length === 0)) {
        toast.error("No recording found!");
        return;
      }

      setSubmitting(true);

      // prefer the recorded blob; if preview exists, reuse chunks
      const blob = new Blob(chunksRef.current, { type: "video/webm" });

      const formData = new FormData();
      formData.append("video", blob);
      formData.append("question_id", question_id);

      const response = await fetch("http://127.0.0.1:8000/my_app/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        navigate("/report", {
          state: {
            rating: data.rating,
            user_answer: data.user_answer,
            feedback: data.feedback,
            strengths: data.strengths,
            model_answer: data.model_answer,
            question_id: question_id,
          },
        });
      } else {
        toast.error("Server error");
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const subjectMap = {
    dbms: "Database management system",
    os: "Operating systems",
    cn: "Computer networks",
    dsa: "Data Structures and Algorithms",
    oops: "Object oriented Programming",
    web: "Web development",
  };

  const subject = subjectMap[cardName];

  // UI state helpers
  const showOpen = !stream;
  const showStart = stream && !recording && !previewURL;
  const showStop = recording;
  const showRetake = !!previewURL;
  const showSubmit = !!previewURL;

  return (
    <div className="record-root">
      <div className="record-inner">
        <header className="record-header">
          <h2>
            All the best for your <br />
            <span className="subject">{subject}</span> Interview!
          </h2>
        </header>

        <main className="record-main">
          <section className="video-wrap">
            {!previewURL ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
            ) : (
              <video
                src={previewURL}
                controls
                className="video-element"
              />
            )}

            {!stream && (
              <div className="video-placeholder">
                <p className="placeholder-title">Camera is currently closed</p>
                <p className="placeholder-sub">Click Open Camera to begin</p>
              </div>
            )}
          </section>

          <section className="controls">
            <div className="controls-row">
              {showOpen && (
                <button className="btn primary" onClick={openCamera}>
                  Open Camera
                </button>
              )}

              {showStart && (
                <button className="btn primary" onClick={startRecording}>
                  Start Recording
                </button>
              )}

              {showStop && (
                <button className="btn danger" onClick={stopRecording}>
                  Stop Recording
                </button>
              )}

              {showRetake && (
                <button className="btn" onClick={retake}>
                  Retake
                </button>
              )}

              <button
                className={`btn submit ${showSubmit ? "" : "disabled"}`}
                onClick={handleSubmit}
                disabled={!showSubmit || submitting}
                title={!showSubmit ? "Record and preview first" : "Submit interview"}
              >
                {submitting ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <ClipLoader size={14} color="white" /> Analyzing...
                  </span>
                ) : (
                  "Submit Interview"
                )}
              </button>
            </div>
          </section>

          <section className="question">
            <h3>
              <ReactTyped strings={[question || "Loading question..."]} typeSpeed={50} />
            </h3>
          </section>
        </main>
      </div>

      <ToastContainer />

      {/* Inline styles scoped to this component for easy paste */}
      <style>{`
        .record-root {
          padding: 28px;
          display: flex;
          justify-content: center;
        }
        .record-inner {
          width: 100%;
          max-width: 1000px;
        }
        .record-header {
          text-align: center;
          margin-bottom: 18px;
        }
        .record-header h2 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
        }
        .subject { color: purple; }

        .record-main {
          display: flex;
          flex-direction: column;
          gap: 18px;
          align-items: center;
        }

        .video-wrap {
          width: 100%;
          max-width: 820px;
          height: 460px;
          border: 3px solid purple;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #000;
        }

        .video-placeholder {
          position: absolute;
          z-index: 5;
          color: #fff;
          text-align: center;
        }
        .placeholder-title { font-weight: 600; margin-bottom: 6px; }
        .placeholder-sub { font-size: 0.9rem; color: #ddd; }

        .controls {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .controls-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }

        .btn {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.08);
          background: white;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 2px 0 rgba(0,0,0,0.03);
          transition: transform 0.08s ease, opacity 0.12s ease;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }

        .btn.primary {
          background: #6c5ce7;
          color: #fff;
          border: none;
        }

        .btn.danger {
          background: #d63031;
          color: #fff;
          border: none;
        }

        .btn.submit {
          background: #5a3fe8;
          color: white;
          margin-left: 6px;
        }

        .btn.disabled,
        .btn[disabled] {
          opacity: 0.55;
          pointer-events: none;
          cursor: not-allowed;
        }

        .question {
          width: 100%;
          max-width: 820px;
          text-align: left;
          margin-top: 8px;
          padding-left: 6px;
        }
        .question h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
          color: #111;
        }

        /* Responsive */
        @media (max-width: 720px) {
          .video-wrap { height: 320px; }
          .record-header h2 { font-size: 1.4rem; }
          .controls-row { gap: 8px; }
          .btn { padding: 9px 12px; font-size: 0.95rem; }
          .question h3 { font-size: 0.98rem; text-align: center; }
        }
      `}</style>
    </div>
  );
}
