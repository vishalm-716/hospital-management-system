import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const health: {
    status: string;
    timestamp: string;
    database: string;
    version: string;
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "unknown",
    version: "1.0.0",
  };

  try {
    // Check database connectivity via Prisma with 2s timeout
    const prismaPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 2000));
    await Promise.race([prismaPromise, timeoutPromise]);
    health.database = "connected";
  } catch {
    // If raw TCP port is filtered by network/hotspot, check HTTPS Supabase REST
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        const res = await fetch(`${supabaseUrl}/rest/v1/User?select=id&limit=1`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        if (res.ok) {
          health.database = "connected";
        } else {
          health.database = "disconnected";
          health.status = "degraded";
        }
      } else {
        health.database = "disconnected";
        health.status = "degraded";
      }
    } catch {
      health.database = "disconnected";
      health.status = "degraded";
    }
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
