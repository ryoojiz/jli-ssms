import { randomUUID } from "node:crypto";
import type { PoolConnection } from "mysql2/promise";

export async function appendAudit(
  db: PoolConnection,
  schoolId: string,
  actor: string,
  action: string,
  reference: Record<string, string | number>,
) {
  await db.execute(
    `INSERT INTO audit_events
      (school_id,id,occurred_at,actor,action_name,before_value,after_value,ip_address)
     VALUES (?,?,UTC_TIMESTAMP(3),?,?,NULL,?,NULL)`,
    [schoolId, randomUUID(), actor, action, JSON.stringify(reference)],
  );
}
