# Job Fit Features — Design Spec

**Date:** 2026-06-23  
**Status:** Approved (history model: Option A)

## Fit score history — Option A (locked)

- Comparisons saved **only in the recruiter's browser** (`job_fit_history_v1`).
- Recruiters can analyse multiple JDs and compare scores in one job-fit session.
- **Dhruvil is notified only** when they click "Yes, notify Dhruvil" (existing flow).
- History clears when: new chat, leaving job-fit mode, or starting fresh job-fit from header.
- History **persists** when clicking "Check another role".

## Remaining features (phased)

| Phase | Feature            | Notes                                  |
| ----- | ------------------ | -------------------------------------- |
| 1     | Fit score history  | This spec — Option A                   |
| 2     | Skill gap chart    | Radar/bar from parsed tables + prompt  |
| 3     | Seniority hint     | Extend classifier + fit prompt         |
| 4     | Schedule call CTA  | Score ≥ 75 + Calendly from settings    |
| 5     | DOCX support       | mammoth client extraction              |
| 6     | Export PDF         | Server route + @react-pdf/renderer     |
| 7     | Admin JD analytics | Migration + `/admin/job-fit-analytics` |

## Privacy copy

> Saved in your browser only. Dhruvil is notified only if you choose to contact him.
