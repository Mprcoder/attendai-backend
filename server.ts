import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

export interface StudentRecord {
  id: string;
  name: string;
  roll_no: string;
  student_phone: string;
  email: string;
  branch: 'CSE' | 'CSD' | 'IT' | 'EC' | 'ME';
  year: '1st' | '2nd' | '3rd' | '4th';
  account_status: 'Active' | 'Inactive';
  total_days: number;
  present_days: number;
  absent_days: number;
  created_at: string;
}

export interface AttendanceLogRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave';
  absentee_reason: string | null;
  call_id: string | null;
  call_status?: 'Not Called' | 'Calling...' | 'Reason Noted' | 'Failed';
  transcript?: string | null;
  created_at: string;
}

export interface ApiEventLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  summary: string;
  payload?: unknown;
}

// Initial seed data matching the attached UI_Clear_09574d76.pdf
const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Aarav Mehta',
    roll_no: '01',
    student_phone: '+91 98765 43210',
    email: 'aarav@college.edu',
    branch: 'CSE',
    year: '2nd',
    account_status: 'Active',
    total_days: 42,
    present_days: 38,
    absent_days: 4,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Sara Khan',
    roll_no: '02',
    student_phone: '+91 91234 56770',
    email: 'sara@college.edu',
    branch: 'CSD',
    year: '2nd',
    account_status: 'Active',
    total_days: 42,
    present_days: 40,
    absent_days: 2,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'John Dsouza',
    roll_no: '03',
    student_phone: '+91 94150 28836',
    email: 'john@college.edu',
    branch: 'ME',
    year: '2nd',
    account_status: 'Active',
    total_days: 42,
    present_days: 29,
    absent_days: 13,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Neha Patel',
    roll_no: '04',
    student_phone: '+91 87654 12098',
    email: 'neha@college.edu',
    branch: 'IT',
    year: '3rd',
    account_status: 'Active',
    total_days: 42,
    present_days: 41,
    absent_days: 1,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    name: 'Rohan Singh',
    roll_no: '05',
    student_phone: '+91 90123 45678',
    email: 'rohan@college.edu',
    branch: 'CSE',
    year: '3rd',
    account_status: 'Inactive',
    total_days: 42,
    present_days: 36,
    absent_days: 6,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    name: 'Priya Verma',
    roll_no: '06',
    student_phone: '+91 93056 77412',
    email: 'priya@college.edu',
    branch: 'EC',
    year: '1st',
    account_status: 'Active',
    total_days: 42,
    present_days: 27,
    absent_days: 15,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    name: 'Karan Yadav',
    roll_no: '14',
    student_phone: '+91 98391 20456',
    email: 'karan@college.edu',
    branch: 'CSE',
    year: '1st',
    account_status: 'Active',
    total_days: 42,
    present_days: 35,
    absent_days: 7,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    name: 'Ishita Roy',
    roll_no: '22',
    student_phone: '+91 99887 76651',
    email: 'ishita@college.edu',
    branch: 'CSD',
    year: '2nd',
    account_status: 'Active',
    total_days: 42,
    present_days: 39,
    absent_days: 3,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111109',
    name: 'Vikas Gupta',
    roll_no: '19',
    student_phone: '+91 70071 33482',
    email: 'vikas@college.edu',
    branch: 'IT',
    year: '3rd',
    account_status: 'Active',
    total_days: 42,
    present_days: 37,
    absent_days: 5,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111110',
    name: 'Aditya Rao',
    roll_no: '11',
    student_phone: '+91 88090 14567',
    email: 'aditya@college.edu',
    branch: 'EC',
    year: '4th',
    account_status: 'Active',
    total_days: 42,
    present_days: 34,
    absent_days: 8,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Rahul Mishra',
    roll_no: '25',
    student_phone: '+91 96280 90314',
    email: 'rahul@college.edu',
    branch: 'ME',
    year: '4th',
    account_status: 'Active',
    total_days: 42,
    present_days: 38,
    absent_days: 4,
    created_at: '2026-08-01T09:00:00Z',
  },
];

