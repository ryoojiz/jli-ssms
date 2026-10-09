ALTER TABLE fixed_assets ADD COLUMN quantity INT NOT NULL DEFAULT 1;
ALTER TABLE books ADD COLUMN publisher VARCHAR(160), ADD COLUMN publication_year INT, ADD COLUMN shelf VARCHAR(80);

CREATE TABLE IF NOT EXISTS imported_quality_checks (
  school_id VARCHAR(32) NOT NULL, row_key VARCHAR(300) NOT NULL,
  check_date DATE NOT NULL, dataset_name VARCHAR(160) NOT NULL,
  row_count INT NOT NULL, complete_count INT NOT NULL, duplicate_count INT NOT NULL,
  invalid_count INT NOT NULL, status VARCHAR(40), note VARCHAR(1000),
  PRIMARY KEY (school_id, row_key), KEY idx_import_quality_date (school_id, check_date),
  CONSTRAINT fk_import_quality_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS imported_grades (
  school_id VARCHAR(32) NOT NULL, row_key VARCHAR(300) NOT NULL,
  student_id VARCHAR(40) NOT NULL, class_id VARCHAR(40) NOT NULL,
  subject_name VARCHAR(160) NOT NULL, grade_kind VARCHAR(40) NOT NULL,
  score DECIMAL(5,2) NOT NULL, semester VARCHAR(40) NOT NULL,
  academic_year VARCHAR(24) NOT NULL, teacher_note VARCHAR(1000),
  PRIMARY KEY (school_id, row_key), KEY idx_imported_grade_student (school_id, student_id, semester),
  CONSTRAINT fk_imported_grade_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id),
  CONSTRAINT fk_imported_grade_class FOREIGN KEY (school_id, class_id) REFERENCES classes(school_id, id),
  CONSTRAINT ck_imported_grade_score CHECK (score >= 0 AND score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS health_screening_records (
  school_id VARCHAR(32) NOT NULL, student_id VARCHAR(40) NOT NULL, screening_date DATE NOT NULL,
  height_cm DECIMAL(6,2), weight_kg DECIMAL(6,2), vision VARCHAR(100), dental VARCHAR(100),
  immunization_complete BOOLEAN, note VARCHAR(1000),
  PRIMARY KEY (school_id, student_id, screening_date),
  CONSTRAINT fk_screening_record_student FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS access_events (
  school_id VARCHAR(32) NOT NULL, row_key VARCHAR(300) NOT NULL,
  event_date DATE NOT NULL, event_time TIME NOT NULL, person_name VARCHAR(160) NOT NULL,
  role_name VARCHAR(80), access_point VARCHAR(120) NOT NULL, direction_name VARCHAR(40), method_name VARCHAR(40),
  PRIMARY KEY (school_id, row_key), KEY idx_access_event_date (school_id, event_date, event_time),
  CONSTRAINT fk_access_event_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS integration_records (
  school_id VARCHAR(32) NOT NULL, source_sheet VARCHAR(100) NOT NULL,
  external_key VARCHAR(300) NOT NULL, subject_ref VARCHAR(100),
  event_date DATE, data_json JSON NOT NULL, updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (school_id, source_sheet, external_key),
  KEY idx_integration_subject (school_id, source_sheet, subject_ref),
  CONSTRAINT fk_integration_record_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
