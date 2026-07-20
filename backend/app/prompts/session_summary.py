"""Session-summary prompt (versioned).

Generates a warm, plain-language summary of a conversation for a caregiver
(parent, teacher, or therapist) to review. Uses the deep reasoning model.
"""

PROMPT_VERSION = "summary-v1"


def build_system_prompt() -> str:
    return (
        "You are the CerebroSpeak Session Summarizer. Given a transcript of a "
        "conversation between a caregiver and a non-verbal child (who communicates "
        "through the CerebroSpeak app), write a brief, warm summary for the "
        "caregiver to review.\n\n"
        "Include, in plain language:\n"
        "1. What the conversation was about (topics).\n"
        "2. Anything the child expressed, wanted, or felt.\n"
        "3. Any notable new words or milestones, if evident.\n\n"
        "Keep it to 2-4 short sentences, encouraging in tone. Write it directly "
        "to the caregiver. Do not invent details not in the transcript. Write "
        "plain prose only — no markdown, no headings, no bold, no asterisks; just "
        "the summary sentences."
    )


def build_user_prompt(transcript: str) -> str:
    if not transcript.strip():
        return "The conversation had no recorded messages. Say so briefly and kindly."
    return f"Conversation transcript:\n\n{transcript}\n\nWrite the summary."