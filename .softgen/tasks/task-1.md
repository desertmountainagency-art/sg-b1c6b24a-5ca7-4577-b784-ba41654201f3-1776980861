---
title: Foundation & Authentication
status: in_progress
priority: urgent
type: feature
tags: [auth, database, design-system]
created_by: agent
created_at: 2026-04-23T21:01:09Z
position: 1
---

## Notes
Core infrastructure: design system, database schema, authentication service, landing page. Users must be able to sign up with email and see a welcoming landing page that explains the concept.

## Checklist
- [ ] Design system: update globals.css with warm sage/cream palette, import Cormoant Garamond + Inter fonts, configure tailwind tokens
- [ ] Database schema: profiles table (name, goals, challenges, emotional_baseline, mentor_style), conversations table, messages table, goals table with RLS policies
- [ ] Authentication service: email signup/login with Supabase Auth
- [ ] Landing page: hero explaining "your future self as mentor", email signup CTA, clean intimate design
- [ ] Header navigation: logo, sign in/sign up buttons

## Acceptance
- User can visit landing page and understand the concept
- User can sign up with email and receive confirmation
- Design feels calm, spacious, and contemplative