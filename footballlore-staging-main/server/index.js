require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = 5000;
const STORIES_FILE = path.join(__dirname, 'stories.json');
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}));
}

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

// Create Stripe checkout session for vote pack
app.post('/api/create-vote-pack-session', async (req, res) => {
  try {
    const { pack, amount } = req.body; // pack: 5, amount: 300 (in cents)
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Vote Credit Pack - ${pack} Votes`,
              description: `Purchase ${pack} vote credits to support your favorite stories`,
            },
            unit_amount: amount, // $3.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/api/vote-pack-status?user={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/stories`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating vote pack checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get vote pack status (simulate credits system)
app.get('/api/vote-pack-status', (req, res) => {
  const { user } = req.query;
  
  fs.readFile(USERS_FILE, 'utf8', (err, data) => {
    if (err) return res.json({ credits: 0 });
    
    try {
      const users = JSON.parse(data);
      const userCredits = users[user] || 0;
      res.json({ credits: userCredits });
    } catch (e) {
      res.json({ credits: 0 });
    }
  });
});

// Add vote credits after successful purchase
app.post('/api/add-vote-credits', (req, res) => {
  const { user, credits } = req.body;
  
  fs.readFile(USERS_FILE, 'utf8', (err, data) => {
    let users = {};
    if (!err) {
      try {
        users = JSON.parse(data);
      } catch (e) {}
    }
    
    users[user] = (users[user] || 0) + credits;
    
    fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update credits' });
      res.json({ success: true, credits: users[user] });
    });
  });
});

// Use vote credits to vote on a story
app.post('/api/use-vote-credit', (req, res) => {
  const { user, storyId } = req.body;
  
  // First, check if user has credits
  fs.readFile(USERS_FILE, 'utf8', (err, userData) => {
    let users = {};
    if (!err) {
      try {
        users = JSON.parse(userData);
      } catch (e) {}
    }
    
    if ((users[user] || 0) < 1) {
      return res.status(400).json({ error: 'Insufficient vote credits' });
    }
    
    // Deduct credit
    users[user] = (users[user] || 0) - 1;
    
    // Update story votes
    fs.readFile(STORIES_FILE, 'utf8', (err, storyData) => {
      if (err) return res.status(500).json({ error: 'Failed to read stories' });
      
      try {
        const stories = JSON.parse(storyData);
        const story = stories.find(s => s.id.toString() === storyId.toString());
        
        if (!story) {
          return res.status(404).json({ error: 'Story not found' });
        }
        
        // Increase community votes by 5
        story.communityVotes = (story.communityVotes || 0) + 5;
        
        // Save both files
        fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), (err) => {
          if (err) return res.status(500).json({ error: 'Failed to update credits' });
          
          fs.writeFile(STORIES_FILE, JSON.stringify(stories, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update story' });
            
            res.json({ 
              success: true, 
              remainingCredits: users[user],
              newVoteCount: story.communityVotes
            });
          });
        });
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse stories' });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
