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

// Pastel color palette per grocery category
const CAT_COLORS: Record<string, { bg: string; border: string }> = {
  all:                    { bg: '#EBF7EE', border: '#C2E8C9' },
  'atta-rice-dal':        { bg: '#FEF8E7', border: '#FCE6B2' },
  'oil-ghee-masala':      { bg: '#FFF4E5', border: '#FFDDB3' },
  'dairy-bread-eggs':     { bg: '#EBF4FF', border: '#BFDBFE' },
  'instant-frozen':       { bg: '#FFF1F2', border: '#FECDD3' },
  'chocolates-sweets':    { bg: '#FDF2F8', border: '#FBCFE8' },
  'bakery-biscuits':      { bg: '#FFF7ED', border: '#FED7AA' },
  'drinks-juices':        { bg: '#F0FDF4', border: '#BBF7D0' },
  'chips-namkeen':        { bg: '#FEFCE8', border: '#FEF08A' },
  'cleaning-essentials':  { bg: '#F0FDFA', border: '#99F6E4' },
  'tea-coffee':           { bg: '#FAF5FF', border: '#E9D5FF' },
  more:                   { bg: '#F3F4F6', border: '#E5E7EB' },
};

const CATEGORIES: CategoryItem[] = [
  { id: 'all',                   name: 'All Items',              emoji: '🛒' },
  { id: 'atta-rice-dal',         name: 'Atta, Rice & Dal',       emoji: '🌾' },
  { id: 'oil-ghee-masala',       name: 'Oil, Ghee & Masala',     emoji: '🫒' },
  { id: 'dairy-bread-eggs',      name: 'Dairy, Bread & Eggs',    emoji: '🥛' },
  { id: 'instant-frozen',        name: 'Instant & Frozen',       emoji: '🍜' },
  { id: 'chocolates-sweets',     name: 'Sweets & Chocolates',    emoji: '🍫' },
  { id: 'bakery-biscuits',       name: 'Bakery & Biscuits',      emoji: '🍪' },
  { id: 'drinks-juices',         name: 'Drinks & Juices',        emoji: '🥤' },
  { id: 'chips-namkeen',         name: 'Chips & Namkeen',        emoji: '🥨' },
  { id: 'cleaning-essentials',   name: 'Cleaning Essentials',    emoji: '🧼' },
  { id: 'tea-coffee',            name: 'Tea, Coffee & More',     emoji: '☕' },
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
