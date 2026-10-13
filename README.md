# CampusConnect — Group 16 · SIH26044

Academia–industry skill mapping, internships and placement portal.

## Stack
- React + Vite
- Supabase Auth (email/password)
- Supabase Postgres
- Row Level Security (RLS)
- Responsive navy / teal dashboard

## Features included
- Student sign up and sign in when Supabase is configured
- Overview dashboard and skill readiness cards
- Add/update student skills and proficiency
- Skill-gap snapshot against opportunity requirements
- Internship/project search and application flow
- Application tracker
- Demo placement-cell report view
- Demo preview mode before configuring Supabase

> The current report screen is a student-scope demonstration, not a complete institution-wide admin console. Production-wide analytics require authorized placement-officer roles and stricter role-based policies.

## 1. Requirements
Install Node.js LTS (includes npm) from https://nodejs.org/ and use a laptop terminal.

## 2. Run the website in demo mode
1. Extract the ZIP.
2. Open a terminal in the `CampusConnect` folder.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL printed by Vite, usually `http://localhost:5173`.
5. Without `.env.local`, the site opens in demo preview mode. Demo applications are kept only in the current browser session and are not saved to a server.

## 3. Connect Supabase
1. Open https://supabase.com/ and create a project.
2. In the Supabase project, open **SQL Editor**.
3. Open `supabase/schema.sql` from this project, copy all SQL, paste it in SQL Editor and click **Run**.
4. In **Project Settings / Connect**, copy the Project URL and publishable key.
5. In the project root, copy `.env.example` to `.env.local`.
6. Put your values in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```
7. Stop and restart Vite after changing environment variables (Ctrl+C, then `npm run dev`).
8. Create an account using your email. If email confirmation is enabled, confirm the link before logging in.

Never place a Supabase `service_role` key in a frontend `.env` file. Only the publishable key belongs in a browser app; RLS policies protect user data.

## 4. Production build
```bash
npm run build
npm run preview
```

## 5. Suggested demo walkthrough (3–4 minutes)
1. Show the dashboard and readiness metrics.
2. Open **My skills**, add a skill such as SQL and adjust proficiency.
3. Open **Internships & projects**, search for Power BI or Excel and apply.
4. Open **My applications** to show the submitted application.
5. Open **College reports** and explain that institution-wide reports need a verified placement-officer role.
6. Explain that Supabase stores authenticated users, profiles, skills, opportunities and applications.

## Assignment deliverables checklist
- [x] Problem statement and solution concept in this README
- [x] Technology architecture and data schema in `supabase/schema.sql`
- [x] Working frontend prototype with demo data
- [x] Supabase schema, RLS policies and seed opportunity listings
- [ ] Run against your own Supabase project and test account
- [ ] Add your college/team details, screenshots, and presentation
- [ ] Before public launch, implement verified placement-officer/company roles, audit access, validate data, and review all RLS policies

## Architecture / flow
Student → Sign up / Sign in → Profile + skills → Match with opportunity requirements → Apply → Track application → Placement cell reviews aggregated, authorized reports.

## SWOT starter
- Strengths: one place for skills, internships, and skill gaps.
- Weaknesses: matching quality depends on accurate skill profiles and employer data.
- Opportunities: college partnerships, verified employer listings, course recommendations.
- Threats: privacy risks, fake listings, low student/employer adoption.

## Basic business model starter
- Students: free access.
- Colleges: optional annual SaaS licence for verified placement analytics and skill-gap reporting.
- Employers: optional verified recruitment listing / campus hiring package.
- Costs: hosting, database, support, employer verification, and ongoing development.

## Risks and mitigations
- Student data privacy: least-privilege access, RLS, collect only necessary data.
- Fake jobs: verified employer onboarding and report/remove workflow.
- Weak recommendations: explain match scores and let students correct skills.
- Adoption: pilot with one department and measure active profiles, applications, and employer response.
