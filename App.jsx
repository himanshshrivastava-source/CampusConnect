import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpen,
  BriefcaseBusiness, Building2, CheckCircle2, ChevronDown, CircleHelp,
  ClipboardList, Code2, Compass, GraduationCap, LayoutDashboard, LogOut,
  Menu, Plus, Search, Settings, ShieldCheck, Sparkles, Target, Users,
  X, Zap
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'

const demoJobs = [
  { id: 'demo-1', title: 'Finance & Business Analyst Intern', company: 'Northstar Analytics', location: 'Hybrid · Indore', type: 'Internship', stipend: '₹12,000/mo', skills: ['Excel', 'Financial Analysis', 'Power BI'], match: 86, color: 'mint' },
  { id: 'demo-2', title: 'Business Operations Intern', company: 'OrbitWorks', location: 'Remote · India', type: 'Internship', stipend: '₹10,000/mo', skills: ['Operations', 'SQL', 'Communication'], match: 72, color: 'violet' },
  { id: 'demo-3', title: 'Junior Data & Reporting Intern', company: 'BluePeak Systems', location: 'On-site · Bhopal', type: 'Project', stipend: '₹8,000/mo', skills: ['Power BI', 'SQL', 'Excel'], match: 68, color: 'amber' },
]
const initialSkills = [
  { name: 'Excel', level: 82, category: 'Business' },
  { name: 'Financial Analysis', level: 68, category: 'Finance' },
  { name: 'Power BI', level: 56, category: 'Analytics' },
  { name: 'SQL', level: 42, category: 'Technology' },
]
const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'skills', label: 'My skills', icon: Target },
  { id: 'opportunities', label: 'Internships & projects', icon: BriefcaseBusiness },
  { id: 'applications', label: 'My applications', icon: ClipboardList },
  { id: 'reports', label: 'College reports', icon: Activity },
]

