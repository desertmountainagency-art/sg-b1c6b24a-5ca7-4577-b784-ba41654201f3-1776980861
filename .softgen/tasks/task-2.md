---
title: Onboarding Intake Flow
status: todo
priority: high
type: feature
tags: [onboarding, ux]
created_by: agent
created_at: 2026-04-23T21:01:09Z
position: 2
---

## Notes
Multi-step onboarding survey collecting name, short/long-term goals, current challenges, emotional baseline, mentor style preference. Generates initial mentor introduction message.

## Checklist
- [ ] Multi-step form component: name → goals → challenges → emotional state → mentor style
- [ ] Store onboarding data in profiles table
- [ ] Generate initial mentor welcome message using user context
- [ ] Redirect to chat interface after completion

## Acceptance
- New users complete intake flow and see personalized mentor greeting
- All onboarding data is saved to database
- Flow feels natural and encouraging, not like a long form