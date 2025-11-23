import json
from typing import Any, Dict, List, Optional, TypedDict

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agents import (
    chat_agent,
    fetch_useful_links,
    food_culture_recommender,
    generate_itinerary,
    packing_list_generator,
    recommend_activities,
    weather_forecaster,
    feeling_options_agent,
    question_bank_agent,
    destination_blueprints_agent,
    core_activities_agent,
)

# Load environment variables (e.g., SERPER_API_KEY for GoogleSerperAPIWrapper)
load_dotenv()

# In-memory cache
cache = {}

class PlannerState(TypedDict, total=False):
    """Shared structure for passing data between agents."""

    preferences_text: str
    preferences: Dict[str, Any]
    itinerary: str
    activity_suggestions: str
    useful_links: List[Dict[str, str]]
    weather_forecast: str
    packing_list: str
    food_culture_info: str
    chat_history: List[Dict[str, str]]
    user_question: str
    chat_response: str
    warning: str


class ItineraryRequest(BaseModel):
    preferences: Dict[str, Any] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    preferences: Dict[str, Any] = Field(default_factory=dict)
    itinerary: str = ""
    chat_history: List[Dict[str, str]] = Field(default_factory=list)
    question: str


def build_state(preferences: Dict[str, Any]) -> PlannerState:
    """Create a base state the agents expect."""
    return {
        "preferences_text": json.dumps(preferences, indent=2),
        "preferences": preferences,
        "itinerary": "",
        "activity_suggestions": "",
        "useful_links": [],
        "weather_forecast": "",
        "packing_list": "",
        "food_culture_info": "",
        "chat_history": [],
        "user_question": "",
        "chat_response": "",
    }


def run_all_agents(preferences: Dict[str, Any]) -> PlannerState:
    """Run the itinerary workflow sequentially and collect results."""
    state = build_state(preferences)
    state.update(generate_itinerary.generate_itinerary(state))
    state.update(recommend_activities.recommend_activities(state))
    state.update(fetch_useful_links.fetch_useful_links(state))
    state.update(weather_forecaster.weather_forecaster(state))
    state.update(packing_list_generator.packing_list_generator(state))
    state.update(food_culture_recommender.food_culture_recommender(state))
    return state


def run_chat(
    preferences: Dict[str, Any],
    itinerary: str,
    chat_history: List[Dict[str, str]],
    question: str,
) -> PlannerState:
    """Answer a follow-up question about an itinerary."""
    state = build_state(preferences)
    state["itinerary"] = itinerary
    state["chat_history"] = chat_history
    state["user_question"] = question
    state.update(chat_agent.chat_node(state))
    return state


app = FastAPI(title="Travel Planner API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/feeling-options")
async def feeling_options() -> List[Dict[str, Any]]:
    if "feeling_options" not in cache:
        cache["feeling_options"] = feeling_options_agent.generate_feeling_options({})["feeling_options"]
    return cache["feeling_options"]


@app.get("/api/question-bank")
async def question_bank() -> List[Dict[str, Any]]:
    if "question_bank" not in cache:
        cache["question_bank"] = question_bank_agent.generate_question_bank({})["question_bank"]
    return cache["question_bank"]


@app.get("/api/destination-blueprints")
async def destination_blueprints() -> List[Dict[str, Any]]:
    if "destination_blueprints" not in cache:
        cache["destination_blueprints"] = destination_blueprints_agent.generate_destination_blueprints({})["destination_blueprints"]
    return cache["destination_blueprints"]


@app.get("/api/core-activities")
async def core_activities() -> Dict[str, List[Dict[str, Any]]]:
    if "core_activities" not in cache:
        cache["core_activities"] = core_activities_agent.generate_core_activities({})["core_activities"]
    return cache["core_activities"]


@app.post("/api/itinerary")
async def itinerary_endpoint(payload: ItineraryRequest) -> PlannerState:
    try:
        return run_all_agents(payload.preferences)
    except Exception as exc:  # pragma: no cover - surfaced for manual testing
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/chat")
async def chat_endpoint(payload: ChatRequest) -> PlannerState:
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="question is required")
    try:
        return run_chat(
            payload.preferences,
            payload.itinerary,
            payload.chat_history,
            payload.question,
        )
    except Exception as exc:  # pragma: no cover - surfaced for manual testing
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# To run locally:
# uvicorn api:app --reload
