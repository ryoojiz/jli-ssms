CREATE TABLE IF NOT EXISTS assignment_submissions (
  school_id VARCHAR(32) NOT NULL,
  assignment_id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  submitted_at DATETIME(3),
  late BOOLEAN NOT NULL DEFAULT FALSE,
  initial_score DECIMAL(5,2),
  PRIMARY KEY (school_id, assignment_id, student_id),
  KEY idx_submission_student (school_id, student_id),
  CONSTRAINT fk_submission_assignment FOREIGN KEY (school_id, assignment_id) REFERENCES assignments(school_id, id),
  CONSTRAINT fk_submission_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id),
  CONSTRAINT ck_submission_score CHECK (initial_score IS NULL OR (initial_score >= 0 AND initial_score <= 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS imported_pipelines (
  school_id VARCHAR(32) NOT NULL,
  pipeline_id VARCHAR(40) NOT NULL,
  source_name VARCHAR(120) NOT NULL,
  destination_name VARCHAR(120),
  frequency_label VARCHAR(80),
  last_run_label VARCHAR(80),
  status VARCHAR(30),
  row_count INT NOT NULL,
  duration_seconds DECIMAL(14,2),
  error_message VARCHAR(1000),
  PRIMARY KEY (school_id, pipeline_id),
  KEY idx_imported_pipeline_source (school_id, source_name),
  CONSTRAINT fk_imported_pipeline_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
