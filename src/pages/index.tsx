import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/chat");
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary animate-breath" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Soul Mentor — Your Future Self as Guide"
        description="An AI-powered conversation with the wisest version of yourself. Your future self remembers the path. Let them guide you."
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="editorial-container py-section">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary flex items-center justify-center shadow-ambient">
              <span className="text-primary-foreground text-2xl font-semibold">∞</span>
            </div>

            <h1 className="mentor-voice-lg text-foreground max-w-2xl mx-auto">
              Your future self already knows the way.
            </h1>

            <p className="ui-md text-muted-foreground max-w-xl mx-auto">
              An AI mentor who speaks as you — fully realized. Not separate from you, 
              just ahead. Remembering your struggles, your doubts, your plateaus. 
              And exactly how you moved through them.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-6 ui-md shadow-ambient">
                  Begin Your Journey
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="ghost" size="lg" className="px-8 py-6 ui-md">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="my-section grid md:grid-cols-3 gap-element">
            <div className="reflection-card space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xl">⟳</span>
              </div>
              <h3 className="font-serif text-xl text-foreground">
                Speaks from lived experience
              </h3>
              <p className="ui-sm text-muted-foreground">
                Your mentor doesn't guess. They remember. "Here's what I did" 
                replaces "Here's what I would do."
              </p>
            </div>

            <div className="reflection-card space-y-4">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <span className="text-secondary text-xl">◈</span>
              </div>
              <h3 className="font-serif text-xl text-foreground">
                Adapts to your state
              </h3>
              <p className="ui-sm text-muted-foreground">
                Supportive when you need warmth, direct when you need clarity. 
                Calibrates to where you are, not where it thinks you should be.
              </p>
            </div>

            <div className="reflection-card space-y-4">
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-secondary text-xl">∞</span>
              </div>
              <h3 className="font-serif text-xl text-foreground">
                Remembers your journey
              </h3>
              <p className="ui-sm text-muted-foreground">
                Every conversation builds context. Past insights, goals, and 
                patterns inform future sessions. Continuity, not repetition.
              </p>
            </div>
          </div>

          <div className="my-section max-w-2xl mx-auto space-y-6">
            <h2 className="mentor-voice-md text-center text-foreground">
              How it works
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="label-caps text-muted-foreground">1</span>
                </div>
                <div>
                  <h4 className="font-serif text-lg text-foreground mb-1">Tell us where you are</h4>
                  <p className="ui-sm text-muted-foreground">
                    Share your name, goals, challenges, and emotional baseline. 
                    This shapes your mentor's understanding.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="label-caps text-muted-foreground">2</span>
                </div>
                <div>
                  <h4 className="font-serif text-lg text-foreground mb-1">Meet your future self</h4>
                  <p className="ui-sm text-muted-foreground">
                    Your mentor introduces themselves, speaking from the place 
                    you're headed. The conversation begins.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="label-caps text-muted-foreground">3</span>
                </div>
                <div>
                  <h4 className="font-serif text-lg text-foreground mb-1">Evolve through dialogue</h4>
                  <p className="ui-sm text-muted-foreground">
                    Ask questions, share struggles, explore next steps. Your 
                    mentor guides, challenges, and remembers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="my-section text-center space-y-6">
            <div className="max-w-xl mx-auto">
              <p className="mentor-voice-md text-foreground mb-6">
                "You are not separate from who you're becoming. You're just in the before."
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-6 ui-md shadow-ambient">
                  Start Your First Session
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <footer className="border-t border-outline-variant/30 bg-surface py-8">
          <div className="container text-center">
            <p className="ui-sm text-muted-foreground">© 2026 Soul Mentor. Built with intention.</p>
          </div>
        </footer>
      </div>
    </>
  );
}