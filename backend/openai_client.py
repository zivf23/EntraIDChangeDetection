# backend/openai_client.py
import os
import openai

from config import OPENAI_API_KEY, OPENAI_MODEL

# Initialize OpenAI API key
openai.api_key = OPENAI_API_KEY

def get_explanation(changes):
    """Generate an explanatory report for a list of configuration changes using GPT."""
    if not changes:
        return ""
    # Format the changes list into a numbered or bulleted list in the prompt
    changes_text = "\n".join(f"- {item}" for item in changes)
    prompt = (
        "You are an IT assistant. Explain the nature of the following Microsoft Entra ID configuration changes:\n"
        f"{changes_text}\n"
        "For each change, provide the possible reason for the change, its potential impact, and any recommended actions."
    )
    try:
        # Use ChatGPT model to get the explanation
        response = openai.ChatCompletion.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.2
        )
        # Extract the response text
        explanation = response['choices'][0]['message']['content'].strip()
        return explanation
    except Exception as e:
        # In case of an error with the API, log it and return a basic explanation
        error_msg = f"(GPT explanation failed: {e})"
        print(error_msg)
        return error_msg
