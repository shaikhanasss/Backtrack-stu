import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import Card from '../components/Card.jsx';
import ProgressSection from '../components/ProgressSection.jsx';
import NotesSection from '../components/NotesSection.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardCards } from '../data/cardsData.js';

const navLinks = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Notes', to: '/dashboard' },
  { label: 'PYQs', to: '/dashboard' },
  { label: 'Calendar', to: '/dashboard' },
  { label: 'Profile', to: '/dashboard' },
];

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="page dashboard-page">
      <Header links={navLinks} onLogout={handleLogout} />

      <section className="hero">
        <h1>👋 Welcome to BackTrack</h1>
        <p>Learn Smart • Score Better</p>
      </section>

      <section className="cards">
        {dashboardCards.map((card) => (
          <Card
            key={card.id}
            icon={card.icon}
            title={card.title}
            description={card.description}
          />
        ))}
      </section>

      <ProgressSection percent={70} />

      <NotesSection />

      <Footer />
    </div>
  );
}
