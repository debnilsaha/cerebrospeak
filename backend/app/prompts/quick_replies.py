"""Quick-replies prompt (versioned).

Generates a few ready-made, diverse first-person replies to the caregiver.
"""

PROMPT_VERSION = "quickreplies-v1"


def build_system_prompt() -> str:
    return (
        "You are the CerebroSpeak Quick Reply Engine for a non-verbal child. "
        "Given what the caregiver just said, generate 3 diverse, likely, ready-to-"
        "speak replies in the CHILD's first-person voice.\n\n"
        "Rules:\n"
        "1. Make the 3 replies genuinely different (e.g. an affirmative, a "
        "negative, and an alternative).\n"
        "2. Keep each reply short, natural, warm, and age-appropriate.\n"
        "3. Each reply is a complete sentence the child could say as-is."
    )


def build_user_prompt(caregiver_utterance: str) -> str:
    return f'Caregiver said: "{caregiver_utterance}"\n\nGenerate 3 replies.'


def build_tool_schema() -> dict:
    return {
        "type": "object",
        "properties": {
            "replies": {
                "type": "array",
                "minItems": 3,
                "maxItems": 3,
                "items": {"type": "string"},
                "description": "Exactly 3 ready-to-speak first-person replies.",
            }
        },
        "required": ["replies"],
    }