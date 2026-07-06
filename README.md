# AI Skincare & Beauty Routine Advisor

An interactive product advisor that lets users browse a beauty product catalog, build a personalized selection, and generate an AI-powered routine — with a follow-up chat interface for continued Q&A.

**[Live demo](https://sanaadnan25.github.io/ai-skincare-routine-advisor/))**

## What it does

- Browse and filter products by category, or search by keyword
- Select multiple products, with selections persisted via `localStorage`
- Generate a personalized routine using an LLM, based on the exact products selected
- Ask follow-up questions in a multi-turn chat — the advisor keeps conversation context and stays scoped to skincare/haircare/makeup/fragrance topics
- RTL/LTR toggle for layout accessibility

## How it works

The frontend is vanilla JS (no framework) talking to a small **Cloudflare Worker** I deployed as a proxy to an OpenAI-compatible chat completions API. This keeps API credentials off the client and gives a single endpoint to manage rate limiting/logic server-side.

Each chat session builds a `messages` array (`system` / `user` / `assistant` roles) that's sent in full on every request, so the model has the complete conversation history — not just the latest question. The system prompt constrains the advisor to on-topic beauty/routine questions.

**Stack:** HTML/CSS/JS, Cloudflare Workers, OpenAI-compatible chat API

## Notes

This project began from a coursework template (GCA-Classroom) and was extended with the API integration, multi-turn context handling, product search/filter logic, and UI features described above.
