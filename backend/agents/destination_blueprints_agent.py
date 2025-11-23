from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from llm import get_llm

# Initialize LLM
llm = get_llm()

def generate_destination_blueprints(state):
    """
    Generate a list of travel "destination blueprints" using an AI agent.
    """
    prompt = PromptTemplate(
        template="""
        You are a creative travel assistant. Generate a list of 4-6 travel "destination blueprints".
        For each blueprint, provide an `id`, `destination`, `feelings`, `climate`, `budget`, `description`, `mapAnchor`, and `highlight`.
        The `id` should be a single word in lowercase.
        The `destination` should be a string in the format "City, Country".
        The `feelings` should be a list of 2-3 feeling `id`s that match the destination.
        The `climate` should be either "cooler" or "warmer".
        The `budget` should be one of "budget-friendly", "balanced", or "luxury".
        The `description` should be a brief, evocative sentence.
        The `mapAnchor` should be a string that can be used in a Google Maps search.
        The `highlight` should be a short, exciting description of a signature moment.

        Your response must be a JSON array.

        Example of a single blueprint in the expected JSON array:
        {{
            "id": "paris",
            "destination": "Paris, France",
            "feelings": ["romantic", "cultural", "foodie"],
            "climate": "cooler",
            "budget": "luxury",
            "description": "The city of love, lights, and art.",
            "mapAnchor": "Eiffel Tower, Paris, France",
            "highlight": "A romantic dinner cruise on the Seine River."
        }}

        Now, generate the full list of 4-6 destination blueprints.
        """,
        input_variables=[],
    )

    chain = prompt | llm | JsonOutputParser()
    destination_blueprints = chain.invoke({})
    return {"destination_blueprints": destination_blueprints}

if __name__ == "__main__":
    import json
    result = generate_destination_blueprints({})
    print(json.dumps(result, indent=2))
