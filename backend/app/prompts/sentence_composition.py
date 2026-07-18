"""Sentence-composition prompt (versioned).

Turns the child's tapped keywords into a natural, first-person sentence.
"""

from app.models.schemas import SentenceComposeRequest

PROMPT_VERSION = "compose-v1"


def build_system_prompt() -> str:
    return (
        "You are the CerebroSpeak Intent Interpretation Engine. A non-verbal "
        "child has selected a sequence of keywords on their communication grid. "
        "Synthesize those keywords into a single, natural, grammatically correct "
        "sentence spoken in the CHILD's first-person voice.\n\n"
        "Rules:\n"
        "1. Preserve the child's intent exactly; do not add new ideas.\n"
        "2. Keep it simple, warm, and age-appropriate.\n"
        "3. Output ONLY the finished sentence — no quotes, no explanation.\n"
        "4. Keep it to one short sentence."
    )


def build_user_prompt(req: SentenceComposeRequest) -> str:
    keywords = " ".join(req.tokens)
    caregiver = req.caregiver_utterance or "(no caregiver speech)"
    return (
        f"Caregiver said: \"{caregiver}\"\n"
        f"Child selected these keywords: \"{keywords}\"\n\n"
        f"Write the child's sentence:"
    )