function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [active, setActive] = useState('overview')
  const [jobs, setJobs] = useState(demoJobs)
  const [applications, setApplications] = useState([])
  const [skills, setSkills] = useState(initialSkills)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [dataMode, setDataMode] = useState(isSupabaseConfigured ? 'connecting' : 'demo')

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data.session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!supabase) return
    if (!user) { setDataMode('connected'); return }
    let mounted = true
    async function loadData() {
      setDataMode('loading')
      const [p, s, j, a] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('student_skills').select('*').eq('student_id', user.id),
        supabase.from('opportunities').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('applications').select('*, opportunities(title, company_name)').eq('student_id', user.id).order('created_at', { ascending: false })
      ])
      if (!mounted) return
      if (p.data) setProfile(p.data)
      if (s.data?.length) setSkills(s.data.map(x => ({ name: x.skill_name, level: x.proficiency, category: x.category || 'General', id: x.id })))
      if (j.data?.length) setJobs(j.data.map(x => ({ id: x.id, title: x.title, company: x.company_name, location: x.location || 'Not specified', type: x.opportunity_type || 'Internship', stipend: x.stipend || 'Not listed', skills: x.required_skills || [], match: scoreMatch(x.required_skills || [], skills), raw: x })))
      if (a.data) setApplications(a.data.map(x => ({ id: x.id, opportunityId: x.opportunity_id, title: x.opportunities?.title || 'Opportunity', company: x.opportunities?.company_name || 'Company', status: x.status, created_at: x.created_at })))
      setDataMode('live')
    }
    loadData()
    return () => { mounted = false }
  }, [user])

  const name = profile?.full_name || user?.user_metadata?.full_name || fullName || 'Himansh'
  const filteredJobs = useMemo(() => jobs.filter(j => `${j.title} ${j.company} ${(j.skills || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())), [jobs, search])
  const completed = Math.min(100, Math.round(skills.reduce((n, s) => n + s.level, 0) / Math.max(1, skills.length)))
  const totalApps = applications.length
  const notify = (message) => { setToast(message); setTimeout(() => setToast(''), 3200) }

  async function handleAuth(e) {
    e.preventDefault()
    setBusy(true)
    if (!supabase) {
      notify('Demo mode: add Supabase credentials in .env.local to enable real login.')
      setBusy(false); return
    }
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    setBusy(false)
    if (result.error) notify(result.error.message)
    else if (authMode === 'signup' && !result.data.session) notify('Account created. Check your email to confirm, then log in.')
    else notify(authMode === 'signup' ? 'Account created!' : 'Welcome back!')
  }

  async function applyToJob(job) {
    if (applications.some(a => a.opportunityId === job.id || a.id === `demo-app-${job.id}`)) {
      notify('You have already applied to this opportunity.'); return
    }
    if (supabase && user && !String(job.id).startsWith('demo-')) {
      const { data, error } = await supabase.from('applications').insert({ opportunity_id: job.id, student_id: user.id, status: 'submitted' }).select().single()
      if (error) { notify(error.message); return }
      setApplications(prev => [{ id: data.id, opportunityId: job.id, title: job.title, company: job.company, status: 'submitted', created_at: data.created_at }, ...prev])
      notify('Application submitted successfully!')
    } else {
      setApplications(prev => [{ id: `demo-app-${job.id}`, opportunityId: job.id, title: job.title, company: job.company, status: 'submitted', created_at: new Date().toISOString() }, ...prev])
      notify(supabase && !user ? 'Log in to save applications to your account. Demo application shown.' : 'Demo application added! Connect Supabase to save it permanently.')
    }
  }

  async function saveSkill(skill) {
    if (supabase && user) {
      const { error } = await supabase.from('student_skills').upsert({ student_id: user.id, skill_name: skill.name, proficiency: skill.level, category: skill.category }, { onConflict: 'student_id,skill_name' })
      if (error) { notify(error.message); return }
    }
    setSkills(prev => prev.some(s => s.name.toLowerCase() === skill.name.toLowerCase())
      ? prev.map(s => s.name.toLowerCase() === skill.name.toLowerCase() ? skill : s)
      : [...prev, skill])
    notify('Skill profile updated.')
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut()
    setUser(null); setProfile(null); notify('Signed out.')
  }

  if (supabase && !user) {
    return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} authEmail={authEmail} setAuthEmail={setAuthEmail} authPassword={authPassword} setAuthPassword={setAuthPassword} fullName={fullName} setFullName={setFullName} handleAuth={handleAuth} busy={busy} toast={toast} />
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><GraduationCap size={22}/></div><div><strong>CampusConnect</strong><span>SKILLS TO OPPORTUNITIES</span></div><button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>{navItems.map(item => <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => { setActive(item.id); setMobileNav(false) }}><item.icon size={18}/><span>{item.label}</span>{item.id === 'applications' && totalApps > 0 && <b className="nav-count">{totalApps}</b>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Explore your skill gap and discover your next step.</p><button onClick={() => setActive('skills')}>View skill guide <ArrowRight size={14}/></button></div><div className="user-mini"><div className="avatar">{initials(name)}</div><div className="user-mini-info"><strong>{name}</strong><span>{user?.email || 'Demo student account'}</span></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={16}/></button></div></div>
      </aside>
      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
      <main className="main-area">
        <header className="topbar"><button className="icon-btn menu-btn" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{navItems.find(n => n.id === active)?.label || 'Overview'}</strong></div><div className="topbar-right"><div className={`connection ${dataMode === 'live' ? 'connected' : ''}`}><span className="status-dot"/>{dataMode === 'live' ? 'Live database' : dataMode === 'demo' ? 'Demo preview' : 'Connecting'}</div><button className="icon-btn notification-btn" onClick={() => notify('You are all caught up!')} aria-label="Notifications"><Bell size={18}/><i/></button><div className="avatar avatar-small">{initials(name)}</div></div></header>
        <div className="page-content">
          {active === 'overview' && <Overview name={name} skills={skills} completed={completed} jobs={jobs} applications={applications} setActive={setActive} applyToJob={applyToJob} />}
          {active === 'skills' && <SkillsPage skills={skills} saveSkill={saveSkill} jobs={jobs} />}
          {active === 'opportunities' && <OpportunitiesPage jobs={filteredJobs} search={search} setSearch={setSearch} applyToJob={applyToJob} applications={applications} />}
          {active === 'applications' && <ApplicationsPage applications={applications} setActive={setActive} />}
          {active === 'reports' && <ReportsPage skills={skills} applications={applications} jobs={jobs} />}
        </div>
        <footer className="footer"><span>© 2026 CampusConnect · SIH26044</span><span><ShieldCheck size={13}/> Built for smarter career readiness</span></footer>
      </main>
      {toast && <div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
    </div>
  )
}

function AuthScreen({ authMode, setAuthMode, authEmail, setAuthEmail, authPassword, setAuthPassword, fullName, setFullName, handleAuth, busy, toast }) {
  return <div className="auth-layout"><section className="auth-visual"><div className="brand auth-brand"><div className="brand-mark"><GraduationCap size={22}/></div><div><strong>CampusConnect</strong><span>SKILLS TO OPPORTUNITIES</span></div></div><div className="auth-hero"><div className="eyebrow"><Sparkles size={14}/> YOUR CAREER, CONNECTED</div><h1>Turn your skills into <em>real opportunities.</em></h1><p>Bridge the gap between what you learn and what the industry needs.</p><div className="auth-stat-row"><div><strong>01</strong><span>Build your skill profile</span></div><div><strong>02</strong><span>Find your skill gaps</span></div><div><strong>03</strong><span>Apply with confidence</span></div></div></div><div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/><div className="auth-footer">ACADEMIA <span>×</span> INDUSTRY</div></section><section className="auth-panel"><form className="auth-form" onSubmit={handleAuth}><div className="auth-form-icon"><GraduationCap size={24}/></div><h2>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2><p>{authMode === 'signup' ? 'Start building your career-ready profile.' : 'Sign in to continue to your workspace.'}</p>{authMode === 'signup' && <label>Full name<input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Himansh Shrivastava"/></label>}<label>Email address<input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@college.edu"/></label><label>Password<input required minLength={6} type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="btn-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></button><div className="auth-switch">{authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"} <button type="button" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>{authMode === 'signup' ? 'Sign in' : 'Create account'}</button></div><div className="auth-secure"><ShieldCheck size={15}/> Secure authentication powered by Supabase</div>{toast && <div className="inline-toast">{toast}</div>}</form></section></div>
}

function Overview({ name, skills, completed, jobs, applications, setActive, applyToJob }) {
  const first = name.split(' ')[0]
  return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> STUDENT WORKSPACE</div><h1>Good to see you, {first} <span className="wave">✦</span></h1><p className="subheading">Your next opportunity starts with the skills you build today.</p></div><button className="btn-primary" onClick={() => setActive('opportunities')}>Explore opportunities <ArrowRight size={16}/></button></div>
    <div className="hero-banner"><div className="hero-copy"><div className="hero-tag"><Zap size={13}/> YOUR CAREER SNAPSHOT</div><h2>Small steps today.<br/><em>Big moves tomorrow.</em></h2><p>Build in-demand skills and get closer to your dream role.</p><button className="btn-light" onClick={() => setActive('skills')}>Improve my profile <ArrowRight size={15}/></button></div><div className="hero-graphic"><div className="graphic-ring ring-a"/><div className="graphic-ring ring-b"/><div className="graphic-center"><GraduationCap size={37}/></div><div className="floating-chip chip-top"><Target size={15}/> Skill match</div><div className="floating-chip chip-bottom"><ArrowUpRight size={15}/> Career growth</div></div></div>
    <div className="metrics-grid"><Metric icon={Target} label="Skill readiness" value={`${completed}%`} note="Average proficiency" trend="+8% this month" color="teal"/><Metric icon={BriefcaseBusiness} label="Opportunities" value={jobs.length} note="Open roles to explore" trend="Updated listings" color="blue"/><Metric icon={ClipboardList} label="Applications" value={applications.length} note="Your submitted applications" trend={applications.length ? 'Keep tracking progress' : 'Your journey starts here'} color="violet"/><Metric icon={Sparkles} label="Skills tracked" value={skills.length} note="In your profile" trend="Keep learning" color="amber"/></div>
    <div className="content-grid"><section className="panel skill-panel"><div className="panel-heading"><div><h3>Skill readiness</h3><p>How your current skills stack up</p></div><button className="text-link" onClick={() => setActive('skills')}>Manage skills <ArrowRight size={14}/></button></div><div className="skill-list">{skills.slice(0,4).map(s => <div className="skill-row" key={s.name}><div className="skill-meta"><span>{s.name}</span><strong>{s.level}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${s.level}%`}}/></div></div>)}</div><div className="skill-insight"><div className="insight-icon"><Sparkles size={17}/></div><div><strong>Your next focus: SQL</strong><p>Improving data querying can unlock more analytics roles.</p></div><button onClick={() => setActive('skills')}><ArrowRight size={16}/></button></div></section>
    <section className="panel action-panel"><div className="panel-heading"><div><h3>Recommended next steps</h3><p>Make progress that matters</p></div></div><div className="action-list"><ActionStep number="01" title="Complete your skill profile" detail="Add your strongest skills and proficiency." onClick={() => setActive('skills')}/><ActionStep number="02" title="Explore matched opportunities" detail="Find roles aligned with your skill set." onClick={() => setActive('opportunities')}/><ActionStep number="03" title="Track your applications" detail="Stay on top of every opportunity." onClick={() => setActive('applications')}/></div></section></div>
    <div className="section-title-row"><div><h2>Picked for your profile</h2><p>Opportunities that match your current skills</p></div><button className="text-link" onClick={() => setActive('opportunities')}>View all <ArrowRight size={14}/></button></div><div className="job-grid">{jobs.slice(0,3).map(job => <JobCard key={job.id} job={job} onApply={() => applyToJob(job)} applied={applications.some(a => a.opportunityId === job.id || a.id === `demo-app-${job.id}`)}/>)}</div>
  </>
}

