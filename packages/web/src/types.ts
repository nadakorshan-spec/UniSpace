export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  instructor?: string | null;
  color: string;
  credits?: number | null;
  term?: string | null;
  createdAt?: string;
  _count?: { tasks: number; exams: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: 'ASSIGNMENT' | 'TASK';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  dueAt?: string | null;
  completedAt?: string | null;
  courseId?: string | null;
  course?: Pick<Course, 'id' | 'code' | 'title' | 'color'> | null;
}

export interface Exam {
  id: string;
  title: string;
  examType: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'OTHER';
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  courseId?: string | null;
  course?: Pick<Course, 'id' | 'code' | 'title' | 'color'> | null;
}

export interface CalendarEvent {
  id: string;
  kind: 'TASK' | 'EXAM';
  title: string;
  start: string;
  end: string;
  color: string;
  courseCode: string | null;
  priority?: Task['priority'];
  status?: Task['status'];
  examType?: Exam['examType'];
  location?: string | null;
}

export interface DashboardStats {
  totalCourses: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalExams: number;
  upcomingExamsCount: number;
  deadlinesThisWeek: number;
  completionRate: number;
  priorityCounts: Record<Task['priority'], number>;
  statusCounts: Record<Task['status'], number>;
  weeklyActivity: { label: string; date: string; tasks: number; exams: number }[];
  upcomingTasks: Task[];
  upcomingExams: Exam[];
  courses: Course[];
}

export interface StudySession {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  completed: boolean;
  taskId?: string | null;
}

export interface StudyPlan {
  id: string;
  title: string;
  summary: string;
  model: string;
  generatedAt: string;
  sessions: StudySession[];
}
