import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/LoginModal.css';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginModal = ({ isOpen, onClose }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showcnfPassword, setShowcnfPassword] = useState(false);

  const navigate = useNavigate();

  const toggleSignup = () => {
    setShowSignup(!showSignup);
    setError('');
    // Clear inputs on toggle
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirmPassword('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('http://127.0.0.1:8000/my_app/api/signup/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      setShowSignup(false);
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch('http://127.0.0.1:8000/my_app/api/login/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('user', JSON.stringify(data));
      setError('');
      onClose();
      navigate('/interview');
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (showSignup) {
      setIsFormValid(email && username && password && confirmPassword);
    } else {
      setIsFormValid(email && password);
    }
  }, [email, username, password, confirmPassword, showSignup]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <FaTimes className="close-icon" onClick={onClose} />
        
        <h2>{showSignup ? "Create Account" : "Welcome Back"}</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form className="form" onSubmit={showSignup ? handleSignup : handleLogin}>
          
          {showSignup && (
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Enter your username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <span id="eyes" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          {showSignup && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <input 
                  type={showcnfPassword ? 'text' : 'password'} 
                  placeholder="Repeat password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
                <span id="eyes" onClick={() => setShowcnfPassword(!showcnfPassword)}>
                  {showcnfPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
          )}

          <button type="submit" disabled={!isFormValid}>
            {showSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p>
          {showSignup ? "Already have an account? " : "New to techReady? "}
          <span className="link" onClick={toggleSignup}>
            {showSignup ? "Log In" : "Create Account"}
          </span>
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginModal;