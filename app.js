const DEPARTMENTS = [
  "EVS",
  "Security",
  "Host",
  "Conversion",
  "Operations",
  "Maintenance",
  "Administration",
];

const state = {
  users: [
    { id: "u1", name: "Ana EVS", email: "employee@shortcall.demo", password: "demo123", role: "employee", department: "EVS" },
    { id: "u2", name: "Bruno Manager", email: "manager@shortcall.demo", password: "demo123", role: "manager", department: "Operations" },
    { id: "u3", name: "Clara Admin", email: "admin@shortcall.demo", password: "demo123", role: "admin", department: "Administration" },
  ],
  shortCalls: [
    {
      id: crypto.randomUUID(),
      title: "Reforço limpeza pós-evento",
      department: "EVS",
      shift: "Noite",
      slots: 2,
      interdepartmentOpen: false,
      createdBy: "u2",
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "Apoio segurança portão B",
      department: "Security",
      shift: "Tarde",
      slots: 1,
      interdepartmentOpen: true,
      createdBy: "u3",
      createdAt: new Date().toISOString(),
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
  return state.users.find((u) => u.id === payload.id) || null;
}

function requireAuth(allowedRoles, renderer) {
  const user = currentUser();
  if (!user) {
    renderLogin("Sessão expirada. Faça login para continuar.");
    return;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    app.innerHTML = `<div class="container"><div class="card"><h2>Acesso negado</h2><p>Seu perfil não possui permissão para este fluxo.</p></div></div>`;
    return;
  }
  renderer(user);
}

function eligibleCallsFor(user) {
  return state.shortCalls.filter((call) => call.interdepartmentOpen || call.department === user.department);
}

function applicationsForCall(callId) {
  return state.applications
    .filter((a) => a.shortCallId === callId)
    .sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
}

function getStatusForPosition(pos, slots) {
  if (pos <= slots) return "confirmed";
  if (pos <= slots + 2) return "pending";
  return "waitlisted";
}

function applyToCall(callId, userId) {
  const alreadyApplied = state.applications.some((a) => a.shortCallId === callId && a.userId === userId);
  if (alreadyApplied) return;

  state.applications.push({
    id: crypto.randomUUID(),
    shortCallId: callId,
    userId,
    appliedAt: new Date().toISOString(),
    status: "pending",
  });
}

function renderLogin(errorMessage = "") {
  app.innerHTML = `
    <main class="container">
      <section class="card" style="max-width: 460px; margin: 10vh auto 0;">
        <h1>Short Call Web</h1>
        <p>Demo pública para gestão de short-calls em fluxo ponta a ponta.</p>
        <div class="notice" style="margin-bottom: 1rem;">
          Usuários demo: employee@shortcall.demo, manager@shortcall.demo, admin@shortcall.demo<br/>Senha: demo123
        </div>
        ${errorMessage ? `<p style="color: var(--danger);">${errorMessage}</p>` : ""}
        <form id="loginForm" class="grid">
          <div>
            <label for="email">Email</label>
            <input id="email" type="email" required placeholder="seu.email@empresa.com" />
          </div>
          <div>
            <label for="password">Senha</label>
            <input id="password" type="password" required placeholder="********" />
          </div>
          <button class="button" type="submit">Entrar</button>
        </form>
      </section>
    </main>
  `;

  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const user = state.users.find((u) => u.email === email && u.password === password);

    if (!user) {
      renderLogin("Credenciais inválidas. Tente novamente.");
      return;
    }

    localStorage.setItem("scw_token", createToken(user));
    route();
  });
}

function renderHeader(user) {
  return `
    <header class="header">
      <div class="brand">
        <h1>Short Call Web</h1>
        <p>${user.name} • ${user.role.toUpperCase()} • ${user.department}</p>
      </div>
      <div class="row">
        ${user.role === "employee" ? `<button class="button ghost" id="gotoEmployee">Meu fluxo</button>` : ""}
        ${user.role !== "employee" ? `<button class="button ghost" id="gotoManager">Gestão</button>` : ""}
        <button class="button ghost" id="logout">Sair</button>
      </div>
    </header>
  `;
}

