import logging
from datetime import date
from flask import Blueprint, request, jsonify
from config import supabase, get_supabase_client
from services.elevenlabs_service import trigger_elevenlabs_call_async

logger = logging.getLogger("attendai.attendance_routes")

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


@attendance_bp.route("/mark", methods=["POST"])
def mark_attendance():
    """
    POST /api/attendance/mark
    Marks daily attendance for a list of students.
    Expected JSON Payload:
    {
        "date": "2026-10-26",
        "trigger_calls": true, // optional, defaults to true
        "students": [
            {
                "student_id": "uuid-of-student",
                "status": "Present" | "Absent" | "Leave"
            }
        ]
    }
    - Upserts/inserts records into the Supabase `attendance_logs` table.
    - For every student marked "Absent", asynchronously triggers
      `trigger_elevenlabs_call(student_phone, student_name, attendance_log_id)`.
    """
    try:
        payload = request.get_json(silent=True)
        if not payload:
            return jsonify({"error": "Invalid or missing JSON request body."}), 400

        attendance_date = payload.get("date") or date.today().isoformat()
        students_list = payload.get("students")
        trigger_calls = payload.get("trigger_calls", True)

        if not isinstance(students_list, list) or len(students_list) == 0:
            return (
                jsonify(
                    {
                        "error": "Field 'students' must be a non-empty list of student attendance objects."
                    }
                ),
                400,
            )

        db = supabase or get_supabase_client()

        # Collect student IDs to validate & fetch student contact info in one query
        student_ids = [
            item.get("student_id")
            for item in students_list
            if item.get("student_id")
        ]
        if len(student_ids) != len(students_list):
            return (
                jsonify(
                    {"error": "Each item in 'students' must include a 'student_id'."}
                ),
                400,
            )

        students_resp = (
            db.table("students")
            .select("id, name, roll_no, student_phone, branch")
            .in_("id", student_ids)
            .execute()
        )
        student_map = {row["id"]: row for row in (students_resp.data or [])}

        rows_to_upsert = []
        valid_statuses = {"Present", "Absent", "Leave"}

        for entry in students_list:
            s_id = entry.get("student_id")
            status = entry.get("status", "Present").capitalize()

            if status not in valid_statuses:
                return (
                    jsonify(
                        {
                            "error": f"Invalid status '{status}' for student_id '{s_id}'. Allowed: Present, Absent, Leave."
                        }
                    ),
                    400,
                )

            if s_id not in student_map:
                return (
                    jsonify(
                        {"error": f"Student with id '{s_id}' not found in database."}
                    ),
                    404,
                )

            rows_to_upsert.append(
                {
                    "student_id": s_id,
                    "date": attendance_date,
                    "status": status,
                    "absentee_reason": entry.get("absentee_reason")
                    if status == "Absent"
                    else None,
                }
            )

        # Save attendance logs to Supabase (upsert on student_id + date unique constraint)
        upsert_resp = (
            db.table("attendance_logs")
            .upsert(rows_to_upsert, on_conflict="student_id,date")
            .execute()
        )
        saved_logs = upsert_resp.data or []

        # Trigger asynchronous ElevenLabs calls for all students marked "Absent"
        absent_calls_triggered = []
        for log_row in saved_logs:
            if log_row.get("status") == "Absent":
                student_info = student_map.get(log_row["student_id"])
                if student_info and trigger_calls:
                    student_phone = student_info.get("student_phone")
                    student_name = student_info.get("name")
                    log_id = log_row.get("id")

                    if student_phone and student_name:
                        trigger_elevenlabs_call_async(
                            student_phone=student_phone,
                            student_name=student_name,
                            attendance_log_id=log_id,
                            date_str=attendance_date,
                        )
                        absent_calls_triggered.append(
                            {
                                "student_id": student_info["id"],
                                "student_name": student_name,
                                "student_phone": student_phone,
                                "attendance_log_id": log_id,
                            }
                        )

        return (
            jsonify(
                {
                    "message": "Attendance marked successfully.",
                    "date": attendance_date,
                    "total_processed": len(saved_logs),
                    "absent_calls_queued": len(absent_calls_triggered),
                    "absent_students_called": absent_calls_triggered,
                    "records": saved_logs,
                }
            ),
            201,
        )

    except Exception as exc:
        logger.exception(f"Error in POST /api/attendance/mark: {exc}")
        return (
            jsonify(
                {
                    "error": "Failed to mark attendance.",
                    "details": str(exc),
                }
            ),
            500,
        )


@attendance_bp.route("/logs", methods=["GET"])
def get_attendance_logs():
    """
    GET /api/attendance/logs
    Fetches all attendance records joined with student details from Supabase
    to display on the frontend dashboard.
    Optional query params:
      - date: Filter by specific date (YYYY-MM-DD)
      - status: Filter by status (Present / Absent / Leave)
      - branch: Filter by student branch (CSE / CSD / IT / EC / ME)
    """
    try:
        filter_date = request.args.get("date")
        filter_status = request.args.get("status")
        filter_branch = request.args.get("branch")

        db = supabase or get_supabase_client()

        # Perform foreign-key join with the `students` table
        query = (
            db.table("attendance_logs")
            .select(
                "id, student_id, date, status, absentee_reason, call_id, created_at, "
                "students(id, name, roll_no, student_phone, email, branch, year, account_status)"
            )
            .order("date", desc=True)
            .order("created_at", desc=True)
        )

        if filter_date:
            query = query.eq("date", filter_date)
        if filter_status:
            query = query.eq("status", filter_status.capitalize())

        response = query.execute()
        logs = response.data or []

        # Optional branch filter on joined student data
        if filter_branch and filter_branch.upper() != "ALL":
            logs = [
                row
                for row in logs
                if (row.get("students") or {}).get("branch", "").upper()
                == filter_branch.upper()
            ]

        return (
            jsonify(
                {
                    "count": len(logs),
                    "logs": logs,
                }
            ),
            200,
        )

    except Exception as exc:
        logger.exception(f"Error in GET /api/attendance/logs: {exc}")
        return (
            jsonify(
                {
                    "error": "Failed to fetch attendance logs.",
                    "details": str(exc),
                }
            ),
            500,
        )
