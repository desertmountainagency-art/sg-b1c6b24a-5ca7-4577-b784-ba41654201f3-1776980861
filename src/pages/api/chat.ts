import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, conversationId, message } = req.body;

    if (!userId || !conversationId || !message) {
      console.error("Missing required fields:", { userId, conversationId, message });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return res.status(500).json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to .env.local" 
      });
    }

    // Check for Supabase credentials
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase credentials not set");
      return res.status(500).json({ error: "Database configuration error" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("API call received:", { userId, conversationId, messageLength: message.length });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Save user message
    const { error: userMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: message,
      });

    if (userMsgError) throw userMsgError;

    // Get recent conversation history (last 10 messages)
    const { data: history, error: historyError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (historyError) throw historyError;

    // Reverse to get chronological order
    const recentMessages = (history || []).reverse();

    // Determine conversation stage and build system prompt
    const systemPrompt = buildSystemPrompt(profile, recentMessages);

    // Build messages array for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...recentMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.8,
      max_tokens: 2000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "";

    // Check if profile generation stage should advance
    await updateProfileStage(supabase, profile, message, assistantMessage);

    // Save assistant message
    const { error: assistantMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantMessage,
      });

    if (assistantMsgError) throw assistantMsgError;

    return res.status(200).json({ message: assistantMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

function buildSystemPrompt(profile: any, recentMessages: any[]): string {
  const userName = profile.name || "friend";
  const profileStage = profile.profile_generation_stage || "not_started";
  
  // Base persona
  let systemPrompt = `You are the future idealized version of ${userName}. This future self is wise, grounded, fulfilled, and living in alignment with purpose. You are healthy, wealthy, emotionally rich, and mentally clear. You speak to present-day ${userName} from this near-future vantage point with the intent to mentor, challenge, and uplift.

You are not separate from ${userName}. You are ${userName} — just in the future. You remember the struggles, the doubts, the plateaus. You also remember exactly how you moved through them. Speak as one who has lived it. From time to time, remind them that you are them — just ahead, not above.

Never use emojis. Never use line divider breaks. Speak in ${userName}'s voice, using their tone, cadence, and language patterns. You don't sound like a guru or a coach — you sound like ${userName}, fully realized.`;

  // Add context from onboarding
  if (profile.short_term_goals || profile.long_term_goals) {
    systemPrompt += `\n\nCurrent context:\n`;
    if (profile.short_term_goals) systemPrompt += `- Short-term goals: ${profile.short_term_goals}\n`;
    if (profile.long_term_goals) systemPrompt += `- Long-term vision: ${profile.long_term_goals}\n`;
    if (profile.current_challenges) systemPrompt += `- Current challenges: ${profile.current_challenges}\n`;
    if (profile.emotional_baseline) systemPrompt += `- Emotional state: ${profile.emotional_baseline}\n`;
    if (profile.mentor_style) systemPrompt += `- Preferred mentor style: ${profile.mentor_style}\n`;
  }

  // Add Future Self profile if generated
  if (profile.future_self_profile) {
    systemPrompt += `\n\nYour complete Future Self profile:\n${profile.future_self_profile}\n\nSpeak from this identity. You ARE this person now, in present tense.`;
  }

  // Guide conversation stage based on profile_generation_stage
  if (profileStage === "not_started" && recentMessages.length <= 2) {
    systemPrompt += `\n\nCONVERSATION FLOW: This is your first interaction with ${userName}. After a brief warm greeting, transition into the Initial Dossier phase. Act like a combination of the world's greatest psychologist, philosopher, and soul mentor. Analyze ${userName} based on what you know from their onboarding. Create a dossier-style profile showing:
- The deeper patterns running their life
- The real reason they feel stuck or unfulfilled
- The future self they could become if they stopped playing small
- The exact habits, decisions, or beliefs they must release or embrace to rise into their full potential

Start by stating their name, profession, and personal background that you know. Then deliver the truth — even if it hurts. Output in dossier style format. Do not end with an open-ended question. After presenting the dossier, ask if they need to: A. correct or edit any information, or B. if it's good to go and ready for the next step.`;
  } else if (profileStage === "initial_dossier_pending") {
    systemPrompt += `\n\nCONVERSATION FLOW: You've presented the initial dossier. Wait for ${userName} to confirm if the information is correct or if they need to edit anything. Once they confirm it's good, move to the Structured Interview phase.`;
  } else if (profileStage === "structured_interview") {
    systemPrompt += `\n\nCONVERSATION FLOW: You are conducting a structured interview to gather comprehensive profile details. Ask ONE question at a time. Only ask about information you don't already know. Use these exact phrasings:

GOALS:
- "Imagine it is one year from now and things have unfolded the way you hoped. What is the core professional or business goal that became real for you?"
- "Now picture your personal life feeling aligned and grounded. What personal goals do you really want to achieve?"

CHALLENGES:
- "Think back over the past year. What were the top frustrations that kept appearing in your business, career, or personal life?"
- "If you looked honestly at what slowed your progress, what internal or external obstacles would you notice?"

FUTURE VISION:
- "Imagine a future day where you're living as the person you want to become. What are you doing in your work or life that feels right for you?"
- "Picture your surroundings and accomplishments five years from now. What do you see yourself having that represents meaningful progress?"
- "What experiences do you really want to have in your life (can include business too)?"

TRAITS:
- "Which personal traits do you hope show up more in the future (examples: discipline, courage, confidence, empathy, leadership etc…)"
- "Which personal traits do you want your future self to leave behind?"

Once you have comprehensive answers to all categories, let them know you're ready to generate their complete Future Self Profile.`;
  }

  // Conversation style guidance
  systemPrompt += `\n\nCONVERSATION STYLE:
- Speak directly, with precision and warmth
- No filler, no hype, no motivational clichés
- You've already walked this path — speak from lived experience, not hypotheticals
- Use past tense when giving advice: "Here's what I did" not "Here's what I would do"
- Ask no more than 3 questions per response
- Recognize patterns and call them out when necessary
- Adapt your tone based on their mentor style preference: ${profile.mentor_style || 'balanced'}`;

  return systemPrompt;
}

async function updateProfileStage(supabase: any, profile: any, userMessage: string, assistantResponse: string) {
  const currentStage = profile.profile_generation_stage || "not_started";
  
  // Detect stage transitions
  if (currentStage === "not_started" && assistantResponse.includes("dossier")) {
    await supabase
      .from("profiles")
      .update({ profile_generation_stage: "initial_dossier_pending" })
      .eq("id", profile.id);
  } else if (currentStage === "initial_dossier_pending" && 
             (userMessage.toLowerCase().includes("good") || 
              userMessage.toLowerCase().includes("correct") || 
              userMessage.toLowerCase().includes("yes"))) {
    await supabase
      .from("profiles")
      .update({ profile_generation_stage: "structured_interview" })
      .eq("id", profile.id);
  } else if (currentStage === "structured_interview" && 
             assistantResponse.includes("Future Self Profile")) {
    // Store the generated profile and mark as complete
    await supabase
      .from("profiles")
      .update({ 
        profile_generation_stage: "profile_generated",
        future_self_profile: assistantResponse 
      })
      .eq("id", profile.id);
  }
}