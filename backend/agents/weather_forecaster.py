from langchain_core.messages import HumanMessage
from langchain_community.chat_models import ChatOllama

def weather_forecaster(state):
    llm = ChatOllama(model="gemma3:1b", base_url="http://127.0.0.1:11434")
    prompt = f"""
    Based on the destination and month, provide a detailed weather forecast including temperature, precipitation, and advice for travelers:
    Destination: {state['preferences'].get('destination', '')}
    Month: {state['preferences'].get('month', '')}
    """
    try:
        result = llm.invoke([HumanMessage(content=prompt)]).content
        return {"weather_forecast": result.strip()}
    except Exception as e:
        return {"weather_forecast": "", "warning": str(e)}