const DEPARTMENTS = ["EVS", "Security", "Host", "Conversion", "Operations", "Maintenance", "Administration"];
const SHIFTS = ["Morning", "Afternoon", "Night"];

const STATUS = {
  PENDING_SCHEDULE: "pending_schedule",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const ATTENDANCE = {
  ATTENDING: "attending",
  REPORTED_ABSENCE: "reported_absence",
  REMOVED_BY_SCHEDULE: "removed_by_schedule",
};

const app = document.getElementById("app");

const LEGAL_NOTICE = "Unofficial demo created by an enthusiastic Computer Engineering professional. This project is not affiliated with BC Place. BC Place names, logos, and copyrights/trademarks belong to their respective owners.";

const THEME = {
  BLUE: "blue",
  WHITE: "white",
};

function getTheme() {
  return localStorage.getItem("scw_theme") === THEME.WHITE ? THEME.WHITE : THEME.BLUE;
}
function setTheme(theme) {
  const selected = theme === THEME.WHITE ? THEME.WHITE : THEME.BLUE;
  localStorage.setItem("scw_theme", selected);
  document.body.classList.toggle("theme-white", selected === THEME.WHITE);
}
function logoForTheme(theme) {
  return theme === THEME.WHITE ? "assets/logo-white.svg" : "assets/logo-blue.svg";
}
function renderThemeControl(selectedTheme) {
  return `<label>Theme
    <select id="themeSelect" class="theme-picker">
      <option value="blue" ${selectedTheme === "blue" ? "selected" : ""}>Blue</option>
      <option value="white" ${selectedTheme === "white" ? "selected" : ""}>White</option>
    </select>
  </label>`;
}
function bindThemeControl(onChangeRender) {
  document.getElementById("themeSelect")?.addEventListener("change", (event) => {
    setTheme(event.target.value);
    onChangeRender();
  });
}

function renderLegalNotice() {
  return `<p class="legal-note">${LEGAL_NOTICE}</p>`;
}

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const plusDays = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

const state = {
  users: [
    { id: "u1", name: "Avery EVS", email: "employee@shortcall.demo", password: "demo123", role: "employee", department: "EVS" },
    { id: "u2", name: "Jordan Manager", email: "manager@shortcall.demo", password: "demo123", role: "manager", department: "Operations" },
    { id: "u3", name: "Taylor Admin", email: "admin@shortcall.demo", password: "demo123", role: "admin", department: "Administration" },
    { id: "u4", name: "Morgan Schedule", email: "schedule@shortcall.demo", password: "demo123", role: "schedule", department: "Administration" },
  ],
  shortCalls: [
    {
      id: crypto.randomUUID(),
      title: "Post-event EVS reset",
      department: "EVS",
      shift: "Night",
      date: plusDays(0),
      slots: 2,
      interdepartmentOpen: false,
      createdBy: "u2",
      createdAt: new Date().toISOString(),
      scheduleStatus: STATUS.APPROVED,
      scheduleReviewedBy: "u4",
      scheduleReviewedAt: new Date().toISOString(),
      scheduleNotes: "Approved for tonight operations.",
    },
    {
      id: crypto.randomUUID(),
      title: "Security gate support",
      department: "Security",
      shift: "Afternoon",
      date: plusDays(1),
      slots: 1,
      interdepartmentOpen: true,
      createdBy: "u2",
      createdAt: new Date().toISOString(),
      scheduleStatus: STATUS.PENDING_SCHEDULE,
      scheduleReviewedBy: null,
      scheduleReviewedAt: null,
      scheduleNotes: "",
    },
  ],
  applications: [],
};

function createToken(user) {
  return btoa(JSON.stringify({ id: user.id, role: user.role }));
}
function parseToken(token) {
  try { return JSON.parse(atob(token)); } catch { return null; }
}
function currentUser() {
  const payload = parseToken(localStorage.getItem("scw_token") || "");
  if (!payload) return null;
  return state.users.find((u) => u.id === payload.id) || null;
}
function requireAuth(roles, cb) {
  const user = currentUser();
  if (!user) return renderLogin();
  if (roles.length && !roles.includes(user.role)) {
    app.innerHTML = `<main class="container"><section class="card"><h2>Access denied</h2>${renderLegalNotice()}</section></main>`;
    return;
  }
  cb(user);
}
function byId(id) { return state.users.find((u) => u.id === id); }
function formatDateTime(v) { return new Date(v).toLocaleString("en-CA"); }

function applicationsForCall(callId) {
  return state.applications
    .filter((a) => a.shortCallId === callId)
    .sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
}

function activeApplicationsForCall(callId) {
  return applicationsForCall(callId).filter((a) => a.attendanceStatus !== ATTENDANCE.REMOVED_BY_SCHEDULE);
}

function rankStatus(position, slots) {
  if (position <= slots) return "confirmed";
  if (position <= slots + 2) return "pending";
  return "waitlisted";
}

function refreshStatuses() {
  state.shortCalls.forEach((call) => {
    const ranking = activeApplicationsForCall(call.id);
    ranking.forEach((a, idx) => {
      a.status = rankStatus(idx + 1, call.slots);
    });
  });
}

function eligibleCalls(user) {
  return state.shortCalls.filter((c) =>
    c.scheduleStatus === STATUS.APPROVED &&
    (c.interdepartmentOpen || c.department === user.department)
  );
}

function createShortCall(payload, creatorId) {
  state.shortCalls.unshift({
    id: crypto.randomUUID(),
    ...payload,
    createdBy: creatorId,
    createdAt: new Date().toISOString(),
    scheduleStatus: STATUS.PENDING_SCHEDULE,
    scheduleReviewedBy: null,
    scheduleReviewedAt: null,
    scheduleNotes: "Awaiting Schedule review.",
  });
}

function setScheduleDecision(callId, decision, reviewerId, note) {
  const c = state.shortCalls.find((x) => x.id === callId);
  if (!c) return;
  c.scheduleStatus = decision;
  c.scheduleReviewedBy = reviewerId;
  c.scheduleReviewedAt = new Date().toISOString();
  c.scheduleNotes = note || "Reviewed by Schedule";
  if (decision === STATUS.REJECTED) {
    state.applications = state.applications.filter((a) => a.shortCallId !== callId);
  }
  refreshStatuses();
}

function applyToCall(callId, userId) {
  const call = state.shortCalls.find((c) => c.id === callId);
  if (!call || call.scheduleStatus !== STATUS.APPROVED) return;
  const exists = state.applications.some((a) => a.shortCallId === callId && a.userId === userId && a.attendanceStatus !== ATTENDANCE.REMOVED_BY_SCHEDULE);
  if (exists) return;
  state.applications.push({
    id: crypto.randomUUID(),
    shortCallId: callId,
    userId,
    appliedAt: new Date().toISOString(),
    status: "pending",
    attendanceStatus: ATTENDANCE.ATTENDING,
    absenceType: "",
    absenceNote: "",
    absenceReportedAt: null,
  });
  refreshStatuses();
}

function reportAbsence(applicationId, type, note) {
  const a = state.applications.find((x) => x.id === applicationId);
  if (!a || a.attendanceStatus === ATTENDANCE.REMOVED_BY_SCHEDULE) return;
  a.attendanceStatus = ATTENDANCE.REPORTED_ABSENCE;
  a.absenceType = type;
  a.absenceNote = note;
  a.absenceReportedAt = new Date().toISOString();
}

function removeBySchedule(applicationId) {
  const a = state.applications.find((x) => x.id === applicationId);
  if (!a) return;
  a.attendanceStatus = ATTENDANCE.REMOVED_BY_SCHEDULE;
  refreshStatuses();
}

function header(user) {
  const theme = getTheme();
  return `
  <header class="card">
    <div class="header-brand">
      <img class="brand-logo" src="${logoForTheme(theme)}" alt="BC Place inspired logo" />
      <small>${user.name} • ${user.role.toUpperCase()} • ${user.department}</small>
    </div>
    <div class="row">
      ${renderThemeControl(theme)}
      ${user.role === "employee" ? `<button class="ghost" id="toEmployee">Employee</button>` : ""}
      ${["manager","admin"].includes(user.role) ? `<button class="ghost" id="toManager">Manager</button>` : ""}
      ${["schedule","admin"].includes(user.role) ? `<button class="ghost" id="toSchedule">Schedule</button>` : ""}
      <button class="ghost" id="logout">Sign out</button>
    </div>
  </header>`;
}

function bindCommon(user) {
  document.getElementById("logout")?.addEventListener("click", () => {
    localStorage.removeItem("scw_token");
    renderLogin();
  });
  document.getElementById("toEmployee")?.addEventListener("click", renderEmployee);
  document.getElementById("toManager")?.addEventListener("click", renderManager);
  document.getElementById("toSchedule")?.addEventListener("click", renderSchedule);
  bindThemeControl(route);
}

function renderLogin(error = "") {
  app.innerHTML = `
  <main class="container login">
    <section class="card">
      <img class="brand-logo" src="${logoForTheme(getTheme())}" alt="BC Place inspired logo" />
      <h1>Short Call Web Demo</h1>
      ${renderThemeControl(getTheme())}
      <p>Sign in with demo users:</p>
      ${renderLegalNotice()}
      <p class="notice">employee@shortcall.demo, manager@shortcall.demo, schedule@shortcall.demo, admin@shortcall.demo<br/>password: demo123</p>
      ${error ? `<p style="color: var(--danger)">${error}</p>` : ""}
      <form id="loginForm" class="grid">
        <div><label>Email</label><input id="email" type="email" required></div>
        <div><label>Password</label><input id="password" type="password" required></div>
        <button class="primary" type="submit">Sign in</button>
      </form>
    </section>
  </main>`;

  bindThemeControl(() => renderLogin(error));

  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const u = state.users.find((x) => x.email === email && x.password === password);
    if (!u) return renderLogin("Invalid credentials");
    localStorage.setItem("scw_token", createToken(u));
    setTheme(getTheme());
    route();
  });
}

