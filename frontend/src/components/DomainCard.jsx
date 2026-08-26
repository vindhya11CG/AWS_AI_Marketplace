import React from 'react';
import '../styles/DomainCard.css';

/**
 * DomainCard component - Displays domain as a marketplace product card
 * @component
 * @param {Object} domain - Domain data
 * @param {number} domain.id - Unique domain identifier
 * @param {string} domain.title - Domain title
 * @param {number} domain.workflowCount - Total workflow count for the domain
 * @param {string} domain.description - Domain description
 * @param {string[]} domain.recentWorkflows - List of recent workflow names
 * @param {string} [domain.logo] - Logo URL or emoji
 * @param {number} [domain.rating] - Star rating (0-5)
 * @param {number} [domain.ratingCount] - Number of ratings
 * @param {string} [domain.seller] - Seller/vendor name
 * @param {string} [domain.badge] - Deployment or feature badge text
 * @returns {React.ReactElement} - Rendered domain card
 */
export default function DomainCard({ domain }) {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="star star-full">★</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="star star-half">★</span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="star star-empty">★</span>
      );
    }

    return stars;
  };

  return (
    <article className="product-card">
      {/* Header with Logo and Top Badge */}
      <div className="card-header">
        <div className="card-logo">{domain.logo || '📦'}</div>
        {domain.id && (
          <span className="top-badge">Top {domain.id}</span>
        )}
      </div>

      {/* Seller Info */}
      <p className="seller-info">Sold by: <strong>{domain.seller || 'Provider'}</strong></p>

      {/* Product Title */}
      <h3 className="product-title">{domain.title}</h3>

      {/* Rating */}
      <div className="rating-section">
        <div className="stars">
          {renderStars(domain.rating || 0)}
        </div>
        <span className="rating-count">({domain.ratingCount || 0})</span>
      </div>

      {/* Feature Badge */}
      {domain.badge && (
        <span className="feature-badge">{domain.badge}</span>
      )}

      {/* Description */}
      <p className="product-description">{domain.description}</p>

      {/* Get Started Button */}
      <button className="get-started-btn" aria-label={`Get started with ${domain.title}`}>
        Get Started
        <span className="dropdown-arrow">▼</span>
      </button>
    </article>
  );
}
