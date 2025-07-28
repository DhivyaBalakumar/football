import React, { useState, useEffect } from 'react';
import './styles/SubmitStory.css';
import { Star } from "lucide-react";
import { useLocation } from 'react-router-dom';

const SubmitStory = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    story: '',
  });

  const [priority, setPriority] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [priorityActive, setPriorityActive] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('priority') === 'success') {
      setPriorityActive(true);
    }
  }, [location.search]);

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

    setError('');

    if (priority) {
      try {
        const res = await fetch('/api/create-priority-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storyId: formData.title.toLowerCase().replace(/\s+/g, '-'),
            amount: 500,
          }),
        });

        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
        } else {
          setError('Could not redirect to Stripe.');
        }
        return;
      } catch (err) {
        setError('Priority session failed.');
        return;
      }
    }

    // If not priority, proceed to regular submission
    try {
      const res = await fetch('/api/submit-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', title: '', story: '' });
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

      {priorityActive && <p className="success-message">✅ Priority Active!</p>}
      {success && <p className="success-message">✅ Story Submitted!</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <label>Name</label>
        <input name="name" type="text" value={formData.name} onChange={handleChange} required />

        <label>Email</label>
        <input name="email" type="email" value={formData.email} onChange={handleChange} required />

        <label>Story Title</label>
        <input name="title" type="text" value={formData.title} onChange={handleChange} required />

        <label>Your Story</label>
        <textarea name="story" value={formData.story} onChange={handleChange} required />

        {/* ✅ Priority Story */}
        <div className="priority-option">
          <input
            type="checkbox"
            id="priority"
            name="priority"
            checked={priority}
            onChange={handleChange}
          />
          <label htmlFor="priority">
            <Star className="inline mr-2 text-yellow-500" />
            Make Priority ($5)
          </label>
        </div>

        <button type="submit" className="btn-primary">Publish Story</button>
      </form>
    </div>
  );
};

export default SubmitStory;
