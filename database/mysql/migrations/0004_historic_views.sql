CREATE TABLE IF NOT EXISTS attendance_trends (
  school_id VARCHAR(32) NOT NULL, day_label VARCHAR(12) NOT NULL, percent_value DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (school_id, day_label), CONSTRAINT fk_attendance_trend_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historic_leave_samples (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, student_name VARCHAR(160) NOT NULL,
  class_name VARCHAR(40) NOT NULL, kind VARCHAR(20) NOT NULL, request_date DATE NOT NULL,
  note VARCHAR(500) NOT NULL, status VARCHAR(30) NOT NULL,
  PRIMARY KEY (school_id, id), CONSTRAINT fk_historic_leave_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS school_comparison_samples (
  school_id VARCHAR(32) NOT NULL, compared_school_name VARCHAR(160) NOT NULL,
  attendance_percent DECIMAL(6,2) NOT NULL, grade_average DECIMAL(6,2) NOT NULL,
  budget_absorption DECIMAL(6,2) NOT NULL, incident_count INT NOT NULL,
  PRIMARY KEY (school_id, compared_school_name),
  CONSTRAINT fk_comparison_owner_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
