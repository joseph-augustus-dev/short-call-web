const DEPARTMENTS = [
  "EVS",
  "Security",
  "Host",
  "Conversion",
  "Operations",
  "Maintenance",
  "Administration",
];

const SHORT_CALL_STATUSES = {
  PENDING_SCHEDULE: "pending_schedule",
  APPROVED: "approved",
  REJECTED: "rejected",
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
      slots: 2,
      interdepartmentOpen: false,
      createdBy: "u2",
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      scheduleStatus: SHORT_CALL_STATUSES.APPROVED,
      scheduleReviewedBy: "u4",
      scheduleReviewedAt: new Date(Date.now() - 1800_000).toISOString(),
      scheduleNotes: "Approved for tonight due to peak foot traffic.",
    },
    {
      id: crypto.randomUUID(),
      title: "Gate B security support",
      department: "Security",
      shift: "Afternoon",
      slots: 1,
      interdepartmentOpen: true,
      createdBy: "u3",
      createdAt: new Date(Date.now() - 2400_000).toISOString(),
      scheduleStatus: SHORT_CALL_STATUSES.PENDING_SCHEDULE,
      scheduleReviewedBy: null,
      scheduleReviewedAt: null,
      scheduleNotes: "",
    },
  ],
  applications: [],
};

const app = document.getElementById("app");

function createToken(user) {
  return btoa(JSON.stringify({ id: user.id, role: user.role, at: Date.now() }));
}

function parseToken(token) {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

function currentUser() {
  const token = localStorage.getItem("scw_token");
  const payload = token && parseToken(token);
  if (!payload) return null;
  return state.users.find((user) => user.id === payload.id) || null;
}

function requireAuth(allowedRoles, renderer) {
  const user = currentUser();
  if (!user) {
    renderLogin("Your session has ended. Please sign in again.");
    return;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    app.innerHTML = `
      <main class="container">
        <section class="card">
          <h2>Access denied</h2>
          <p>Your role does not have permission to open this workflow.</p>
        </section>
      </main>
    `;
    return;
  }

  renderer(user);
}

function getUserById(userId) {
  return state.users.find((user) => user.id === userId);
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function applicationsForCall(shortCallId) {
  return state.applications
    .filter((application) => application.shortCallId === shortCallId)
    .sort((first, second) => new Date(first.appliedAt) - new Date(second.appliedAt));
}

function getApplicationStatus(position, slots) {
  if (position <= slots) return "confirmed";
  if (position <= slots + 2) return "pending";
  return "waitlisted";
}

function refreshApplicationStatuses() {
  state.shortCalls.forEach((shortCall) => {
    const ranking = applicationsForCall(shortCall.id);
    ranking.forEach((applicationEntry, index) => {
      applicationEntry.status = getApplicationStatus(index + 1, shortCall.slots);
    });
  });
}

function eligibleShortCallsForEmployee(user) {
  return state.shortCalls.filter(
    (shortCall) =>
      shortCall.scheduleStatus === SHORT_CALL_STATUSES.APPROVED &&
      (shortCall.interdepartmentOpen || shortCall.department === user.department)
  );
}

function createShortCall(payload, creatorId) {
  state.shortCalls.unshift({
    id: crypto.randomUUID(),
    ...payload,
    createdBy: creatorId,
    createdAt: new Date().toISOString(),
    scheduleStatus: SHORT_CALL_STATUSES.PENDING_SCHEDULE,
    scheduleReviewedBy: null,
    scheduleReviewedAt: null,
    scheduleNotes: "Awaiting Schedule team review.",
  });
}

function setScheduleDecision(shortCallId, decisionStatus, reviewerId, scheduleNotes) {
  const shortCall = state.shortCalls.find((item) => item.id === shortCallId);
  if (!shortCall) return;

  shortCall.scheduleStatus = decisionStatus;
  shortCall.scheduleReviewedBy = reviewerId;
  shortCall.scheduleReviewedAt = new Date().toISOString();
  shortCall.scheduleNotes = scheduleNotes || (decisionStatus === SHORT_CALL_STATUSES.APPROVED ? "Approved by Schedule team." : "Rejected by Schedule team.");

  if (decisionStatus === SHORT_CALL_STATUSES.REJECTED) {
    state.applications = state.applications.filter((application) => application.shortCallId !== shortCallId);
  }

  refreshApplicationStatuses();
}

function applyToShortCall(shortCallId, userId) {
  const shortCall = state.shortCalls.find((item) => item.id === shortCallId);
  if (!shortCall || shortCall.scheduleStatus !== SHORT_CALL_STATUSES.APPROVED) return;

  const alreadyApplied = state.applications.some(
    (application) => application.shortCallId === shortCallId && application.userId === userId
  );

  if (alreadyApplied) return;

  state.applications.push({
    id: crypto.randomUUID(),
    shortCallId,
    userId,
    appliedAt: new Date().toISOString(),
    status: "pending",
  });

  refreshApplicationStatuses();
}

function renderHeader(user) {
  const managerAccess = user.role === "manager" || user.role === "admin";
  const scheduleAccess = user.role === "schedule" || user.role === "admin";

  return `
    <header class="header card chrome-card">
      <div class="brand">
        <div class="brand-top">
          <span class="stadium-dot">◉</span>
          <h1>Short Call Web • BC Place Demo</h1>
        </div>
        <p>${user.name} • ${user.role.toUpperCase()} • ${user.department}</p>
      </div>
      <div class="row">
        ${user.role === "employee" ? `<button class="button ghost" id="gotoEmployee">Employee View</button>` : ""}
        ${managerAccess ? `<button class="button ghost" id="gotoManager">Manager/Admin View</button>` : ""}
        ${scheduleAccess ? `<button class="button ghost" id="gotoSchedule">Schedule Review</button>` : ""}
        <button class="button ghost" id="logout">Sign Out</button>
      </div>
    </header>
  `;
}

function renderLogin(errorMessage = "") {
  app.innerHTML = `
    <main class="container">
      <section class="card login-card">
        <div class="hero-symbol">⬡</div>
        <h1>Short Call Web</h1>
        <p>Modern end-to-end short-call operations demo for BC Place staffing workflows.</p>
        <div class="notice" style="margin-bottom: 1rem;">
          Demo users: employee@shortcall.demo, manager@shortcall.demo, admin@shortcall.demo, schedule@shortcall.demo<br />
          Password: demo123
        </div>
        ${errorMessage ? `<p style="color: var(--danger);">${errorMessage}</p>` : ""}
        <form id="loginForm" class="grid">
          <div>
            <label for="email">Email</label>
            <input id="email" type="email" required placeholder="name@company.ca" />
          </div>
          <div>
            <label for="password">Password</label>
            <input id="password" type="password" required placeholder="••••••••" />
          </div>
          <button class="button" type="submit">Sign In</button>
        </form>
      </section>
    </main>
  `;

  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    const user = state.users.find((candidate) => candidate.email === email && candidate.password === password);
    if (!user) {
      renderLogin("Invalid credentials. Please try again.");
      return;
    }

    localStorage.setItem("scw_token", createToken(user));
    route();
  });
}

