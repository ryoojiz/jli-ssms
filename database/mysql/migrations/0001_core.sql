-- MySQL 8.4 / InnoDB. Existing PostgreSQL migrations are intentionally not run here.
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  npsn VARCHAR(32),
  address VARCHAR(500),
  short_address VARCHAR(250),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  principal_name VARCHAR(160),
  academic_year VARCHAR(24),
  semester VARCHAR(24),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_schools_npsn (npsn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  name VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_app_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS school_memberships (
  school_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(32) NOT NULL,
  teacher_id VARCHAR(40),
  student_id VARCHAR(40),
  class_id VARCHAR(40),
  PRIMARY KEY (school_id, user_id),
  KEY idx_memberships_user (user_id),
  CONSTRAINT fk_membership_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES app_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  active_school_id VARCHAR(32) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expiry (expires_at),
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES app_users(id),
  CONSTRAINT fk_session_school FOREIGN KEY (active_school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  nip VARCHAR(40),
  name VARCHAR(160) NOT NULL,
  sex VARCHAR(2),
  position VARCHAR(160),
  subject VARCHAR(160),
  homeroom_class VARCHAR(40),
  phone VARCHAR(40),
  email VARCHAR(190),
  employment_status VARCHAR(32),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (school_id, id),
  UNIQUE KEY uq_teacher_nip (school_id, nip),
  CONSTRAINT fk_teacher_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classes (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  name VARCHAR(40) NOT NULL,
  grade INT NOT NULL,
  group_name VARCHAR(12),
  homeroom_teacher_id VARCHAR(40),
  room VARCHAR(80),
  capacity INT,
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_class_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_class_teacher FOREIGN KEY (school_id, homeroom_teacher_id) REFERENCES teachers(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  nisn VARCHAR(20) NOT NULL,
  nis VARCHAR(20),
  name VARCHAR(160) NOT NULL,
  sex VARCHAR(2),
  birth_date DATE,
  class_id VARCHAR(40) NOT NULL,
  address VARCHAR(500),
  father_name VARCHAR(160),
  mother_name VARCHAR(160),
  guardian_name VARCHAR(160),
  guardian_phone VARCHAR(40),
  guardian_email VARCHAR(190),
  tag_uid VARCHAR(60),
  PRIMARY KEY (school_id, id),
  UNIQUE KEY uq_student_nisn (school_id, nisn),
  KEY idx_students_class (school_id, class_id),
  CONSTRAINT fk_student_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parent_student_links (
  school_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  PRIMARY KEY (school_id, user_id, student_id),
  CONSTRAINT fk_parent_member FOREIGN KEY (school_id, user_id) REFERENCES school_memberships(school_id, user_id),
  CONSTRAINT fk_parent_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(60) NOT NULL,
  name VARCHAR(160) NOT NULL,
  PRIMARY KEY (school_id, id),
  UNIQUE KEY uq_subject_name (school_id, name),
  CONSTRAINT fk_subject_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teacher_assignments (
  school_id VARCHAR(32) NOT NULL,
  teacher_id VARCHAR(40) NOT NULL,
  class_id VARCHAR(40) NOT NULL,
  subject_id VARCHAR(60) NOT NULL,
  PRIMARY KEY (school_id, teacher_id, class_id, subject_id),
  CONSTRAINT fk_assignment_teacher FOREIGN KEY (school_id, teacher_id) REFERENCES teachers(school_id, id),
  CONSTRAINT fk_assignment_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id),
  CONSTRAINT fk_assignment_subject FOREIGN KEY (school_id, subject_id) REFERENCES subjects(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_records (
  school_id VARCHAR(32) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  attendance_date DATE NOT NULL,
  class_id VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL,
  attendance_time TIME,
  source VARCHAR(30) NOT NULL DEFAULT 'Manual',
  note VARCHAR(300),
  changed_by VARCHAR(190),
  changed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (school_id, student_id, attendance_date),
  KEY idx_attendance_class_date (school_id, class_id, attendance_date),
  CONSTRAINT fk_attendance_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id),
  CONSTRAINT fk_attendance_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id),
  CONSTRAINT ck_attendance_status CHECK (status IN ('Hadir','Terlambat','Izin','Sakit','Alfa'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_requests (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  class_id VARCHAR(40) NOT NULL,
  kind VARCHAR(12) NOT NULL,
  request_date DATE NOT NULL,
  note VARCHAR(500) NOT NULL,
  status VARCHAR(16) NOT NULL,
  requested_at DATETIME(3) NOT NULL,
  requested_by VARCHAR(190) NOT NULL,
  decided_at DATETIME(3),
  decided_by VARCHAR(190),
  PRIMARY KEY (school_id, id),
  KEY idx_leave_student_date (school_id, student_id, request_date),
  CONSTRAINT fk_leave_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id),
  CONSTRAINT fk_leave_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  target VARCHAR(32) NOT NULL,
  published_at DATETIME(3) NOT NULL,
  author VARCHAR(190) NOT NULL,
  PRIMARY KEY (school_id, id),
  KEY idx_announcement_time (school_id, published_at),
  CONSTRAINT fk_announcement_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  source_key VARCHAR(190) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (school_id, id),
  UNIQUE KEY uq_notification_source (school_id, source_key),
  KEY idx_notification_student (school_id, student_id, created_at),
  CONSTRAINT fk_notification_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_reads (
  school_id VARCHAR(32) NOT NULL,
  notification_id VARCHAR(40) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  read_at DATETIME(3) NOT NULL,
  PRIMARY KEY (school_id, notification_id, user_id),
  CONSTRAINT fk_read_notification FOREIGN KEY (school_id, notification_id) REFERENCES notifications(school_id, id),
  CONSTRAINT fk_read_user FOREIGN KEY (user_id) REFERENCES app_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_items (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(40) NOT NULL,
  location VARCHAR(100) NOT NULL,
  balance INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(190) NOT NULL,
  PRIMARY KEY (school_id, id),
  UNIQUE KEY uq_stock_name_location (school_id, name, location),
  CONSTRAINT fk_stock_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT ck_stock_balance CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_requests (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  item_id VARCHAR(40) NOT NULL,
  quantity INT NOT NULL,
  note VARCHAR(300) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(190) NOT NULL,
  reviewed_at DATETIME(3),
  reviewed_by VARCHAR(190),
  handed_at DATETIME(3),
  handed_by VARCHAR(190),
  PRIMARY KEY (school_id, id),
  KEY idx_stock_request_status (school_id, status),
  CONSTRAINT fk_stock_request_item FOREIGN KEY (school_id, item_id) REFERENCES stock_items(school_id, id),
  CONSTRAINT ck_stock_request_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_counts (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  item_id VARCHAR(40) NOT NULL,
  expected INT NOT NULL,
  observed INT NOT NULL,
  reason VARCHAR(300) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(190) NOT NULL,
  reviewed_at DATETIME(3),
  reviewed_by VARCHAR(190),
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_stock_count_item FOREIGN KEY (school_id, item_id) REFERENCES stock_items(school_id, id),
  CONSTRAINT ck_stock_count_nonnegative CHECK (expected >= 0 AND observed >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  item_id VARCHAR(40) NOT NULL,
  delta INT NOT NULL,
  kind VARCHAR(20) NOT NULL,
  note VARCHAR(300) NOT NULL,
  reference_id VARCHAR(40),
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(190) NOT NULL,
  PRIMARY KEY (school_id, id),
  UNIQUE KEY uq_stock_movement_ref (school_id, kind, reference_id),
  KEY idx_stock_movement_item (school_id, item_id, created_at),
  CONSTRAINT fk_stock_movement_item FOREIGN KEY (school_id, item_id) REFERENCES stock_items(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS library_rooms (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  capacity INT NOT NULL,
  changed_at DATETIME(3),
  changed_by VARCHAR(190),
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_room_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT ck_room_capacity CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_bookings (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  room_id VARCHAR(40) NOT NULL,
  class_id VARCHAR(40) NOT NULL,
  visit_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose VARCHAR(300) NOT NULL,
  expected INT NOT NULL,
  actual INT,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(190) NOT NULL,
  reviewed_at DATETIME(3),
  reviewed_by VARCHAR(190),
  completed_at DATETIME(3),
  completed_by VARCHAR(190),
  canceled_at DATETIME(3),
  canceled_by VARCHAR(190),
  PRIMARY KEY (school_id, id),
  KEY idx_booking_slot (school_id, room_id, visit_date, start_time, end_time),
  CONSTRAINT fk_booking_room FOREIGN KEY (school_id, room_id) REFERENCES library_rooms(school_id, id),
  CONSTRAINT fk_booking_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id),
  CONSTRAINT ck_booking_time CHECK (start_time < end_time),
  CONSTRAINT ck_booking_count CHECK (expected > 0 AND (actual IS NULL OR actual >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grade_assessments (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  teacher_id VARCHAR(40) NOT NULL,
  class_id VARCHAR(40) NOT NULL,
  subject_id VARCHAR(60) NOT NULL,
  semester VARCHAR(40) NOT NULL,
  kind VARCHAR(12) NOT NULL,
  title VARCHAR(160) NOT NULL,
  deadline DATE NOT NULL,
  published_at DATETIME(3),
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(190) NOT NULL,
  PRIMARY KEY (school_id, id),
  KEY idx_assessment_teacher_term (school_id, teacher_id, semester),
  CONSTRAINT fk_grade_teacher FOREIGN KEY (school_id, teacher_id) REFERENCES teachers(school_id, id),
  CONSTRAINT fk_grade_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id),
  CONSTRAINT fk_grade_subject FOREIGN KEY (school_id, subject_id) REFERENCES subjects(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grade_scores (
  school_id VARCHAR(32) NOT NULL,
  assessment_id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  changed_at DATETIME(3) NOT NULL,
  changed_by VARCHAR(190) NOT NULL,
  PRIMARY KEY (school_id, assessment_id, student_id),
  CONSTRAINT fk_score_assessment FOREIGN KEY (school_id, assessment_id) REFERENCES grade_assessments(school_id, id),
  CONSTRAINT fk_score_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id),
  CONSTRAINT ck_grade_score CHECK (score >= 0 AND score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grade_score_edits (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  assessment_id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  score DECIMAL(5,2),
  changed_at DATETIME(3) NOT NULL,
  changed_by VARCHAR(190) NOT NULL,
  PRIMARY KEY (school_id, id),
  KEY idx_score_edit_assessment (school_id, assessment_id, student_id),
  CONSTRAINT fk_score_edit_assessment FOREIGN KEY (school_id, assessment_id) REFERENCES grade_assessments(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grade_weights (
  school_id VARCHAR(32) NOT NULL,
  class_id VARCHAR(40) NOT NULL,
  subject_id VARCHAR(60) NOT NULL,
  semester VARCHAR(40) NOT NULL,
  daily INT NOT NULL,
  pts INT NOT NULL,
  pas INT NOT NULL,
  changed_at DATETIME(3) NOT NULL,
  changed_by VARCHAR(190) NOT NULL,
  PRIMARY KEY (school_id, class_id, subject_id, semester),
  CONSTRAINT fk_weight_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id),
  CONSTRAINT fk_weight_subject FOREIGN KEY (school_id, subject_id) REFERENCES subjects(school_id, id),
  CONSTRAINT ck_grade_weights CHECK (daily >= 0 AND pts >= 0 AND pas >= 0 AND daily + pts + pas = 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teacher_kpi_notes (
  school_id VARCHAR(32) NOT NULL,
  id VARCHAR(40) NOT NULL,
  teacher_id VARCHAR(40) NOT NULL,
  semester VARCHAR(40) NOT NULL,
  note TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  created_by VARCHAR(190) NOT NULL,
  PRIMARY KEY (school_id, id),
  CONSTRAINT fk_kpi_note_teacher FOREIGN KEY (school_id, teacher_id) REFERENCES teachers(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
