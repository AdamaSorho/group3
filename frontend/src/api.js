const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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