function renderEmployeeDashboard() {
  requireAuth(["employee"], (user) => {
    refreshApplicationStatuses();

    const eligibleCalls = eligibleShortCallsForEmployee(user);
    const userApplications = state.applications.filter((application) => application.userId === user.id);
    const confirmedCount = userApplications.filter((application) => application.status === "confirmed").length;
    const pendingCount = userApplications.filter((application) => application.status === "pending").length;

    app.innerHTML = `
      <main class="container">
        ${renderHeader(user)}
        <section class="kpi">
          <article class="item"><small>Eligible Calls</small><strong>${eligibleCalls.length}</strong></article>
          <article class="item"><small>Pending</small><strong>${pendingCount}</strong></article>
          <article class="item"><small>Confirmed</small><strong>${confirmedCount}</strong></article>
        </section>

        <section class="grid two" style="margin-top: 1rem;">
          <article class="card decorated-card">
            <h3>✦ Open Short Calls</h3>
            <ul class="list">
              ${eligibleCalls
                .map((shortCall) => {
                  const alreadyApplied = state.applications.some(
                    (application) => application.shortCallId === shortCall.id && application.userId === user.id
                  );

                  return `
                    <li class="item">
                      <div class="row">
                        <strong>${shortCall.title}</strong>
                        <span class="tag">${shortCall.department}</span>
                      </div>
                      <p>Shift: ${shortCall.shift} • Seats: ${shortCall.slots} • Cross-department: ${shortCall.interdepartmentOpen ? "Yes" : "No"}</p>
                      <p class="meta">Approved by Schedule • Published ${formatDate(shortCall.createdAt)}</p>
                      <button class="button applyButton" data-id="${shortCall.id}" ${alreadyApplied ? "disabled" : ""}>${
                    alreadyApplied ? "Already Applied" : "Apply"
                  }</button>
                    </li>
                  `;
                })
                .join("")}
              ${eligibleCalls.length === 0 ? `<li class="notice">No approved short-calls are available for your profile right now.</li>` : ""}
            </ul>
          </article>

          <article class="card decorated-card">
            <h3>◆ My Queue Position</h3>
            <ul class="list">
              ${userApplications
                .map((applicationEntry) => {
                  const shortCall = state.shortCalls.find((item) => item.id === applicationEntry.shortCallId);
                  if (!shortCall) return "";
                  const ranking = applicationsForCall(shortCall.id);
                  const position = ranking.findIndex((item) => item.id === applicationEntry.id) + 1;
                  const status = getApplicationStatus(position, shortCall.slots);
                  applicationEntry.status = status;

                  return `
                    <li class="item">
                      <div class="row">
                        <strong>${shortCall.title}</strong>
                        <span class="tag ${status}">${status}</span>
                      </div>
                      <p>Queue spot: #${position} • Timestamp: ${formatDate(applicationEntry.appliedAt)}</p>
                    </li>
                  `;
                })
                .join("")}
              ${userApplications.length === 0 ? `<li class="notice">You have no applications yet.</li>` : ""}
            </ul>
          </article>
        </section>

        <p class="footer-note">Demo mode: in-memory state only. Refresh resets data.</p>
      </main>
    `;

    document.querySelectorAll(".applyButton").forEach((button) => {
      button.addEventListener("click", () => {
        applyToShortCall(button.dataset.id, user.id);
        renderEmployeeDashboard();
      });
    });

    bindCommonActions(user);
  });
}

