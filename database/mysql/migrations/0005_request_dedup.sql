CREATE TABLE IF NOT EXISTS request_dedup (
  school_id VARCHAR(32) NOT NULL,
  request_key VARCHAR(36) NOT NULL,
  actor_user_id VARCHAR(36) NOT NULL,
  action_name VARCHAR(60) NOT NULL,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (school_id, request_key),
  KEY idx_dedup_actor (school_id, actor_user_id, applied_at),
  CONSTRAINT fk_dedup_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_dedup_actor FOREIGN KEY (actor_user_id) REFERENCES app_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
