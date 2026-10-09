CREATE TABLE IF NOT EXISTS kpi_catalog (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, name VARCHAR(200) NOT NULL,
  formula VARCHAR(500) NOT NULL, source VARCHAR(120) NOT NULL, owner_name VARCHAR(120) NOT NULL,
  frequency VARCHAR(40) NOT NULL, version_label VARCHAR(30) NOT NULL, display_value VARCHAR(80) NOT NULL,
  target_value VARCHAR(80) NOT NULL, status VARCHAR(30) NOT NULL, refreshed_at DATETIME,
  PRIMARY KEY (school_id, id), CONSTRAINT fk_kpi_catalog_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kpi_trends (
  school_id VARCHAR(32) NOT NULL, period_key VARCHAR(20) NOT NULL,
  attendance DECIMAL(6,2) NOT NULL, grade_average DECIMAL(6,2) NOT NULL, budget_absorption DECIMAL(6,2) NOT NULL,
  PRIMARY KEY (school_id, period_key), CONSTRAINT fk_kpi_trend_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS data_quality_checks (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, source VARCHAR(120) NOT NULL,
  check_name VARCHAR(240) NOT NULL, finding_count INT NOT NULL, threshold_count INT NOT NULL,
  status VARCHAR(30) NOT NULL, checked_at DATETIME,
  PRIMARY KEY (school_id, id), CONSTRAINT fk_quality_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scheduled_reports (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, name VARCHAR(200) NOT NULL,
  format_name VARCHAR(20) NOT NULL, schedule_label VARCHAR(120) NOT NULL,
  recipients VARCHAR(500) NOT NULL, status VARCHAR(30) NOT NULL, last_run_at DATETIME,
  PRIMARY KEY (school_id, id), CONSTRAINT fk_report_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingestion_status (
  school_id VARCHAR(32) NOT NULL, source VARCHAR(120) NOT NULL, method_name VARCHAR(80) NOT NULL,
  event_count INT NOT NULL, lag_label VARCHAR(40) NOT NULL, status VARCHAR(30) NOT NULL,
  PRIMARY KEY (school_id, source), CONSTRAINT fk_ingestion_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS integration_sources (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(80) NOT NULL, name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL, method_name VARCHAR(100) NOT NULL, status VARCHAR(40) NOT NULL,
  last_sync_label VARCHAR(100), notes TEXT,
  PRIMARY KEY (school_id, id), CONSTRAINT fk_integration_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS outbound_messages (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, channel_name VARCHAR(30) NOT NULL,
  recipient VARCHAR(200) NOT NULL, body TEXT NOT NULL, time_label VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,
  PRIMARY KEY (school_id, id), CONSTRAINT fk_outbound_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_events (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(40) NOT NULL, occurred_at DATETIME(3) NOT NULL,
  actor VARCHAR(190) NOT NULL, action_name VARCHAR(300) NOT NULL,
  before_value TEXT, after_value TEXT, ip_address VARCHAR(45),
  PRIMARY KEY (school_id, id), KEY idx_audit_time (school_id, occurred_at),
  CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Source-specific Excel sheets are staged here without losing their original column/value pairs.
-- Operational master-data imports are upserted into their typed tables; these rows remain traceable evidence.
CREATE TABLE IF NOT EXISTS import_batches (
  school_id VARCHAR(32) NOT NULL, id VARCHAR(36) NOT NULL, module_name VARCHAR(60) NOT NULL,
  imported_by VARCHAR(190) NOT NULL, imported_at DATETIME(3) NOT NULL,
  PRIMARY KEY (school_id, id), KEY idx_import_module (school_id, module_name, imported_at),
  CONSTRAINT fk_import_batch_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS import_rows (
  school_id VARCHAR(32) NOT NULL, module_name VARCHAR(60) NOT NULL,
  sheet_name VARCHAR(100) NOT NULL, row_key VARCHAR(300) NOT NULL,
  data_json JSON NOT NULL, batch_id VARCHAR(36) NOT NULL, updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (school_id, module_name, sheet_name, row_key),
  KEY idx_import_batch (school_id, batch_id),
  CONSTRAINT fk_import_row_batch FOREIGN KEY (school_id, batch_id) REFERENCES import_batches(school_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
