require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = 5000;
const STORIES_FILE = path.join(__dirname, 'stories.json');

app.use(cors());
app.use(express.json());

// Get all stories
app.get('/api/stories', (req, res) => {
  fs.readFile(STORIES_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read stories.' });
    try {
      const stories = JSON.parse(data);
      res.json(stories);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse stories.' });
    }
  });
});

// Submit a new story
app.post('/api/submit-story', (req, res) => {
  const newStory = req.body;
  fs.readFile(STORIES_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read stories.' });
    let stories = [];
    try {
      stories = JSON.parse(data);
    } catch (e) {}
    stories.unshift({ ...newStory, id: Date.now() });
    fs.writeFile(STORIES_FILE, JSON.stringify(stories, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to save story.' });
      res.json({ success: true, message: 'Story submitted!' });
    });
  });
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { formData } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Priority Story Boost',
              description: 'Get featured placement and increased visibility for your story',
            },
            unit_amount: 500, // $5.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/submit-story?priority=success&${new URLSearchParams(formData).toString()}`,
      cancel_url: `http://localhost:5173/submit-story?priority=cancel`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
