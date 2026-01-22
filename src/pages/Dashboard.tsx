import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MessageCircle, Star, TrendingUp, Users, Award, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";
import { swapService } from "@/lib/swapService";
import { messageService } from "@/lib/messageService";
import { reviewService } from "@/lib/reviewService";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState([
    { label: "Swaps Completed", value: "0", icon: Users, trend: "" },
    { label: "Average Rating", value: "0.0", icon: Star, trend: "" },
    { label: "Active Conversations", value: "0", icon: MessageCircle, trend: "" },
    { label: "Badges Earned", value: "0", icon: Award, trend: "" },
  ]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recommendedSwaps, setRecommendedSwaps] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const completionSteps = useMemo(() => {
    if (!userProfile) return [];
    return [
      { id: 'photo', label: "Add profile photo", completed: !!userProfile.profile_image_url },
      { id: 'bio', label: "Complete bio", completed: !!userProfile.bio },
      { id: 'skills', label: "Add skills offered", completed: Array.isArray(userProfile.skills_offered) ? userProfile.skills_offered.length > 0 : !!userProfile.skills_offered },
      { id: 'location', label: "Add location (City & Country)", completed: !!userProfile.city && !!userProfile.country },
      { id: 'skills_wanted', label: "Add skills you want", completed: Array.isArray(userProfile.skills_wanted) ? userProfile.skills_wanted.length > 0 : !!userProfile.skills_wanted },
    ];
  }, [userProfile]);

  const profileCompletion = useMemo(() => {
    if (completionSteps.length === 0) return 0;
    const completedCount = completionSteps.filter(s => s.completed).length;
    return Math.round((completedCount / completionSteps.length) * 100);
  }, [completionSteps]);

  useEffect(() => {
    fetchDashboardData();

    // Listen for profile updates from other pages
    const handleProfileUpdate = () => {
      console.log("Profile updated event received, refreshing dashboard...");
      fetchDashboardData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Parallel fetching for performance
      const [profile, userSwaps, conversations, rating, allSwaps, notices, completedCount] = await Promise.all([
        profileService.getProfile(user.id),
        swapService.getUserSwapsWithPartner(user.id),
        messageService.getConversations(user.id),
        reviewService.getAverageRating(user.id),
        swapService.getAllSwaps(),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
        swapService.getCompletedSwapsCount(user.id)
      ]);

      setUserProfile(profile);

      // 1. Swaps Completed - now using the centralized count from swapService
      // This count includes both created and joined swaps that are completed.

      // 2. Average Rating & Star Logic is handled in the UI loop

      // 3. Active Conversations (Unique users)
      const uniqueConvs = conversations.length;

      setStats([
        { label: "Swaps Completed", value: completedCount.toString(), icon: Users, trend: `+${userSwaps.length - completedCount} active` },
        { label: "Average Rating", value: rating.toFixed(1), icon: Star, trend: rating >= 4.5 ? "Top 10%" : "" },
        { label: "Active Conversations", value: uniqueConvs.toString(), icon: MessageCircle, trend: "" },
        { label: "Badges Earned", value: (profile?.badges?.length || 0).toString(), icon: Award, trend: "" },
      ]);

      // 4. Upcoming Sessions (Active swaps)
      // Since we don't have a schedule table yet, we show active swaps as sessions
      const activeSwaps = userSwaps.filter((s: any) => s.status === 'active').map((s: any) => ({
        id: s.id,
        title: s.title || "Untitled Swap",
        partner: "Active Partner", // Ideally fetch partner profile
        time: "Upcoming Session",
        type: s.user_id === user.id ? 'Teaching' : 'Learning'
      }));
      setUpcomingSessions(activeSwaps.slice(0, 3));

      // 5. Recommended Swaps
      const othersSwaps = allSwaps.filter((s: any) => s.user_id !== user.id).slice(0, 3);
      setRecommendedSwaps(othersSwaps);

      setNotifications(notices.data || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={true} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">
                Welcome back, {userProfile?.full_name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your skill exchanges
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="terracotta" asChild>
                <Link to="/swap/create">
                  Create Swap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/discover">
                  Find New Swaps
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-xs text-teal mt-1">{stat.trend}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-terracotta/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-terracotta" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-xl">Upcoming Sessions</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/schedule">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-terracotta/20 scrollbar-track-transparent">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${session.type === 'Teaching' ? 'bg-terracotta/10' : 'bg-teal/10'
                            }`}>
                            <Calendar className={`h-6 w-6 ${session.type === 'Teaching' ? 'text-terracotta' : 'text-teal'
                              }`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{session.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{session.partner}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{session.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <Badge variant={session.type === 'Teaching' ? 'default' : 'secondary'} className={
                            session.type === 'Teaching'
                              ? 'bg-terracotta/10 text-terracotta border-0'
                              : 'bg-teal/10 text-teal border-0'
                          }>
                            {session.type}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 w-full text-muted-foreground">
                      <p className="text-sm italic">No upcoming sessions found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Swaps */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-xl">Recommended for You</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/discover">Explore More</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedSwaps.length > 0 ? (
                    recommendedSwaps.map((swap) => (
                      <Link
                        key={swap.id}
                        to={`/swap/${swap.id}`}
                        className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-terracotta/50 hover:shadow-warm transition-all group"
                      >
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg uppercase font-bold text-muted-foreground overflow-hidden">
                          {swap.user_profiles?.profile_image_url ? (
                            <img src={swap.user_profiles.profile_image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            swap.skill_offered?.[0] || '?'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold group-hover:text-terracotta transition-colors">
                                {swap.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {swap.user_profiles?.full_name || 'Community Member'} • {swap.user_profiles?.city || 'Remote'}
                              </p>
                            </div>
                            <Badge className="bg-teal/10 text-teal border-0 shrink-0">
                              Recommended
                            </Badge>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {swap.skill_offered}
                            </Badge>
                            <span className="text-muted-foreground">↔</span>
                            <Badge variant="outline" className="text-xs">
                              {swap.skill_wanted}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-terracotta transition-colors" />
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm italic">No recommendations at the moment</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                  </div>
                  <div className="space-y-2 text-sm">
                    {completionSteps.map((step) => (
                      <div key={step.id} className={`flex items-center gap-2 ${step.completed ? 'text-teal' : 'text-muted-foreground'}`}>
                        <div className={`h-2 w-2 rounded-full ${step.completed ? 'bg-teal' : 'bg-muted'}`} />
                        {step.label} {step.completed ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/profile">Complete Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/messages">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Messages
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/profile">
                    <Users className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/discover">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Browse Community
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;