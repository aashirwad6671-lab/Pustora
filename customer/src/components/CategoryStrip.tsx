'use client';

import React from 'react';

interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
}

interface CategoryGridProps {
  selectedCategory: string;
  onSelect: (id: string) => void;
}

// Pastel color palette per category
const CAT_COLORS: Record<string, { bg: string; border: string }> = {
  all:       { bg: '#EDE8FF', border: '#D5CCFF' },
  books:     { bg: '#E6F1FB', border: '#BDD9F5' },
  stationery:{ bg: '#FAEEDA', border: '#F5DBAE' },
  toys:      { bg: '#FBEAF0', border: '#F5C9D9' },
  gifts:     { bg: '#EAF3DE', border: '#C3E0A0' },
  art:       { bg: '#EEEDFE', border: '#D1CEFC' },
  more:      { bg: '#FAECE7', border: '#F5C9B8' },
};

const CATEGORIES: CategoryItem[] = [
  { id: 'all',        name: 'All Items',    emoji: '✨' },
  { id: 'books',      name: 'NCERT Books',  emoji: '📚' },
  { id: 'stationery', name: 'Stationery',   emoji: '✏️' },
  { id: 'toys',       name: 'Toys',         emoji: '🧸' },
  { id: 'gifts',      name: 'Gifts',        emoji: '🎁' },
  { id: 'art',        name: 'Art & Craft',  emoji: '🎨' },
];

export default function CategoryGrid({ selectedCategory, onSelect }: CategoryGridProps) {
  return (
    <section aria-labelledby="cat-grid-heading">
      <h2 className="section-title" id="cat-grid-heading" style={{ marginBottom: '14px' }}>
        Shop by Category
      </h2>
      <div className="cat-grid" role="list">
        {CATEGORIES.map((cat) => {
          const colors = CAT_COLORS[cat.id] || CAT_COLORS.more;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              role="listitem"
              onClick={() => onSelect(cat.id)}
              className={`cat-grid-item${isActive ? ' active' : ''}`}
              id={`cat-grid-${cat.id}`}
              aria-pressed={isActive}
              aria-label={cat.name}
            >
              <div
                className="cat-grid-icon"
                style={{
                  background: isActive ? 'var(--primary-gradient)' : colors.bg,
                  border: `1.5px solid ${isActive ? 'transparent' : colors.border}`,
                }}
              >
                <span role="img" aria-hidden="true" className="cat-grid-emoji">
                  {cat.emoji}
                </span>
              </div>
              <span className="cat-grid-label">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
