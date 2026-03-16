---
name: genui-media
description: Teaches RovoDev how to signal image generation and audio/TTS requests using structured code fence markers. The backend detects these markers and routes to the appropriate service (AI Gateway for images, TTS API for audio). Use this skill when the user asks to generate, create, draw, or produce visual assets (images, logos, illustrations) or audio content (voiceovers, narration, text-to-speech). Do NOT use for questions about media formats, editing existing files, or explaining how media tools work.
---

# Media Generation Protocol

RovoDev cannot generate images or audio directly. When a user asks for media generation, emit a structured code fence that the backend will intercept and route to the appropriate service.

## Image Generation

When the user wants a new visual asset created — an image, illustration, logo, icon, poster, banner, portrait, or artwork — emit an `image` code fence.

**Trigger phrases:** generate/create/draw/make/design/render + image/picture/photo/illustration/icon/logo/artwork/poster/banner/portrait

### Format

Write a brief 1-sentence acknowledgment, then emit:

````
```image
{"prompt":"A detailed description of the image to generate","style":"optional style guidance"}
```
````

The `prompt` field should be a rich, descriptive prompt that a text-to-image model can use. Expand the user's request into a detailed scene description with subject, composition, lighting, and style details. The `style` field is optional — use it for explicit style requests (photorealistic, cartoon, watercolor, etc.).

### Examples

**User:** "Generate an image of a lighthouse at sunset"

```image
{"prompt":"A tall white lighthouse on a rocky coastal cliff at golden hour sunset, warm orange and pink sky reflecting on calm ocean water, dramatic clouds, photographic quality","style":"photorealistic"}
```

**User:** "Draw me a cute cat icon for my app"

```image
{"prompt":"A friendly cartoon cat face icon, simple flat design, rounded features, warm expression, suitable for an app icon, clean vector style on a transparent background","style":"flat illustration"}
```

### When NOT to use

Do NOT emit an `image` fence for:
- Questions about images: "what format is this image?", "how do I resize a photo?"
- Finding or searching existing images: "find me a photo of...", "show me an image of..."
- Editing or modifying uploaded images: "crop this", "make it brighter"
- Describing what an image contains: "what's in this picture?"

For these, respond with text only.

---

## Audio / Text-to-Speech Generation

When the user wants text converted to audio, narrated aloud, or spoken — emit an `audio` code fence.

**Trigger phrases:** read aloud/narrate/text-to-speech/TTS/voice/speak this/generate audio/create voiceover/say this out loud

### Format

Write a brief 1-sentence acknowledgment, then emit:

````
```audio
{"text":"The exact text to convert to speech","voice":"optional voice preference"}
```
````

The `text` field should contain the finalized script — clean, well-punctuated prose ready for speech synthesis. If the user asks to narrate something from the conversation context (e.g., "read that summary aloud"), extract the relevant text and include it in full. The `voice` field is optional — use it when the user specifies a preference (calm, energetic, male, female, etc.).

### Examples

**User:** "Read this aloud: Four score and seven years ago..."

```audio
{"text":"Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal.","voice":"calm, authoritative"}
```

**User:** "Generate a voiceover for my presentation intro"

First, ask what text they want narrated (use `ask_user_questions` if the script is unclear). Once you have the text:

```audio
{"text":"Welcome to our Q1 product review. Today we'll walk through three key milestones our team achieved this quarter.","voice":"professional, warm"}
```

### When NOT to use

Do NOT emit an `audio` fence for:
- Questions about audio: "what audio format should I use?", "how does TTS work?"
- Music requests: "play some jazz" (this is playback, not generation)
- Transcription: "transcribe this audio file" (this is speech-to-text, not text-to-speech)
- Sound effects or music composition (the TTS service only does speech)

For these, respond with text only.

---

## Combined Requests

If a user asks for both image and audio in the same message (e.g., "create a poster and narrate its contents"), emit both fences in the same response, each with its own acknowledgment line.

## Interaction with GenUI Specs

Media fences and `spec` fences serve different purposes:
- `spec` fences render interactive UI cards inline in the conversation
- `image` and `audio` fences produce persistent artifacts (downloadable, shareable)

If a request combines a visual explanation with media generation (e.g., "show me a dashboard of my work and also generate a team logo"), emit both a `spec` fence for the dashboard and an `image` fence for the logo.
