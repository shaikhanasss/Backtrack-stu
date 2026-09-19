import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared site header/navigation.
 * `links` is an array of { label, to } so the nav can differ
 * between the public landing page and the logged-in dashboard.
 */
export default function Header({ links, onLogout }) {
  return (
    <header>
      <div className="logo">BackTrack</div>
      <nav>
        {links.map((link) => (
          <Link key={link.label} to={link.to}>
            {link.label}
          </Link>
        ))}
        {onLogout && (
          <a
            href="#logout"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
          >
            Logout
          </a>
        )}
      </nav>
    </header>
  );
}