function renderEmployeeDashboard() {
  requireAuth(["employee"], (user) => {
    const eligible = eligibleCallsFor(user);
    const myApps = state.applications.filter((a) => a.userId === user.id);

    const totalConfirmed = myApps.filter((a) => a.status === "confirmed").length;
    const totalPending = myApps.filter((a) => a.status === "pending").length;

    app.innerHTML = `
      <main class="container">
        ${renderHeader(user)}
        <section class="kpi">
          <article class="item"><small>Elegíveis</small><strong>${eligible.length}</strong></article>
          <article class="item"><small>Pending</small><strong>${totalPending}</strong></article>
          <article class="item"><small>Confirmed</small><strong>${totalConfirmed}</strong></article>
        </section>

        <section class="grid two" style="margin-top: 1rem;">
          <article class="card">
            <h3>Short-calls elegíveis</h3>
            <ul class="list">
              ${eligible
                .map((call) => {
                  const already = state.applications.some((a) => a.shortCallId === call.id && a.userId === user.id);
                  return `
                  <li class="item">
                    <div class="row">
                      <strong>${call.title}</strong>
                      <span class="tag">${call.department}</span>
                    </div>
                    <p>Turno: ${call.shift} • Vagas: ${call.slots} • Aberto interdepartamental: ${call.interdepartmentOpen ? "Sim" : "Não"}</p>
                    <button class="button applyBtn" data-id="${call.id}" ${already ? "disabled" : ""}>${already ? "Já aplicado" : "Aplicar"}</button>
                  </li>`;
                })
                .join("")}
            </ul>
          </article>

          <article class="card">
            <h3>Minhas candidaturas</h3>
            <ul class="list">
              ${myApps.length === 0 ? `<li class="notice">Nenhuma candidatura até o momento.</li>` : ""}
              ${myApps
                .map((appEntry) => {
                  const call = state.shortCalls.find((c) => c.id === appEntry.shortCallId);
                  const ranking = applicationsForCall(call.id);
                  const pos = ranking.findIndex((item) => item.id === appEntry.id) + 1;
                  const status = getStatusForPosition(pos, call.slots);
                  appEntry.status = status;
                  return `
                    <li class="item">
                      <div class="row">
                        <strong>${call.title}</strong>
                        <span class="tag ${status}">${status}</span>
                      </div>
                      <p>Posição na fila: #${pos} • Timestamp: ${new Date(appEntry.appliedAt).toLocaleString("pt-BR")}</p>
                    </li>
                  `;
                })
                .join("")}
            </ul>
          </article>
        </section>

        <p class="footer-note">Modo demo sem banco de dados: informações em memória e reset ao recarregar.</p>
      </main>
    `;

    document.querySelectorAll(".applyBtn").forEach((button) => {
      button.addEventListener("click", () => {
        applyToCall(button.dataset.id, user.id);
        renderEmployeeDashboard();
      });
    });

    bindCommonActions(user);
  });
}

function renderManagerDashboard() {
  requireAuth(["manager", "admin"], (user) => {
    app.innerHTML = `
      <main class="container">
        ${renderHeader(user)}
        <section class="grid two">
          <article class="card">
            <h3>Criar short-call</h3>
            <form id="createForm" class="grid">
              <div>
                <label for="title">Título</label>
                <input id="title" required placeholder="Ex.: Cobertura operação noturna" />
              </div>
              <div class="form-grid">
                <div>
                  <label for="department">Departamento</label>
                  <select id="department">${DEPARTMENTS.map((d) => `<option>${d}</option>`).join("")}</select>
                </div>
                <div>
                  <label for="shift">Turno</label>
                  <select id="shift">
                    <option>Manhã</option>
                    <option>Tarde</option>
                    <option>Noite</option>
                  </select>
                </div>
                <div>
                  <label for="slots">Vagas</label>
                  <input id="slots" type="number" min="1" value="1" />
                </div>
                <div>
                  <label for="openAll">Abertura interdepartamental</label>
                  <select id="openAll"><option value="false">Não</option><option value="true">Sim</option></select>
                </div>
              </div>
              <button class="button" type="submit">Publicar</button>
            </form>
          </article>

          <article class="card">
            <h3>Governança e regras</h3>
            <p>Somente perfis manager/admin podem publicar short-calls e abrir chamadas para múltiplos departamentos.</p>
            <div class="notice">
              Departamentos oficiais: ${DEPARTMENTS.join(", ")}.
            </div>
          </article>
        </section>

        <section class="card" style="margin-top: 1rem;">
          <h3>Ranking temporal de candidaturas</h3>
          <ul class="list">
            ${state.shortCalls
              .map((call) => {
                const ranking = applicationsForCall(call.id);
                return `
                  <li class="item">
                    <div class="row">
                      <strong>${call.title}</strong>
                      <span class="tag">${call.department}</span>
                    </div>
                    <p>Turno: ${call.shift} • Vagas: ${call.slots} • Interdepartamental: ${call.interdepartmentOpen ? "Sim" : "Não"}</p>
                    ${
                      ranking.length === 0
                        ? `<div class="notice">Sem candidatos até o momento.</div>`
                        : `<ul class="list">${ranking
                            .map((candidate, index) => {
                              const applicant = state.users.find((u) => u.id === candidate.userId);
                              const status = getStatusForPosition(index + 1, call.slots);
                              candidate.status = status;
                              return `<li class="item">#${index + 1} — ${applicant.name} (${applicant.department}) • ${new Date(candidate.appliedAt).toLocaleString(
                                "pt-BR"
                              )} • <span class="tag ${status}">${status}</span></li>`;
                            })
                            .join("")}</ul>`
                    }
                  </li>
                `;
              })
              .join("")}
          </ul>
        </section>
      </main>
    `;

    document.getElementById("createForm").addEventListener("submit", (event) => {
      event.preventDefault();
      state.shortCalls.unshift({
        id: crypto.randomUUID(),
        title: document.getElementById("title").value.trim(),
        department: document.getElementById("department").value,
        shift: document.getElementById("shift").value,
        slots: Number(document.getElementById("slots").value),
        interdepartmentOpen: document.getElementById("openAll").value === "true",
        createdBy: user.id,
        createdAt: new Date().toISOString(),
      });

      renderManagerDashboard();
    });

    bindCommonActions(user);
  });
}

function bindCommonActions(user) {
  const logout = document.getElementById("logout");
  if (logout) {
    logout.addEventListener("click", () => {
      localStorage.removeItem("scw_token");
      renderLogin();
    });
  }

  const gotoEmployee = document.getElementById("gotoEmployee");
  if (gotoEmployee) {
    gotoEmployee.addEventListener("click", renderEmployeeDashboard);
  }

  const gotoManager = document.getElementById("gotoManager");
  if (gotoManager) {
    gotoManager.addEventListener("click", () => {
      if (user.role === "employee") {
        renderEmployeeDashboard();
      } else {
        renderManagerDashboard();
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

  renderManagerDashboard();
}

route();
