import logging
from flask import Blueprint, request, jsonify
from config import supabase, get_supabase_client

logger = logging.getLogger("attendai.webhook_routes")

webhook_bp = Blueprint("webhook", __name__, url_prefix="/webhook")


@webhook_bp.route("/elevenlabs", methods=["POST"])
def elevenlabs_post_call_webhook():
    """
    POST /webhook/elevenlabs
    Receives the post-call webhook from ElevenLabs Conversational AI containing
    the conversation transcript and call summary (reason for absence).

    Supports both flat webhook payloads:
      {
          "call_id": "conv_abc123",
          "summary": "Medical appointment at city clinic",
          "transcript": [...]
      }
    and nested ElevenLabs Conversational AI `post_call_transcription` event structures:
      {
          "type": "post_call_transcription",
          "data": {
              "conversation_id": "conv_abc123",
              "analysis": {
                  "transcript_summary": "Student had a medical emergency."
              },
              "conversation_initiation_client_data": {
                  "dynamic_variables": {
                      "attendance_log_id": "..."
                  }
              }
          }
      }
    """
    try:
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Invalid or missing JSON payload."}), 400

        logger.info("Received ElevenLabs post-call webhook payload.")

        # Support both top-level and nested `data` objects from ElevenLabs
        data_obj = payload.get("data") if isinstance(payload.get("data"), dict) else payload

        # 1. Extract `call_id` (or `conversation_id` / `callSid`)
        call_id = (
            payload.get("call_id")
            or payload.get("conversation_id")
            or data_obj.get("call_id")
            or data_obj.get("conversation_id")
            or data_obj.get("callSid")
        )

        # 2. Extract `summary` (from top-level `summary`, `absentee_reason`, or `analysis.transcript_summary`)
        analysis = data_obj.get("analysis") or {}
        data_collection = analysis.get("data_collection_results") or {}
        reason_field = data_collection.get("absentee_reason") or {}

        summary = (
            payload.get("summary")
            or payload.get("absentee_reason")
            or data_obj.get("summary")
            or reason_field.get("value")
            or analysis.get("transcript_summary")
            or analysis.get("call_summary")
        )

        # Fallback: check dynamic_variables for attendance_log_id if provided
        client_data = data_obj.get("conversation_initiation_client_data") or {}
        dynamic_vars = client_data.get("dynamic_variables") or {}
        attendance_log_id = (
            payload.get("attendance_log_id")
            or dynamic_vars.get("attendance_log_id")
        )

        if not call_id and not attendance_log_id:
            return (
                jsonify(
                    {
                        "error": "Missing 'call_id' (or 'conversation_id') in webhook payload."
                    }
                ),
                400,
            )

        if not summary:
            return (
                jsonify(
                    {
                        "error": "Missing 'summary' (or 'analysis.transcript_summary') in webhook payload."
                    }
                ),
                400,
            )

        db = supabase or get_supabase_client()

        # 3. Update `absentee_reason` in Supabase `attendance_logs` where `call_id` matches
        if call_id:
            update_resp = (
                db.table("attendance_logs")
                .update({"absentee_reason": str(summary).strip()})
                .eq("call_id", str(call_id))
                .execute()
            )
            updated_rows = update_resp.data or []
        else:
            updated_rows = []

        # Fallback match by `attendance_log_id` if `call_id` wasn't matched yet
        if not updated_rows and attendance_log_id:
            update_Payload = {"absentee_reason": str(summary).strip()}
            if call_id:
                update_Payload["call_id"] = str(call_id)
            update_resp = (
                db.table("attendance_logs")
                .update(update_Payload)
                .eq("id", str(attendance_log_id))
                .execute()
            )
            updated_rows = update_resp.data or []

        if not updated_rows:
            logger.warning(
                f"No attendance_logs record found matching call_id='{call_id}'."
            )
            return (
                jsonify(
                    {
                        "error": f"No attendance record found for call_id '{call_id}'.",
                        "call_id": call_id,
                    }
                ),
                404,
            )

        logger.info(
            f"Updated absentee_reason for call_id='{call_id}': {summary}"
        )

        return (
            jsonify(
                {
                    "message": "Absentee reason updated successfully from ElevenLabs webhook.",
                    "call_id": call_id,
                    "summary": summary,
                    "updated_record": updated_rows[0],
                }
            ),
            200,
        )

    except Exception as exc:
        logger.exception(f"Error processing POST /webhook/elevenlabs: {exc}")
        return (
            jsonify(
                {
                    "error": "Failed to process ElevenLabs webhook.",
                    "details": str(exc),
                }
            ),
            500,
        )
