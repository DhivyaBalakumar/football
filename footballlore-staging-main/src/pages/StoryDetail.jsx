import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import './styles/StoryDetail.css';
import VotingWidget from '../components/VotingWidget';
import BoostButton from '../components/BoostButton'

export default function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [buyingVotes, setBuyingVotes] = useState(false);
  const [usingCredit, setUsingCredit] = useState(false);

  useEffect(() => {
    // Fetch stories from backend
    fetch('http://localhost:5000/api/stories')
      .then(res => res.json())
      .then(stories => {
        const foundStory = stories.find(s => s.id.toString() === id);
        setStory(foundStory);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stories:', err);
        setLoading(false);
      });

    // Fetch user's vote credits
    fetchUserCredits();
  }, [id]);

  const fetchUserCredits = () => {
    fetch('http://localhost:5000/api/vote-pack-status?user=demo@email.com')
      .then(res => res.json())
      .then(data => setCredits(data.credits))
      .catch(err => console.error('Error fetching credits:', err));
  };

  const handleBuyVotes = async () => {
    setBuyingVotes(true);
    
    try {
      // Create checkout session for vote pack
      const response = await fetch('http://localhost:5000/api/create-vote-pack-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pack: 5, amount: 300 }), // 5 votes for $3
      });
      
      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await loadStripe('pk_test_51RpNj4Gb0PHpWPxsJKDT78Uf2rMtlMXmjO5VpNj4NCjT305f4UrDjAoWaPEAhfjEyn0viPgkr19Fys1BGFxAJbfY00VYND6Pqa');
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: sessionId,
        });
        
        if (error) {
          console.error('Stripe error:', error);
          alert('Payment failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Vote pack purchase error:', error);
      alert('Failed to purchase vote pack. Please try again.');
    }
    
    setBuyingVotes(false);
  };

  const handleUseVoteCredit = async () => {
    if (credits < 1) {
      alert('You need to purchase vote credits first!');
      return;
    }

    setUsingCredit(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/use-vote-credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user: 'demo@email.com', 
          storyId: story.id 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setCredits(result.remainingCredits);
        setStory(prev => ({
          ...prev,
          communityVotes: result.newVoteCount
        }));
        alert(`Success! Added 5 votes to this story. You have ${result.remainingCredits} credits remaining.`);
      } else {
        alert(result.error || 'Failed to use vote credit.');
      }
    } catch (error) {
      console.error('Vote credit error:', error);
      alert('Failed to use vote credit. Please try again.');
    }
    
    setUsingCredit(false);
  };

  if (loading) return <p>Loading...</p>;
  if (!story) return <p>Story not found.</p>;

  return (
    <main className='story-details-grid'>
      <div className="story-detail container">
        {story.isPriority && <span className="priority-star">⭐ Priority Story</span>}
        <h2>{story.title}</h2>
        {/* <img src={story.image} alt={story.title} /> */}
        <p>{story.story || story.content}</p>
        
        {/* Vote Pack Purchase Section */}
        <div className="vote-pack-section">
          <div className="vote-credits">
            <span className="credits-display">Vote Credits: {credits}</span>
          </div>
          <div className="vote-buttons">
            <button 
              onClick={handleBuyVotes}
              disabled={buyingVotes}
              className="buy-votes-button"
            >
              {buyingVotes ? 'Processing...' : 'Buy 5 Votes ($3)'}
            </button>
            <button 
              onClick={handleUseVoteCredit}
              disabled={usingCredit || credits < 1}
              className="use-credit-button"
            >
              {usingCredit ? 'Adding Votes...' : 'Use 1 Credit (+5 Votes)'}
            </button>
          </div>
          <p className="vote-info">Current Story Votes: {story.communityVotes || 0}</p>
        </div>
        
        <button className="back-button" onClick={() => navigate('/stories')}>
          ← Back to Stories
        </button>
      </div>
      <div className='votes-section'>
        <div className="community-votes">
          <VotingWidget storyId={story.id} userEmail={'p@gmail.com'}/>
        </div>
        <div className="boost-button">
          <BoostButton storyId={story.id} />
        </div>
      </div>
    </main>
  );
}