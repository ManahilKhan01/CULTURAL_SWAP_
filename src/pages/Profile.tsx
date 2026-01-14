import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Calendar, Globe, Clock, Award, Edit, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";
import { reviewService } from "@/lib/reviewService";
import { swapService } from "@/lib/swapService";

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    <Navbar isLoggedIn={true} />
    <main className="container mx-auto px-4 py-8">
      {/* Skeleton Header */}
      <div className="bg-muted rounded-2xl p-8 mb-8 h-48 flex flex-col md:flex-row gap-6 relative overflow-hidden">
        <div className="h-32 w-32 rounded-2xl bg-muted-foreground/10" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-48 bg-muted-foreground/10 rounded" />
          <div className="h-4 w-64 bg-muted-foreground/10 rounded" />
          <div className="h-4 w-full bg-muted-foreground/10 rounded max-w-md" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted-foreground/10 rounded-full" />
            <div className="h-6 w-20 bg-muted-foreground/10 rounded-full" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-10 w-48 bg-muted rounded mb-6" />
          <div className="bg-card rounded-xl border border-border p-6 h-40" />
          <div className="bg-card rounded-xl border border-border p-6 h-40" />
        </div>
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 h-48" />
          <div className="bg-card rounded-xl border border-border p-6 h-24" />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [swapsCount, setSwapsCount] = useState(0);
  const [bgLoading, setBgLoading] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 1. Load basic profile first (Fastest)
          const profile = await profileService.getProfile(user.id);
          if (profile) {
            setUserProfile(profile);
            setLoading(false); // Show basic info immediately
          }

          // 2. Load heavier data in background (Async)
          setBgLoading(true);
          Promise.all([
            reviewService.getReviewsForUser(user.id),
            reviewService.getAverageRating(user.id),
            swapService.getCompletedSwapsCount(user.id)
          ]).then(([userReviews, avgRating, completedCount]) => {
            setReviews(userReviews);
            setRating(avgRating);
            setSwapsCount(completedCount);
            setBgLoading(false);

            // Cache everything for next time
            localStorage.setItem('profile_page_cache', JSON.stringify({
              profile: profile || userProfile,
              reviews: userReviews,
              rating: avgRating,
              swapsCount: completedCount,
              timestamp: Date.now()
            }));
          }).catch(() => setBgLoading(false));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setLoading(false);
      }
    };

    // Load from cache first for instant display
    const cached = localStorage.getItem('profile_page_cache');
    if (cached) {
      try {
        const { profile, reviews: cachedReviews, rating: cachedRating, swapsCount: cachedSwaps, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Use cache if less than 2 minutes old
        if (age < 2 * 60 * 1000) {
          setUserProfile(profile);
          setReviews(cachedReviews);
          setRating(cachedRating);
          setSwapsCount(cachedSwaps);
          setLoading(false);

          // Still refresh in background
          loadProfileData();
          return;
        }
      } catch {
        // Ignore cache errors
      }
    }

    loadProfileData();
  }, []);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log("Profile updated event received, refreshing profile...");
      setLoading(true);
      const reloadProfileData = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const profile = await profileService.getProfile(user.id);
            if (profile) {
              setUserProfile(profile);
            }
            setLoading(false);
          }
        } catch (error) {
          console.error('Error reloading profile:', error);
          setLoading(false);
        }
      };
      reloadProfileData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [userProfile]);

  if (loading) return <ProfileSkeleton />;

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={true} />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">Please complete your profile in Settings</p>
          <Button asChild><Link to="/settings">Go to Settings</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-terracotta/10 to-teal/10 rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative group">
              <img
                src={userProfile.profile_image_url || "/placeholder.svg"}
                alt={userProfile.full_name}
                className="h-32 w-32 rounded-2xl object-cover border-4 border-white shadow-warm transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/10 opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-terracotta to-terracotta/70">{userProfile.full_name || "User"}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground mb-4">
                    <span className="flex items-center gap-1 hover:text-terracotta transition-colors">
                      <MapPin className="h-4 w-4" />
                      {userProfile.city || "City"}, {userProfile.country || "Country"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-golden text-golden" />
                      {rating > 0 ? rating.toFixed(1) : (bgLoading ? "..." : "0.0")} ({reviews.length} reviews)
                    </span>
                  </div>
                </div>
                <Button variant="outline" asChild className="hover-lift">
                  <Link to="/settings"><Edit className="h-4 w-4 mr-2" />Edit Profile</Link>
                </Button>
              </div>
              <p className="text-muted-foreground mb-4 max-w-2xl leading-relaxed">{userProfile.bio || "No bio added yet"}</p>
              <div className="flex flex-wrap gap-2">
                {userProfile.languages && userProfile.languages.length > 0 && userProfile.languages.map((lang: string) => (
                  <Badge key={lang} variant="secondary" className="gap-1 bg-white/50 border-white/40"><Globe className="h-3 w-3" />{lang}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="skills" className="w-full">
              <TabsList className="mb-6 bg-muted/50 p-1 border border-border/50 rounded-xl">
                <TabsTrigger value="skills" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Skills</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="skills" className="space-y-6 focus-visible:outline-none">
                <Card className="border-border/50 shadow-sm overflow-hidden group">
                  <div className="h-1 w-full bg-terracotta/10 translate-y-[-1px] group-hover:bg-terracotta/30 transition-colors" />
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-terracotta">
                      <Award className="h-5 w-5" /> Skills I Offer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills_offered && userProfile.skills_offered.length > 0 ? (
                        userProfile.skills_offered.map((skill: string) => (
                          <Badge key={skill} className="bg-terracotta/10 text-terracotta border-0 hover:bg-terracotta hover:text-white transition-all cursor-default scale-100 hover:scale-110 active:scale-95">{skill}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm italic">No skills added yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden group">
                  <div className="h-1 w-full bg-teal/10 translate-y-[-1px] group-hover:bg-teal/30 transition-colors" />
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-teal">
                      <Loader2 className="h-5 w-5" /> Skills I Want to Learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills_wanted && userProfile.skills_wanted.length > 0 ? (
                        userProfile.skills_wanted.map((skill: string) => (
                          <Badge key={skill} className="bg-teal/10 text-teal border-0 hover:bg-teal hover:text-white transition-all cursor-default scale-100 hover:scale-110 active:scale-95">{skill}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm italic">No skills added yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4 focus-visible:outline-none">
                {bgLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-32 w-full bg-muted rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review: any) => (
                    <Card key={review.id} className="border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-terracotta/10 flex items-center justify-center font-display text-terracotta font-bold">
                            {review.reviewer_name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{review.reviewer_name || "User"}</p>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-golden text-golden' : 'text-muted'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm italic leading-relaxed">"{review.comment}"</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="py-12 text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No reviews yet. Start swapping to earn reviews!</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between text-sm group">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" /> Languages
                  </span>
                  <span className="font-medium">{userProfile.languages?.join(", ") || "None"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" /> Timezone
                  </span>
                  <span className="font-medium">{userProfile.timezone || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Member Since
                  </span>
                  <span className="font-medium">{new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-terracotta to-terracotta/80 text-white border-0 shadow-lg shadow-terracotta/20 relative overflow-hidden group">
              <div className="absolute top-[-20%] right-[-10%] h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
              <CardContent className="py-8 text-center relative z-10">
                <p className="text-4xl font-display font-bold mb-1 drop-shadow-sm">
                  {bgLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  ) : swapsCount}
                </p>
                <p className="text-terracotta-foreground/90 text-sm font-medium uppercase tracking-widest">Swaps Completed</p>
              </CardContent>
            </Card>

            <div className="bg-teal/5 border border-teal/10 rounded-xl p-6 text-center">
              <Award className="h-10 w-10 text-teal mx-auto mb-3 opacity-50" />
              <h4 className="font-semibold text-teal-900 mb-1">Culture Explorer</h4>
              <p className="text-xs text-teal-700/70">Next badge at 5 completed swaps</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;