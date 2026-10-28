import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Configure standard application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("attendai.config")


class Config:
    """Centralized configuration for AttendAI Flask Backend."""

    # Flask settings
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    PORT: int = int(os.getenv("PORT", "5000"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "attendai-dev-secret-key")

    # Supabase credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    # ElevenLabs Conversational AI Outbound Call credentials
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    ELEVENLABS_AGENT_ID: str = os.getenv("ELEVENLABS_AGENT_ID", "")
    ELEVENLABS_PHONE_NUMBER_ID: str = os.getenv("ELEVENLABS_PHONE_NUMBER_ID", "")
    ELEVENLABS_WEBHOOK_SECRET: str = os.getenv("ELEVENLABS_WEBHOOK_SECRET", "")

    # ElevenLabs Outbound Calling API URL
    # Official endpoint for Conversational AI Twilio Outbound Call
    ELEVENLABS_OUTBOUND_URL: str = os.getenv(
        "ELEVENLABS_OUTBOUND_URL",
        "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
    )


def get_supabase_client() -> Client:
    """
    Initializes and returns the official Supabase Python client.
    Raises RuntimeError if SUPABASE_URL or SUPABASE_KEY are missing.
    """
    if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
        logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
        raise RuntimeError(
            "Supabase configuration is incomplete. Please set SUPABASE_URL and SUPABASE_KEY in .env."
        )
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)


# Singleton instance initialized when credentials are present
supabase: Client | None = None
try:
    if Config.SUPABASE_URL and Config.SUPABASE_KEY:
        supabase = get_supabase_client()
        logger.info("Supabase client initialized successfully.")
    else:
        logger.warning(
            "Supabase credentials not set yet. Populate SUPABASE_URL and SUPABASE_KEY in .env."
        )
except Exception as exc:
    logger.error(f"Failed to initialize Supabase client: {exc}")
