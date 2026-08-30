# Rule Engine — Formal Spec (R-10 .. R-13)

Source of truth: `config/rules.json:1` (dynamic) + `src/domain/engine.js:1` (implementation). Rules are versioned; `RULE_ENGINE.md` changelog below.

## R-11 Subject Pass/Fail

```
IF mark == "AB":
  markUsed = "AB", GP=0, isFail=true, isAbsent=true, rule="R-11 ABSENT"
ELSE IF subject.practical:
  total = theory + practical
  practicalBelow = practical < passMarks.practical (8)   // tracked for R-10 even if theory also fails
  IF theory < passMarks.theory (25):
    GP=0, isFail=true, hasPracticalFail=practicalBelow, rule = "R-11 THEORY_FAIL(th<25)" [+ "+PRACTICAL_BELOW(p<8)" if practicalBelow]
  ELSE IF practicalBelow:
    GP=0, isFail=true, hasPracticalFail=true, rule="R-11 PRACTICAL_FAIL(p<8)"
  ELSE:
    GP = scale(total) via gradingScale, isFail=(GP==0), rule="R-11 PASS" or "R-11 TOTAL_FAIL(0-32)"
ELSE: // non-practical 0..100
  GP = scale(total), isFail=(GP==0), rule="R-11 PASS"/"R-11 FAIL(0-32)"   // 25 not applied; 33 threshold via scale
```

**Grade Scale (configurable, default):**
```
80-100:5.0 A+ | 70-79:4.0 A | 60-69:3.5 A- | 50-59:3.0 B | 40-49:2.0 C | 33-39:1.0 D | 0-32:0.0 F
```

## R-12 GPA

```
optionalContribution = max(0, optionalGP - optionalDeduction) // deduction=2.0
rawUncapped = (Σ compulsoryGPs + optionalContribution) / divisor  // divisor=6
uncappedGPA = roundHalfUp( min(cap, rawUncapped), 2 ) // cap=5.00, HALF_UP via Decimal
```

Examples:
- `Σcomp=30, optGP=5 → (30+3)/6=5.5 → capped 5.00`
- `optGP=2.0 → max(0,0)=0`
- `optGP=AB→0 → 0`

## R-13 Overall Result & Letter

```
hasCompulsoryFail = any compulsoryGP==0
finalGPA = hasCompulsoryFail ? 0.00 : uncappedGPA
letter   = hasCompulsoryFail ? "F" : map(finalGPA)
// map: 5.00→A+, 4.00-4.99→A, 3.50-3.99→A-, 3.00-3.49→B, 2.00-2.99→C, 1.00-1.99→D, else F
uncappedDisplay preserved for trace; failureCause = first failed compulsory code + trace
```

Trace must show:
- per-subject `markUsed`, `gradePoint`, `rule` that decided it
- for high-average fails: `failureCauseTrace` + R-13 note `final 0.00 F (uncancelled X.XX visible)`

## R-10 Checking Lists (Pre-Publish)

```
optionalList   = every student where optionalGP ≤ optionalThreshold (2.0)  // includes AB→0
practicalList  = every student where practicalBelowThreshold in ANY subject (practical <8)
absentList     = every student where isAbsent in ANY subject
A student may be on 1–3 lists.
```

Teacher hand-verify each list before `VERIFIED`. Lists are exposed via `GET /api/cases/:id/checking-lists` and static `checking_lists.json`.

## Rounding

Use `Decimal.js` `toDecimalPlaces(2, ROUND_HALF_UP)`. `Math.round` would mis-round 3.495 → 3.49.

## Changelog

- **v1.0.0** (current): initial implementation, Decimal HALF_UP, practicalBelowThreshold tracked independently, AB separate from 0.
- Next: DB-backed `rule_config` with `effective_from` + migration for new board rules.
