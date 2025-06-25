# ===================================================================
# FILENAME: openai_client.py
# Description: Handles communication with the OpenAI API.
# UPDATED: Your test script was converted into a reusable function.
# ===================================================================
import os
from openai import OpenAI
from backend.config import OPENAI_API_KEY, OPENAI_MODEL

def get_change_explanation(changes_list):
    """
    Sends a list of changes to GPT and asks for a one-sentence summary in Hebrew.
    """
    if not OPENAI_API_KEY:
        print("[OpenAI] OPENAI_API_KEY is not set. Skipping explanation.")
        return "ניתוח GPT לא זמין. מפתח API חסר."

    if not changes_list:
        return "לא זוהו שינויים."

    # In case of initial capture, provide a standard explanation.
    if len(changes_list) == 1 and "Initial configuration" in changes_list[0]:
        return "זוהי התצורה הראשונית של המדיניות שנשמרה במערכת. אין שינויים קודמים להשוואה."
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    changes_str = "\n".join(f"- {change}" for change in changes_list)
    prompt = f"""
    You are an expert Israeli cyber-security analyst.
    The following changes were detected in Microsoft Entra Conditional Access policies.
    Please explain the overall security impact in one clear sentence in Hebrew.
    Focus on the risk or benefit. For example: "השינויים מחזקים את האבטחה על ידי דרישת אימות רב-גורמי למשתמשים נוספים."

    Changes:
    {changes_str}
    """

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=100
        )
        explanation = response.choices[0].message.content.strip()
        print(f"[OpenAI] Successfully received explanation: {explanation}")
        return explanation
    except Exception as e:
        print(f"[OpenAI] Failed to get explanation from OpenAI. Error: {e}")
        return "שגיאה בעת יצירת ניתוח השינויים על ידי GPT."