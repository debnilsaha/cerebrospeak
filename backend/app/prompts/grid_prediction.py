"""Grid-prediction prompt (versioned).

Exposes:
  - PROMPT_VERSION: bump when the prompt/schema changes (logged with each call).
  - build_system_prompt(): the system instructions given the context.
  - build_user_prompt(): the per-request user message.
  - build_tool_schema(): the JSON schema the model must fill (guaranteed output).
"""

from app.models.schemas import GridPredictionRequest

PROMPT_VERSION = "grid-v1"

_CATEGORIES = ["pronoun", "verb", "noun", "adjective", "social", "question", "urgent"]


def build_system_prompt() -> str:
    return (
        "You are the CerebroSpeak Prediction Engine, an assistive communication "
        "aid for a non-verbal child using a symbol grid to build sentences.\n\n"
        "Your job: predict the most useful next words the CHILD might want to "
        "select, given what the caregiver said and what the child has typed so far.\n\n"
        "Rules:\n"
        "1. Predict words from the CHILD's first-person perspective (things the "
        "child would say or want).\n"
        "2. Use simple, concrete, age-appropriate vocabulary.\n"
        "3. Categorize each word using the Fitzgerald Key: pronoun, verb, noun, "
        "adjective, social, question, or urgent.\n"
        "4. Mark a word urgent=true ONLY for genuine needs like help, pain, stop, "
        "or bathroom.\n"
        "5. Order words by usefulness (most likely first).\n"
        "6. Never repeat words the child has already selected, and never use any "
        "excluded words.\n"
        "7. Return exactly the requested number of words."
    )


def build_user_prompt(req: GridPredictionRequest) -> str:
    draft = " ".join(req.current_tokens) if req.current_tokens else "(nothing yet)"
    caregiver = req.caregiver_utterance or "(no caregiver speech)"
    excluded = ", ".join(req.exclude_words) if req.exclude_words else "(none)"
    tod = req.time_of_day or "unknown"

    return (
        f"Caregiver just said: \"{caregiver}\"\n"
        f"Child's sentence so far: \"{draft}\"\n"
        f"Time of day: {tod}\n"
        f"Excluded words (do NOT use): {excluded}\n\n"
        f"Predict the {req.grid_size} most useful next words for the child."
    )


def build_tool_schema(grid_size: int) -> dict:
    return {
        "type": "object",
        "properties": {
            "words": {
                "type": "array",
                "minItems": grid_size,
                "maxItems": grid_size,
                "items": {
                    "type": "object",
                    "properties": {
                        "word": {
                            "type": "string",
                            "description": "The word or short phrase to display.",
                        },
                        "category": {
                            "type": "string",
                            "enum": _CATEGORIES,
                            "description": "Fitzgerald Key category.",
                        },
                        "urgent": {
                            "type": "boolean",
                            "description": "True only for urgent needs.",
                        },
                    },
                    "required": ["word", "category", "urgent"],
                },
            }
        },
        "required": ["words"],
    }