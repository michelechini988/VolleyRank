import { supabaseAdmin } from './official_catalog_service.js';

export interface AuditLogEntry {
  entity_type: string;
  entity_id: string;
  action: string;
  source_system: string;
  old_value?: any;
  new_value?: any;
  severity: 'info' | 'warning' | 'error';
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const { error } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      action: entry.action,
      source_system: entry.source_system,
      old_value: entry.old_value,
      new_value: entry.new_value,
      severity: entry.severity,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error("Error logging audit:", error);
  }
}
