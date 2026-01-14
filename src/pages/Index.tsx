import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Globe, Users, Star, Shield, Sparkles, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { mockSwaps, mockUsers, skillCategories } from "@/data/mockData";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Matching",
      description: "Our smart algorithm finds perfect skill matches based on your interests and learning goals."
    },
    {
      icon: Globe,
      title: "Global Community",
      description: "Connect with learners from 150+ countries and explore diverse cultural traditions."
    },
    {
      icon: Shield,
      title: "Safe & Verified",
      description: "All members are verified with reviews and ratings to ensure quality exchanges."
    },
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description: "Built-in messaging and video calls make scheduling and learning seamless."
    }
  ];

  const stats = [
    { value: "50K+", label: "Active Members" },
    { value: "150+", label: "Countries" },
    { value: "100K+", label: "Skills Exchanged" },
    { value: "4.9", label: "Avg Rating" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNDMjc0NTQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-terracotta/10 text-terracotta border-0 mb-6 px-4 py-1">
              ✨ Join 50,000+ skill exchangers worldwide
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Exchange Skills,{" "}
              <span className="text-gradient">Share Cultures</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with people worldwide to teach what you know and learn what you love. 
              No money needed—just your passion and curiosity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => {
                  if (isLoggedIn) {
                    navigate("/dashboard");
                  } else {
                    navigate("/signup");
                  }
                }}
              >
                Start Swapping Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-terracotta">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              How CultureSwap Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start your skill exchange journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "List Your Skills",
                description: "Share what you can teach and what you want to learn. Our AI finds the best matches."
              },
              {
                step: "2",
                title: "Connect & Chat",
                description: "Message potential partners, discuss goals, and schedule your exchange sessions."
              },
              {
                step: "3",
                title: "Learn & Grow",
                description: "Exchange skills through video calls or in-person meetings. Earn badges as you progress!"
              }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-card rounded-2xl p-8 border border-border hover-lift h-full">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-terracotta to-teal flex items-center justify-center text-white font-bold text-xl mb-6">
                    {item.step}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Explore Skill Categories
            </h2>
            <p className="text-muted-foreground">
              Discover thousands of skills across diverse categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {skillCategories.map((category) => (
              <Link
                key={category.id}
                to={`/discover?category=${category.id}`}
                className="bg-card rounded-xl p-6 border border-border hover:border-terracotta/50 hover:shadow-warm transition-all group"
              >
                <span className="text-3xl mb-3 block">{category.icon}</span>
                <h3 className="font-semibold mb-1 group-hover:text-terracotta transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground">{category.count} skills</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Swaps */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Featured Swaps
              </h2>
              <p className="text-muted-foreground">
                Popular skill exchanges happening now
              </p>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link to="/discover">View All</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockSwaps.slice(0, 3).map((swap) => (
              <Card key={swap.id} className="hover-lift overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={swap.user.avatar}
                      alt={swap.user.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{swap.user.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {swap.user.location}, {swap.user.country}
                      </p>
                    </div>
                    {swap.matchScore && (
                      <Badge className="bg-teal/10 text-teal border-0">
                        {swap.matchScore}% match
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-semibold mb-2">{swap.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {swap.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="bg-terracotta/10 text-terracotta border-0">
                      Offers: {swap.skillOffered}
                    </Badge>
                    <Badge variant="secondary" className="bg-teal/10 text-teal border-0">
                      Wants: {swap.skillWanted}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-golden text-golden" />
                      <span>{swap.user.rating}</span>
                      <span>({swap.user.reviewCount})</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/swap/${swap.id}`}>
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link to="/discover">View All Swaps</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-navy text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why Choose CultureSwap?
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Everything you need for meaningful skill exchanges
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-terracotta/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-terracotta/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-terracotta" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              What Our Community Says
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {mockUsers.slice(0, 3).map((user) => (
              <Card key={user.id} className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-golden text-golden" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">
                    "CultureSwap changed how I learn. I taught {user.skillsOffered[0]} and learned {user.skillsWanted[0]} from someone across the world!"
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.location}, {user.country}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-terracotta to-terracotta-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Swapping?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Join thousands of learners exchanging skills and cultures every day. 
            It's free to get started!
          </p>
          <Button size="xl" className="bg-white text-terracotta hover:bg-white/90" asChild>
            <Link to="/signup">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;