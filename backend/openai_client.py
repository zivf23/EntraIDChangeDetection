"""
OpenAI integration module for generating explanations of Entra ID configuration changes.
This module is updated for openai library version >= 1.0.0.
"""

import logging
from typing import List
# --- FIX: Changed 'InvalidRequestError' to 'BadRequestError' ---
from openai import OpenAI, RateLimitError, AuthenticationError, BadRequestError
from config import OPENAI_API_KEY, OPENAI_MODEL

# Set up logging
logger = logging.getLogger(__name__)

# Initialize the client
client = None
if OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}")
else:
    logger.warning("OPENAI_API_KEY is not set. AI explanations will be disabled.")


def get_explanation(changes: List[str]) -> str:
    """
    Generate an AI-powered explanation for configuration changes using the modern OpenAI client.
    """
    if not client:
        return """
        <div class="alert alert-secondary">
            <h4>AI Service Not Configured</h4>
            <p>The OpenAI API key is not configured. AI-powered explanations are currently disabled.</p>
        </div>
        """

    if not changes:
        logger.debug("No changes to explain")
        return ""
    
    # Limit the number of changes to prevent token overflow
    if len(changes) > 50:
        logger.warning(f"Too many changes ({len(changes)}), truncating to 50")
        original_count = len(changes)
        changes = changes[:50]
        changes.append(f"... and {original_count - 50} more changes")
    
    changes_text = "\n".join(f"- {change}" for change in changes)
    
    system_prompt = """You are a Microsoft Entra ID (Azure AD) security expert. 
    Format all responses in clean, semantic HTML without any markdown.
    Be concise but thorough in your analysis."""
    
    user_prompt = f"""Analyze these Microsoft Entra ID configuration changes:

{changes_text}

Provide your analysis in HTML format with these exact sections:

<h3>Summary</h3>
<p>Brief overview of what changed (1-2 sentences)</p>

<h3>Impact Analysis</h3>
<p>How these changes affect the organization</p>
<ul>
<li>User access impacts</li>
<li>Security posture changes</li>
<li>Operational impacts</li>
</ul>

<h3>Security Implications</h3>
<p>Security considerations for these changes</p>
<ul>
<li>Potential risks</li>
<li>Compliance impacts</li>
</ul>

<h3>Recommended Actions</h3>
<p>What administrators should do next</p>
<ul>
<li>Immediate actions</li>
<li>Follow-up tasks</li>
</ul>

Keep the total response under 500 words. Focus on actionable insights."""

    try:
        logger.info(f"Requesting GPT explanation for {len(changes)} changes")
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1000,
            temperature=0.3,
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        explanation = response.choices[0].message.content.strip()
        
        if not explanation.startswith('<'):
            explanation = f"<p>{explanation}</p>"
        
        usage = response.usage
        if usage:
            logger.info(f"GPT response received. Tokens used: {usage.total_tokens}")
        
        return explanation
        
    except RateLimitError as e:
        logger.error(f"OpenAI rate limit exceeded: {e}")
        return """
        <div class="alert alert-warning"><h4>Rate Limit Exceeded</h4><p>The AI service is temporarily unavailable due to rate limits.</p></div>
        """
        
    except AuthenticationError as e:
        logger.error(f"OpenAI authentication failed: {e}")
        return """
        <div class="alert alert-danger"><h4>Authentication Error</h4><p>Unable to authenticate with the AI service. Please check your API key.</p></div>
        """
        
    # --- FIX: Changed 'InvalidRequestError' to 'BadRequestError' ---
    except BadRequestError as e:
        logger.error(f"Invalid OpenAI request: {e}")
        return f"""
        <div class="alert alert-danger"><h4>Configuration Error</h4><p>The AI model '{OPENAI_MODEL}' may not be available. Error: {str(e)}</p></div>
        """
        
    except Exception as e:
        logger.error(f"Unexpected error in GPT explanation: {e}", exc_info=True)
        return f"""
        <div class="alert alert-danger"><h4>Error Generating Explanation</h4><p>An unexpected error occurred.</p><details><summary>Details</summary><pre>{str(e)}</pre></details></div>
        """
