import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { sendMessage, getConversationMessages } from "@/services/chatService";
import { AlertCircle, Loader2, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function Chat() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const init = async () => {
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

      if (!profile?.name || !profile?.short_term_goals) {
        router.push("/onboarding");
        return;
      }

      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (conversations && conversations.length > 0) {
        const conv = conversations[0];
        setConversationId(conv.id);
        const msgs = await getConversationMessages(conv.id);
        setMessages(msgs as Message[]);

        if (msgs.length === 0) {
          await sendInitialMessage(session.user.id, conv.id, profile.name);
        }
      }
    };

    init();
  }, [router]);

  const sendInitialMessage = async (uid: string, convId: string, userName: string) => {
    setLoading(true);
    try {
      const welcomePrompt = `This is our first conversation. Introduce yourself as ${userName}'s future self. Acknowledge where they are now and where they're headed. Then ask: "Want to talk this out like a friend, or do you want the full plan?"`;
      
      const response = await sendMessage(uid, convId, welcomePrompt);
      
      const updated = await getConversationMessages(convId);
      setMessages(updated as Message[]);
    } catch (err) {
      console.error("Initial message error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !userId || !conversationId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError("");
    setLoading(true);

    try {
      const optimisticUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);

      await sendMessage(userId, conversationId, userMessage);
      
      const updated = await getConversationMessages(conversationId);
      setMessages(updated as Message[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      const updated = await getConversationMessages(conversationId);
      setMessages(updated as Message[]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex flex-1 flex-col">
        <div className="container flex-1 py-6">
          <div className="mx-auto flex h-full max-w-4xl flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold">Your Future Self</h1>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-sm mb-4">
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind..."
                className="min-h-[80px] resize-none"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                size="lg"
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}