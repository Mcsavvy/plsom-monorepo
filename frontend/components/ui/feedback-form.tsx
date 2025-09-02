"use client";

import { useState } from "react";
import { X, Send, Camera, X as CloseIcon } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";
import { useAuth } from "@/hooks/auth";

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackData) => void;
  isLoading?: boolean;
}

interface FeedbackData {
  name: string;
  email: string;
  message: string;
  screenshot?: File;
}

export function FeedbackForm({ isOpen, onClose, onSubmit, isLoading = false }: FeedbackFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FeedbackData>({
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email || "",
    message: "",
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handleInputChange = (field: keyof FeedbackData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    const dataToSubmit = {
      ...formData,
      screenshot: screenshot || undefined,
    };

    onSubmit(dataToSubmit);
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      name: user?.firstName && user?.lastName ? `${user.firstName} ${user?.lastName}` : "",
      email: user?.email || "",
      message: "",
    });
    setScreenshot(null);
    setScreenshotPreview(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Help Us Improve
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message">What would you like to tell us? *</Label>
            <Textarea
              id="message"
              placeholder="Describe the issue, share feedback, or report a bug..."
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Screenshot Upload */}
          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("screenshot")?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Add Screenshot
              </Button>
              {screenshot && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeScreenshot}
                  className="text-destructive hover:text-destructive"
                >
                  <CloseIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Screenshot Preview */}
            {screenshotPreview && (
              <div className="relative inline-block">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="max-w-full h-32 object-contain border rounded-md"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.message.trim() || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// Hook for managing feedback form state
export function useFeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openForm = () => setIsOpen(true);
  const closeForm = () => setIsOpen(false);

  const handleSubmit = async (data: FeedbackData) => {
    setIsLoading(true);
    try {
      // Here you can send the feedback to your backend or Sentry
      console.log("Feedback submitted:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close form after successful submission
      closeForm();
      
      // You could show a success toast here
      console.log("Feedback sent successfully!");
      
    } catch (error) {
      console.error("Failed to send feedback:", error);
      // You could show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isOpen,
    openForm,
    closeForm,
    handleSubmit,
    isLoading,
  };
}
