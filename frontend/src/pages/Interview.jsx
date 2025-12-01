import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaDatabase, 
  FaServer, 
  FaNetworkWired, 
  FaCode, 
  FaGlobe, 
  FaCube, 
  FaArrowRight
} from 'react-icons/fa';
import '../css/Interview.css';

const Interview = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleTakeInterview = (cardName) => {
    // This logs to console so you can verify the click is happening
    console.log("Button Clicked. Navigating to:", cardName); 
    navigate('/record', { state: { cardName: cardName } });
  };

  const modules = [
    {
      id: 'dbms',
      title: "Database Management",
      icon: <FaDatabase />,
      color: "purple",
      desc: "Database Architecture, Design, Normalization, Transactions, Deadlocks, Indexes.",
      tags: ["SQL", "ACID", "Indexing", "Normalization"]
    },
    {
      id: 'os',
      title: "Operating Systems",
      icon: <FaServer />, 
      color: "green",
      desc: "Process Management, Memory, File Systems, Networking, Deadlocks.",
      tags: ["Kernel", "Threads", "Scheduling", "Paging"]
    },
    {
      id: 'cn',
      title: "Computer Networks",
      icon: <FaNetworkWired />,
      color: "blue",
      desc: "Network Models, Transmission, Routing, Security, Protocols.",
      tags: ["TCP/IP", "OSI", "HTTP", "Routing"]
    },
    {
      id: 'dsa',
      title: "Data Structures & Algo",
      icon: <FaCode />,
      color: "pink",
      desc: "Arrays, Linked Lists, Trees, Graphs, Sorting, Searching, DP, Complexity.",
      tags: ["Algorithms", "Big-O", "Graphs", "Trees"]
    },
    {
      id: 'web',
      title: "Web Development",
      icon: <FaGlobe />,
      color: "cyan",
      desc: "HTML/CSS, JS (ES6+), React/Angular, Node.js, Databases, Web Security.",
      tags: ["Frontend", "Backend", "REST API", "React"]
    },
    {
      id: 'oops',
      title: "OOP Design",
      icon: <FaCube />,
      color: "orange",
      desc: "Classes, Objects, Inheritance, Polymorphism, Encapsulation, Patterns.",
      tags: ["SOLID", "Inheritance", "Polymorphism", "Classes"]
    }
  ];

  return (
    <div className="interview-wrapper">
      {/* Background Elements - Now Optimized with Gradients & Pointer Events None */}
      <div className="bg-glow top-right"></div>
      <div className="bg-glow bottom-left"></div>
      <div className="grid-overlay"></div>

      <div className="interview-container">
        <header className="page-header">
          <div className="header-badge">SKILL ASSESSMENT</div>
          <h1>Select Your <span className="highlight">Arena</span></h1>
          <p>Choose a technical domain to begin your AI-powered mock interview.</p>
        </header>

        <div className="modules-grid">
          {modules.map((module, index) => (
            <div key={index} className={`module-card ${module.color}-theme`}>
              <div className="card-bg-gradient"></div>
              
              <div className="card-header">
                <div className="icon-box">
                  {module.icon}
                </div>
                <h2>{module.title}</h2>
              </div>
              
              <div className="card-body">
                <p className="description">{module.desc}</p>
                <div className="tags-cloud">
                  {module.tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="card-footer">
                <button 
                  className="start-btn" 
                  onClick={() => handleTakeInterview(module.id)}
                >
                  Start Interview <FaArrowRight className="btn-icon"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Interview;