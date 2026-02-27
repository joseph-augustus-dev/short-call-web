# Short Call Web (Demo)

Plataforma web de demonstração para gestão de **short-calls** (chamadas rápidas de escala), com foco em baixo atrito operacional.

## Objetivo de negócio

Demonstrar um fluxo ponta a ponta para operações com demanda variável por turno:

- publicação rápida de short-calls;
- candidatura de colaboradores elegíveis;
- fila temporal transparente;
- visibilidade de status (`pending`, `confirmed`, `waitlisted`);
- governança por perfil (`employee`, `manager`, `admin`).

## Escopo funcional implementado

- **Autenticação de demonstração** via email/senha, com trilha preparada para SSO corporativo.
- **Controle de acesso por perfil** com middleware central (`requireAuth`) validando sessão e permissões.
- **Fluxo do colaborador (employee):**
  - visualização de short-calls elegíveis;
  - candidatura em um clique;
  - posição de fila por timestamp;
  - consulta de status por posição.
- **Fluxo de gestão (manager/admin):**
  - criação de short-calls;
  - abertura interdepartamental;
  - ranking temporal de candidatos.
- **Regras organizacionais explícitas:** departamentos fixos no domínio:
  - EVS
  - Security
  - Host
  - Conversion
  - Operations
  - Maintenance
  - Administration

## Tecnologias

- HTML, CSS e JavaScript puros (sem backend e sem banco de dados).
- Estado em memória (reinicia ao recarregar a página).

## Usuários demo

- `employee@shortcall.demo` / `demo123`
- `manager@shortcall.demo` / `demo123`
- `admin@shortcall.demo` / `demo123`

## Execução local

```bash
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`.

## Deploy no GitHub Pages

O deploy foi configurado via GitHub Actions em `.github/workflows/pages.yml`.

### O que o workflow faz

1. Dispara em push para `main` ou `master` e também manualmente (`workflow_dispatch`).
2. Monta um artefato estático (`dist/`) com:
   - `index.html`
   - `app.js`
   - `styles.css`
   - `404.html` (cópia do `index.html` para fallback de rota)
3. Publica automaticamente no ambiente `github-pages`.

### Como publicar

1. Faça push do repositório para o GitHub.
2. Em **Settings → Pages**, selecione **GitHub Actions** como source.
3. Faça merge/push na branch `main` (ou `master`).
4. Acompanhe o job em **Actions → Deploy Short Call Web Demo**.
5. A URL pública final aparece no step `Deploy to GitHub Pages`.

## Evolução futura

- Persistência MySQL para produção.
- Integração SSO Dayforce.
- APIs server-side com trilha de auditoria e observabilidade.
