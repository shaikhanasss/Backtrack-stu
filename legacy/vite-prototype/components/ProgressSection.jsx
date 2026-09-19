import React from 'react';
import { progressStats } from '../data/cardsData.js';

export default function ProgressSection({ percent = 70 }) {
  return (
    <section className="progress">
      <div className="progress-box">
        <h2>📊 Student Progress</h2>
        <p>Daily Goal</p>

        <div className="bar">
          <div className="fill" style={{ width: `${percent}%` }} />
        </div>
        <p>{percent}% Completed</p>

        <div className="stats">
          {progressStats.map((stat) => (
            <div className="stat" key={stat.id}>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
