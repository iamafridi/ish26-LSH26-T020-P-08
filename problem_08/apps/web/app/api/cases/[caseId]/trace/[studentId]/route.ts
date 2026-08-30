import { NextResponse } from "next/server";
import { getCase } from "../../../../../../lib/engine";

export async function GET(_req: Request, { params }: { params: Promise<{ caseId: string; studentId: string }> }) {
  const { caseId, studentId } = await params;
  const c = getCase(decodeURIComponent(caseId));
  if (!c) return NextResponse.json({ error: `Case ${caseId} not found` }, { status: 404 });
  const stu = c.results.find((r: any) => r.id === decodeURIComponent(studentId));
  if (!stu) return NextResponse.json({ error: `Student ${studentId} not found in ${caseId}` }, { status: 404 });
  return NextResponse.json(stu);
}