function renderManagerDashboard() {
  requireAuth(["manager", "admin"], (user) => {
    const managerVisibleCalls = state.shortCalls.filter((shortCall) => user.role === "admin" || shortCall.createdBy === user.id);

    app.innerHTML = `
      <main class="container">
        ${renderHeader(user)}

        <section class="grid two">
          <article class="card decorated-card">
            <h3>✚ Create Short Call</h3>
            <p class="meta">All manager/admin requests require Schedule team approval before publication.</p>
            <form id="createForm" class="grid">
              <div>
                <label for="title">Title</label>
                <input id="title" required placeholder="Example: Event exit reset support" />
              </div>
              <div class="form-grid">
                <div>
                  <label for="department">Department</label>
                  <select id="department">${DEPARTMENTS.map((department) => `<option>${department}</option>`).join("")}</select>
                </div>
                <div>
                  <label for="shift">Shift</label>
                  <select id="shift">
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Night</option>
                  </select>
                </div>
                <div>
                  <label for="slots">Seats</label>
                  <input id="slots" type="number" min="1" value="1" required />
                </div>
                <div>
                  <label for="openAll">Cross-department</label>
                  <select id="openAll">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <button class="button" type="submit">Submit to Schedule</button>
            </form>
          </article>

          <article class="card decorated-card">
            <h3>◌ Governance Rules</h3>
            <p>Only manager/admin can create requests. Only Schedule can approve/reject publication frequency across departments.</p>
            <div class="notice">Official departments: ${DEPARTMENTS.join(", ")}.</div>
          </article>
        </section>

        <section class="card" style="margin-top: 1rem;">
          <h3>Requested Calls & Temporal Ranking</h3>
          <ul class="list">
            ${managerVisibleCalls
              .map((shortCall) => {
                const ranking = applicationsForCall(shortCall.id);
                const scheduleReviewer = shortCall.scheduleReviewedBy ? getUserById(shortCall.scheduleReviewedBy)?.name : "Pending";

                return `
                  <li class="item">
                    <div class="row">
                      <strong>${shortCall.title}</strong>
                      <div class="row">
                        <span class="tag">${shortCall.department}</span>
                        <span class="tag schedule ${shortCall.scheduleStatus}">${shortCall.scheduleStatus}</span>
                      </div>
                    </div>
                    <p>Shift: ${shortCall.shift} • Seats: ${shortCall.slots} • Cross-department: ${shortCall.interdepartmentOpen ? "Yes" : "No"}</p>
                    <p class="meta">Schedule owner: ${scheduleReviewer || "Pending"} • Notes: ${shortCall.scheduleNotes || "-"}</p>
                    ${
                      shortCall.scheduleStatus !== SHORT_CALL_STATUSES.APPROVED
                        ? `<div class="notice">This call is not visible to employees until Schedule approval.</div>`
                        : ranking.length === 0
                        ? `<div class="notice">Approved and live. No applications yet.</div>`
                        : `<ul class="list">${ranking
                            .map((applicationEntry, index) => {
                              const applicant = getUserById(applicationEntry.userId);
                              const status = getApplicationStatus(index + 1, shortCall.slots);
                              applicationEntry.status = status;
                              return `<li class="item">#${index + 1} — ${applicant?.name || "Unknown"} (${applicant?.department || "N/A"}) • ${formatDate(
                                applicationEntry.appliedAt
                              )} • <span class="tag ${status}">${status}</span></li>`;
                            })
                            .join("")}</ul>`
                    }
                  </li>
                `;
              })
              .join("")}
            ${managerVisibleCalls.length === 0 ? `<li class="notice">You have not created any short-calls yet.</li>` : ""}
          </ul>
        </section>
      </main>
    `;

    document.getElementById("createForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const title = document.getElementById("title").value.trim();
      const slots = Number(document.getElementById("slots").value);
      if (!title || Number.isNaN(slots) || slots < 1) return;

      createShortCall(
        {
          title,
          department: document.getElementById("department").value,
          shift: document.getElementById("shift").value,
          slots,
          interdepartmentOpen: document.getElementById("openAll").value === "true",
        },
        user.id
      );

      renderManagerDashboard();
    });

    bindCommonActions(user);
  });
}

