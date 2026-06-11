import React from 'react';
import { navItems } from '../data/sampleData.js';

// The bottom nav now switches between local app sections without a router.
// This keeps Milestone 2 simple and fully offline.
export function BottomNav({ activeItem = 'home', onSelect }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map((item) => (
        <button
          aria-current={item.id === activeItem ? 'page' : undefined}
          className={item.id === activeItem ? 'active' : ''}
          key={item.id}
          onClick={() => onSelect(item.id)}
          type="button"
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
