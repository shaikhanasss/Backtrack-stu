import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import Card from '../components/Card.jsx';
import { landingCards } from '../data/cardsData.js';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Notes', to: '/login' },
  { label: 'PYQs', to: '/login' },
  { label: 'Quiz', to: '/login' },
  { label: 'Calendar', to: '/login' },
  { label: 'Login', to: '/login' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  // Search box state (replaces the old uncontrolled <input>)
  const [search, setSearch] = useState('');

  const handleExplore = () => {
    // Original inline JS showed a welcome alert on click.
    // Kept as a light-weight welcome message, then send the user
    // toward sign up so "Explore" leads somewhere useful.
    window.alert('Welcome To BackTrack 🚀');
    navigate('/signup');
  };

  return (
    <div className="page landing-page">
      <Header links={navLinks} />

      <section className="hero">
        <h1>Learn Smart, Score Better</h1>
        <p>SSC • HSC • PYQs • Quiz • AI • Games</p>
        <div>
          <input
            type="text"
            placeholder="Search notes, PYQs, quizzes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" onClick={handleExplore}>
          Explore Now
        </button>
      </section>

      <section className="cards">
        {landingCards.map((card) => (
          <Card
            key={card.id}
            icon={card.icon}
            title={card.title}
            description={card.description}
          />
        ))}
      </section>

      <Footer />
    </div>
  );
}
