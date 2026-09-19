import React from 'react';
import { notesCards } from '../data/cardsData.js';

export default function NotesSection() {
  return (
    <section className="notes-section">
      {notesCards.map((note) => (
        <div className="card" key={note.id}>
          <div className="card-icon" aria-hidden="true">
            {note.icon}
          </div>
          <h2>{note.title}</h2>
          <p>{note.subtitle}</p>
          <button type="button">Open</button>
        </div>
      ))}
    </section>
  );
}
