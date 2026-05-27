// docs\architecture\ai.md
## AI Stack
- OpenAI
- AI SDK
- Structured outputs

### AI Protection
- token limits,
- request quotas,
- prompt injection mitigation.


## AI Locale Awareness
Prompts must receive:

```ts
locale: "pl" | "en"
```

# Prompt system:
- Base prompt: Same for all prompts in the entire application
- Branch prompt: Dodaje kontekst danego workspace (np. dodajac inforamcje o firmie)
- Workspace custom instructions (dodatkowe instrukcje które można dodać per workspace)
- Uploaded files context 
- User request

# AI Cost Strategy
- model usage,
- limity,
- fallback models,