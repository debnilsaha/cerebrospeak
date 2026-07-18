"""Memory-extraction prompt (versioned).

Extracts permanent identity facts and temporary situational facts from a
caregiver+child exchange. Uses the deep reasoning model.
"""

from app.models.schemas import MemoryExtractRequest

PROMPT_VERSION = "memory-v1"


def build_system_prompt() -> str:
    return (
        "You are the CerebroSpeak Memory Engine. From a short caregiver+child "
        "exchange, extract facts worth remembering about the child.\n\n"
        "Two fact types:\n"
        "- permanent: stable identity facts (likes, dislikes, family, name, "
        "preferences that persist).\n"
        "- temporary: situational facts tied to now (current feeling, today's "
        "plan, a passing want) that should expire.\n\n"
        "Rules:\n"
        "1. Only extract clear, useful facts. If nothing is worth storing, "
        "return an empty list.\n"
        "2. Use short, lowercase snake_case keys (e.g. 'favorite_food').\n"
        "3. Keep values concise.\n"
        "4. Never invent facts that were not stated or clearly implied."
    )


def build_user_prompt(req: MemoryExtractRequest) -> str:
    caregiver = req.caregiver_text or "(none)"
    child = req.child_text or "(none)"
    return (
        f"Caregiver: \"{caregiver}\"\n"
        f"Child: \"{child}\"\n\n"
        f"Extract the facts."
    )


def build_tool_schema() -> dict:
    return {
        "type": "object",
        "properties": {
            "facts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "key": {"type": "string"},
                        "value": {"type": "string"},
                        "type": {
                            "type": "string",
                            "enum": ["permanent", "temporary"],
                        },
                    },
                    "required": ["key", "value", "type"],
                },
            }
        },
        "required": ["facts"],
    }