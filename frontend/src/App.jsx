import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import TransitionPage from './pages/TransitionPage.jsx';
import Home from './pages/Home.jsx';
import Interview from './pages/Interview.jsx';
import Record from './pages/Record.jsx';
import Report from './pages/Report.jsx';
import Profile from './pages/Profile.jsx';

// Components
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      {/* Header is visible on all pages except Landing Page for a clean look. 
          You can wrap it conditionally if you prefer. */}
      <Header />
      
      <Routes>
        {/* ENTRY: Animated Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* STEP 2: Choice Hub */}
        <Route path="/start" element={<TransitionPage />} />

        {/* MAIN APP */}
        <Route path="/mock-interview" element={<Home />} />
        <Route path="/interview" element={<ProtectedRoute component={Interview} />} />
        <Route path="/record" element={<ProtectedRoute component={Record} />} />
        <Route path="/report" element={<ProtectedRoute component={Report} />} />
        <Route path="/profile" element={<ProtectedRoute component={Profile} />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;