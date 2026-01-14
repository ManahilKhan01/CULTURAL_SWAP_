import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Calendar, Globe, Clock, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/lib/profileService";
import { reviewService } from "@/lib/reviewService";

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!id) {
          setLoading(false);
          return;
        }

        // Load user profile from database
        const profile = await profileService.getProfile(id);
        if (profile) {
          setUser(profile);

          // Load reviews and rating
          const userReviews = await reviewService.getReviewsForUser(id);
          const avgRating = await reviewService.getAverageRating(id);

          setReviews(userReviews || []);
          setRating(avgRating || 0);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={true} />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-terracotta mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={true} />
        <main className="container mx-auto px-4 py-8 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">User Not Found</h1>
          <Button asChild><Link to="/swaps">Back to Swaps</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/swaps"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <img 
                  src={user.profile_image_url || "/placeholder.svg"} 
                  alt={user.full_name || "User"} 
                  className="h-32 w-32 rounded-full object-cover mx-auto ring-4 ring-terracotta/20" 
                />
                <h1 className="font-display text-2xl font-bold mt-4">{user.full_name || "User"}</h1>
                <p className="text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />{user.city || "Location"}, {user.country || "Country"}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Star className="h-5 w-5 fill-golden text-golden" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
                <Button variant="terracotta" className="w-full mt-4" asChild>
                  <Link to={`/messages?user=${user.id}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />Send Message
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{user.languages?.join(', ') || 'Not specified'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {user.bio && (
              <Card>
                <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            {user.skills_offered && user.skills_offered.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Skills Offered</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {user.skills_offered.map((skill: string, idx: number) => (
                    <Badge key={idx} className="bg-terracotta/10 text-terracotta border-terracotta/30">{skill}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {user.skills_wanted && user.skills_wanted.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Skills Wanted</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {user.skills_wanted.map((skill: string, idx: number) => (
                    <Badge key={idx} className="bg-teal/10 text-teal border-teal/30">{skill}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {reviews && reviews.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Reviews</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.reviewer_name || "Anonymous"}</p>
                          <div className="flex gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < (review.rating || 0) ? "fill-golden text-golden" : "text-muted"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
