import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/Report.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSave, FaCheckCircle } from 'react-icons/fa';

const preprocessText = (text) => {
  if (!text) return <p className="text-muted">No content available.</p>;
  
  return text.split('\n\n').map((paragraph, index) => {
    if ((paragraph.startsWith('**') && paragraph.endsWith('**'))) {
      return <p key={index} style={{ color: '#fff', marginBottom: '0.5rem' }}><strong>{paragraph.slice(2, -2)}</strong></p>;
    } else {
      return <p key={index} style={{ marginBottom: '0.8rem' }}>{paragraph}</p>;
    }
  });
};

const Report = () => {
  const { state } = useLocation();
  
  // Handle both single question (old flow) and multiple (new flow)
  // If state has 'allReports', use it. If not, wrap single report in array.
  let allReports = [];
  if (state?.allReports) {
    allReports = state.allReports;
  } else if (state?.rating) {
    // Legacy support for single question mode
    allReports = [{
      question: "Interview Question", // You might need to pass question text in single mode
      rating: state.rating,
      user_answer: state.user_answer,
      feedback: state.feedback,
      strengths: state.strengths,
      model_answer: state.model_answer
    }];
  }

  const [reportSaved, setReportSaved] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user ? user.email : '';

  if (allReports.length === 0) {
    return (
      <div className="report-container" style={{ textAlign: 'center' }}>
        <h2>No Report Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>Please complete an interview first.</p>
      </div>
    );
  }

  // Calculate Average Score
  const aggregateRating = () => {
    const nums = allReports.map(r => parseFloat(r.rating) || 0);
    if (nums.length === 0) return 0;
    const sum = nums.reduce((a,b) => a + b, 0);
    return (sum / nums.length).toFixed(1);
  };

  const overallRating = parseFloat(aggregateRating());
  
  let ratingColor = '#a1a1aa';
  let ratingText = 'Average Performance';
  
  if (overallRating >= 8) { 
    ratingColor = '#22c55e'; // Green
    ratingText = 'Excellent Performance';
  } else if (overallRating >= 5) { 
    ratingColor = '#f59e0b'; // Orange
    ratingText = 'Good Performance';
  } else { 
    ratingColor = '#ef4444'; // Red
    ratingText = 'Needs Improvement';
  }

  const handleSaveReport = async () => {
    if (reportSaved) return;
    
    try {
      const reportData = {
        email: userEmail,
        reports: allReports
      };
      
      const res = await fetch('http://127.0.0.1:8000/my_app/api/save_report/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!res.ok) throw new Error('Failed to save');
      
      toast.success("Report saved successfully!");
      setReportSaved(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save report");
    }
  };

  return (
    <div className="report-container">
      
      {/* Header Section */}
      <div className="report-header">
        <h2>Interview Report</h2>
        <button 
          className={`save-btn ${reportSaved ? 'saved' : ''}`} 
          onClick={handleSaveReport}
          disabled={reportSaved}
        >
          {reportSaved ? <><FaCheckCircle /> Saved</> : <><FaSave /> Save Report</>}
        </button>
      </div>

      {/* Summary Card */}
      <div className="score-summary" style={{ borderColor: ratingColor, background: `${ratingColor}10` }}>
        <div className="score-badge" style={{ color: ratingColor }}>
          {overallRating}<span>/10</span>
        </div>
        <div>
          <div className="score-text" style={{ color: ratingColor }}>{ratingText}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Based on {allReports.length} question(s)
          </div>
        </div>
      </div>

      {/* Detailed Questions List */}
      <div className="questions-list">
        {allReports.map((r, i) => (
          <div key={i} className="question-report">
            
            <div className="q-header">
              <div>
                <div className="q-title">Question {i + 1}</div>
                <div className="q-text">{r.question || "Question text unavailable"}</div>
              </div>
              <div className="q-rating" style={{ 
                color: parseFloat(r.rating) >= 7 ? 'var(--success-color)' : 'var(--warning-color)',
                borderColor: parseFloat(r.rating) >= 7 ? 'var(--success-color)' : 'var(--warning-color)'
              }}>
                {r.rating}
              </div>
            </div>

            <div className="feedback-grid">
              <div className="feedback-item">
                <h4>AI Feedback</h4>
                {preprocessText(r.feedback)}
              </div>
              
              <div className="feedback-item">
                <h4>Model Answer</h4>
                {preprocessText(r.model_answer)}
              </div>

              <div className="feedback-item">
                <h4>Strengths</h4>
                {preprocessText(r.strengths)}
              </div>

              <div className="feedback-item">
                <h4>Your Transcript</h4>
                <p style={{ fontStyle: 'italic', opacity: 0.8 }}>"{r.user_answer}"</p>
              </div>
            </div>

          </div>
        ))}
      </div>

      <ToastContainer theme="dark" />
    </div>
  );
};

export default Report;