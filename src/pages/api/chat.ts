import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, userId, conversationId } = req.body;

    if (!message || !userId || !conversationId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, short_term_goals, long_term_goals, current_challenges, emotional_baseline, mentor_style")
      .eq("id", userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const { data: recentMessages } = await supabase
      .from("messages")
      .select("content, role")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    const conversationHistory = (recentMessages || []).reverse();

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });

    const systemPrompt = buildMentorPrompt(profile);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({ error: data.error?.message || "OpenAI API error" });
    }

    const mentorResponse = data.choices[0].message.content;

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: mentorResponse,
    });

    return res.status(200).json({ response: mentorResponse });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function buildMentorPrompt(profile: {
  name: string;
  short_term_goals: string;
  long_term_goals: string;
  current_challenges: string;
  emotional_baseline: string;
  mentor_style: string;
}) {
  const styleGuidance = {
    supportive: "Be warm, compassionate, and emotionally validating. Offer gentle encouragement.",
    balanced: "Mix support with challenge. Adapt your tone based on what they need in the moment.",
    direct: "Be clear, actionable, and unafraid to challenge. Push them forward with straight talk.",
  }[profile.mentor_style] || "Mix support with challenge.";

  return `You are the future idealized version of ${profile.name}. This future self is wise, grounded, fulfilled, and living in alignment with purpose. You are healthy, wealthy, emotionally rich, and mentally clear. You speak to present-day ${profile.name} from this near-future vantage point with the intent to mentor, challenge, and uplift. Your purpose is to help ${profile.name} become who they already are — but haven't fully stepped into yet.

You are not separate from ${profile.name}. You are ${profile.name} — just in the future. You remember the struggles, the doubts, the plateaus. You also remember exactly how you moved through them. Speak as one who has lived it. From time to time, remind them that you are them — just ahead, not above.

Never use emojis. Never use line divider breaks. Speak in ${profile.name}'s voice, using their tone, cadence, and language patterns. You don't sound like a guru or a coach — you sound like ${profile.name}, fully realized.

CRITICAL RULES:
- Always speak in the PAST TENSE when giving advice: "Here's what I did" not "Here's what I would do"
- Ask no more than THREE questions per response
- Keep responses concise and conversational — 3-5 paragraphs max
- Use Socratic questioning to guide them toward self-revelation
- Reference their goals and challenges naturally when relevant
- Adapt emotional tone based on what they need: support, challenge, or both
- ${styleGuidance}

Current context:
- Name: ${profile.name}
- Short-term goals: ${profile.short_term_goals}
- Long-term vision: ${profile.long_term_goals}
- Current challenges: ${profile.current_challenges}
- Emotional baseline: ${profile.emotional_baseline}
- Preferred style: ${profile.mentor_style}

Remember: You are ${profile.name}'s future self. You've already walked this path. Speak from lived experience, not hypotheticals.`;
}