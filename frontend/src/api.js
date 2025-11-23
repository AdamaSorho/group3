const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function getJSON(path) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }
  return response.json();
}

async function postJSON(path, body) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }
  return response.json();
}

export function getFeelingOptions() {
  return getJSON("/api/feeling-options");
}

export function getQuestionBank() {
  return getJSON("/api/question-bank");
}

export function getDestinationBlueprints() {
  return getJSON("/api/destination-blueprints");
}

export function getCoreActivities() {
  return getJSON("/api/core-activities");
}

export function requestItinerary(preferences) {
  return postJSON("/api/itinerary", { preferences });
}

export function requestChat({ preferences, itinerary, chatHistory, question }) {
  return postJSON("/api/chat", {
    preferences,
    itinerary,
    chat_history: chatHistory,
    question,
  });
}
