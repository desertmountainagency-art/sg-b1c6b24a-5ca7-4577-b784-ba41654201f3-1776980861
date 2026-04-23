import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const STEPS = [
  { id: 1, title: "What's your name?", subtitle: "Let's start simple" },
  { id: 2, title: "What are your goals?", subtitle: "Where do you want to be?" },
  { id: 3, title: "What challenges are you facing?", subtitle: "What's holding you back?" },
  { id: 4, title: "How are you feeling?", subtitle: "Your emotional baseline" },
  { id: 5, title: "How should your mentor show up?", subtitle: "Choose your style" },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    shortTermGoals: "",
    longTermGoals: "",
    challenges: "",
    emotionalBaseline: "",
    mentorStyle: "balanced",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/signin");
        return;
      }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, short_term_goals")
        .eq("id", session.user.id)
        .single();

      if (profile?.name && profile?.short_term_goals) {
        router.push("/chat");
      }
    };

    checkAuth();
  }, [router]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;

    setError("");
    setLoading(true);

    try {
      // Use UPSERT to handle both insert and update cases
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          name: formData.name,
          short_term_goals: formData.shortTermGoals,
          long_term_goals: formData.longTermGoals,
          current_challenges: formData.challenges,
          emotional_baseline: formData.emotionalBaseline,
          mentor_style: formData.mentorStyle,
        }, {
          onConflict: "id"
        });

      if (upsertError) {
        console.error("Profile upsert error:", upsertError);
        throw upsertError;
      }

      const { error: conversationError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          title: "First Session",
        })
        .select()
        .single();

      if (conversationError) {
        console.error("Conversation insert error:", conversationError);
        throw conversationError;
      }

      router.push("/chat");
    } catch (err) {
      console.error("Full error object:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.shortTermGoals.trim().length > 0 && formData.longTermGoals.trim().length > 0;
      case 3:
        return formData.challenges.trim().length > 0;
      case 4:
        return formData.emotionalBaseline.trim().length > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`h-2 w-12 rounded-full transition-colors ${
                    step.id === currentStep
                      ? "bg-primary"
                      : step.id < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm animate-fade-in">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold">
                {STEPS[currentStep - 1].title}
              </h1>
              <p className="text-muted-foreground">
                {STEPS[currentStep - 1].subtitle}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    placeholder="What should your future self call you?"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    autoFocus
                  />
                </div>
              )}

              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="shortTermGoals">Short-term goals (next 3-6 months)</Label>
                    <Textarea
                      id="shortTermGoals"
                      placeholder="What do you want to achieve soon?"
                      value={formData.shortTermGoals}
                      onChange={(e) =>
                        setFormData({ ...formData, shortTermGoals: e.target.value })
                      }
                      rows={4}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longTermGoals">Long-term vision (1-5 years)</Label>
                    <Textarea
                      id="longTermGoals"
                      placeholder="Where do you see yourself in the future?"
                      value={formData.longTermGoals}
                      onChange={(e) =>
                        setFormData({ ...formData, longTermGoals: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <div className="space-y-2">
                  <Label htmlFor="challenges">Current challenges</Label>
                  <Textarea
                    id="challenges"
                    placeholder="What's standing in your way? What feels hard right now?"
                    value={formData.challenges}
                    onChange={(e) =>
                      setFormData({ ...formData, challenges: e.target.value })
                    }
                    rows={6}
                    autoFocus
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-2">
                  <Label htmlFor="emotionalBaseline">How are you feeling right now?</Label>
                  <Textarea
                    id="emotionalBaseline"
                    placeholder="Stressed? Motivated? Stuck? Uncertain? Describe your current state."
                    value={formData.emotionalBaseline}
                    onChange={(e) =>
                      setFormData({ ...formData, emotionalBaseline: e.target.value })
                    }
                    rows={5}
                    autoFocus
                  />
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-4">
                  <Label>How should your mentor show up?</Label>
                  <RadioGroup
                    value={formData.mentorStyle}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mentorStyle: value })
                    }
                  >
                    <div className="flex items-start space-x-3 rounded-lg border border-border p-4 hover:border-primary transition-colors">
                      <RadioGroupItem value="supportive" id="supportive" />
                      <div className="flex-1">
                        <Label htmlFor="supportive" className="font-semibold cursor-pointer">
                          Warm & Supportive
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Gentle encouragement, emotional validation, compassionate guidance
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-lg border border-border p-4 hover:border-primary transition-colors">
                      <RadioGroupItem value="balanced" id="balanced" />
                      <div className="flex-1">
                        <Label htmlFor="balanced" className="font-semibold cursor-pointer">
                          Balanced
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Mix of support and challenge, adapting to what you need
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-lg border border-border p-4 hover:border-primary transition-colors">
                      <RadioGroupItem value="direct" id="direct" />
                      <div className="flex-1">
                        <Label htmlFor="direct" className="font-semibold cursor-pointer">
                          Direct & Challenging
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Straight talk, actionable clarity, push you forward
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid() || loading}
                  className="ml-auto gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || loading}
                  className="ml-auto gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Meet Your Future Self
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}