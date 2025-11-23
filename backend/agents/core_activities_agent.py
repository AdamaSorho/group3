from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from llm import get_llm

# Initialize LLM
llm = get_llm()

def generate_core_activities(state):
    """
    Generate a dictionary of core activities, keyed by feeling.
    """
    prompt = PromptTemplate(
        template="""
        You are a creative travel assistant. Generate a dictionary of core activities for a travel itinerary.
        The dictionary should have keys corresponding to the following feelings: "relax", "adventure", "reconnect", "food", "budget", "celebrate".
        For each feeling, provide a list of 3-4 activities.
        Each activity should be an object with a `title`, `detail`, and `mapQuery`.
        The `title` should be a short, engaging name for the activity.
        The `detail` should be a brief description of the activity.
        The `mapQuery` should be a string that can be used in a Google Maps search.

        Your response must be a JSON object.

        Example of a single key-value pair in the expected JSON object:
        {{
            "relax": [
                {{
                    "title": "Beach Day",
                    "detail": "Soak up the sun on a beautiful sandy beach.",
                    "mapQuery": "beach near me"
                }},
                {{
                    "title": "Spa Treatment",
                    "detail": "Indulge in a relaxing massage or facial.",
                    "mapQuery": "spa near me"
                }}
            ]
        }}

        Now, generate the full dictionary of core activities.
        """,
        input_variables=[],
    )

    chain = prompt | llm | JsonOutputParser()
    core_activities = chain.invoke({})
    return {"core_activities": core_activities}

if __name__ == "__main__":
    import json
    result = generate_core_activities({})
    print(json.dumps(result, indent=2))
