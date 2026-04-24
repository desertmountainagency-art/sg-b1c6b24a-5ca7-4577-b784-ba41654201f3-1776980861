import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { getConversationMessages, sendMessage } from "@/services/chatService";
import { AlertCircle, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/signin");
        return;
      }

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .single();

      if (!profile?.name) {
        router.push("/onboarding");
        return;
      }

      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
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
    setStreaming(true);
    try {
      const welcomePrompt = `Begin the Future Self profile generation process for ${userName}.`;
      await streamMessage(uid, convId, welcomePrompt);
    } catch (err) {
      console.error("Initial message error:", err);
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const streamMessage = async (uid: string, convId: string, userMessage: string) => {
    return new Promise<void>((resolve, reject) => {
      const eventSource = new EventSource(
        `/api/chat?userId=${encodeURIComponent(uid)}&conversationId=${encodeURIComponent(convId)}&message=${encodeURIComponent(userMessage)}`
      );

      // Use fetch with streaming instead
      fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: uid,
          conversationId: convId,
          message: userMessage,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error("No response body");
          }

          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                
                if (data === "[DONE]") {
                  // Stream complete - refresh messages from database
                  const updated = await getConversationMessages(convId);
                  setMessages(updated as Message[]);
                  setStreamingContent("");
                  resolve();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    setStreamingContent((prev) => prev + parsed.content);
                  } else if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch (e) {
                  console.error("Error parsing stream data:", e);
                }
              }
            }
          }
        })
        .catch((err) => {
          console.error("Stream error:", err);
          setStreamingContent("");
          reject(err);
        });
    });
  };

  const handleSend = async () => {
    if (!input.trim() || !userId || !conversationId || loading || streaming) return;

    const userMessage = input.trim();
    setInput("");
    setError("");
    setLoading(true);
    setStreaming(true);

    try {
      // Add user message optimistically
      const optimisticUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);

      // Stream the AI response
      await streamMessage(userId, conversationId, userMessage);
    } catch (err) {
      console.error("Send message error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      setStreamingContent("");
      
      // Reload messages from database
      try {
        const updated = await getConversationMessages(conversationId);
        setMessages(updated as Message[]);
      } catch (reloadErr) {
        console.error("Failed to reload messages:", reloadErr);
      }
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="editorial-container py-8">
        <div className="max-w-3xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="reflection-card min-h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto mb-6 space-y-6" ref={messagesEndRef}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "assistant" ? "message-mentor" : "message-user"}
                >
                  {message.content}
                </div>
              ))}
              
              {streaming && streamingContent && (
                <div className="message-mentor">
                  {streamingContent}
                  <span className="inline-block w-1 h-5 ml-1 bg-primary animate-pulse" />
                </div>
              )}

              {loading && !streaming && (
                <div className="flex items-center gap-3 p-6">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary/30 animate-breath" style={{ animationDelay: "0s" }} />
                    <div className="h-2 w-2 rounded-full bg-primary/30 animate-breath" style={{ animationDelay: "0.3s" }} />
                    <div className="h-2 w-2 rounded-full bg-primary/30 animate-breath" style={{ animationDelay: "0.6s" }} />
                  </div>
                  <span className="ui-sm text-muted-foreground">Your future self is thinking...</span>
                </div>
              )}
            </div>

            <div className="border-t border-outline-variant/30 pt-6">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share what's on your mind..."
                  disabled={loading || streaming}
                  rows={3}
                  className="flex-1 resize-none ui-md"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || streaming}
                  size="lg"
                  className="self-end shadow-ambient"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}