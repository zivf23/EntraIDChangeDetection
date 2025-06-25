# ===================================================================
# FILENAME: test_openai.py
# Description: A simple script to test the connection to the OpenAI API.
# UPDATED: Added key verification print to help debug authentication issues.
# ===================================================================
import os
import sys
from openai import OpenAI

def test_openai_connection():
    """
    Tests the OpenAI API connection using the environment variable key.
    """
    print("--- Starting OpenAI Connection Test ---")

    # 1. Read the API Key from environment variables
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()

    if not api_key:
        print("\nERROR: OPENAI_API_KEY environment variable is not set.")
        print("Please set it before running the script.")
        sys.exit(1)

    # 2. Print a snippet of the key for verification
    key_snippet = f"{api_key[:5]}...{api_key[-4:]}" if len(api_key) > 9 else "Invalid Key Length"
    print(f"Verifying API Key read by script: {key_snippet}")
    
    print("Initializing client...")
    client = OpenAI(api_key=api_key)

    # 3. Create a sample request to send to GPT
    sample_changes = [
        "Policy Created: 'Block Legacy Authentication'",
        "Policy Modified: 'MFA for all users'"
    ]
    changes_str = "\n".join(f"- {change}" for change in sample_changes)
    prompt = f"In one sentence in Hebrew, what is the impact of these changes: {changes_str}"

    # 4. Send the request and handle the response
    print("Sending a test request to OpenAI API...")
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        
        explanation = response.choices[0].message.content
        print("\n--- SUCCESS! ---")
        print("Connection to OpenAI is working correctly.")
        print("Received response from GPT:")
        print(f"-> {explanation}")

    except Exception as e:
        print("\n--- FAILED! ---")
        print("Could not connect to OpenAI. See the error below.")
        print(f"\nError Type: {type(e).__name__}")
        print(f"Error Details: {e}")
        print("\nACTION REQUIRED:")
        print("1. Compare the key snippet above with the key in your OpenAI dashboard.")
        print("2. If they don't match, re-set your environment variable carefully.")
        print("3. If they DO match, the key itself is likely invalid. Please generate a NEW API key on the OpenAI website and try again.")

if __name__ == '__main__':
    test_openai_connection()