function renderEmployee() {
  requireAuth(["employee"], (user) => {
    refreshStatuses();
    const calls = eligibleCalls(user);
    const myApps = state.applications.filter((a) => a.userId === user.id);

    app.innerHTML = `<main class="container">
      ${header(user)}
      <section class="card">
        <h2>Eligible approved short-calls</h2>
        <div class="list">
          ${calls.map((c) => {
            const already = myApps.find((a) => a.shortCallId === c.id && a.attendanceStatus !== ATTENDANCE.REMOVED_BY_SCHEDULE);
            return `<article class="item">
              <div class="row between"><strong>${c.title}</strong><span class="tag approved">${c.scheduleStatus}</span></div>
              <small>${c.department} • ${c.shift} • ${c.date} • Seats: ${c.slots}</small>
              <div class="row" style="margin-top:.45rem"><button class="primary apply" data-id="${c.id}" ${already ? "disabled" : ""}>${already ? "Applied" : "Apply"}</button></div>
            </article>`;
          }).join("") || `<p class="notice">No approved calls available for your department filter.</p>`}
        </div>
      </section>

      <section class="card" style="margin-top:1rem;">
        <h2>My applications and attendance</h2>
        <p class="notice">Employees can report inability to attend. Only Schedule can remove an applicant from a call.</p>
        <div class="list">
        ${myApps.map((a) => {
          const c = state.shortCalls.find((x) => x.id === a.shortCallId);
          const canReport = a.attendanceStatus === ATTENDANCE.ATTENDING;
          return `<article class="item">
            <div class="row between">
              <strong>${c?.title || "Removed call"}</strong>
              <span class="tag ${a.status}">${a.status || "pending"}</span>
            </div>
            <small>${c?.department || "-"} • ${c?.shift || "-"} • ${c?.date || "-"}</small>
            <div class="row" style="margin-top:.3rem">
              <span class="tag ${a.attendanceStatus}">${a.attendanceStatus}</span>
              ${a.absenceType ? `<span class="tag">absence: ${a.absenceType}</span>` : ""}
            </div>
            ${a.absenceNote ? `<small>Note: ${a.absenceNote}</small>` : ""}
            ${canReport ? `<form class="grid two reportForm" data-id="${a.id}" style="margin-top:.45rem;">
              <select name="type"><option value="illness">illness</option><option value="no_show">no_show</option><option value="other">other</option></select>
              <input name="note" placeholder="Optional note for Schedule" />
              <button class="warn" type="submit">Notify inability to attend</button>
            </form>` : ""}
          </article>`;
        }).join("") || `<p>No applications yet.</p>`}
        </div>
      </section>
      ${renderLegalNotice()}
    </main>`;

    document.querySelectorAll(".apply").forEach((b) => b.addEventListener("click", () => {
      applyToCall(b.dataset.id, user.id);
      renderEmployee();
    }));

    document.querySelectorAll(".reportForm").forEach((f) => f.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = f.dataset.id;
      reportAbsence(id, f.type.value, f.note.value.trim());
      renderEmployee();
    }));

    bindCommon(user);
  });
}

