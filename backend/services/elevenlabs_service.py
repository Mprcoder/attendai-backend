import logging
import threading
from typing import Dict, Any, Optional
import requests
from config import Config, get_supabase_client, supabase

logger = logging.getLogger("attendai.elevenlabs_service")


def trigger_elevenlabs_call(
    student_phone: str,
    student_name: str,
    attendance_log_id: Optional[str] = None,
    date_str: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Triggers an automated outbound phone call to an absent student via the
    ElevenLabs Conversational AI Agent Outbound Calling API.

    Once ElevenLabs returns a `call_id` (or `conversation_id` / `callSid`),
    this function updates the corresponding row in Supabase `attendance_logs`
    so the post-call webhook (`/webhook/elevenlabs`) can match and store the
    student's absentee reason.

    Args:
        student_phone (str): Student's phone number in E.164 format (e.g. "+919876543210").
        student_name (str): Full name of the absent student.
        attendance_log_id (Optional[str]): UUID of the `attendance_logs` record to update.
        date_str (Optional[str]): Attendance date string (YYYY-MM-DD) for dynamic prompt context.

    Returns:
        Dict[str, Any]: Result dictionary containing `success`, `call_id`, and API response details.
    """
    if not Config.ELEVENLABS_API_KEY or not Config.ELEVENLABS_AGENT_ID:
        logger.error(
            "ElevenLabs credentials missing (ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID)."
        )
        return {
            "success": False,
            "error": "Missing ElevenLabs API key or Agent ID in environment variables.",
        }

    # Normalize phone number to clean E.164 format (strip spaces/hyphens)
    formatted_phone = "".join(
        ch for ch in student_phone if ch.isdigit() or ch == "+"
    )

    headers = {
        "xi-api-key": Config.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }

    # Payload for ElevenLabs Conversational AI Outbound Call API
    payload: Dict[str, Any] = {
        "agent_id": Config.ELEVENLABS_AGENT_ID,
        "agent_phone_number_id": Config.ELEVENLABS_PHONE_NUMBER_ID,
        "to_number": formatted_phone,
        "conversation_initiation_client_data": {
            "dynamic_variables": {
                "student_name": student_name,
                "student_phone": formatted_phone,
                "attendance_date": date_str or "today",
                "attendance_log_id": attendance_log_id or "",
            }
        },
    }

    try:
        logger.info(
            f"Initiating ElevenLabs outbound call to {student_name} ({formatted_phone})..."
        )
        response = requests.post(
            Config.ELEVENLABS_OUTBOUND_URL,
            json=payload,
            headers=headers,
            timeout=15,
        )
        response.raise_for_status()
        resp_data = response.json()

        # ElevenLabs Conversational AI returns `conversation_id` or `call_id` / `callSid`
        call_id = (
            resp_data.get("call_id")
            or resp_data.get("conversation_id")
            or resp_data.get("callSid")
        )

        logger.info(
            f"ElevenLabs call initiated for {student_name}. call_id={call_id}"
        )

        # Persist the returned call_id into Supabase `attendance_logs`
        if call_id and attendance_log_id:
            db = supabase or get_supabase_client()
            db.table("attendance_logs").update({"call_id": str(call_id)}).eq(
                "id", attendance_log_id
            ).execute()
            logger.info(
                f"Updated attendance_logs(id={attendance_log_id}) with call_id={call_id}"
            )

        return {
            "success": True,
            "call_id": call_id,
            "student_name": student_name,
            "student_phone": formatted_phone,
            "raw_response": resp_data,
        }

    except requests.exceptions.HTTPError as http_err:
        err_body = (
            http_err.response.text if http_err.response is not None else str(http_err)
        )
        logger.error(
            f"ElevenLabs HTTP error while calling {student_name} ({formatted_phone}): {err_body}"
        )
        return {
            "success": False,
            "error": f"ElevenLabs API HTTP Error: {err_body}",
        }
    except requests.exceptions.RequestException as req_err:
        logger.error(
            f"Network error calling ElevenLabs API for {student_name}: {req_err}"
        )
        return {
            "success": False,
            "error": f"Request failed: {str(req_err)}",
        }
    except Exception as exc:
        logger.exception(
            f"Unexpected error in trigger_elevenlabs_call for {student_name}: {exc}"
        )
        return {
            "success": False,
            "error": str(exc),
        }


def trigger_elevenlabs_call_async(
    student_phone: str,
    student_name: str,
    attendance_log_id: Optional[str] = None,
    date_str: Optional[str] = None,
) -> threading.Thread:
    """
    Spawns a non-blocking background daemon thread to invoke `trigger_elevenlabs_call`
    so the POST `/api/attendance/mark` HTTP response returns immediately to the HOD UI.
    """
    thread = threading.Thread(
        target=trigger_elevenlabs_call,
        kwargs={
            "student_phone": student_phone,
            "student_name": student_name,
            "attendance_log_id": attendance_log_id,
            "date_str": date_str,
        },
        daemon=True,
    )
    thread.start()
    return thread
