CREATE TABLE IF NOT EXISTS timetables (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, day_name VARCHAR(12) NOT NULL,
  start_time TIME NOT NULL, end_time TIME NOT NULL, class_id VARCHAR(40) NOT NULL,
  subject_name VARCHAR(160) NOT NULL, teacher_name VARCHAR(160) NOT NULL, room VARCHAR(80) NOT NULL,
  PRIMARY KEY (school_id, id), KEY idx_timetable_class (school_id, class_id, day_name),
  CONSTRAINT fk_timetable_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, title VARCHAR(160) NOT NULL,
  class_id VARCHAR(40) NOT NULL, subject_name VARCHAR(160) NOT NULL, deadline DATE NOT NULL,
  submitted_count INT NOT NULL, total_count INT NOT NULL, status VARCHAR(20) NOT NULL,
  PRIMARY KEY (school_id, id), CONSTRAINT fk_assignment_record_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exams (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, name VARCHAR(160) NOT NULL,
  subject_name VARCHAR(160) NOT NULL, class_id VARCHAR(40) NOT NULL, exam_date DATE NOT NULL,
  kind VARCHAR(24) NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_exam_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historic_grades (
  school_id VARCHAR(32) NOT NULL, student_id VARCHAR(40) NOT NULL, subject_name VARCHAR(160) NOT NULL,
  score DECIMAL(5,2) NOT NULL, PRIMARY KEY (school_id, student_id, subject_name),
  CONSTRAINT fk_historic_grade_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id),
  CONSTRAINT ck_historic_score CHECK (score >= 0 AND score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS budget_lines (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, code VARCHAR(40) NOT NULL,
  program VARCHAR(200) NOT NULL, budget DECIMAL(16,2) NOT NULL, realized DECIMAL(16,2) NOT NULL,
  PRIMARY KEY (school_id, id), UNIQUE KEY uq_budget_code (school_id, code),
  CONSTRAINT fk_budget_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finance_transactions (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, transaction_date DATE NOT NULL,
  description VARCHAR(300) NOT NULL, category VARCHAR(60) NOT NULL, kind VARCHAR(30) NOT NULL,
  amount DECIMAL(16,2) NOT NULL, status VARCHAR(30) NOT NULL, PRIMARY KEY (school_id, id),
  KEY idx_finance_date (school_id, transaction_date),
  CONSTRAINT fk_finance_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cashflow_periods (
  school_id VARCHAR(32) NOT NULL, period_key VARCHAR(16) NOT NULL,
  inflow DECIMAL(16,2) NOT NULL, outflow DECIMAL(16,2) NOT NULL,
  PRIMARY KEY (school_id, period_key), CONSTRAINT fk_cashflow_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fixed_assets (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, asset_code VARCHAR(80) NOT NULL,
  name VARCHAR(200) NOT NULL, category VARCHAR(80) NOT NULL, location VARCHAR(100) NOT NULL,
  condition_label VARCHAR(40) NOT NULL, status VARCHAR(30) NOT NULL, purchase_value DECIMAL(16,2) NOT NULL,
  PRIMARY KEY (school_id, id), UNIQUE KEY uq_asset_code (school_id, asset_code),
  CONSTRAINT fk_asset_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_loans (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, asset_name VARCHAR(200) NOT NULL,
  borrower VARCHAR(160) NOT NULL, loan_date DATE NOT NULL, return_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_asset_loan_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_maintenance (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, asset_name VARCHAR(200) NOT NULL,
  kind VARCHAR(60) NOT NULL, scheduled_date DATE NOT NULL, technician VARCHAR(160) NOT NULL,
  status VARCHAR(30) NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_asset_maintenance_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS books (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, isbn VARCHAR(40) NOT NULL,
  title VARCHAR(240) NOT NULL, author VARCHAR(160) NOT NULL, category VARCHAR(80) NOT NULL,
  stock INT NOT NULL, available INT NOT NULL, PRIMARY KEY (school_id, id),
  UNIQUE KEY uq_book_isbn (school_id, isbn), CONSTRAINT fk_book_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT ck_book_stock CHECK (stock >= 0 AND available >= 0 AND available <= stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS book_loans (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, book_title VARCHAR(240) NOT NULL,
  borrower VARCHAR(160) NOT NULL, class_name VARCHAR(40) NOT NULL, loan_date DATE NOT NULL,
  due_date DATE NOT NULL, status VARCHAR(30) NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_book_loan_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS health_visits (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, student_name VARCHAR(160) NOT NULL,
  class_name VARCHAR(40) NOT NULL, visit_date DATE NOT NULL, complaint VARCHAR(300) NOT NULL,
  treatment VARCHAR(300) NOT NULL, status VARCHAR(30) NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_health_visit_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS anthropometry_summaries (
  school_id VARCHAR(32) NOT NULL, class_name VARCHAR(40) NOT NULL, average_height DECIMAL(6,2) NOT NULL,
  average_weight DECIMAL(6,2) NOT NULL, nutrition_status VARCHAR(60) NOT NULL, normal_percent DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (school_id, class_name), CONSTRAINT fk_anthro_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS health_screenings (
  school_id VARCHAR(32) NOT NULL, kind VARCHAR(80) NOT NULL, examined INT NOT NULL, findings INT NOT NULL,
  PRIMARY KEY (school_id, kind), CONSTRAINT fk_screening_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitors (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, name VARCHAR(160) NOT NULL,
  organization VARCHAR(160) NOT NULL, purpose VARCHAR(240) NOT NULL, arrived_at VARCHAR(20) NOT NULL,
  left_at VARCHAR(20) NOT NULL, status VARCHAR(30) NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_visitor_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS security_incidents (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, occurred_at DATETIME NOT NULL,
  kind VARCHAR(160) NOT NULL, location VARCHAR(120) NOT NULL, source VARCHAR(120) NOT NULL,
  severity VARCHAR(30) NOT NULL, status VARCHAR(30) NOT NULL, PRIMARY KEY (school_id, id),
  KEY idx_incident_status (school_id, status, occurred_at),
  CONSTRAINT fk_incident_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devices (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, name VARCHAR(160) NOT NULL,
  type VARCHAR(60) NOT NULL, location VARCHAR(120) NOT NULL, status VARCHAR(40) NOT NULL,
  last_seen_label VARCHAR(80) NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_device_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS learning_materials (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, title VARCHAR(200) NOT NULL,
  subject_name VARCHAR(160) NOT NULL, class_id VARCHAR(40) NOT NULL, type VARCHAR(40) NOT NULL,
  access_count INT NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_material_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quizzes (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, title VARCHAR(200) NOT NULL,
  class_id VARCHAR(40) NOT NULL, question_count INT NOT NULL, participant_count INT NOT NULL,
  average_score DECIMAL(5,2) NOT NULL, status VARCHAR(30) NOT NULL, PRIMARY KEY (school_id, id),
  CONSTRAINT fk_quiz_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
