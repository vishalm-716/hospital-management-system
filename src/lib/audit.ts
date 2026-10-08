import prisma from "@/lib/prisma";

interface AuditLogEntry {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create an audit log entry for tracking data access and modifications.
 * Used for every patient record read/write, report access, encounter change,
 * invoice change, and bed assignment.
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        ipAddress: entry.ipAddress,
        metadata: (entry.metadata as any) || undefined,
      },
    });
  } catch (error) {
    // Don't let audit logging failures break the application
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Helper to get client IP from headers (best effort in serverless)
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