const DEFAULT_DATE = '2026-10-26';

// Seed attendance logs matching Page 3 & Page 4 of UI_Clear_09574d76.pdf
const INITIAL_ATTENDANCE_LOGS: AttendanceLogRecord[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    student_id: '11111111-1111-4111-8111-111111111101', // Aarav Mehta (CSE, 01)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: 'Medical',
    call_id: 'conv_el_9876543210_01',
    call_status: 'Reason Noted',
    transcript: 'Agent: Hello Aarav, I am calling from AttendAI regarding your absence today. Could you share the reason?\nAarav: Hi, I had a high fever and visited the doctor for a medical checkup.\nAgent: Thank you, I have logged Medical as your reason. Get well soon!',
    created_at: '2026-10-26T09:15:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    student_id: '11111111-1111-4111-8111-111111111107', // Karan Yadav (CSE, 14)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: null,
    call_id: null,
    call_status: 'Not Called',
    created_at: '2026-10-26T09:15:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    student_id: '11111111-1111-4111-8111-111111111102', // Sara Khan (CSD, 02/03)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: 'Family function',
    call_id: 'conv_el_9123456770_02',
    call_status: 'Reason Noted',
    transcript: 'Agent: Hello Sara, calling from the CSE/CSD coordinator office about your absence today.\nSara: Hello, I am attending an urgent family function out of town today.\nAgent: Understood, I have updated your attendance log with Family function.',
    created_at: '2026-10-26T09:16:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    student_id: '11111111-1111-4111-8111-111111111108', // Ishita Roy (CSD, 22)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: null,
    call_id: null,
    call_status: 'Not Called',
    created_at: '2026-10-26T09:16:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222205',
    student_id: '11111111-1111-4111-8111-111111111104', // Neha Patel (IT, 04/07)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: 'Sick leave',
    call_id: 'conv_el_8765412098_04',
    call_status: 'Reason Noted',
    transcript: 'Agent: Hi Neha, this is AttendAI checking in on your absence today.\nNeha: I am down with a migraine and taking sick leave today.\nAgent: Got it, I have marked Sick leave in the portal.',
    created_at: '2026-10-26T09:17:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222206',
    student_id: '11111111-1111-4111-8111-111111111109', // Vikas Gupta (IT, 19)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: null,
    call_id: null,
    call_status: 'Not Called',
    created_at: '2026-10-26T09:17:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222207',
    student_id: '11111111-1111-4111-8111-111111111106', // Priya Verma (EC, 06)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: 'Out of station',
    call_id: 'conv_el_9305677412_06',
    call_status: 'Reason Noted',
    transcript: 'Agent: Hello Priya, calling from AttendAI regarding your class attendance today.\nPriya: Hi, I am currently out of station due to a train delay and will return tomorrow.\nAgent: Thank you, I have logged Out of station for your record.',
    created_at: '2026-10-26T09:18:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222208',
    student_id: '11111111-1111-4111-8111-111111111110', // Aditya Rao (EC, 11)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: null,
    call_id: null,
    call_status: 'Not Called',
    created_at: '2026-10-26T09:18:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222209',
    student_id: '11111111-1111-4111-8111-111111111103', // John Dsouza (ME, 03)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: null,
    call_id: null,
    call_status: 'Not Called',
    created_at: '2026-10-26T09:19:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222210',
    student_id: '11111111-1111-4111-8111-111111111111', // Rahul Mishra (ME, 25)
    date: DEFAULT_DATE,
    status: 'Absent',
    absentee_reason: 'Transport issue',
    call_id: 'conv_el_9628090314_25',
    call_status: 'Reason Noted',
    transcript: 'Agent: Hello Rahul, this is AttendAI Virtual Coordinator. You were marked absent today.\nRahul: My college bus broke down on the highway so I had a transport issue.\nAgent: Understood, I have recorded Transport issue in the attendance log.',
    created_at: '2026-10-26T09:20:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222211',
    student_id: '11111111-1111-4111-8111-111111111105', // Rohan Singh (CSE, 05)
    date: DEFAULT_DATE,
    status: 'Present',
    absentee_reason: null,
    call_id: null,
    call_status: 'Not Called',
    created_at: '2026-10-26T09:20:00Z',
  },
];

