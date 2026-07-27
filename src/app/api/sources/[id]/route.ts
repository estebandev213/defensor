import { NextResponse } from "next/server";
import { z } from "zod";
import { createDatabaseClient } from "@/db/client";
import { PostgresLegalCatalogRepository } from "@/server/legal/repository";
import { env } from "@/server/security/env";
import { publicError } from "@/server/security/errors";

export const dynamic = "force-dynamic";

const SourceIdSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const parsedId = SourceIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(publicError("VALIDATION_ERROR"), { status: 400 });
  }

  if (!env.DATABASE_URL) {
    return NextResponse.json(publicError("DATABASE_UNAVAILABLE"), { status: 503 });
  }

  const db = createDatabaseClient();
  try {
    const source = await new PostgresLegalCatalogRepository(db).getSourceById(parsedId.data);
    if (!source) {
      return NextResponse.json(publicError("SOURCE_NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json({
      id: source.id,
      title: source.title,
      normType: source.normType,
      normNumber: source.normNumber,
      officialPublisher: source.officialPublisher,
      officialUrl: source.officialUrl,
      sourceDomain: source.sourceDomain,
      publicationDate: source.publicationDate,
      effectiveFrom: source.effectiveFrom,
      effectiveTo: source.effectiveTo,
      status: source.status,
      retrievedAt: source.retrievedAt,
    });
  } catch {
    return NextResponse.json(publicError("DATABASE_UNAVAILABLE"), { status: 503 });
  } finally {
    await db.end({ timeout: 1 }).catch(() => undefined);
  }
}
