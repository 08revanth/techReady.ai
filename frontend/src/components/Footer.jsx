import React from 'react';
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin } from 'react-icons/fa';
import '../css/Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                {/* Logo Section */}
                <h3>techReady.<span className="purple">ai</span></h3>
                
                <div className="footer-content">
                    {/* Contact Info */}
                    <div className="contact-info">
                        <p>Email: support@techready.ai</p>
                        <p>Phone: +91 7760092363</p>
                        <p>Address: techReady.ai Pvt.Ltd, National Institute of Engineering, Mysore, India</p>
                    </div>

                    {/* Socials */}
                    <div className="socials">
                        <div className="social_links">
                            <p>Connect</p>
                            <a href="#" className="twitter"><FaTwitter size={24} /></a>
                            <a href="#" className="instagram"><FaInstagram size={24} /></a>
                            <a href="#" className="facebook"><FaFacebook size={24} /></a>
                            <a href="#" className="linkedin"><FaLinkedin size={24} /></a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="copyright">
                    <p>&copy; {new Date().getFullYear()} techReady.ai. All rights reserved.</p>
                    <div className="terms-policies">
                        <a href="#">Terms</a>
                        <a href="#">Privacy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;