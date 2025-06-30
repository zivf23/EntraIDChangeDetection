"""
OpenAI integration module for generating explanations of Entra ID configuration changes.

This module uses GPT to analyze configuration changes and provide:
- Summary of what changed
- Impact analysis
- Security implications
- Recommended actions

The output is formatted as HTML for display in the web interface.
"""

import openai
import logging
from typing import List, Optional

from config import OPENAI_API_KEY, OPENAI_MODEL

# Configure OpenAI client
openai.api_key = OPENAI_API_KEY

# Set up logging
logger = logging.getLogger(__name__)

def get_explanation(changes: List[str]) -> str:
    """
    Generate an AI-powered explanation for configuration changes.
    
    This function sends the list of changes to OpenAI's GPT model and receives
    a structured explanation formatted in HTML.
    
    Args:
        changes: List of configuration changes detected
        
    Returns:
        HTML-formatted explanation of the changes, or error message on failure
        
    Example:
        >>> changes = ["Added user 'john@company.com'", "Modified MFA policy"]
        >>> explanation = get_explanation(changes)
        >>> print(explanation)
        <h3>Summary</h3><p>Two configuration changes were detected...</p>
    """
    # Return empty string if no changes
    if not changes:
        logger.debug("No changes to explain")
        return ""
    
    # Limit the number of changes to prevent token overflow
    if len(changes) > 50:
        logger.warning(f"Too many changes ({len(changes)}), truncating to 50")
        changes = changes[:50]
        changes.append(f"... and {len(changes) - 50} more changes")
    
    # Format changes as a bulleted list
    changes_text = "\n".join(f"- {change}" for change in changes)
    
    # Create a detailed prompt for GPT
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
        
        # Make API call to OpenAI
        response = openai.ChatCompletion.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1000,
            temperature=0.3,  # Lower temperature for more consistent output
            presence_penalty=0.1,
            frequency_penalty=0.1
        )
        
        # Extract the explanation
        explanation = response['choices'][0]['message']['content'].strip()
        
        # Validate HTML output
        if not explanation.startswith('<'):
            # Wrap in paragraph if GPT didn't return HTML
            explanation = f"<p>{explanation}</p>"
        
        # Log token usage for monitoring
        usage = response.get('usage', {})
        logger.info(f"GPT response received. Tokens used: {usage.get('total_tokens', 'N/A')}")
        
        return explanation
        
    except openai.error.RateLimitError as e:
        logger.error(f"OpenAI rate limit exceeded: {e}")
        return """
        <div class="alert alert-warning">
            <h4>Rate Limit Exceeded</h4>
            <p>The AI service is temporarily unavailable due to rate limits. 
            Please try again in a few moments.</p>
        </div>
        """
        
    except openai.error.AuthenticationError as e:
        logger.error(f"OpenAI authentication failed: {e}")
        return """
        <div class="alert alert-danger">
            <h4>Authentication Error</h4>
            <p>Unable to authenticate with the AI service. 
            Please check your OpenAI API key configuration.</p>
        </div>
        """
        
    except openai.error.InvalidRequestError as e:
        logger.error(f"Invalid OpenAI request: {e}")
        return f"""
        <div class="alert alert-danger">
            <h4>Configuration Error</h4>
            <p>The AI model '{OPENAI_MODEL}' may not be available. 
            Error: {str(e)}</p>
        </div>
        """
        
    except Exception as e:
        logger.error(f"Unexpected error in GPT explanation: {e}", exc_info=True)
        return f"""
        <div class="alert alert-danger">
            <h4>Error Generating Explanation</h4>
            <p>An unexpected error occurred while generating the analysis. 
            Please check the logs for details.</p>
            <details>
                <summary>Technical Details</summary>
                <pre>{str(e)}</pre>
            </details>
        </div>
        """