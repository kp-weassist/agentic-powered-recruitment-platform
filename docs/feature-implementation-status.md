## Feature Implementation Status (Candidate Portal)

Date: 2025-09-06

Scope: `@profile`, `@resumes`, `@resume-builder`, `@assessments`, `@ats-optimization-checker`, `@resume-and-jd-analyzer`

### @profile (Candidate Profile)
- Done
  - Multi-section profile with personal details, skills, location, desired salary, experience, education, projects
  - Rich text support for experience, projects, and education coursework
  - Resume upload and avatar upload via Supabase Storage
  - Resume parsing + extraction flow to prefill profile (PDF parsing + structured extraction)
  - Persist profile to `users` and `candidate_profiles`
- Left (per PRD Epic 3.1)
  - Skills proficiency levels (currently free-text skills only)
  - Profile completeness indicator with suggestions
  - Privacy settings for profile visibility
  - Profile preview showing employer view
  - Explicit UI toggle for experience `is_current` (data field exists; toggle present in builder but not on profile page)

### @resumes (Resume Library)
- Done
  - Upload resumes to Supabase (stored with `file_url`, `storage_path`)
  - List previous uploads with inline PDF preview and open-in-new-tab
  - Set default resume (writes to `candidate_profiles.resume_url`)
- Left (per PRD Epic 3.2)
  - Support DOC/DOCX upload in this screen (profile uploader accepts; library restricts to PDF)
  - File size validation (e.g., 5MB max) and user-facing errors
  - Versioning UI (rename, delete, designate versions)
  - Parsed data review screen with edit/fallback (covered in builder/profile flow; not in this screen)

### @resume-builder (Templates, Wizard, Export)
- Done
  - Step-by-step wizard with progress indicator
  - Real-time preview and matching PDF export via React-PDF
  - Save/update to Supabase Storage (`resume` bucket) and `resumes` row with `resume_data`
  - Prefill from uploaded resume by parsing + structured extraction
  - Template options: Classic and Modern (2 templates)
  - "Save as New" with custom filename and in-place URL update when creating new
- Left (per PRD Epic 3.3)
  - 5 professional designs (currently 2)
  - Auto-save during creation (manual save/export only today)
  - Content suggestions based on job title
  - Template gallery UX polish (thumbnails, descriptions)

### @assessments (Creation from JD/Resume, Runner, Results, History)
- Done
  - Candidate-side creation of assessment from resume + JD (POST API)
  - Runner supports multiple-choice, coding, and scenario; time tracking and auto-submit on timeout
  - Attempt creation on open; per-question navigation; multi-select MCQs
  - Results: overall score, AI summary (if provided), per-question breakdown, feedback tab
  - History: graded attempts list with relative scoring progress bar
- Left (per PRD Epic 5)
  - Admin assessment builder (question bank, difficulty, preview, versioning)
  - Coding editor with syntax highlighting and test cases; code replay
  - Anti-cheating measures (e.g., copy-paste detection)
  - Comparative analysis across candidates; pass/fail thresholds
  - Exports (PDF/CSV); integrate results directly into employer-facing candidate view
  - Assignment flows (auto/manual/bulk), reminders, deadlines, retake policies
  - Library of 5 technical + 5 soft-skill assessments surfaced in UI

### @ats-optimization-checker (ATS Analysis)
- Done
  - Generate ATS analysis for any uploaded resume; save results on the resume row
  - Report includes: ATS compatibility score, keyword match (matched/missing), readability, action verbs, length, section structure, formatting guides, quantifiable achievements, red flags, parse risks, contact/links/tables/images checks
  - Dialog view and inline section rendering
- Docs alignment
  - Not explicitly specified in PRD; recommended to add as a Candidate tool under Epic 3 or as a supporting capability to Epic 4 (AI explainability)

### @resume-and-jd-analyzer (Alignment Analysis + History)
- Done
  - Analyze selected resume against pasted JD; dialog report with: overall match, role inferred, keyword matching (matched/missing/recommended), experience alignment (strengths/gaps), responsibilities alignment (satisfied/partial/missing), resume improvements, tailored bullets, education/cert alignment, ATS considerations, interview prep (technical/behavioral/domain + estimated seniority), risk flags, next steps
  - History page (`resume_jd_analysis_history`) with resume preview, stored JD, and tabbed results
- Docs alignment
  - Complements PRD Epic 4 (AI matching/explainability) and FR3; recommend documenting as an explicit story for candidate-side JD alignment and interview prep generation

---

### Additional Implemented Capabilities (not explicitly in PRD docs)
- Resume parsing pipeline exposed to UI flows (profile extract, builder prefill)
- Resume default selection and inline PDF previews across multiple screens
- Save-as-new and versioned filename strategy for builder exports
- Candidate assessment attempt history with sorted results and progress visualization

---

### Recommended PRD Additions/Updates
1) Add Story: "ATS Optimization Checker" (Candidate Tools)
   - Provide ATS-focused analysis with actionable suggestions and keyword coverage to improve parsing outcomes and recruiter screening.
2) Add Story: "Resume + JD Alignment & Interview Prep" (AI Explainability under Epic 4)
   - Generate match score, alignment breakdowns, targeted resume improvements, and interview prep questions; persist history for comparison.
3) Clarify Resume Workflows
   - Make explicit that parsing + review can occur in builder/profile, while the resume library focuses on storage, default selection, and previews.
4) Extend Resume Builder Requirements
   - Specify minimum number of templates (≥5), auto-save behavior, and content suggestion UX.
5) Assessment Builder & Delivery Scope
   - Define admin-facing builder, assignment/reminder flows, and result exports to meet Epic 5 acceptance.

---

### Quick Gap Checklist vs PRD
- Skills proficiency (profile): Missing
- Profile completeness, privacy, preview: Missing
- Resume file size validation + DOC/DOCX in library: Missing
- Builder auto-save, 5 templates, job-title suggestions: Missing
- Assessment builder/admin, anti-cheat, editor, exports, assignments: Missing
- Comparative analytics and cross-candidate views: Missing

Overall, candidate-side foundations are implemented with strong resume tooling (upload, parsing, builder/export) and value-add AI utilities (ATS check, JD alignment). The largest remaining items are admin/assignment flows for assessments and several UX enhancements specified in Epic 3 and Epic 5.


