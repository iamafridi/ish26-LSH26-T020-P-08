-- Migration 0001_init — senior-database-architect
-- RLS + append-only audit + indexes

-- Enable RLS
ALTER TABLE "Result" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Policies: tenant isolation (app sets app.current_tenant)
CREATE POLICY tenant_isolation_result ON "Result" USING ("tenantId" = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_mark ON "Mark" USING ("tenantId" = current_setting('app.current_tenant', true));
CREATE POLICY tenant_isolation_student ON "Student" USING ("tenantId" = current_setting('app.current_tenant', true));

-- Audit append-only: prevent UPDATE/DELETE
CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER audit_no_update BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- Indexes already in schema.prisma, add BRIN for audit time-range (performance)
CREATE INDEX IF NOT EXISTS "AuditLog_at_brin" ON "AuditLog" USING BRIN ("at");
