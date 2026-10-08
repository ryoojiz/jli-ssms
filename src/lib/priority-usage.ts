import type { DemoWorkflow } from "@/lib/demo-workflow";
import { teacherKpi, type PriorityState } from "@/lib/priority-demo";

/** All figures come from new, browser-local demo transactions, never sample or Cloud records. */
export function summarizePriorityUsage(priority: PriorityState, workflow: DemoWorkflow) {
  const teacherPeriods = new Map<string, { teacherId: string; semester: string }>();
  for (const assessment of priority.assessments) {
    teacherPeriods.set(`${assessment.teacherId}\u0000${assessment.semester}`, {
      teacherId: assessment.teacherId,
      semester: assessment.semester,
    });
  }
  const teacher = {
    active: new Set(priority.assessments.map((a) => a.teacherId)).size,
    entriesDone: 0,
    entriesTotal: 0,
    onTime: 0,
    deadlineTotal: 0,
  };
  for (const { teacherId, semester } of teacherPeriods.values()) {
    const result = teacherKpi(priority, teacherId, semester);
    teacher.entriesDone += result.entriesDone;
    teacher.entriesTotal += result.entriesTotal;
    teacher.onTime += result.onTime;
    teacher.deadlineTotal += result.deadlineTotal;
  }

  const completedBookings = priority.bookings.filter((booking) => booking.status === "Selesai");
  const published = priority.assessments.filter((assessment) => assessment.publishedAt);

  return {
    warehouse: {
      handovers: priority.requests.filter((request) => request.status === "Diserahkan").length,
      pending: priority.requests.filter((request) => request.status === "Menunggu").length,
      approvedCounts: priority.counts.filter((count) => count.status === "Disetujui").length,
    },
    attendance: {
      records: workflow.attendance.filter((record) => record.schoolId === priority.schoolId).length,
      pendingRequests: workflow.requests.filter(
        (request) => request.schoolId === priority.schoolId && request.status === "Menunggu",
      ).length,
    },
    library: {
      visits: completedBookings.length,
      visitors: completedBookings.reduce((sum, booking) => sum + (booking.actual ?? 0), 0),
      pending: priority.bookings.filter((booking) => booking.status === "Menunggu").length,
    },
    grades: {
      published: published.length,
      drafts: priority.assessments.length - published.length,
      publishedScores: published.reduce(
        (sum, assessment) => sum + Object.keys(assessment.scores).length,
        0,
      ),
    },
    teacher,
  };
}
