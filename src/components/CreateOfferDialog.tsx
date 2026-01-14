import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { offerService } from "@/lib/offerService";
import { useToast } from "@/hooks/use-toast";

interface CreateOfferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversationId: string;
    swapId?: string;
    receiverId: string;
    onOfferCreated?: () => void;
}

const DAYS_OF_WEEK = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
];

const DURATION_OPTIONS = [
    { value: "30min", label: "30 minutes" },
    { value: "1hr", label: "1 hour" },
    { value: "1.5hr", label: "1.5 hours" },
    { value: "2hr", label: "2 hours" },
    { value: "3hr", label: "3 hours" },
    { value: "custom", label: "Custom" },
];

export const CreateOfferDialog = ({
    open,
    onOpenChange,
    conversationId,
    swapId,
    receiverId,
    onOfferCreated,
}: CreateOfferDialogProps) => {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [skillOffered, setSkillOffered] = useState("");
    const [skillWanted, setSkillWanted] = useState("");
    const [category, setCategory] = useState("Technology");
    const [format, setFormat] = useState("online");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [duration, setDuration] = useState("");
    const [schedule, setSchedule] = useState("");
    const [notes, setNotes] = useState("");

    const toggleDay = (dayId: string) => {
        setSelectedDays((prev) =>
            prev.includes(dayId)
                ? prev.filter((d) => d !== dayId)
                : [...prev, dayId]
        );
    };

    const handleSubmit = async () => {
        if (!title.trim() || !skillOffered.trim() || !skillWanted.trim()) {
            toast({
                title: "Error",
                description: "Title and skills are required",
                variant: "destructive",
            });
            return;
        }

        if (selectedDays.length === 0) {
            toast({
                title: "Error",
                description: "Please select at least one day",
                variant: "destructive",
            });
            return;
        }

        if (!duration) {
            toast({
                title: "Error",
                description: "Please select a session duration",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);

            await offerService.createOffer({
                conversation_id: conversationId,
                swap_id: swapId || undefined,
                receiver_id: receiverId,
                title,
                skill_offered: skillOffered,
                skill_wanted: skillWanted,
                category,
                format,
                session_days: selectedDays,
                duration,
                schedule: schedule || undefined,
                notes: notes || undefined,
            });

            toast({
                title: "Offer Sent!",
                description: "Your offer has been sent to the other user.",
            });

            // Reset form
            setTitle("");
            setSkillOffered("");
            setSkillWanted("");
            setSelectedDays([]);
            setDuration("");
            setSchedule("");
            setNotes("");

            onOpenChange(false);
            onOfferCreated?.();
        } catch (error: any) {
            console.error("Error creating offer:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send offer",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Create Swap Offer</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto flex-1 px-6 -mx-6 pr-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Swap Proposal Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., English for Coding Help"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={submitting}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="offered">I Can Teach *</Label>
                                <Input
                                    id="offered"
                                    placeholder="Skill you offer"
                                    value={skillOffered}
                                    onChange={(e) => setSkillOffered(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wanted">I Want to Learn *</Label>
                                <Input
                                    id="wanted"
                                    placeholder="Skill you want"
                                    value={skillWanted}
                                    onChange={(e) => setSkillWanted(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory} disabled={submitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Technology">Technology</SelectItem>
                                        <SelectItem value="Language">Language</SelectItem>
                                        <SelectItem value="Arts & Crafts">Arts & Crafts</SelectItem>
                                        <SelectItem value="Business">Business</SelectItem>
                                        <SelectItem value="Music">Music</SelectItem>
                                        <SelectItem value="Fitness">Fitness</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="format">Format</Label>
                                <Select value={format} onValueChange={setFormat} disabled={submitting}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="in-person">In-Person</SelectItem>
                                        <SelectItem value="both">Both</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border my-4" />
                    {/* Session Days */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Available Days *</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                                <div key={day.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={day.id}
                                        checked={selectedDays.includes(day.id)}
                                        onCheckedChange={() => toggleDay(day.id)}
                                        disabled={submitting}
                                    />
                                    <Label
                                        htmlFor={day.id}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {day.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <Label htmlFor="duration">Session Duration *</Label>
                        <Select value={duration} onValueChange={setDuration} disabled={submitting}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                {DURATION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Schedule / Time Preference */}
                    <div className="space-y-2">
                        <Label htmlFor="schedule">Preferred Time</Label>
                        <Input
                            id="schedule"
                            placeholder="e.g., Evenings after 6 PM, mornings on weekends"
                            value={schedule}
                            onChange={(e) => setSchedule(e.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any additional details about your availability or preferences..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={submitting}
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="terracotta"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Offer
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOfferDialog;
