import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import './styles/StoryCard.css';

export default function StoryCard({ id, title, snippet, image, mostViewed, priority }) {
  const navigate = useNavigate();

  return (
    <div className="story-card">
      {mostViewed && <div className="most-viewed-badge">Most Viewed</div>}
      {priority && (
        <div className="priority-badge" title="Priority Story">
          <Star className="h-5 w-5 text-yellow-400" fill="#facc15" />
        </div>
      )}
      {/* <img src={image} alt={title} /> */}
      <div className="story-content">
        <h3>{title}</h3>
        <p>{snippet}</p>
        <div
          className="read-more"
          onClick={() => navigate(`/stories/${id}`)}
          tabIndex={0}
          role="button"
          aria-label={`Read more about ${title}`}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate(`/stories/${id}`);
            }
          }}
        >
          Read More →
        </div>
      </div>
    </div>
  );
}