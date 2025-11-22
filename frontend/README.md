# Travel Itinerary Generator · Group 3

A Vite + React experience that implements the “Travel Itinerary Generator Using AI for Personalized Trip Planning” proposal. The experience focuses on Human-Computer Interaction principles such as progressive disclosure, multimodal feedback, and conversation-driven co-creation rather than complex AI models.

## Experience highlights

- **Feelings-first planning** – Travelers select emotional goals (relaxation, reconnection, adventure, etc.) that drive the rest of the interface.
- **Adaptive questioning** – Contextual questions surface gradually; answers become conversation entries and unlock the “Generate itinerary” action.
- **Conversational interface** – Users can type or dictate ideas through a microphone button that taps the browser’s SpeechRecognition API.
- **Multimodal output** – Generated itineraries include text plans, vibe GIFs, mood boards, clickable map links, and an Excel download with structured blocks.
- **Lightweight activity editing** – Reorder activities per day to reposition moments closer to a hotel or shift energy throughout the day.

## Getting started

```bash
npm install
npm run dev
```

The dev server will print a local URL (default `http://localhost:5173`). Because voice input depends on the browser’s SpeechRecognition implementation, use Chrome or Edge for the full experience.

## Implementation notes

- The interface was built without a backend; itinerary suggestions are synthesized from curated templates and heuristics that respond to the selected vibes and question answers.
- Excel export is powered by [`xlsx`](https://www.npmjs.com/package/xlsx) so users can take the structured grid into spreadsheets or calendars.
- All map links open Google Maps search queries so users can quickly reposition or research the recommended stops. Feel free to integrate additional APIs if you want live data.
