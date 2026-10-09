import { datetime, decimal, int, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";

export const schools = mysqlTable("schools", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  npsn: varchar("npsn", { length: 32 }),
  address: varchar("address", { length: 500 }),
  shortAddress: varchar("short_address", { length: 250 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  principalName: varchar("principal_name", { length: 160 }),
  academicYear: varchar("academic_year", { length: 24 }),
  semester: varchar("semester", { length: 24 }),
});

export const appUsers = mysqlTable("app_users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
});

export const schoolMemberships = mysqlTable(
  "school_memberships",
  {
    schoolId: varchar("school_id", { length: 32 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    teacherId: varchar("teacher_id", { length: 40 }),
    studentId: varchar("student_id", { length: 40 }),
  },
  (t) => [primaryKey({ columns: [t.schoolId, t.userId] })],
);

export const sessions = mysqlTable("sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  activeSchoolId: varchar("active_school_id", { length: 32 }).notNull(),
  expiresAt: datetime("expires_at").notNull(),
});

export const classes = mysqlTable(
  "classes",
  {
    schoolId: varchar("school_id", { length: 32 }).notNull(),
    id: varchar("id", { length: 40 }).notNull(),
    name: varchar("name", { length: 40 }).notNull(),
    grade: int("grade").notNull(),
  },
  (t) => [primaryKey({ columns: [t.schoolId, t.id] })],
);

export const students = mysqlTable(
  "students",
  {
    schoolId: varchar("school_id", { length: 32 }).notNull(),
    id: varchar("id", { length: 40 }).notNull(),
    nisn: varchar("nisn", { length: 20 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    classId: varchar("class_id", { length: 40 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.schoolId, t.id] })],
);
