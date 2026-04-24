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

    // Get user profile and conversation history
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Get recent messages for context
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    const conversationHistory = (recentMessages || []).reverse();

    // Build messages array for OpenAI
    const systemPrompt = buildSystemPrompt(profile, conversationHistory);
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Save user message first
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });

    // Set up streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // Call OpenAI with streaming
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.8,
      max_tokens: 2000,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Send completion signal
    res.write(`data: [DONE]\n\n`);

    // Save assistant message to database
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: fullResponse,
    });

    // Check if profile generation stage should advance
    await updateProfileStage(supabase, profile, message, fullResponse);

    res.end();
  } catch (error) {
    console.error("Chat API error:", error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process message" 
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`);
      res.end();
    }
  }
}

function buildSystemPrompt(profile: any, recentMessages: any[]): string {
  const currentStage = profile.profile_generation_stage || "not_started";
  
  let systemPrompt = `You are the future self of ${profile.name}. You have already achieved their goals and overcome their challenges. You speak from lived experience, not hypotheticals.

User Context:
- Name: ${profile.name}
- Short-term goals: ${profile.short_term_goals || "Not specified"}
- Long-term goals: ${profile.long_term_goals || "Not specified"}
- Current challenges: ${profile.current_challenges || "Not specified"}
- Emotional baseline: ${profile.emotional_baseline || "Not specified"}
- Preferred mentor style: ${profile.mentor_style || "balanced"}
`;

  if (currentStage === "not_started") {
    systemPrompt += `\n\nThis is the first conversation. Execute PROMPT #1 from the Future Self generation process:

Analyze ${profile.name} based on what you know. Create a dossier-style profile showing:
- The deeper patterns running their life
- The real reason they feel stuck or unfulfilled
- The future self they could become if they stopped playing small
- The exact habits, decisions, or beliefs they must release or embrace to rise into their full potential

Output format is in a dossier style profile. Be direct and truthful.

After completing the dossier, ask: "Do you need to A. correct or edit any of this information, or B. is it good to go?"`;
  } else if (currentStage === "initial_dossier_pending") {
    systemPrompt += `\n\nThe user is reviewing the initial dossier. Wait for their confirmation (A or B) before proceeding to structured interview questions.`;
  } else if (currentStage === "structured_interview") {
    systemPrompt += `\n\nExecute PROMPT #2: Structured Profile Building.

Ask ONE question at a time from these categories:
- Core Identity (if not already known)
- Goals (professional and personal)
- Challenges (frustrations and obstacles)
- Future Vision (aspirations to DO, HAVE, EXPERIENCE)
- Traits to Change (traits to develop, traits to leave behind)

ONLY ask questions for information you don't already have. Skip questions automatically when answers are known from the onboarding data above.

Be warm, curious, and supportive. Ask one question at a time. Keep responses conversational.`;
  } else if (currentStage === "profile_generated") {
    systemPrompt += `\n\nYou have completed the profile generation. Here is ${profile.name}'s Future Self Identity:

${profile.future_self_profile || "Profile not yet generated"}

Now operate as their fully realized future self. Speak in present tense about who they are now (in the future). Reference the profile naturally in your guidance. Adapt your tone to their preferred mentor style: ${profile.mentor_style}.`;
  }

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
              userMessage.toLowerCase().includes("yes") ||
              userMessage.toLowerCase().includes("b"))) {
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