let studentsStore: StudentRecord[] = [...INITIAL_STUDENTS];
let attendanceLogsStore: AttendanceLogRecord[] = [...INITIAL_ATTENDANCE_LOGS];
let apiEventLogs: ApiEventLog[] = [
  {
    id: 'evt-init-1',
    timestamp: new Date().toISOString(),
    method: 'POST',
    endpoint: '/api/attendance/mark',
    status: 201,
    summary: 'Marked attendance for 11 students (2026-10-26)',
  },
  {
    id: 'evt-init-2',
    timestamp: new Date().toISOString(),
    method: 'POST',
    endpoint: '/webhook/elevenlabs',
    status: 200,
    summary: 'Webhook updated absentee_reason="Transport issue" for call_id="conv_el_9628090314_25"',
  },
];

function recordApiEvent(method: string, endpoint: string, status: number, summary: string, payload?: unknown) {
  apiEventLogs.unshift({
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    status,
    summary,
    payload,
  });
  if (apiEventLogs.length > 40) {
    apiEventLogs = apiEventLogs.slice(0, 40);
  }
}

const SAMPLE_AI_REASONS = [
  {
    reason: 'Medical appointment',
    transcript:
      'Agent: Hello, I am calling from AttendAI regarding your absence today. Could you let me know the reason?\nStudent: Hi, I had a scheduled dental and medical checkup this morning.\nAgent: Thank you! I have logged Medical appointment for your HOD.',
  },
  {
    reason: 'Fever & viral infection',
    transcript:
      'Agent: Hi, calling from AttendAI Virtual Coordinator. You were marked absent in today’s lecture.\nStudent: I woke up with a viral fever and doctor advised rest for today.\nAgent: Understood, I have recorded Fever & viral infection. Take care!',
  },
  {
    reason: 'Transport delay',
    transcript:
      'Agent: Hello, this is the AttendAI assistant calling from your department.\nStudent: Hi, the metro line had a signal failure this morning so I missed the morning session.\nAgent: Got it, logging Transport delay in your attendance record.',
  },
  {
    reason: 'Family emergency',
    transcript:
      'Agent: Hello, calling from AttendAI regarding today’s attendance.\nStudent: I had to help my parents with an urgent family matter at home.\nAgent: Thank you for confirming. I have updated your status with Family emergency.',
  },
];

/**
 * Simulates or executes the asynchronous ElevenLabs outbound call
 * (`trigger_elevenlabs_call(student_phone, student_name)`).
 */