function Metric({ icon: Icon, label, value, note, trend, color }) { return <div className="metric-card"><div className={`metric-icon ${color}`}><Icon size={19}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-note">{note}</div><div className="metric-trend"><span className="trend-dot"/>{trend}</div></div> }
function ActionStep({ number, title, detail, onClick }) { return <button className="action-step" onClick={onClick}><span className="step-number">{number}</span><span className="step-copy"><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={16}/></button> }

function JobCard({ job, onApply, applied }) { return <article className="job-card"><div className="job-card-top"><div className={`company-mark ${job.color || 'mint'}`}>{(job.company || 'C').slice(0,1)}</div><span className="match-pill"><Sparkles size={12}/>{job.match || 0}% match</span></div><div className="job-type">{job.type || 'Internship'} <span>·</span> {job.location}</div><h3>{job.title}</h3><p className="company-name">{job.company}</p><div className="job-skills">{(job.skills || []).slice(0,3).map(s => <span key={s}>{s}</span>)}</div><div className="job-card-bottom"><div><strong>{job.stipend || 'Compensation varies'}</strong><small>Estimated compensation</small></div><button className={applied ? 'btn-applied' : 'btn-outline'} onClick={onApply}>{applied ? 'Applied ✓' : 'Apply now'}</button></div></article> }

function SkillsPage({ skills, saveSkill, jobs }) {
  const [skillName, setSkillName] = useState('')
  const [level, setLevel] = useState(60)
  const [category, setCategory] = useState('Business')
  const gaps = useMemo(() => {
    const all = [...new Set(jobs.flatMap(j => j.skills || []))]
    return all.map(name => ({ name, current: skills.find(s => s.name.toLowerCase() === name.toLowerCase())?.level || 0 })).filter(s => s.current < 70).sort((a,b) => a.current - b.current)
  }, [jobs, skills])
  return <><PageHeader eyebrow="YOUR CAPABILITIES" title="My skills" subtitle="Map what you know today and identify what to learn next."/><div className="content-grid skills-layout"><section className="panel"><div className="panel-heading"><div><h3>Your skill profile</h3><p>Proficiency is self-reported in this demo.</p></div><span className="soft-pill">{skills.length} skills</span></div><div className="skill-list skill-list-large">{skills.map(s => <div className="skill-row" key={s.name}><div className="skill-meta"><div><span>{s.name}</span><small>{s.category}</small></div><strong>{s.level}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${s.level}%`}}/></div></div>)}</div><form className="add-skill-form" onSubmit={e => { e.preventDefault(); if (skillName.trim()) { saveSkill({ name: skillName.trim(), level: Number(level), category }); setSkillName('') } }}><h4><Plus size={16}/> Add or update a skill</h4><div className="form-row"><input required value={skillName} onChange={e => setSkillName(e.target.value)} placeholder="e.g. Financial Modelling"/><select value={category} onChange={e => setCategory(e.target.value)}><option>Business</option><option>Finance</option><option>Analytics</option><option>Technology</option><option>Communication</option></select></div><div className="range-row"><label>Proficiency <strong>{level}%</strong></label><input type="range" min="0" max="100" value={level} onChange={e => setLevel(e.target.value)}/><div className="range-labels"><span>Beginner</span><span>Intermediate</span><span>Advanced</span></div></div><button className="btn-primary" type="submit">Save skill <ArrowRight size={15}/></button></form></section><section className="panel"><div className="panel-heading"><div><h3>Skill gaps to close</h3><p>Skills commonly requested in open roles</p></div><div className="insight-icon"><Target size={16}/></div></div>{gaps.length ? <div className="gap-list">{gaps.slice(0,6).map(g => <div className="gap-item" key={g.name}><div className="gap-title"><span>{g.name}</span><b>{g.current === 0 ? 'Not added' : `${g.current}%`}</b></div><div className="progress-track"><div className="progress-fill gap-fill" style={{width:`${g.current}%`}}/></div><small>{g.current < 40 ? 'High priority · start with fundamentals' : 'Build confidence with a practical project'}</small></div>)}</div> : <div className="empty-state"><CheckCircle2 size={28}/><strong>Looking good!</strong><p>No major gaps in the sample roles.</p></div>}<div className="tip-card"><Sparkles size={18}/><div><strong>Make learning practical</strong><p>Build a small project for each new skill and add it to your portfolio.</p></div></div></section></div></>
}

function OpportunitiesPage({ jobs, search, setSearch, applyToJob, applications }) { return <><PageHeader eyebrow="CAREER EXPLORER" title="Internships & projects" subtitle="Discover opportunities and take the next step toward your career."/><div className="search-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, companies or skills…"/></div><span className="result-count">{jobs.length} opportunities</span></div><div className="job-grid full-job-grid">{jobs.map(job => <JobCard key={job.id} job={job} onApply={() => applyToJob(job)} applied={applications.some(a => a.opportunityId === job.id || a.id === `demo-app-${job.id}`)}/>)}</div>{!jobs.length && <div className="empty-state panel"><Search size={28}/><strong>No matching opportunities</strong><p>Try another role, company or skill keyword.</p></div>}</> }

function ApplicationsPage({ applications, setActive }) { return <><PageHeader eyebrow="YOUR CAREER JOURNEY" title="My applications" subtitle="Every application is a step forward. Track your progress here."/><div className="panel application-panel"><div className="panel-heading"><div><h3>Application tracker</h3><p>{applications.length} total submissions</p></div><span className="soft-pill">{applications.filter(a => a.status === 'submitted' || a.status === 'pending').length} in progress</span></div>{applications.length ? <div className="table-wrap"><table><thead><tr><th>Opportunity</th><th>Company</th><th>Date applied</th><th>Status</th></tr></thead><tbody>{applications.map(a => <tr key={a.id}><td><strong>{a.title}</strong></td><td>{a.company}</td><td>{a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : 'Today'}</td><td><span className={`status-pill ${(a.status || 'submitted').toLowerCase()}`}>{a.status || 'submitted'}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><ClipboardList size={23}/></div><strong>Your next chapter starts here</strong><p>You haven't submitted any applications yet. Find a role that fits your skills.</p><button className="btn-primary" onClick={() => setActive('opportunities')}>Explore opportunities <ArrowRight size={15}/></button></div>}</div></> }

function ReportsPage({ skills, applications, jobs }) {
  const submitted = applications.length
  const average = Math.round(skills.reduce((sum,s) => sum+s.level,0) / Math.max(1,skills.length))
  const skillRows = [...skills].sort((a,b) => a.level-b.level)
  return <><PageHeader eyebrow="PLACEMENT CELL" title="College reports" subtitle="A sample overview of student readiness and opportunity engagement."/><div className="report-notice"><ShieldCheck size={18}/><div><strong>Demonstration report</strong><p>This view currently summarizes the signed-in demo profile. College-wide analytics require authorized placement-cell accounts and student data.</p></div></div><div className="metrics-grid report-metrics"><Metric icon={Users} label="Profiles in view" value="01" note="Current student profile" trend="Demo scope" color="blue"/><Metric icon={Target} label="Avg. proficiency" value={`${average}%`} note="Across listed skills" trend="Self-reported levels" color="teal"/><Metric icon={ClipboardList} label="Applications" value={submitted} note="Submitted by this profile" trend="Application activity" color="violet"/><Metric icon={BriefcaseBusiness} label="Open opportunities" value={jobs.length} note="Visible in this portal" trend="Sample listings included" color="amber"/></div><div className="content-grid"><section className="panel"><div className="panel-heading"><div><h3>Skill-gap snapshot</h3><p>Lowest proficiency skills appear first</p></div></div><div className="report-bars">{skillRows.map(s => <div className="report-bar-row" key={s.name}><span>{s.name}</span><div className="progress-track"><div className="progress-fill" style={{width:`${s.level}%`}}/></div><strong>{s.level}%</strong></div>)}</div></section><section className="panel"><div className="panel-heading"><div><h3>Suggested actions</h3><p>Priorities for the placement cell</p></div></div><div className="action-list"><ActionStep number="01" title="Validate skill profiles" detail="Ask students to verify proficiency levels." onClick={() => notify('Suggested action: validate student profiles.')}/><ActionStep number="02" title="Map skills to job roles" detail="Compare course outcomes with employer needs." onClick={() => notify('Suggested action: collect employer requirements.')}/><ActionStep number="03" title="Review application trends" detail="Monitor application and interview outcomes." onClick={() => notify('Suggested action: review application trends.')}/></div></section></div></>
}

function PageHeader({ eyebrow, title, subtitle }) { return <div className="page-header"><div className="eyebrow"><span className="eyebrow-dot"/>{eyebrow}</div><h1>{title}</h1><p className="subheading">{subtitle}</p></div> }
function initials(name) { return (name || 'CC').split(' ').filter(Boolean).slice(0,2).map(s => s[0]).join('').toUpperCase() }
function scoreMatch(required, current) { if (!required.length) return 0; const owned = new Set((current || []).map(s => s.name.toLowerCase())); return Math.round(required.filter(s => owned.has(s.toLowerCase())).length / required.length * 100) }

export default App

