import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaRobot, 
  FaUserTie, 
  FaBriefcase, 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaArrowRight, 
  FaBolt,
  FaStar
} from 'react-icons/fa';
import '../css/TransitionPage.css';

export default function TransitionPage() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    // Simulated Data for immediate visual impact
    setJobs([
        { title: "Software Engineer", company: "Google", loc: "Bangalore", type: "Full-time" },
        { title: "Backend Dev", company: "Amazon", loc: "Hyderabad", type: "Hybrid" },
        { title: "Frontend Lead", company: "Swiggy", loc: "Remote", type: "Contract" },
        { title: "AI Researcher", company: "OpenAI", loc: "SF / Remote", type: "On-site" },
        { title: "Product Manager", company: "Cred", loc: "Mumbai", type: "Full-time" },
        { title: "DevOps Eng", company: "Netflix", loc: "Remote", type: "Full-time" },
    ]);
  }, []);

  const handleJobClick = () => window.open('https://linkedin.com/jobs', '_blank');

  return (
    <div className="portal-container">
      {/* Dynamic Background Elements */}
      <div className="bg-orb orb-purple"></div>
      <div className="bg-orb orb-cyan"></div>
      <div className="scan-line"></div>

      <div className="interface-wrapper">
        
        {/* Header */}
        <header className="main-header">
          <h1 className="glitch-title" data-text="Choose Your Path">Choose Your Path</h1>
          <p className="subtitle">Accelerate your career with AI simulation or Human expertise.</p>
        </header>

        {/* The Dual Pillars */}
        <div className="pillars-grid">
          
          {/* Left Pillar: AI */}
          <Link to="/mock-interview" className="pillar-card ai-theme">
            <div className="pillar-content">
              <div className="icon-halo">
                <FaRobot />
              </div>
              <div className="pillar-text">
                <h2>AI Mock Interview</h2>
                <p>Gemini-powered simulation. Instant feedback, voice analysis, and scoring.</p>
                <ul className="feature-list">
                  <li><FaBolt /> Real-time Voice AI</li>
                  <li><FaBolt /> DSA & System Design</li>
                </ul>
              </div>
              <div className="cta-button">
                Start AI Session <FaArrowRight />
              </div>
            </div>
            <div className="hover-bg"></div>
          </Link>

          {/* Right Pillar: Expert (Now Active) */}
          <Link to="/expert-interview" className="pillar-card expert-theme">
            <div className="pillar-content">
              <div className="icon-halo">
                <FaUserTie />
              </div>
              <div className="pillar-text">
                <h2>Expert Mentorship</h2>
                <p>1-on-1 live sessions with Senior Engineers from FAANG & Top Startups.</p>
                <ul className="feature-list">
                  <li><FaStar /> Mock Interviews</li>
                  <li><FaStar /> Resume Review</li>
                </ul>
              </div>
              <div className="cta-button">
                Book Expert <FaArrowRight />
              </div>
            </div>
            <div className="hover-bg"></div>
          </Link>

        </div>

        {/* Full Width Market Feed */}
        <div className="market-feed-bar">
          <div className="feed-label">
            <div className="live-dot"></div>
            LIVE MARKET
          </div>
          
          <div className="ticker-window">
            <div className="ticker-track">
              {[...jobs, ...jobs, ...jobs].map((job, i) => (
                <div key={i} className="ticker-item" onClick={handleJobClick}>
                  <span className="t-role">{job.title}</span>
                  <span className="t-at">@</span>
                  <span className="t-company">{job.company}</span>
                  <span className="t-loc">({job.loc})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}