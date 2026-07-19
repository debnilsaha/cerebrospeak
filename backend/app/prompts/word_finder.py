"""Word-finder prompt (versioned).

Given a hint or category the child typed/spoke (e.g. "dino", "animals",
"space things"), return matching, tappable word-cells — the fringe-vocabulary
'Say Anything' path so the child is never limited to predicted words.
"""

PROMPT_VERSION = "wordfinder-v1"

_CATEGORIES = ["pronoun", "verb", "noun", "adjective", "social", "question", "urgent"]


def build_system_prompt() -> str:
    return (
        "You are the CerebroSpeak Word Finder for a non-verbal child's "
        "communication grid. The child (or caregiver) gives a hint, a partial "
        "word, or a category, and you return the specific words they most likely "
        "want — especially concrete nouns and fringe vocabulary.\n\n"
        "Rules:\n"
        "1. Interpret hints generously: 'dino' -> dinosaur, T-rex, etc.; "
        "'animals' -> a variety of animals; 'space' -> rocket, planet, star.\n"
        "2. If the hint is one specific word, put that exact word first, then "
        "closely related options.\n"
        "3. Prefer concrete, age-appropriate, picturable words.\n"
        "4. Categorize each with the Fitzgerald Key: pronoun, verb, noun, "
        "adjective, social, question, or urgent. Most will be 'noun'.\n"
        "5. Return exactly the requested number of words."
    )


def build_user_prompt(query: str, caregiver_utterance: str, grid_size: int) -> str:
    context = (
        f"Conversation context: \"{caregiver_utterance}\"\n"
        if caregiver_utterance.strip()
        else ""
    )
    return (
        f"{context}"
        f"The child is looking for: \"{query}\"\n\n"
        f"Return the {grid_size} best matching words."
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
                        "word": {"type": "string"},
                        "category": {"type": "string", "enum": _CATEGORIES},
                        "urgent": {"type": "boolean"},
                    },
                    "required": ["word", "category", "urgent"],
                },
            }
        },
        "required": ["words"],
    }