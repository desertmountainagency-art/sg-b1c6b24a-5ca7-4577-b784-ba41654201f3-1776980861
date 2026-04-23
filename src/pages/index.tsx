import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Target, MessageCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="container py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Your Future Self Awaits</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Meet the person you&apos;re becoming
            </h1>
            
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              Soul Mentor is an AI companion that speaks as your future, idealized self — 
              someone who has already walked your path and knows the way forward.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2">
                  Start Your Journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="how-it-works" className="border-t border-border bg-muted/30 py-24">
          <div className="container">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Conversations that transform
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                This isn&apos;t a chatbot — it&apos;s the wisest version of yourself, 
                offering guidance from lived experience.
              </p>
            </div>

            <div className="grid gap-12 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Intimate Conversations</h3>
                <p className="text-muted-foreground">
                  Speak with your future self in a natural, supportive dialogue 
                  that adapts to your emotional state.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Goal Tracking</h3>
                <p className="text-muted-foreground">
                  Your mentor extracts commitments from conversations and 
                  tracks progress on what matters most.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Deep Memory</h3>
                <p className="text-muted-foreground">
                  Every conversation builds context. Your mentor remembers 
                  your journey and references past insights naturally.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Ready to meet your future self?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Start with a simple intake — share where you are and where you want to go.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2">
                  Begin Your Journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Soul Mentor. Built with intention.</p>
        </div>
      </footer>
    </div>
  );
}