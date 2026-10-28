import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Check,
  Search,
  Download,
  Phone,
  PhoneCall,
  Plus,
  Edit3,
  Trash2,
  Code2,
  Copy,
  CheckCircle2,
  X,
  Send,
  FileCode,
  RefreshCw,
  Lock,
  ChevronDown,
  MessageSquareText,
} from 'lucide-react';

interface Student {
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

interface AttendanceLog {
  id: string;
  student_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave';
  absentee_reason: string | null;
  call_id: string | null;
  call_status?: 'Not Called' | 'Calling...' | 'Reason Noted' | 'Failed';
  transcript?: string | null;
  created_at: string;
  students: Student | null;
}

interface BackendFile {
  path: string;
  label: string;
  lang: string;
  content: string;
}

interface ApiEvent {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  summary: string;
  payload?: unknown;
}

type ActiveTab =
  | 'students'
  | 'attendance_data'
  | 'daily_attendance'
  | 'absent_students'
  | 'python_backend';

const BRANCHES: Array<'All' | 'CSE' | 'CSD' | 'IT' | 'EC' | 'ME'> = [
  'All',
  'CSE',
  'CSD',
  'IT',
  'EC',
  'ME',
];
const YEARS: Array<'1st' | '2nd' | '3rd' | '4th'> = ['1st', '2nd', '3rd', '4th'];

const FALLBACK_STUDENTS: Student[] = [
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

/**
 * Safe JSON fetch wrapper that verifies Content-Type is JSON before parsing,
 * preventing JSON.parse syntax errors if the server is restarting.
 */
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, status: res.status, data: null };
    }
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      return { ok: false, status: res.status, data: null };
    }
    const parsed = JSON.parse(text) as T;
    return { ok: res.ok, status: res.status, data: parsed };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>('teacher@school.edu');
  const [loginPassword, setLoginPassword] = useState<string>('••••••••••');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('absent_students');
  const [students, setStudents] = useState<Student[]>(FALLBACK_STUDENTS);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [backendFiles, setBackendFiles] = useState<BackendFile[]>([]);
  const [apiEvents, setApiEvents] = useState<ApiEvent[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedAccountStatus, setSelectedAccountStatus] = useState<string>('All');
  const [selectedDate] = useState<string>('2026-10-26');

  // Daily Attendance local draft state
  const [dailyDraft, setDailyDraft] = useState<Record<string, 'Present' | 'Absent' | 'Leave'>>({});
  const [autoCallOnSave, setAutoCallOnSave] = useState<boolean>(true);
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);

  // Calling state
  const [callingLogIds, setCallingLogIds] = useState<Record<string, boolean>>({});
  const [batchCalling, setBatchCalling] = useState<boolean>(false);

  // Webhook Tester & Transcript Modal state
  const [selectedCallLog, setSelectedCallLog] = useState<AttendanceLog | null>(null);
  const [manualWebhookReason, setManualWebhookReason] = useState<string>('');
  const [submittingWebhook, setSubmittingWebhook] = useState<boolean>(false);

  // Student Management Form state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(
    '11111111-1111-4111-8111-111111111103'
  );
  const [formRollNo, setFormRollNo] = useState<string>('03');
  const [formName, setFormName] = useState<string>('John Dsouza');
  const [formPhone, setFormPhone] = useState<string>('+91 94150 28836');
  const [formEmail, setFormEmail] = useState<string>('john@college.edu');
  const [formBranch, setFormBranch] = useState<'CSE' | 'CSD' | 'IT' | 'EC' | 'ME'>('CSE');
  const [formYear, setFormYear] = useState<'1st' | '2nd' | '3rd' | '4th'>('2nd');
  const [formActive, setFormActive] = useState<boolean>(true);

  // Python Backend Code Viewer state
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copiedFile, setCopiedFile] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  const fetchAllData = useCallback(async () => {
    const [studentsRes, logsRes, filesRes] = await Promise.all([
      safeFetchJson<{ students: Student[] }>('/api/students'),
      safeFetchJson<{ logs: AttendanceLog[] }>(`/api/attendance/logs?date=${selectedDate}`),
      safeFetchJson<{ files: BackendFile[]; events: ApiEvent[] }>('/api/backend-files'),
    ]);

    if (studentsRes.ok && studentsRes.data?.students) {
      setStudents(studentsRes.data.students);
    }

    if (logsRes.ok && logsRes.data?.logs) {
      const fetchedLogs = logsRes.data.logs;
      setLogs(fetchedLogs);

      const draftMap: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
      fetchedLogs.forEach((l) => {
        draftMap[l.student_id] = l.status;
      });
      setDailyDraft((prev) =>
        Object.keys(prev).length === 0 ? draftMap : { ...draftMap, ...prev }
      );
    }

    if (filesRes.ok && filesRes.data) {
      setBackendFiles(filesRes.data.files || []);
      setApiEvents(filesRes.data.events || []);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Select student for editing in Student Management
  const handleSelectStudentForEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setFormRollNo(student.roll_no);
    setFormName(student.name);
    setFormPhone(student.student_phone);
    setFormEmail(student.email);
    setFormBranch(student.branch);
    setFormYear(student.year);
    setFormActive(student.account_status === 'Active');
  };

  const handleStartAddNewStudent = () => {
    setEditingStudentId(null);
    const nextRoll = String(students.length + 1).padStart(2, '0');
    setFormRollNo(nextRoll);
    setFormName('');
    setFormPhone('+91 ');
    setFormEmail('');
    setFormBranch('CSE');
    setFormYear('1st');
    setFormActive(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRollNo.trim() || !formPhone.trim()) {
      showToast('Please fill in Roll No, Student Name, and Mobile No.');
      return;
    }

    const payload = {
      roll_no: formRollNo.trim(),
      name: formName.trim(),
      student_phone: formPhone.trim(),
      email: formEmail.trim() || `${formName.trim().toLowerCase().split(' ')[0]}@college.edu`,
      branch: formBranch,
      year: formYear,
      account_status: formActive ? 'Active' : 'Inactive',
    };

    if (editingStudentId) {
      const res = await safeFetchJson<{ student: Student }>(`/api/students/${editingStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(`Updated ${formName} in Supabase students table.`);
        await fetchAllData();
      }
    } else {
      const res = await safeFetchJson<{ student: Student }>('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok && res.data?.student) {
        showToast(`Added ${formName} to Supabase students table.`);
        setEditingStudentId(res.data.student.id);
        await fetchAllData();
      }
    }
  };

  const handleRemoveStudent = async () => {
    if (!editingStudentId) return;
    const res = await safeFetchJson<{ message: string }>(`/api/students/${editingStudentId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      showToast('Student removed from database.');
      handleStartAddNewStudent();
      await fetchAllData();
    }
  };

  // Trigger POST /api/attendance/mark
  const handleSaveDailyAttendance = async () => {
    setSavingAttendance(true);
    try {
      const payload = {
        date: selectedDate,
        trigger_calls: autoCallOnSave,
        students: students.map((s) => ({
          student_id: s.id,
          status: dailyDraft[s.id] || 'Present',
        })),
      };

      const res = await safeFetchJson<{
        total_processed: number;
        absent_calls_queued: number;
        error?: string;
      }>('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data) {
        const callNote =
          res.data.absent_calls_queued > 0
            ? ` & queued ${res.data.absent_calls_queued} ElevenLabs outbound call(s)`
            : '';
        showToast(
          `POST /api/attendance/mark: Saved ${res.data.total_processed} records${callNote}.`
        );
        await fetchAllData();
      } else {
        showToast(`Error: ${res.data?.error || 'Failed to mark attendance'}`);
      }
    } finally {
      setSavingAttendance(false);
    }
  };

  // Trigger individual ElevenLabs outbound call
  const handleTriggerSingleCall = async (log: AttendanceLog) => {
    setCallingLogIds((prev) => ({ ...prev, [log.id]: true }));
    try {
      const res = await safeFetchJson<{ call_id: string; error?: string }>('/api/calls/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_log_id: log.id,
          auto_webhook: true,
        }),
      });
      if (res.ok && res.data) {
        showToast(
          `ElevenLabs Agent calling ${log.students?.name} (${log.students?.student_phone}) • call_id: ${res.data.call_id}`
        );
        await fetchAllData();
      } else {
        showToast(`Call error: ${res.data?.error || 'Failed to initiate call'}`);
      }
    } finally {
      setTimeout(() => {
        setCallingLogIds((prev) => ({ ...prev, [log.id]: false }));
      }, 1500);
    }
  };

  // Trigger batch calling assistant for all uncalled absent students
  const handleStartCallingAssistant = async () => {
    setBatchCalling(true);
    try {
      const res = await safeFetchJson<{ count: number; error?: string }>(
        '/api/calls/trigger-batch',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            branch: selectedBranch,
          }),
        }
      );
      if (res.ok && res.data) {
        if (res.data.count === 0) {
          showToast(
            'All absent students in this view already have reasons noted or calls active.'
          );
        } else {
          showToast(
            `ElevenLabs Calling Assistant started for ${res.data.count} absent student(s). Webhook summaries will arrive shortly.`
          );
        }
        await fetchAllData();
      }
    } finally {
      setTimeout(() => setBatchCalling(false), 1500);
    }
  };

  // Trigger manual POST /webhook/elevenlabs from the inspector modal
  const handleSendManualWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallLog || !manualWebhookReason.trim()) return;

    setSubmittingWebhook(true);
    try {
      let targetCallId = selectedCallLog.call_id;
      if (!targetCallId) {
        const initRes = await safeFetchJson<{ call_id: string }>('/api/calls/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attendance_log_id: selectedCallLog.id,
            auto_webhook: false,
          }),
        });
        targetCallId = initRes.data?.call_id || null;
      }

      const webhookRes = await safeFetchJson<{ error?: string }>('/webhook/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: targetCallId,
          summary: manualWebhookReason.trim(),
          transcript: `Agent: Hello ${selectedCallLog.students?.name}, calling from AttendAI regarding your absence today.\n${selectedCallLog.students?.name.split(' ')[0]}: ${manualWebhookReason.trim()}\nAgent: Thank you, I have logged "${manualWebhookReason.trim()}" in Supabase attendance_logs.`,
        }),
      });

      if (webhookRes.ok) {
        showToast(
          `POST /webhook/elevenlabs (200 OK): Updated absentee_reason="${manualWebhookReason.trim()}" for call_id="${targetCallId}"`
        );
        await fetchAllData();
        setSelectedCallLog(null);
        setManualWebhookReason('');
      } else {
        showToast(`Webhook error: ${webhookRes.data?.error || 'Request failed'}`);
      }
    } finally {
      setSubmittingWebhook(false);
    }
  };

  // Export CSV helper
  const handleExportCSV = (filename: string, rows: Array<Record<string, unknown>>) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} rows to ${filename}`);
  };

  // Filtered datasets
  const filteredAbsentLogs = useMemo(() => {
    return logs
      .filter((l) => l.status === 'Absent')
      .filter((l) => {
        const st = l.students;
        if (!st) return false;
        if (selectedBranch !== 'All' && st.branch !== selectedBranch) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            st.name.toLowerCase().includes(q) ||
            st.roll_no.toLowerCase().includes(q) ||
            st.student_phone.toLowerCase().includes(q) ||
            (l.absentee_reason || '').toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [logs, selectedBranch, searchQuery]);

  const absentCountsByBranch = useMemo(() => {
    const allAbsent = logs.filter((l) => l.status === 'Absent');
    const counts = {
      total: allAbsent.length,
      CSE: 0,
      CSD: 0,
      IT: 0,
      EC: 0,
      ME: 0,
    };
    allAbsent.forEach((l) => {
      const b = l.students?.branch;
      if (b && b in counts) {
        counts[b as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [logs]);

  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (selectedBranch !== 'All' && st.branch !== selectedBranch) return false;
      if (selectedYear !== 'All' && st.year !== selectedYear) return false;
      if (selectedAccountStatus !== 'All' && st.account_status !== selectedAccountStatus)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          st.name.toLowerCase().includes(q) ||
          st.roll_no.toLowerCase().includes(q) ||
          st.student_phone.toLowerCase().includes(q) ||
          st.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [students, selectedBranch, selectedYear, selectedAccountStatus, searchQuery]);

  // Daily attendance summary metrics
  const dailySummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    students.forEach((s) => {
      const st = dailyDraft[s.id] || 'Present';
      if (st === 'Present') present++;
      else if (st === 'Absent') absent++;
      else if (st === 'Leave') leave++;
    });
    const total = students.length || 1;
    const pct = Math.round((present / total) * 100);
    return {
      total: students.length,
      present,
      absent,
      leave,
      pct,
    };
  }, [students, dailyDraft]);

  // ---------------------------------------------------------------------------
  // PAGE 1: LOGIN VIEW (Matches Page 1 of UI_Clear_09574d76.pdf)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#F0F5FF] via-[#EBF2FF] to-[#DCE8FF] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[1160px] grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#0F172A]">ATTEND AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-[1.12] max-w-xl">
              Attendance,
              <br />
              <span className="text-[#2563EB]">made effortless.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#475569] max-w-lg leading-relaxed">
              Mark daily attendance, track student records and call absent students — all from one
              simple workspace.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-[#2563EB]">
              <span className="bg-white/90 border border-[#DBEAFE] px-4 py-2 rounded-lg shadow-xs">
                ✓ Daily Attendance
              </span>
              <span className="bg-white/90 border border-[#DBEAFE] px-4 py-2 rounded-lg shadow-xs">
                ✓ Smart Calling (ElevenLabs AI)
              </span>
              <span className="bg-white/90 border border-[#DBEAFE] px-4 py-2 rounded-lg shadow-xs">
                ✓ Supabase PostgreSQL
              </span>
            </div>
          </div>

          {/* Right Sign-In Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-[#0F172A]">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Sign in to continue to your workspace.</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsAuthenticated(true);
                }}
                className="mt-7 space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB] text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB] text-slate-800"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-[#2563EB]"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => showToast('Password reset link sent to administrator.')}
                    className="font-semibold text-[#2563EB] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Sign In
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-slate-200"></div>
                  <span className="shrink mx-3 text-xs text-slate-400">or</span>
                  <div className="grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAuthenticated(true)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span className="font-bold text-[#2563EB]">G</span>
                  Sign in with Google
                </button>
              </form>

              <p className="text-center text-xs text-slate-400 mt-6">
                Accounts are created by an administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED WORKSPACE (Matches Pages 2, 3, 4, 5 + Python Flask Code View)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-[#0F172A]">
      {/* Top Navigation Bar (Strict 3-Zone Contract matching PDF) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('absent_students');
          }}
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0"
        >
          <span className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold">
            ✓
          </span>
          ATTEND AI
        </a>

        {/* Zone 2: 5 Single-Line Navigation Links */}
        <nav className="flex items-center gap-6 overflow-x-auto text-sm font-medium text-slate-500 h-full">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`h-full flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'students'
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Students
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attendance_data')}
            className={`h-full flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'attendance_data'
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Attendance Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daily_attendance')}
            className={`h-full flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'daily_attendance'
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Daily Attendance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('absent_students')}
            className={`h-full flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'absent_students'
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Absent Students
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('python_backend')}
            className={`h-full flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'python_backend'
                ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Python Flask Code
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === 'python_backend' ? 'absent_students' : 'python_backend')
            }
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#EEF4FF] text-[#2563EB] hover:bg-[#DBEAFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeTab === 'python_backend' ? 'HOD Dashboard' : 'HOD · CSE'}
          </button>
          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            title="Sign Out"
            className="w-9 h-9 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center hover:bg-[#1D4ED8] transition-colors shrink-0 cursor-pointer"
          >
            HD
          </button>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="leading-snug">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 lg:px-10 py-8">
        {/* ===================================================================
            VIEW 1: ABSENT STUDENTS (Page 3 of PDF + ElevenLabs Calling Assistant)
           =================================================================== */}
        {activeTab === 'absent_students' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Absent Students</h1>
              <p className="text-xs text-slate-500 mt-1">
                All branches · 26 Oct 2026 · Automated ElevenLabs Outbound Calling &amp; Webhook
                Reason Logger
              </p>
            </div>

            {/* Filter & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, roll or mobile..."
                    className="w-full pl-9 pr-3.5 py-2 bg-white text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <span className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#EBF2FF] text-[#2563EB] whitespace-nowrap">
                  Today
                </span>

                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3.5 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        Branch: {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleExportCSV(
                      `absent_students_${selectedDate}.csv`,
                      filteredAbsentLogs.map((l) => ({
                        Branch: l.students?.branch || '',
                        Roll: l.students?.roll_no || '',
                        Student: l.students?.name || '',
                        Mobile: l.students?.student_phone || '',
                        Reason: l.absentee_reason || 'Not Noted',
                        Status: l.absentee_reason ? 'Reason Noted' : 'Not Called',
                        Call_ID: l.call_id || '',
                      }))
                    )
                  }
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>

                <button
                  type="button"
                  onClick={handleStartCallingAssistant}
                  disabled={batchCalling}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  {batchCalling ? 'Calling Absent Students...' : 'Start Calling Assistant'}
                </button>
              </div>
            </div>

            {/* Branch Breakdown KPI Strip (Matches Page 3 of PDF) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                <div className="text-2xl font-bold text-[#DC2626] tabular-nums">
                  {absentCountsByBranch.total}
                </div>
                <div className="text-xs text-slate-500 mt-1">Total Absent</div>
              </div>
              {(['CSE', 'CSD', 'IT', 'EC', 'ME'] as const).map((branchKey) => (
                <div
                  key={branchKey}
                  onClick={() =>
                    setSelectedBranch(selectedBranch === branchKey ? 'All' : branchKey)
                  }
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
                    selectedBranch === branchKey
                      ? 'border-[#2563EB] bg-[#F8FAFF]'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl font-bold text-[#0F172A] tabular-nums">
                    {absentCountsByBranch[branchKey]}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{branchKey}</div>
                </div>
              ))}
            </div>

            {/* Absent Students Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F6FA] border-b border-slate-200/80 text-[11px] font-bold text-slate-500 tracking-wider">
                      <th className="py-3.5 px-5">BRANCH</th>
                      <th className="py-3.5 px-4">ROLL</th>
                      <th className="py-3.5 px-4">STUDENT</th>
                      <th className="py-3.5 px-4">MOBILE NO.</th>
                      <th className="py-3.5 px-4">REASON (ELEVENLABS WEBHOOK)</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-5 text-right">CALL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-xs">
                    {filteredAbsentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No absent students matching current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAbsentLogs.map((log) => {
                        const st = log.students!;
                        const isCalling =
                          callingLogIds[log.id] || log.call_status === 'Calling...';
                        const hasReason = Boolean(log.absentee_reason);

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-5 font-semibold text-slate-700">
                              {st.branch}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                              {st.roll_no}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                              {st.name}
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                              {st.student_phone}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {hasReason ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCallLog(log);
                                    setManualWebhookReason(log.absentee_reason || '');
                                  }}
                                  className="text-left group flex items-center gap-1.5 text-slate-700 hover:text-[#2563EB] cursor-pointer"
                                >
                                  <span>{log.absentee_reason}</span>
                                  <MessageSquareText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB]" />
                                </button>
                              ) : isCalling ? (
                                <span className="text-[#2563EB] font-medium">
                                  AI Agent on call... awaiting webhook
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {hasReason ? (
                                <span className="font-semibold text-emerald-700">
                                  Reason Noted
                                </span>
                              ) : isCalling ? (
                                <span className="font-semibold text-amber-600">Calling...</span>
                              ) : (
                                <span className="font-medium text-slate-500">Not Called</span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <div className="inline-flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCallLog(log);
                                    setManualWebhookReason(log.absentee_reason || '');
                                  }}
                                  className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                  title="Simulate / Inspect ElevenLabs Post-Call Webhook"
                                >
                                  Webhook
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTriggerSingleCall(log)}
                                  disabled={isCalling}
                                  className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-semibold text-xs rounded-md inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  <Phone className="w-3 h-3" />
                                  {isCalling ? 'Calling' : 'Call'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {filteredAbsentLogs.length} of {absentCountsByBranch.total} absent
                  students
                </span>
                <span>Updated via /webhook/elevenlabs · Live Sync</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 2: DAILY ATTENDANCE (Page 4 of PDF + POST /api/attendance/mark)
           =================================================================== */}
        {activeTab === 'daily_attendance' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Daily Attendance</h1>
              <p className="text-xs text-slate-500 mt-1">
                Mark today&apos;s attendance — 26 Oct 2026
              </p>
            </div>

            {/* Filter & Save Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student..."
                    className="w-full pl-9 pr-3.5 py-2 bg-white text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <span className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#EBF2FF] text-[#2563EB]">
                  Today
                </span>

                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3.5 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        Branch: {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCallOnSave}
                    onChange={(e) => setAutoCallOnSave(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB]"
                  />
                  Auto-trigger ElevenLabs Call for Absent students
                </label>

                <button
                  type="button"
                  onClick={handleSaveDailyAttendance}
                  disabled={savingAttendance}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {savingAttendance ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>

            {/* 5 KPI Summary Cards (Matches Page 4 of PDF) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                <div className="text-2xl font-bold text-[#0F172A] tabular-nums">
                  {dailySummary.total}
                </div>
                <div className="text-xs text-slate-500 mt-1">Total Students</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                <div className="text-2xl font-bold text-[#16A34A] tabular-nums">
                  {dailySummary.present}
                </div>
                <div className="text-xs text-slate-500 mt-1">Present</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                <div className="text-2xl font-bold text-[#DC2626] tabular-nums">
                  {dailySummary.absent}
                </div>
                <div className="text-xs text-slate-500 mt-1">Absent</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                <div className="text-2xl font-bold text-[#D97706] tabular-nums">
                  {dailySummary.leave}
                </div>
                <div className="text-xs text-slate-500 mt-1">On Leave</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/80 p-4">
                <div className="text-2xl font-bold text-[#2563EB] tabular-nums">
                  {dailySummary.pct}%
                </div>
                <div className="text-xs text-slate-500 mt-1">Attendance Today</div>
              </div>
            </div>

            {/* Daily Attendance Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F6FA] border-b border-slate-200/80 text-[11px] font-bold text-slate-500 tracking-wider">
                      <th className="py-3.5 px-5">ROLL</th>
                      <th className="py-3.5 px-4">STUDENT</th>
                      <th className="py-3.5 px-4">BRANCH</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-5">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-xs">
                    {filteredStudents.map((st) => {
                      const currentStatus = dailyDraft[st.id] || 'Present';
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5 font-mono tabular-nums text-slate-600">
                            {st.roll_no}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{st.name}</td>
                          <td className="py-3.5 px-4 text-slate-600">{st.branch}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`font-semibold ${
                                currentStatus === 'Present'
                                  ? 'text-[#16A34A]'
                                  : currentStatus === 'Absent'
                                  ? 'text-[#DC2626]'
                                  : 'text-[#D97706]'
                              }`}
                            >
                              {currentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setDailyDraft((prev) => ({ ...prev, [st.id]: 'Present' }))
                                }
                                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  currentStatus === 'Present'
                                    ? 'bg-[#2563EB] text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDailyDraft((prev) => ({ ...prev, [st.id]: 'Absent' }))
                                }
                                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  currentStatus === 'Absent'
                                    ? 'bg-[#DC2626] text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDailyDraft((prev) => ({ ...prev, [st.id]: 'Leave' }))
                                }
                                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  currentStatus === 'Leave'
                                    ? 'bg-[#F59E0B] text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                Leave
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 3: ATTENDANCE DATA (Page 2 of PDF)
           =================================================================== */}
        {activeTab === 'attendance_data' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Attendance Data</h1>
              <p className="text-xs text-slate-500 mt-1">Student-wise attendance records</p>
            </div>

            {/* Filter & Export Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students..."
                    className="w-full pl-9 pr-3.5 py-2 bg-white text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <span className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#EBF2FF] text-[#2563EB]">
                  This Month
                </span>

                <div className="relative">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3.5 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        Branch: {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleExportCSV(
                    'student_attendance_summary.csv',
                    filteredStudents.map((s) => ({
                      Student: s.name,
                      Roll: s.roll_no,
                      Branch: s.branch,
                      Total_Days: s.total_days,
                      Present: s.present_days,
                      Absent: s.absent_days,
                      Percentage: `${Math.round((s.present_days / s.total_days) * 100)}%`,
                    }))
                  )
                }
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            {/* Attendance Data Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F6FA] border-b border-slate-200/80 text-[11px] font-bold text-slate-500 tracking-wider">
                      <th className="py-3.5 px-5">STUDENT</th>
                      <th className="py-3.5 px-4">ROLL</th>
                      <th className="py-3.5 px-4">TOTAL DAYS</th>
                      <th className="py-3.5 px-4">PRESENT</th>
                      <th className="py-3.5 px-4">ABSENT</th>
                      <th className="py-3.5 px-5">PERCENTAGE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-xs">
                    {filteredStudents.map((st) => {
                      const pct = Math.round((st.present_days / (st.total_days || 1)) * 100);
                      const isLow = pct < 75;
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-5 font-semibold text-[#0F172A]">{st.name}</td>
                          <td className="py-4 px-4 font-mono tabular-nums text-slate-600">
                            {st.roll_no}
                          </td>
                          <td className="py-4 px-4 font-mono tabular-nums text-slate-700">
                            {st.total_days}
                          </td>
                          <td className="py-4 px-4 font-mono tabular-nums font-semibold text-[#16A34A]">
                            {st.present_days}
                          </td>
                          <td className="py-4 px-4 font-mono tabular-nums font-semibold text-[#DC2626]">
                            {st.absent_days}
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-28 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isLow ? 'bg-[#DC2626]' : 'bg-[#16A34A]'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className={`font-mono tabular-nums font-bold ${
                                  isLow ? 'text-[#DC2626]' : 'text-[#16A34A]'
                                }`}
                              >
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {filteredStudents.length} of {students.length} students
                </span>
                <span className="font-mono tabular-nums">‹ 1 2 3 ... 10 ›</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 4: STUDENT MANAGEMENT (Page 5 of PDF)
           =================================================================== */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">Student Management</h1>
                <p className="text-xs text-slate-500 mt-1">
                  CSE Department · Add, edit and manage student records
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartAddNewStudent}
                className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Student
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 8 Columns: Filter + Student Table */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, roll or mobile..."
                      className="w-full pl-9 pr-3.5 py-2 bg-white text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 rounded-lg pl-3.5 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                    >
                      <option value="All">Year: All</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          Year: {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedAccountStatus}
                      onChange={(e) => setSelectedAccountStatus(e.target.value)}
                      className="appearance-none bg-white border border-slate-200 rounded-lg pl-3.5 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                    >
                      <option value="All">Status: All</option>
                      <option value="Active">Status: Active</option>
                      <option value="Inactive">Status: Inactive</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F4F6FA] border-b border-slate-200/80 text-[11px] font-bold text-slate-500 tracking-wider">
                          <th className="py-3.5 px-4">ROLL</th>
                          <th className="py-3.5 px-4">STUDENT</th>
                          <th className="py-3.5 px-4">EMAIL</th>
                          <th className="py-3.5 px-4">MOBILE</th>
                          <th className="py-3.5 px-3">YEAR</th>
                          <th className="py-3.5 px-3">STATUS</th>
                          <th className="py-3.5 px-4 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 text-xs">
                        {filteredStudents.map((st) => {
                          const isSelected = editingStudentId === st.id;
                          return (
                            <tr
                              key={st.id}
                              onClick={() => handleSelectStudentForEdit(st)}
                              className={`transition-colors cursor-pointer ${
                                isSelected ? 'bg-[#EBF2FF]/70' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                                {st.roll_no}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                                {st.name}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">{st.email}</td>
                              <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">
                                {st.student_phone}
                              </td>
                              <td className="py-3.5 px-3 text-slate-600">{st.year}</td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`font-semibold ${
                                    st.account_status === 'Active'
                                      ? 'text-[#16A34A]'
                                      : 'text-[#DC2626]'
                                  }`}
                                >
                                  {st.account_status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectStudentForEdit(st);
                                  }}
                                  className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#2563EB] text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3.5 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Showing {filteredStudents.length} of {students.length} students
                    </span>
                    <span className="font-mono tabular-nums">‹ 1 2 3 ... 9 ›</span>
                  </div>
                </div>
              </div>

              {/* Right 4 Columns: Edit / Add Student Panel (Matches Page 5 of PDF) */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#0F172A]">
                    {editingStudentId ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <span className="text-xs font-mono font-semibold text-[#2563EB]">
                    Roll {formRollNo || '--'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Update details or switch to &ldquo;Add New Student&rdquo;.
                </p>

                <form onSubmit={handleSaveStudent} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Roll No *
                    </label>
                    <input
                      type="text"
                      value={formRollNo}
                      onChange={(e) => setFormRollNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB] font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mobile No. *
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB] font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Department
                    </label>
                    <div className="relative">
                      <select
                        value={formBranch}
                        onChange={(e) =>
                          setFormBranch(e.target.value as 'CSE' | 'CSD' | 'IT' | 'EC' | 'ME')
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-[#2563EB]"
                      >
                        <option value="CSE">CSE</option>
                        <option value="CSD">CSD</option>
                        <option value="IT">IT</option>
                        <option value="EC">EC</option>
                        <option value="ME">ME</option>
                      </select>
                      <Lock className="w-3.5 h-3.5 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Year
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {YEARS.map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setFormYear(yr)}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            formYear === yr
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Account Status
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormActive(!formActive)}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <span
                        className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                          formActive ? 'bg-[#16A34A]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            formActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        {formActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleStartAddNewStudent}
                      className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {editingStudentId && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={handleRemoveStudent}
                        className="text-xs font-semibold text-[#DC2626] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove student
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 5: PYTHON FLASK BACKEND & SUPABASE SQL CODE INSPECTOR
           =================================================================== */}
        {activeTab === 'python_backend' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">
                  AttendAI — Modular Python Flask &amp; Supabase Backend
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Complete production code for <code className="font-mono">app.py</code>,{' '}
                  <code className="font-mono">config.py</code>,{' '}
                  <code className="font-mono">routes/attendance_routes.py</code>,{' '}
                  <code className="font-mono">routes/webhook_routes.py</code>,{' '}
                  <code className="font-mono">services/elevenlabs_service.py</code> &amp;{' '}
                  <code className="font-mono">schema.sql</code>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const current = backendFiles[selectedFileIndex];
                    if (current) {
                      navigator.clipboard.writeText(current.content);
                      setCopiedFile(true);
                      showToast(`Copied ${current.label} to clipboard!`);
                      setTimeout(() => setCopiedFile(false), 2000);
                    }
                  }}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedFile ? 'Copied!' : 'Copy Current File'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 4 Columns: Modular File Tree + API Endpoint Reference */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200/90 p-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Backend Project Structure (/backend)
                  </h3>
                  <div className="space-y-1">
                    {backendFiles.map((file, idx) => (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setSelectedFileIndex(idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                          selectedFileIndex === idx
                            ? 'bg-[#2563EB] text-white font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{file.label}</span>
                        <FileCode className="w-3.5 h-3.5 shrink-0 opacity-75" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live API Activity Log */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Live API &amp; Webhook Activity
                    </h3>
                    <button
                      type="button"
                      onClick={fetchAllData}
                      className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {apiEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="font-bold text-[#2563EB]">
                            {evt.method} {evt.endpoint}
                          </span>
                          <span className="text-emerald-700 font-semibold">HTTP {evt.status}</span>
                        </div>
                        <p className="text-slate-600 mt-1 leading-snug">{evt.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 8 Columns: Code Viewer */}
              <div className="lg:col-span-8 bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-md">
                <div className="px-5 py-3 bg-[#1E293B] border-b border-slate-700 flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-200 font-semibold">
                    {backendFiles[selectedFileIndex]?.path || 'backend/app.py'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Python 3.11+ · Flask · supabase-py · ElevenLabs Conversational AI
                  </span>
                </div>
                <pre className="p-5 text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed max-h-[640px] overflow-y-auto">
                  <code>{backendFiles[selectedFileIndex]?.content || 'Loading...'}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          MODAL: ELEVENLABS WEBHOOK SIMULATOR & CALL TRANSCRIPT INSPECTOR
         ===================================================================== */}
      {selectedCallLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  ElevenLabs AI Call &amp; Webhook Inspector
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student:{' '}
                  <strong className="text-slate-800">{selectedCallLog.students?.name}</strong> (
                  {selectedCallLog.students?.branch} · Roll {selectedCallLog.students?.roll_no})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCallLog(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedCallLog.students?.student_phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ElevenLabs call_id:</span>
                <span className="font-mono text-[#2563EB] font-semibold">
                  {selectedCallLog.call_id || 'Will be assigned on call'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Absentee Reason:</span>
                <span className="font-semibold text-slate-800">
                  {selectedCallLog.absentee_reason || 'None (Not Called)'}
                </span>
              </div>
            </div>

            {selectedCallLog.transcript && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ElevenLabs Post-Call Transcript
                </label>
                <pre className="p-3 rounded-lg bg-[#0F172A] text-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {selectedCallLog.transcript}
                </pre>
              </div>
            )}

            <form
              onSubmit={handleSendManualWebhook}
              className="space-y-3 pt-1 border-t border-slate-200"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test <code className="font-mono text-[#2563EB]">POST /webhook/elevenlabs</code>{' '}
                  Summary Payload
                </label>
                <input
                  type="text"
                  value={manualWebhookReason}
                  onChange={(e) => setManualWebhookReason(e.target.value)}
                  placeholder="e.g. Medical emergency, Family function, Transport issue..."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCallLog(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingWebhook}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingWebhook ? 'Sending Webhook...' : 'Fire /webhook/elevenlabs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
