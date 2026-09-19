import React from 'react';
import { Link } from 'react-router-dom';

export default function Card({ icon, title, description, to, actionLabel }) {
  return (
    <div className="card">
      <div className="card-icon" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {to && actionLabel && (
        <Link className="card-link" to={to}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
