---
title: AI Chat Interface
status: todo
priority: high
type: feature
tags: [chat, ai, openai]
created_by: agent
created_at: 2026-04-23T21:01:09Z
position: 3
---

## Notes
Conversational UI for mentor chat. OpenAI integration with future-self persona prompt. Real-time message streaming. Stores all messages in database. Mentor calibrates tone with opening question.

## Checklist
- [ ] Chat UI component: message list, input field, send button, typing indicators
- [ ] OpenAI API route: system prompt injection with user context, streaming responses
- [ ] Message persistence: save all sent/received messages to database
- [ ] Mentor persona: inject name, goals, context into system message
- [ ] Calibration question: "Want to talk this out like a friend, or do you want the full plan?"

## Acceptance
- User can send messages and receive contextual mentor responses
- Mentor speaks in past tense as future self
- Conversation history persists across sessions