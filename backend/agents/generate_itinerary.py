from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from llm import get_llm
import json

def generate_itinerary(state):
    """
    Generate a structured travel itinerary using an AI agent.
    """
    llm = get_llm()

    prompt = PromptTemplate(
        template="""
        You are a travel planning expert. Based on the following user preferences, create a detailed travel itinerary.

        Preferences:
        {preferences_text}

        Your response must be a JSON object with two keys:
        1.  "text": A string containing a concise, engaging summary of the overall trip.
        2.  "days": An array of objects, where each object represents a single day of the itinerary.

        Each day object must have the following structure:
        - "title": A string for the day's theme (e.g., "Day 1: Arrival and Exploration").
        - "activities": An array of strings, where each string is a detailed description of an activity for that day.

        Example of the expected JSON structure:
        {{
            "text": "Get ready for an amazing 3-day adventure in Paris, blending iconic sights with culinary delights!",
            "days": [
                {{
                    "title": "Day 1: Arrival and Montmartre",
                    "activities": [
                        "Arrive at Charles de Gaulle Airport (CDG) and take a taxi to your hotel in Le Marais.",
                        "Settle in and then head out to explore the charming streets of Montmartre.",
                        "Visit the Sacré-Cœur Basilica for breathtaking views of the city.",
                        "Enjoy a classic French dinner at a bistro in Montmartre."
                    ]
                }},
                {{
                    "title": "Day 2: Art and History",
                    "activities": [
                        "Start your day at the Louvre Museum. Be sure to book tickets in advance to see the Mona Lisa.",
                        "Walk through the Tuileries Garden to the Place de la Concorde.",
                        "Explore the Champs-Élysées and see the Arc de Triomphe.",
                        "In the evening, take a romantic dinner cruise on the Seine River."
                    ]
                }}
            ]
        }}

        Now, generate the itinerary based on the user's preferences.
        """,
        input_variables=["preferences_text"],
    )

    try:
        chain = prompt | llm | JsonOutputParser()
        itinerary_json = chain.invoke({"preferences_text": json.dumps(state['preferences'], indent=2)})
        return {"itinerary": itinerary_json}
    except Exception as e:
        return {"itinerary": {"text": "", "days": []}, "warning": f"Failed to generate itinerary: {e}"}