function renderManager() {
  requireAuth(["manager", "admin"], (user) => {
    const own = state.shortCalls.filter((c) => user.role === "admin" || c.createdBy === user.id);
    app.innerHTML = `<main class="container">
      ${header(user)}
      <section class="card">
        <h2>Create short-call request (requires Schedule approval)</h2>
        <form id="createForm" class="grid three">
          <input id="title" placeholder="Title" required>
          <select id="dept">${DEPARTMENTS.map((d) => `<option>${d}</option>`).join("")}</select>
          <select id="shift">${SHIFTS.map((s) => `<option>${s}</option>`).join("")}</select>
          <input id="date" type="date" value="${plusDays(0)}" required>
          <input id="slots" type="number" min="1" value="1" required>
          <select id="open"><option value="false">Department only</option><option value="true">Open cross-department</option></select>
          <button class="primary" type="submit">Submit to Schedule</button>
        </form>
      </section>
      <section class="card" style="margin-top:1rem">
        <h3>My created calls</h3>
        <div class="list">
          ${own.map((c) => `<article class="item">
            <div class="row between"><strong>${c.title}</strong><span class="tag ${c.scheduleStatus}">${c.scheduleStatus}</span></div>
            <small>${c.department} • ${c.shift} • ${c.date} • seats ${c.slots}</small>
            <small>Schedule notes: ${c.scheduleNotes || "-"}</small>
          </article>`).join("") || `<p>No calls yet.</p>`}
        </div>
      </section>
      ${renderLegalNotice()}
    </main>`;

    document.getElementById("createForm").addEventListener("submit", (e) => {
      e.preventDefault();
      createShortCall({
        title: document.getElementById("title").value.trim(),
        department: document.getElementById("dept").value,
        shift: document.getElementById("shift").value,
        date: document.getElementById("date").value,
        slots: Number(document.getElementById("slots").value),
        interdepartmentOpen: document.getElementById("open").value === "true",
      }, user.id);
      renderManager();
    });

    bindCommon(user);
  });
}

