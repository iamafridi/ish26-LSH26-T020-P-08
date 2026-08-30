import { getCase } from "../../../../../lib/engine";

export async function GET(_req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const c = getCase(decodeURIComponent(caseId));
  if (!c) return new Response(JSON.stringify({ error: `Case ${caseId} not found` }), { status: 404 });
  let csv = "id,name,class,optional,finalGPA,letter,isFail,uncappedGPA,failureCause,optionalGP,optionalContrib,lists\n";
  for (const r of c.results) {
    csv += [r.id, `"${r.name}"`, r.class, r.optional, r.gpa.finalGPADisplay, r.gpa.letter, r.isFail ? "FAIL" : "PASS", r.gpa.uncappedDisplay, r.gpa.failureCause || "", r.optionalGP, r.gpa.optionalContribution, r.checkingListKeys.join("|")].join(",") + "\n";
  }
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${caseId}.csv"`,
    },
  });
}