function renderScheduleDashboard() {
  requireAuth(["schedule", "admin"], (user) => {
    const pendingCalls = state.shortCalls.filter((shortCall) => shortCall.scheduleStatus === SHORT_CALL_STATUSES.PENDING_SCHEDULE);

    app.innerHTML = `
      <main class="container">
        ${renderHeader(user)}

        <section class="kpi">
          <article class="item"><small>Pending Review</small><strong>${pendingCalls.length}</strong></article>
          <article class="item"><small>Approved</small><strong>${state.shortCalls.filter((item) => item.scheduleStatus === SHORT_CALL_STATUSES.APPROVED).length}</strong></article>
          <article class="item"><small>Rejected</small><strong>${state.shortCalls.filter((item) => item.scheduleStatus === SHORT_CALL_STATUSES.REJECTED).length}</strong></article>
        </section>

        <section class="card decorated-card" style="margin-top: 1rem;">
          <h3>⬢ Schedule Approval Queue</h3>
          <ul class="list">
            ${state.shortCalls
              .map((shortCall) => {
                const creator = getUserById(shortCall.createdBy);
                const isPending = shortCall.scheduleStatus === SHORT_CALL_STATUSES.PENDING_SCHEDULE;
                return `
                  <li class="item">
                    <div class="row">
                      <strong>${shortCall.title}</strong>
                      <span class="tag schedule ${shortCall.scheduleStatus}">${shortCall.scheduleStatus}</span>
                    </div>
                    <p>Requested by: ${creator?.name || "Unknown"} • Department: ${shortCall.department} • Shift: ${shortCall.shift} • Seats: ${shortCall.slots}</p>
                    <p class="meta">Created: ${formatDate(shortCall.createdAt)} • Notes: ${shortCall.scheduleNotes || "-"}</p>
                    ${
                      isPending
                        ? `<div class="row">
                            <button class="button approveButton" data-id="${shortCall.id}" data-decision="approved">Approve</button>
                            <button class="button rejectButton" data-id="${shortCall.id}" data-decision="rejected">Reject</button>
                          </div>`
                        : `<div class="notice">Finalized by ${getUserById(shortCall.scheduleReviewedBy)?.name || "Schedule"} on ${formatDate(
                            shortCall.scheduleReviewedAt || shortCall.createdAt
                          )}.</div>`
                    }
                  </li>
                `;
              })
              .join("")}
          </ul>
        </section>
      </main>
    `;

    document.querySelectorAll(".approveButton, .rejectButton").forEach((button) => {
      button.addEventListener("click", () => {
        const decision = button.dataset.decision === "approved" ? SHORT_CALL_STATUSES.APPROVED : SHORT_CALL_STATUSES.REJECTED;
        const note =
          decision === SHORT_CALL_STATUSES.APPROVED
            ? "Approved by Schedule for balanced department frequency."
            : "Rejected by Schedule due to frequency limits in current shift.";

        setScheduleDecision(button.dataset.id, decision, user.id, note);
        renderScheduleDashboard();
      });
    });

    bindCommonActions(user);
  });
}

function bindCommonActions(user) {
  const logoutButton = document.getElementById("logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("scw_token");
      renderLogin();
    });
  }

  const employeeButton = document.getElementById("gotoEmployee");
  if (employeeButton) {
    employeeButton.addEventListener("click", renderEmployeeDashboard);
  }

  const managerButton = document.getElementById("gotoManager");
  if (managerButton) {
    managerButton.addEventListener("click", renderManagerDashboard);
  }

  const scheduleButton = document.getElementById("gotoSchedule");
  if (scheduleButton) {
    scheduleButton.addEventListener("click", () => {
      if (user.role === "employee" || user.role === "manager") {
        renderManagerDashboard();
      } else {
        renderScheduleDashboard();
      }
    });
  }
}

function route() {
  const user = currentUser();
  if (!user) {
    renderLogin();
    return;
  }

  if (user.role === "employee") {
    renderEmployeeDashboard();
    return;
  }

  if (user.role === "schedule") {
    renderScheduleDashboard();
    return;
  }

  renderManagerDashboard();
}

route();
