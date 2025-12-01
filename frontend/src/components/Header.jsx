import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../css/Header.css';
import '../css/Index.css';
import LoginModal from '../pages/LoginModal.jsx';

import 'react-toastify/dist/ReactToastify.css';

export default function Header() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isAuthenticated = !!localStorage.getItem('user');
    const navigate = useNavigate();

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div>
            <div className="header_container">
                <nav>
                    <Link 
                        to={'/'} 
                        style={{ 
                            textDecoration: 'none', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px' 
                        }}
                    >
                        {/* Added Logo Image Here */}
                        <img 
                            src="/logo.svg" 
                            alt="techReady Logo" 
                            style={{ 
                                height: '35px', 
                                width: '35px',
                                filter: 'drop-shadow(0 0 5px rgba(217, 70, 239, 0.5))' 
                            }} 
                        />
                        
                        {/* Adjusted H1 to align with logo */}
                        <h1 style={{ margin: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                            techReady.<span id='ai'>ai</span>
                        </h1>
                    </Link>

                    <ul>
                        {isAuthenticated ? (
                            <>
                                <li>
                                    <Link to={"/profile"} style={{ textDecoration: 'none', color: 'white' }}>
                                        Profile
                                    </Link>
                                </li>
                                <li onClick={handleLogout} style={{ cursor: 'pointer' }}>
                                    Logout
                                </li>
                            </>
                        ) : (
                            <li onClick={toggleModal} style={{ cursor: 'pointer' }}>
                                <FaUser id='icon' /> Login
                            </li>
                        )}
                    </ul>
                </nav>
            </div>

            <LoginModal isOpen={isModalOpen} onClose={toggleModal} />
        </div>
    );
}