# RailSense AI for SIH 2026

## Positioning

RailSense AI is a RailMadad assist layer, not a replacement for RailMadad. The winning claim is narrower and stronger: reduce passenger friction at complaint intake and convert unstructured multilingual complaints into staff-ready incident records.

## What Judges Need To See

1. Passenger speaks or types in English, Hindi, Kannada, Telugu, or Tamil.
2. Groq extracts issue category, train, coach, berth, and PNR into structured JSON.
3. NVIDIA NIM reads a ticket photo when the passenger cannot type the PNR.
4. Zoho Catalyst Functions protect provider keys and own all backend calls.
5. Zoho Data Store persists complaints, status, and timelines.
6. Sarvam handles server-side STT/TTS so speech credentials never reach the browser.
7. PNR lookup is demo-seeded railway data, not a fake IRCTC integration.

## Differentiator

Most complaint demos stop at filing. This one makes the backend operationally useful:

- rule-based severity scoring that is explainable to railway staff;
- recurrence detection by train, coach, issue, and recent time window;
- device-local passenger tracking without login;
- evidence capture ready for Zoho File Store once a Catalyst folder is configured;
- multilingual intake without forcing passengers through forms.

## Honest Boundaries

- RailMadad official APIs are not assumed.
- PNR data is local seeded demo data.
- Provider keys must live in Catalyst environment variables:
  - `GROQ_API_KEY`
  - `SARVAM_API_KEY`
  - `NVIDIA_NIM_API_KEY`
- Optional model overrides:
  - `GROQ_MODEL`
  - `NVIDIA_NIM_VISION_MODEL`
  - `SARVAM_TTS_SPEAKER`

## Demo Script

Open with the passenger pain: a tired passenger should not need to find the right form category while standing in a coach.

Then show one live flow:

1. Select language.
2. Speak or type a messy complaint with coach and/or PNR.
3. Show AI-extracted tags and missing-field follow-up.
4. Upload ticket photo if PNR is missing.
5. Submit complaint.
6. Track the generated `RS-YYYY-XXXXX` ID.

Close with the staff value: every passenger complaint becomes a structured, prioritized incident with a timeline.
