// HomePage.jsx
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "../../styles/Auth_style/HomePage.css";
import logocmc from "../../assets/logocmc.png";
import imeet from "../../assets/c-meet.jpg";
import team_management from "../../assets/team_management.png";
import auto from "../../assets/automation.png";
import report from "../../assets/report.png";
import async from "../../assets/async.png";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import axios from "axios";
import EmailForm from "./EmailForm";
const HomePage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <a href="/homepage" className="navbar-logo">
            <img src={logocmc} className="logo-img-homepage"></img>
          </a>
          <ul className="navbar-menu">
            <li>
              <a href="#">Home Page</a>
            </li>
            <li>
              <a href="#">About Us</a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="homepage-title">
          <div className="homepage-title-h2">
            <h3>&gt;&gt; HOMEPAGE</h3>
          </div>
        </div>
        <div className="hero-grid">
          <div className="hero-content">
            <h1>All-in-One Business Management Platform</h1>
            <p>
              Save time, boost productivity, and grow smarter.<br></br>
              Sign up today and unlock smart scheduling, chat, and video
              calls—all in one place.
            </p>
            <EmailForm />
          </div>

          <div className="hero-image">
            <div className="image-placeholder">
              <img src={imeet} className="imeet" alt="imeet"></img>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="section-container">
          <h2 className="section-title">Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">✓</div>
              <h3>Save Time</h3>
              <p>Automate workflows and minimize manual tasks</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚡</div>
              <h3>Boost Productivity</h3>
              <p>Smart tools help you work faster and more efficiently</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🛡️</div>
              <h3>Secure & Reliable</h3>
              <p>
                Advanced security system ensures your data is fully protected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-image">
                  <img src={team_management} className="team_management"></img>
                </div>
                <div className="text-key-feature">
                  <h3>Team Management</h3>
                  <p>Easily manage and assign tasks across your team</p>
                </div>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-image">
                  <img src={auto} className="automation"></img>
                </div>
                <div className="text-key-feature">
                  <h3>Automation</h3>
                  <p>
                    Automate repetitive tasks so you can focus on what matters
                    most
                  </p>
                </div>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-image">
                  <img src={report} className="report"></img>
                </div>
                <div className="text-key-feature">
                  <h3>Detailed Reports</h3>
                  <p>
                    Analyze data with clear, visual reports to make accurate
                    decisions
                  </p>
                </div>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-content">
                <div className="feature-image">
                  <img src={async} className="async"></img>
                </div>
                <div className="text-key-feature">
                  <h3>Cross-Platform Sync</h3>
                  <p>Access anytime, anywhere, on any device</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="section-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <a href="/homepage" className="navbar-logo">
                  <img src={logocmc} className="logo-img-homepage"></img>
                </a>
              </div>
              <p className="footer-description">
                Modern management solutions help your business grow sustainably
                and optimize workflows.
              </p>
              <div className="footer-contact">
                <p>
                  📍 3th, 80 Thanh Cong Buiding, Dich Vong Hau, Cau Giay, Ha Noi
                </p>
                <p>📞 +84 123 456 789</p>
                <p>✉️ admin@gmail.com</p>
              </div>
              <div className="footer-social">
                <a>
                  <FaFacebook size={20} />
                </a>
                <a>
                  <FaInstagram size={20} />
                </a>
                <a>
                  <FaTwitter size={20} />
                </a>
                <a>
                  <FaYoutube size={20} />
                </a>
              </div>
            </div>

            <div className="footer-column">
              <h4>Products</h4>
              <ul className="footer-links">
                <li>
                  <a>Features</a>
                </li>
                <li>
                  <a>Pricing</a>
                </li>
                <li>
                  <a>Guides</a>
                </li>
                <li>
                  <a>API</a>
                </li>
                <li>
                  <a>Documentation</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <ul className="footer-links">
                <li>
                  <a>About Us</a>
                </li>
                <li>
                  <a>Blog</a>
                </li>
                <li>
                  <a>Careers</a>
                </li>
                <li>
                  <a>Partners</a>
                  </li>
                <li>
                  <a>News</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Support</h4>
              <ul className="footer-links">
                <li>
                  <a>Help Center</a>
                </li>
                <li>
                  <a>Contact</a>
                </li>
                <li>
                  <a>FAQs</a>
                </li>
                <li>
                  <a>User Guide</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Legal</h4>
              <ul className="footer-links">
                <li>
                  <a>Terms of Use</a>
                </li>
                <li>
                  <a>Privacy Policy</a>
                </li>
                <li>
                  <a>Cookie Policy</a>
                </li>
                <li>
                  <a>Copyright</a>
                </li>
                <li>
                  <a>Licenses</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; 2024 Logo. All rights reserved. Made with ❤️ in Vietnam
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
