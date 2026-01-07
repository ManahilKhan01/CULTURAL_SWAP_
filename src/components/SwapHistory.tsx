import { useState, useEffect } from "react";
import { MessageCircle, Video, FileText, Activity, Loader2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { historyService } from "@/lib/historyService";

interface SwapHistoryProps {
    swapId: string;
}

export const SwapHistory = ({ swapId }: SwapHistoryProps) => {
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
        loadStats();
    }, [swapId, filter]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = filter
                ? await historyService.getHistoryByType(swapId, filter)
                : await historyService.getSwapHistory(swapId);
            setHistory(data);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await historyService.getActivityStats(swapId);
            setStats(statsData);
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "message":
                return <MessageCircle className="h-4 w-4" />;
            case "session":
                return <Video className="h-4 w-4" />;
            case "file_exchange":
                return <FileText className="h-4 w-4" />;
            case "status_change":
                return <Activity className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "message":
                return "text-blue-600 bg-blue-500/10";
            case "session":
                return "text-green-600 bg-green-500/10";
            case "file_exchange":
                return "text-purple-600 bg-purple-500/10";
            case "status_change":
                return "text-orange-600 bg-orange-500/10";
            default:
                return "text-gray-600 bg-gray-500/10";
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Swap History</CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant={filter === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(null)}
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === "message" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("message")}
                        >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Messages
                        </Button>
                        <Button
                            variant={filter === "session" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("session")}
                        >
                            <Video className="h-3 w-3 mr-1" />
                            Sessions
                        </Button>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 rounded-lg bg-blue-500/10">
                            <p className="text-2xl font-bold text-blue-600">{stats.totalMessages}</p>
                            <p className="text-xs text-muted-foreground">Messages</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-500/10">
                            <p className="text-2xl font-bold text-green-600">{stats.totalSessions}</p>
                            <p className="text-xs text-muted-foreground">Sessions</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-purple-500/10">
                            <p className="text-2xl font-bold text-purple-600">
                                {Math.round(stats.totalTimeSpent / 60 * 10) / 10}h
                            </p>
                            <p className="text-xs text-muted-foreground">Time Spent</p>
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No activity yet</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {history.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.activity_type)}`}>
                                    {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDate(activity.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
