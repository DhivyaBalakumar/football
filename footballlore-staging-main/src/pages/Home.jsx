import { Link } from "react-router-dom"
import { Trophy, Users, Star, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react";
import StoryCard from "../components/StoryCard"
import RaffleWidget from "../components/RaffleWidget"
import StripeCheckoutButton from "../components/StripeCheckoutButton"
import './styles/Stories.css'

const Home = () => {
  
  const [stories, setStories] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5000/api/stories")
      .then((res) => res.json())
      .then((data) => setStories(data))
      .catch(() => setStories([]));
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-headline font-bold text-charcoal mb-6">
          Every Match Has a <span className="text-football-green">Story</span>
        </h1>
        <p className="text-xl font-body text-gray-600 mb-8 max-w-3xl mx-auto">
          Share your match-day memories, locker-room legends, and personal football moments with a community that
          understands the beautiful game.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/submit-story" className="btn-primary">
            Share Your Story
          </Link>
          <Link to="/stories" className="btn-ghost">
            Browse Stories
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        <div className="text-center">
          <div className="bg-football-green text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-headline font-bold text-charcoal mb-2">1,247</h3>
          <p className="font-body text-gray-600">Stories Shared</p>
        </div>
        <div className="text-center">
          <div className="bg-football-green text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-headline font-bold text-charcoal mb-2">8,932</h3>
          <p className="font-body text-gray-600">Community Members</p>
        </div>
        <div className="text-center">
          <div className="bg-football-green text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-headline font-bold text-charcoal mb-2">45,678</h3>
          <p className="font-body text-gray-600">Votes Cast</p>
        </div>
        <div className="text-center">
          <div className="bg-football-green text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-headline font-bold text-charcoal mb-2">156</h3>
          <p className="font-body text-gray-600">Stories This Week</p>
        </div>
      </section>

      {/* Raffle Widget Section */}
      <RaffleWidget />

      {/* Stripe Checkout Button Section */}
      <StripeCheckoutButton />

      {/* Featured Stories */}
      <section className="story-grid">
        {stories.length === 0 ? (
          <p>No stories yet. Be the first to submit one!</p>
        ) : (
          stories.map((story, i) => (
            <StoryCard
              key={story.id}
              id={story.id}
              title={story.title}
              snippet={story.snippet || story.story?.slice(0, 60) + "..."}
              image={story.image || "/download.jpeg"}
              mostViewed={i === 0}
              priority={story.priority}
            />
          ))
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-football-green text-white rounded-2xl p-12 text-center">
        <h2 className="text-3xl font-headline font-bold mb-4">Ready to Share Your Football Story?</h2>
        <p className="text-xl font-body mb-8 opacity-90">
          Join thousands of fans sharing their most memorable football moments
        </p>
        <Link
          to="/submit-story"
          className="bg-white text-football-green px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Start Writing Now
        </Link>
      </section>
    </div>
  )
}

export default Home