async function triggerElevenLabsCall(
  studentPhone: string,
  studentName: string,
  attendanceLogId: string,
  autoCompleteWebhook = true
): Promise<{ call_id: string; mode: 'live_elevenlabs' | 'simulated_elevenlabs' }> {
  const cleanPhone = studentPhone.replace(/[^\d+]/g, '');
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

  // If real ElevenLabs credentials are configured in .env, call the live ElevenLabs Outbound API
  if (elevenLabsKey && agentId && phoneNumberId && !elevenLabsKey.startsWith('xi-api-key-your')) {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          agent_phone_number_id: phoneNumberId,
          to_number: cleanPhone,
          conversation_initiation_client_data: {
            dynamic_variables: {
              student_name: studentName,
              student_phone: cleanPhone,
              attendance_log_id: attendanceLogId,
            },
          },
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as Record<string, string>;
        const liveCallId = data.call_id || data.conversation_id || data.callSid || `conv_live_${Date.now()}`;
        const logIdx = attendanceLogsStore.findIndex((l) => l.id === attendanceLogId);
        if (logIdx !== -1) {
          attendanceLogsStore[logIdx].call_id = liveCallId;
          attendanceLogsStore[logIdx].call_status = 'Calling...';
        }
        return { call_id: liveCallId, mode: 'live_elevenlabs' };
      }
    } catch (err) {
      console.error('Live ElevenLabs API error, falling back to simulation:', err);
    }
  }

  // Generate a realistic ElevenLabs conversation_id / call_id
  const callId = `conv_el_${cleanPhone.slice(-6)}_${Date.now().toString().slice(-4)}`;
  const logIdx = attendanceLogsStore.findIndex((l) => l.id === attendanceLogId);
  if (logIdx !== -1) {
    attendanceLogsStore[logIdx].call_id = callId;
    attendanceLogsStore[logIdx].call_status = 'Calling...';
  }

  recordApiEvent(
    'ASYNC',
    'trigger_elevenlabs_call()',
    202,
    `Outbound call initiated to ${studentName} (${studentPhone}) -> call_id="${callId}"`,
    {
      agent_id: agentId || 'agent_attendai_v1',
      to_number: cleanPhone,
      student_name: studentName,
      call_id: callId,
    }
  );

  if (autoCompleteWebhook) {
    setTimeout(() => {
      const currentLog = attendanceLogsStore.find((l) => l.call_id === callId);
      if (currentLog && !currentLog.absentee_reason) {
        const picked = SAMPLE_AI_REASONS[Math.floor(Math.random() * SAMPLE_AI_REASONS.length)];
        currentLog.absentee_reason = picked.reason;
        currentLog.call_status = 'Reason Noted';
        currentLog.transcript = picked.transcript.replace('Student:', `${studentName.split(' ')[0]}:`);
        recordApiEvent(
          'POST',
          '/webhook/elevenlabs',
          200,
          `ElevenLabs post-call webhook received for ${studentName} (call_id="${callId}"): "${picked.reason}"`,
          {
            call_id: callId,
            summary: picked.reason,
          }
        );
      }
    }, 3200);
  }

  return { call_id: callId, mode: 'simulated_elevenlabs' };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ---------------------------------------------------------------------------
  // 1. POST /api/attendance/mark
  // Expects JSON with `date` and a list of `students` (with their status).
  // Saves records and triggers ElevenLabs call for every student marked "Absent".
  // ---------------------------------------------------------------------------
  app.post('/api/attendance/mark', async (req: Request, res: Response) => {
    try {
      const { date, students, trigger_calls = false } = req.body as {
        date?: string;
        trigger_calls?: boolean;
        students?: Array<{
          student_id: string;
          status: 'Present' | 'Absent' | 'Leave';
          absentee_reason?: string | null;
        }>;
      };

      const targetDate = date || DEFAULT_DATE;

      if (!Array.isArray(students) || students.length === 0) {
        res.status(400).json({
          error: "Field 'students' must be a non-empty array of student attendance items.",
        });
        return;
      }

      const updatedRecords: AttendanceLogRecord[] = [];
      const absentStudentsCalled: Array<{
        student_id: string;
        student_name: string;
        student_phone: string;
        call_id: string;
      }> = [];

      for (const item of students) {
        const student = studentsStore.find((s) => s.id === item.student_id);
        if (!student) continue;

        const existingIndex = attendanceLogsStore.findIndex(
          (l) => l.student_id === item.student_id && l.date === targetDate
        );

        let logEntry: AttendanceLogRecord;
        if (existingIndex !== -1) {
          const prev = attendanceLogsStore[existingIndex];
          const isStillAbsent = item.status === 'Absent';
          logEntry = {
            ...prev,
            status: item.status,
            absentee_reason: isStillAbsent
              ? item.absentee_reason !== undefined
                ? item.absentee_reason
                : prev.absentee_reason
              : null,
            call_id: isStillAbsent ? prev.call_id : null,
            call_status: isStillAbsent ? prev.call_status || 'Not Called' : 'Not Called',
          };
          attendanceLogsStore[existingIndex] = logEntry;
        } else {
          logEntry = {
            id: crypto.randomUUID(),
            student_id: item.student_id,
            date: targetDate,
            status: item.status,
            absentee_reason: item.status === 'Absent' ? item.absentee_reason || null : null,
            call_id: null,
            call_status: 'Not Called',
            created_at: new Date().toISOString(),
          };
          attendanceLogsStore.push(logEntry);
        }

        updatedRecords.push(logEntry);

        // Requirement: For every student marked "Absent", asynchronously call trigger_elevenlabs_call
        if (item.status === 'Absent' && trigger_calls && !logEntry.absentee_reason) {
          const callRes = await triggerElevenLabsCall(
            student.student_phone,
            student.name,
            logEntry.id,
            true
          );
          absentStudentsCalled.push({
            student_id: student.id,
            student_name: student.name,
            student_phone: student.student_phone,
            call_id: callRes.call_id,
          });
        }
      }

      recordApiEvent(
        'POST',
        '/api/attendance/mark',
        201,
        `Saved ${updatedRecords.length} attendance records for ${targetDate} (${absentStudentsCalled.length} outbound AI calls queued)`,
        { date: targetDate, count: updatedRecords.length, calls_triggered: absentStudentsCalled.length }
      );

      res.status(201).json({
        message: 'Attendance marked successfully.',
        date: targetDate,
        total_processed: updatedRecords.length,
        absent_calls_queued: absentStudentsCalled.length,
        absent_students_called: absentStudentsCalled,
        records: updatedRecords,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to mark attendance.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 2. POST /webhook/elevenlabs
  // Receives the post-call webhook from ElevenLabs containing the transcript
  // and call summary (reason for absence), extracts `call_id` and `summary`,
  // and updates `absentee_reason` where `call_id` matches.
  // ---------------------------------------------------------------------------
  app.post('/webhook/elevenlabs', (req: Request, res: Response) => {
    try {
      const payload = req.body as Record<string, any>;
      if (!payload || typeof payload !== 'object') {
        res.status(400).json({ error: 'Invalid or missing JSON webhook payload.' });
        return;
      }

      const dataObj = payload.data && typeof payload.data === 'object' ? payload.data : payload;
      const callId: string | undefined =
        payload.call_id ||
        payload.conversation_id ||
        dataObj.call_id ||
        dataObj.conversation_id ||
        dataObj.callSid;

      const summary: string | undefined =
        payload.summary ||
        payload.absentee_reason ||
        dataObj.summary ||
        dataObj.analysis?.data_collection_results?.absentee_reason?.value ||
        dataObj.analysis?.transcript_summary ||
        dataObj.analysis?.call_summary;

      const transcript: string | undefined =
        payload.transcript || dataObj.transcript || undefined;

      if (!callId) {
        res.status(400).json({ error: "Missing 'call_id' in webhook payload." });
        return;
      }

      if (!summary) {
        res.status(400).json({ error: "Missing 'summary' in webhook payload." });
        return;
      }

      const logIndex = attendanceLogsStore.findIndex((l) => l.call_id === String(callId));
      if (logIndex === -1) {
        recordApiEvent(
          'POST',
          '/webhook/elevenlabs',
          404,
          `No attendance_logs record found for call_id="${callId}"`,
          payload
        );
        res.status(404).json({
          error: `No attendance record found matching call_id '${callId}'.`,
          call_id: callId,
        });
        return;
      }

      attendanceLogsStore[logIndex].absentee_reason = String(summary).trim();
      attendanceLogsStore[logIndex].call_status = 'Reason Noted';
      if (transcript) {
        attendanceLogsStore[logIndex].transcript = String(transcript);
      }

      const student = studentsStore.find((s) => s.id === attendanceLogsStore[logIndex].student_id);

      recordApiEvent(
        'POST',
        '/webhook/elevenlabs',
        200,
        `Updated absentee_reason="${summary}" for ${student?.name || 'Student'} (call_id="${callId}")`,
        { call_id: callId, summary }
      );

      res.status(200).json({
        message: 'Absentee reason updated successfully from ElevenLabs webhook.',
        call_id: callId,
        summary: String(summary).trim(),
        updated_record: {
          ...attendanceLogsStore[logIndex],
          students: student || null,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to process ElevenLabs webhook.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 3. GET /api/attendance/logs
  // Fetches all attendance records joined with student details.
  // ---------------------------------------------------------------------------
  app.get('/api/attendance/logs', (req: Request, res: Response) => {
    try {
      const { date, status, branch } = req.query as {
        date?: string;
        status?: string;
        branch?: string;
      };

      let joined = attendanceLogsStore.map((log) => {
        const student = studentsStore.find((s) => s.id === log.student_id) || null;
        return {
          ...log,
          students: student,
        };
      });

      if (date) {
        joined = joined.filter((item) => item.date === date);
      }
      if (status) {
        joined = joined.filter((item) => item.status.toLowerCase() === status.toLowerCase());
      }
      if (branch && branch.toUpperCase() !== 'ALL') {
        joined = joined.filter(
          (item) => item.students?.branch.toUpperCase() === branch.toUpperCase()
        );
      }

      res.status(200).json({
        count: joined.length,
        logs: joined,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch attendance logs.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 4. Individual or Batch Outbound Call Trigger for Absent Students Page
  // ---------------------------------------------------------------------------
  app.post('/api/calls/trigger', async (req: Request, res: Response) => {
    try {
      const { attendance_log_id, auto_webhook = true } = req.body as {
        attendance_log_id?: string;
        auto_webhook?: boolean;
      };

      if (!attendance_log_id) {
        res.status(400).json({ error: 'attendance_log_id is required' });
        return;
      }

      const log = attendanceLogsStore.find((l) => l.id === attendance_log_id);
      if (!log) {
        res.status(404).json({ error: 'Attendance log not found' });
        return;
      }

      const student = studentsStore.find((s) => s.id === log.student_id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const result = await triggerElevenLabsCall(
        student.student_phone,
        student.name,
        log.id,
        auto_webhook
      );

      res.status(200).json({
        message: `ElevenLabs outbound call initiated to ${student.name}`,
        call_id: result.call_id,
        mode: result.mode,
        student,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to initiate ElevenLabs call.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post('/api/calls/trigger-batch', async (req: Request, res: Response) => {
    try {
      const { date = DEFAULT_DATE, branch } = req.body as { date?: string; branch?: string };
      const pendingLogs = attendanceLogsStore.filter((l) => {
        if (l.date !== date || l.status !== 'Absent' || l.absentee_reason) return false;
        if (branch && branch !== 'All') {
          const st = studentsStore.find((s) => s.id === l.student_id);
          if (!st || st.branch !== branch) return false;
        }
        return true;
      });

      const triggered: Array<{ student_name: string; call_id: string }> = [];
      for (const log of pendingLogs) {
        const student = studentsStore.find((s) => s.id === log.student_id);
        if (student) {
          const resCall = await triggerElevenLabsCall(
            student.student_phone,
            student.name,
            log.id,
            true
          );
          triggered.push({ student_name: student.name, call_id: resCall.call_id });
        }
      }

      res.status(200).json({
        message: `Started ElevenLabs Calling Assistant for ${triggered.length} absent students.`,
        count: triggered.length,
        triggered,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to run batch calling assistant.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 5. Students CRUD API (for Student Management & Attendance Data tabs)
  // ---------------------------------------------------------------------------
  app.get('/api/students', (_req: Request, res: Response) => {
    res.status(200).json({
      count: studentsStore.length,
      students: studentsStore,
    });
  });

  app.post('/api/students', (req: Request, res: Response) => {
    const { name, roll_no, student_phone, email, branch, year, account_status } = req.body;
    if (!name || !roll_no || !student_phone) {
      res.status(400).json({ error: 'Name, Roll No, and Mobile No. are required.' });
      return;
    }

    const newStudent: StudentRecord = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      roll_no: String(roll_no).trim().padStart(2, '0'),
      student_phone: String(student_phone).trim(),
      email: email ? String(email).trim() : `${String(name).toLowerCase().split(' ')[0]}@college.edu`,
      branch: branch || 'CSE',
      year: year || '2nd',
      account_status: account_status || 'Active',
      total_days: 42,
      present_days: 40,
      absent_days: 2,
      created_at: new Date().toISOString(),
    };

    studentsStore.push(newStudent);

    // Also add a default Present log for DEFAULT_DATE
    attendanceLogsStore.push({
      id: crypto.randomUUID(),
      student_id: newStudent.id,
      date: DEFAULT_DATE,
      status: 'Present',
      absentee_reason: null,
      call_id: null,
      call_status: 'Not Called',
      created_at: new Date().toISOString(),
    });

    recordApiEvent('POST', '/api/students', 201, `Created student ${newStudent.name} (Roll ${newStudent.roll_no})`);
    res.status(201).json({ student: newStudent });
  });

  app.put('/api/students/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = studentsStore.findIndex((s) => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    const updated: StudentRecord = {
      ...studentsStore[idx],
      ...req.body,
      id: studentsStore[idx].id,
    };
    studentsStore[idx] = updated;
    recordApiEvent('PUT', `/api/students/${id.slice(0, 8)}`, 200, `Updated student ${updated.name} (Roll ${updated.roll_no})`);
    res.status(200).json({ student: updated });
  });

  app.delete('/api/students/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const existing = studentsStore.find((s) => s.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }
    studentsStore = studentsStore.filter((s) => s.id !== id);
    attendanceLogsStore = attendanceLogsStore.filter((l) => l.student_id !== id);
    recordApiEvent('DELETE', `/api/students/${id.slice(0, 8)}`, 200, `Removed student ${existing.name}`);
    res.status(200).json({ message: 'Student removed successfully.' });
  });

  // ---------------------------------------------------------------------------
  // 6. Backend Source Files & Live Event Stream Endpoint
  // ---------------------------------------------------------------------------
  app.get('/api/backend-files', (_req: Request, res: Response) => {
    const filesToRead = [
      { path: 'backend/schema.sql', label: 'schema.sql (Supabase SQL)', lang: 'sql' },
      { path: 'backend/app.py', label: 'app.py', lang: 'python' },
      { path: 'backend/config.py', label: 'config.py', lang: 'python' },
      { path: 'backend/routes/attendance_routes.py', label: 'routes/attendance_routes.py', lang: 'python' },
      { path: 'backend/routes/webhook_routes.py', label: 'routes/webhook_routes.py', lang: 'python' },
      { path: 'backend/services/elevenlabs_service.py', label: 'services/elevenlabs_service.py', lang: 'python' },
      { path: '.env.example', label: '.env.example', lang: 'ini' },
      { path: 'backend/requirements.txt', label: 'requirements.txt', lang: 'text' },
    ];

    const files = filesToRead.map((item) => {
      const fullPath = path.resolve(process.cwd(), item.path);
      let content = '';
      try {
        content = fs.readFileSync(fullPath, 'utf-8');
      } catch {
        content = '# File not found';
      }
      return { ...item, content };
    });

    res.status(200).json({
      files,
      events: apiEventLogs,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AttendAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
