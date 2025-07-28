import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import './styles/SubmitStory.css';
import { Crown, Star } from "lucide-react";

// Auto-submit story as priority after Stripe payment success
function usePrioritySubmit() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('priority') === 'success') {
      // Extract form data from URL
      const name = params.get('name') || '';
      const email = params.get('email') || '';
      const title = params.get('title') || '';
      const story = params.get('story') || '';
      if (name && email && title && story) {
        // Only submit if not already submitted (avoid double submit)
        fetch('http://localhost:5000/api/submit-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, title, story, priority: true }),
        })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
              window.location.reload(); // Reload to clear form and show success
            }
          });
      }
    }
  }, []);
}


const SubmitStory = () => {
  usePrioritySubmit();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    story: '',
    priority: false,
  });

  const [priority, setPriority] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [priorityChecked, setPriorityChecked] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  const handlePriorityChange = (e) => {
    setPriorityChecked(e.target.checked);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setPriority(checked);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!formData.name || !formData.email || !formData.title || !formData.story) {
      setError('Please fill out all fields.');
      return;
    }
    if (!nameRegex.test(formData.name)) {
      setError('Name can only contain letters and spaces.');
      return;
    }

    if (priorityChecked) {
      setStripeLoading(true);
      
      try {
        // Create checkout session on server
        const response = await fetch('http://localhost:5000/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ formData }),
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
            setError('Payment failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('Payment error:', error);
        setError('Payment system error. Please try again later.');
      }
      
      setStripeLoading(false);
      return;
    }

    // If not priority, submit story as normal
    try {
      const res = await fetch('http://localhost:5000/api/submit-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, priority: false }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setError('');
        setFormData({ name: '', email: '', title: '', story: '', priority: false });
        setPriorityChecked(false);
      } else {
        setError('Something went wrong.');
      }
    } catch (err) {
      setError('Network error.');
    }
  };

  return (
    <div className="form-container">
      <h2>Submit Your Story</h2>


      <form onSubmit={handleSubmit} noValidate>
        <label>Name</label>
        <input name="name" type="text" value={formData.name} onChange={handleChange} required />

        <label>Email</label>
        <input name="email" type="email" value={formData.email} onChange={handleChange} required />

        <label>Story Title</label>
        <input name="title" type="text" value={formData.title} onChange={handleChange} required />

        <label>Your Story</label>
        <textarea name="story" value={formData.story} onChange={handleChange} required />

        {/* Priority Checkbox Section */}
        <div className="mt-6 mb-6 p-4 border-2 border-football-yellow rounded-lg bg-yellow-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Star className="h-6 w-6 text-football-yellow" />
            <div>
              <h3 className="font-semibold text-charcoal">Make Priority Story ($5)</h3>
              <p className="text-sm text-gray-600">Get featured placement and increased visibility</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="priority"
              checked={priorityChecked}
              onChange={handlePriorityChange}
              disabled={stripeLoading}
            />
            <label htmlFor="priority" className="font-semibold text-charcoal">Pay $5</label>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={stripeLoading}>Publish Story</button>
      </form>

      {success && (
        <div className="success-message">✅ Thank you for your submission!</div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default SubmitStory;
