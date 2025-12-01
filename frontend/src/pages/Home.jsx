import React, { useState } from 'react';
import { 
  FaArrowRight, 
  FaDatabase, 
  FaNetworkWired, 
  FaCode, 
  FaObjectGroup, 
  FaTree, 
  FaLaptop, 
  FaRobot, 
  FaChartLine, 
  FaCheckCircle 
} from 'react-icons/fa';
import '../css/Home.css';
import { Link } from 'react-router-dom';
import LoginModal from './LoginModal';

export default function Home() {
    const [isOpen, setIsOpen] = useState(false);
    const isAuthenticated = !!localStorage.getItem('user');

    const toggleModal = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="home-wrapper">
            {/* Cinematic Background */}
            <div className="ambient-background">
                <div className="grid-lines"></div>
                <div className="glow-spot top-left"></div>
                <div className="glow-spot bottom-right"></div>
            </div>

            <div className="main-container">
                
                {/* --- HERO SECTION --- */}
                <section className="hero-section">
                    <div className="hero-badge">
                        <span className="pulse-dot"></span> AI-POWERED PREP
                    </div>
                    <h1 className="hero-title">
                        MASTER YOUR <br />
                        <span className="neon-text">TECH INTERVIEW</span>
                    </h1>
                    <p className="hero-desc">
                        Stop guessing. Start practicing. Experience realistic AI simulations, 
                        get instant feedback, and perfect your code before the real deal.
                    </p>
                    
                    <div className="cta-wrapper">
                        {isAuthenticated ? (
                            <Link to="/interview" className="primary-btn-link">
                                <button className="glow-button">
                                    Start Interview <FaArrowRight />
                                </button>
                            </Link>
                        ) : (
                            <button onClick={toggleModal} className="glow-button">
                                Start Interview <FaArrowRight />
                            </button>
                        )}
                        <LoginModal isOpen={isOpen} onClose={toggleModal} />
                    </div>
                </section>

                {/* --- TECH STACK STRIP (Modules) --- */}
                <section className="tech-strip">
                    <div className="strip-header">Supported Modules</div>
                    <div className="tech-grid">
                        <div className="tech-card"><FaDatabase /> <span>DBMS</span></div>
                        <div className="tech-card"><FaNetworkWired /> <span>Networks</span></div>
                        <div className="tech-card"><FaTree /> <span>DSA</span></div>
                        <div className="tech-card"><FaCode /> <span>Web Dev</span></div>
                        <div className="tech-card"><FaObjectGroup /> <span>OOPs</span></div>
                        <div className="tech-card"><FaLaptop /> <span>OS</span></div>
                    </div>
                </section>

                {/* --- BENTO GRID (Why Choose Us) --- */}
                <section className="features-section">
                    <h2 className="section-heading">Why <span className="highlight">techReady.ai</span>?</h2>
                    
                    <div className="bento-grid">
                        {/* Large Feature 1 */}
                        <div className="bento-box feature-large">
                            <div className="box-icon"><FaRobot /></div>
                            <h3>Realistic AI Simulations</h3>
                            <p>Our Gemini-powered engine mimics the pressure and depth of top-tier tech interviews at Google & Amazon.</p>
                        </div>

                        {/* Medium Feature 2 */}
                        <div className="bento-box feature-medium">
                            <div className="box-icon color-blue"><FaCheckCircle /></div>
                            <h3>Model Answers</h3>
                            <p>Don't just fail—learn. See the perfect code solution instantly.</p>
                        </div>

                        {/* Medium Feature 3 */}
                        <div className="bento-box feature-medium">
                            <div className="box-icon color-green"><FaChartLine /></div>
                            <h3>Live Scoring</h3>
                            <p>Get rated on Code Quality, Efficiency, and Communication.</p>
                        </div>

                        {/* Wide Feature 4 */}
                        <div className="bento-box feature-wide">
                            <div className="content-row">
                                <div className="text-col">
                                    <h3>Detailed Reports</h3>
                                    <p>Deep-dive analytics into your weak spots. We track your growth over time so you know exactly when you're ready.</p>
                                </div>
                                <div className="visual-col">
                                    <div className="dummy-chart"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}