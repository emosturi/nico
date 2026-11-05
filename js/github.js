const PROFILE = "https://github.com/emosturi";

function safeGithubUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" && parsed.hostname === "github.com") return parsed.href;
  } catch {
    /* el perfil queda como respaldo */
  }
  return PROFILE;
}

function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export async function loadGithub() {
  const status = document.querySelector("#github-status");
  const list = document.querySelector("#github-repos");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const headers = { Accept: "application/vnd.github+json" };
    const [userRes, reposRes] = await Promise.all([
      fetch("https://api.github.com/users/emosturi", { headers, signal: controller.signal }),
      fetch("https://api.github.com/users/emosturi/repos?per_page=100&sort=updated", {
        headers,
        signal: controller.signal,
      }),
    ]);
    if (!userRes.ok || !reposRes.ok) throw new Error("github");

    const user = await userRes.json();
    const repos = await reposRes.json();
    if (!Array.isArray(repos)) throw new Error("lista");

    const recent = repos
      .filter((repo) => repo && typeof repo.name === "string" && repo.name !== "nico")
      .sort((a, b) => String(b.pushed_at).localeCompare(String(a.pushed_at)))
      .slice(0, 8);

    const total = Math.max(0, (Number(user.public_repos) || 0) - (repos.some((repo) => repo.name === "nico") ? 1 : 0));
    status.textContent =
      recent.length === 0
        ? "No hay repositorios públicos."
        : `${total} repositorios públicos. Estos son los ocho con actividad más reciente.`;

    list.replaceChildren();
    for (const repo of recent) {
      const item = document.createElement("li");
      item.className = "repo";
      const title = document.createElement("h3");
      const link = document.createElement("a");
      link.href = safeGithubUrl(repo.html_url);
      link.textContent = repo.name;
      title.append(link);
      item.append(title);

      if (repo.description) {
        const copy = document.createElement("p");
        copy.textContent = repo.description;
        item.append(copy);
      }

      const meta = document.createElement("p");
      meta.className = "repo-meta";
      if (repo.language) {
        const lang = document.createElement("span");
        lang.className = "lang";
        lang.textContent = repo.language;
        meta.append(lang);
      }
      if (repo.fork) {
        const fork = document.createElement("span");
        fork.className = "fork";
        fork.textContent = "Fork";
        meta.append(fork);
      }
      const when = document.createElement("span");
      when.textContent = formatDate(repo.pushed_at);
      meta.append(when);
      item.append(meta);
      list.append(item);
    }
  } catch {
    status.textContent = "No se pudo cargar la actividad. El perfil sigue en el enlace de arriba.";
    list.replaceChildren();
  } finally {
    clearTimeout(timer);
  }
}
