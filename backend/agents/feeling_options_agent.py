from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from llm import get_llm

# Initialize LLM
llm = get_llm()

def generate_feeling_options(state):
    """
    Generate a list of travel "feeling options" using an AI agent.
    """
    prompt = PromptTemplate(
        template="""
        You are a creative travel assistant. Generate a list of 6-8 travel "feeling options" that a user can choose from to describe their desired trip.
        For each option, provide an `id`, `label`, `description`, `color`, `gif` URL, and a list of two `moodImages` URLs.
        The `id` should be a single word in lowercase.
        The `label` should be a short, descriptive title.
        The `description` should be a brief, evocative sentence.
        The `color` should be a hex code.
        The `gif` URL should be a relevant, high-quality GIF from a reputable source like Giphy.
        The `moodImages` URLs should be high-quality, atmospheric images from a source like Unsplash.

        Your response must be a JSON array.

        Example of a single item in the expected JSON array:
        {{
            "id": "adventurous",
            "label": "Adventurous",
            "description": "For thrill-seekers and explorers.",
            "color": "#FF6B6B",
            "gif": "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa3JzYWRsNmZrcGF2b3ZncWxpb3J2b2tqY3pmbHh1c2VpZ3N5cmc0eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKWpu216g661My4/giphy.gif",
            "moodImages": [
                "https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=2073&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop"
            ]
        }}

        Now, generate the full list of 6-8 feeling options.
        """,
        input_variables=[],
    )

    chain = prompt | llm | JsonOutputParser()
    feeling_options = chain.invoke({})
    return {"feeling_options": feeling_options}

if __name__ == "__main__":
    import json
    result = generate_feeling_options({})
    print(json.dumps(result, indent=2))
