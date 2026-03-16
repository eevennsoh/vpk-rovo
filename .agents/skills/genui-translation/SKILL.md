---
name: genui-translation
description: Teaches RovoDev how to handle translation requests using its existing Google Cloud Translate MCP tool and present results in interactive GenUI spec cards. Use when the user asks to translate text between languages, convert text to another language, or asks "how do you say X in Y". The skill guides RovoDev to call the translate tool directly and present results in a structured spec card with source text, translated text, and language metadata.
---

# Translation Protocol

RovoDev has access to the Google Cloud Translate tool via its MCP servers. When a user asks for translation, use the tool directly and present results in a visual `spec` card.

## When to Use

**Trigger phrases:** translate/translation, "how do you say X in Y", "what is X in French", convert to [language], "say this in [language]"

## Flow

### Step 1: Gather Required Details

Before translating, ensure you have:
1. **Source text** — the text to translate
2. **Target language** — the language to translate into

If either is missing, use `ask_user_questions` to collect them:
- "What text should I translate?" (if source is unclear)
- "What language should I translate it to?" (if target is missing)

Do NOT guess missing details. Do NOT proceed without both source text and target language.

### Step 2: Call the Translation Tool

Use the Google Cloud Translate MCP tool (`google_gcp_atlassian_translate_translate_text`) with the source text and target language.

### Step 3: Present Results as a Spec Card

After receiving the translation result, emit a `spec` card showing both the original and translated text:

```spec
{"op":"add","path":"/root","value":"main"}
{"op":"add","path":"/elements/main","value":{"type":"Stack","props":{"gap":"md"},"children":["heading","sourceCard","translatedCard"]}}
{"op":"add","path":"/elements/heading","value":{"type":"Heading","props":{"text":"Translation","level":"h3"},"children":[]}}
{"op":"add","path":"/elements/sourceCard","value":{"type":"Card","props":{"title":"Original (English)"},"children":["sourceText"]}}
{"op":"add","path":"/elements/sourceText","value":{"type":"Text","props":{"content":"The original text here"}}}
{"op":"add","path":"/elements/translatedCard","value":{"type":"Card","props":{"title":"Translated (French)"},"children":["translatedText"]}}
{"op":"add","path":"/elements/translatedText","value":{"type":"Text","props":{"content":"Le texte original ici"}}}
```

Adapt the card titles to show the actual source and target languages. For longer translations, include the full text in the card.

## When NOT to Use

- Language learning questions: "how does French grammar work?" → respond with text
- Asking about translation services: "what translation API should I use?" → respond with text
- Requests involving non-text translation: "translate this image" → respond with text explaining limitations
