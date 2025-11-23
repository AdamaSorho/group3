from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from llm import get_llm

# Initialize LLM
llm = get_llm()

def generate_question_bank(state):
    """
    Generate a list of questions for the user to answer.
    """
    prompt = PromptTemplate(
        template="""
        You are a helpful travel assistant. Generate a list of 8-10 questions to ask a user about their travel preferences.
        For each question, provide an `id`, `icon`, `question`, `type`, and optionally `placeholder`, `helper`, `options`, and `dependsOn`.
        The `id` should be a unique camelCase string.
        The `icon` should be a relevant emoji.
        The `question` should be a clear and concise question.
        The `type` should be either "text" or "choice".
        If the `type` is "choice", provide a list of `options`.
        If the `type` is "text", you can provide a `placeholder` and `helper` text.
        The `dependsOn` field should be a JSON object that specifies a condition for the question to be displayed. The object should have a `field` and `value` property. For example, to make a question dependent on the "reconnect" feeling, you would use: `{{"field": "feelings", "value": "reconnect"}}`.
        Make sure one of the questions has an id of "kidFriendly" and depends on the "reconnect" feeling.

        Your response must be a JSON array.

        Example of a single question in the expected JSON array:
        {{
            "id": "travelStyle",
            "icon": "🗺️",
            "question": "What's your ideal travel style?",
            "type": "choice",
            "options": ["Fast-paced & Packed", "Relaxed & Flexible", "A Mix of Both"]
        }}

        Now, generate the full list of 8-10 questions.
        """,
        input_variables=[],
    )

    chain = prompt | llm | JsonOutputParser()
    question_bank = chain.invoke({})
    return {"question_bank": question_bank}

if __name__ == "__main__":
    import json
    result = generate_question_bank({})
    print(json.dumps(result, indent=2))