function renderSchedule() {
  requireAuth(["schedule", "admin"], (user) => {
    refreshStatuses();
    const pending = state.shortCalls.filter((c) => c.scheduleStatus === STATUS.PENDING_SCHEDULE);
    const approved = state.shortCalls.filter((c) => c.scheduleStatus === STATUS.APPROVED);
    const absences = state.applications.filter((a) => a.attendanceStatus === ATTENDANCE.REPORTED_ABSENCE);
    const todayCalls = approved.filter((c) => c.date === plusDays(0));

    app.innerHTML = `<main class="container">
      ${header(user)}

      <section class="kpis">
        <article class="kpi"><small>Pending approvals</small><strong>${pending.length}</strong></article>
        <article class="kpi"><small>Approved calls</small><strong>${approved.length}</strong></article>
        <article class="kpi"><small>Today approved</small><strong>${todayCalls.length}</strong></article>
        <article class="kpi"><small>Reported absences</small><strong>${absences.length}</strong></article>
        <article class="kpi"><small>Total applications</small><strong>${state.applications.length}</strong></article>
      </section>

      <section class="card">
        <h2>Department approval queue (all departments)</h2>
        <div class="list">
          ${state.shortCalls.map((c) => {
            const creator = byId(c.createdBy)?.name || "Unknown";
            const buttons = c.scheduleStatus === STATUS.PENDING_SCHEDULE ? `<div class="row">
              <button class="primary approve" data-id="${c.id}" data-d="approved">Approve</button>
              <button class="danger approve" data-id="${c.id}" data-d="rejected">Reject</button>
            </div>` : "";
            return `<article class="item">
              <div class="row between"><strong>${c.title}</strong><span class="tag ${c.scheduleStatus}">${c.scheduleStatus}</span></div>
              <small>${c.department} • ${c.shift} • ${c.date} • seats ${c.slots}</small>
              <small>Requested by ${creator} • ${formatDateTime(c.createdAt)}</small>
              <small>Schedule notes: ${c.scheduleNotes || "-"}</small>
              ${buttons}
            </article>`;
          }).join("")}
        </div>
      </section>

      <section class="card" style="margin-top:1rem">
        <h2>Daily operations monitor and filters</h2>
        <form id="filters" class="grid three">
          <select id="fDate"><option value="today">Today only</option><option value="all">All dates</option>${[...new Set(approved.map((c) => c.date))].map((d) => `<option value="${d}">${d}</option>`).join("")}</select>
          <select id="fDept"><option value="all">All departments</option>${DEPARTMENTS.map((d) => `<option>${d}</option>`).join("")}</select>
          <select id="fShift"><option value="all">All shifts</option>${SHIFTS.map((s) => `<option>${s}</option>`).join("")}</select>
        </form>
        <div id="opsList"></div>
      </section>

      <section class="card" style="margin-top:1rem">
        <h2>Future absence and no-show management</h2>
        <div class="list">
          ${absences.map((a) => {
            const c = state.shortCalls.find((x) => x.id === a.shortCallId);
            const u = byId(a.userId);
            return `<article class="item">
              <div class="row between"><strong>${u?.name || "Unknown"}</strong><span class="tag reported_absence">${a.absenceType || "absence"}</span></div>
              <small>${c?.title || "-"} • ${c?.department || "-"} • ${c?.date || "-"} • ${c?.shift || "-"}</small>
              <small>Reported: ${a.absenceReportedAt ? formatDateTime(a.absenceReportedAt) : "-"}</small>
              <small>Note: ${a.absenceNote || "-"}</small>
              <div class="row"><button class="danger removeApplicant" data-id="${a.id}">Remove from call (Schedule only)</button></div>
            </article>`;
          }).join("") || `<p>No reported absences.</p>`}
        </div>
      </section>
      ${renderLegalNotice()}
    </main>`;

    const renderOps = () => {
      const fDate = document.getElementById("fDate").value;
      const fDept = document.getElementById("fDept").value;
      const fShift = document.getElementById("fShift").value;

      const filtered = approved.filter((c) => {
        const dateOk = fDate === "all" ? true : (fDate === "today" ? c.date === plusDays(0) : c.date === fDate);
        const deptOk = fDept === "all" ? true : c.department === fDept;
        const shiftOk = fShift === "all" ? true : c.shift === fShift;
        return dateOk && deptOk && shiftOk;
      });

      document.getElementById("opsList").innerHTML = `<div class="list">${filtered.map((c) => {
        const ranking = applicationsForCall(c.id);
        return `<article class="item">
          <div class="row between"><strong>${c.title}</strong><span class="tag approved">approved</span></div>
          <small>${c.department} • ${c.shift} • ${c.date} • seats ${c.slots}</small>
          <ul>
            ${ranking.map((a, i) => {
              const u = byId(a.userId);
              return `<li>#${i + 1} ${u?.name || "Unknown"} — <span class="tag ${a.status}">${a.status}</span> <span class="tag ${a.attendanceStatus}">${a.attendanceStatus}</span></li>`;
            }).join("") || `<li>No applicants yet.</li>`}
          </ul>
        </article>`;
      }).join("") || `<p>No calls match the filters.</p>`}</div>`;
    };

    document.querySelectorAll(".approve").forEach((b) => b.addEventListener("click", () => {
      const decision = b.dataset.d === "approved" ? STATUS.APPROVED : STATUS.REJECTED;
      setScheduleDecision(b.dataset.id, decision, user.id, `Schedule ${decision} on ${new Date().toLocaleString("en-CA")}`);
      renderSchedule();
    }));

    document.querySelectorAll(".removeApplicant").forEach((b) => b.addEventListener("click", () => {
      removeBySchedule(b.dataset.id);
      renderSchedule();
    }));

    document.getElementById("filters").addEventListener("change", renderOps);
    renderOps();

    bindCommon(user);
  });
}

function route() {
  const user = currentUser();
  if (!user) return renderLogin();
  if (user.role === "employee") return renderEmployee();
  if (user.role === "schedule") return renderSchedule();
  if (user.role === "manager") return renderManager();
  return renderSchedule();
}

setTheme(getTheme());
route();
