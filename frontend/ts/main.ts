type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
type ApiResponse<T> = ApiOk<T> | ApiErr;

type User = { id: number; email: string } | null;

type Video = {
  id: number;
  title: string;
  file_path: string;
  likes: number;
  created_at: string;
  email: string;
};

const API = "/video-hosting/backend/api";

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function setMsg(el: HTMLElement | null, text: string): void {
  if (!el) return;
  el.textContent = text;
}

function isApiOk<T>(res: ApiResponse<T>): res is ApiOk<T> {
  return res.ok === true;
}

async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url, { credentials: "same-origin" });
  return (await res.json()) as ApiResponse<T>;
}

async function apiPost<T>(
  url: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  return (await res.json()) as ApiResponse<T>;
}

function validateAuth(email: string, password: string): string {
  if (!email || !password) return "Заполните email и пароль";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Некорректный email";
  if (password.length < 6) return "Пароль минимум 6 символов";
  return "";
}

function validateUpload(title: string, file?: File): string {
  if (!title) return "Введите название";
  if (!file) return "Выберите видеофайл";

  const max = 200 * 1024 * 1024;
  if (file.size > max) return "Файл слишком большой";

  const okTypes = ["video/mp4", "video/webm", "video/ogg"];
  if (!okTypes.includes(file.type)) return "Неверный формат файла";

  return "";
}

function buildVideoUrl(filePath: string): string {
  return `/video-hosting/${filePath}`;
}

const authSection = $("authSection") as HTMLElement | null;
const appSection = $("appSection") as HTMLElement | null;
const userBox = $("userBox") as HTMLElement | null;

const loginForm = $("loginForm") as HTMLFormElement | null;
const registerForm = $("registerForm") as HTMLFormElement | null;
const logoutBtn = $("logoutBtn") as HTMLButtonElement | null;

const loginMsg = $("loginMsg");
const registerMsg = $("registerMsg");

const uploadForm = $("uploadForm") as HTMLFormElement | null;
const uploadMsg = $("uploadMsg");
const uploadBar = $("uploadBar") as HTMLElement | null;

const videosGrid = $("videosGrid") as HTMLElement | null;
const emptyState = $("emptyState") as HTMLElement | null;

const searchInput = $("searchInput") as HTMLInputElement | null;
const sortSelect = $("sortSelect") as HTMLSelectElement | null;
const searchBtn = $("searchBtn") as HTMLButtonElement | null;

function setAppState(user: User): void {
  if (!authSection || !appSection || !userBox) return;

  if (user) {
    authSection.hidden = true;
    appSection.hidden = false;
    userBox.textContent = user.email;
    return;
  }

  authSection.hidden = false;
  appSection.hidden = true;
  userBox.textContent = "";
}

function setUploadProgress(percent: number): void {
  if (!uploadBar) return;
  const box = uploadBar.parentElement as HTMLElement | null;
  if (!box) return;

  if (percent <= 0) {
    box.hidden = true;
    uploadBar.style.width = "0%";
    return;
  }

  box.hidden = false;
  uploadBar.style.width = `${percent}%`;
}

function renderVideos(list: Video[]): void {
  if (!videosGrid || !emptyState) return;

  videosGrid.innerHTML = "";

  if (!list.length) {
    const q = (searchInput?.value || "").trim();
    emptyState.textContent = q ? "Ничего не найдено" : "Видео пока нет";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  const frag = document.createDocumentFragment();

  list.forEach((v) => {
    const card = document.createElement("div");
    card.className = "video-card";

    const body = document.createElement("div");
    body.className = "video-card__body";

    const title = document.createElement("h4");
    title.className = "video-card__title";
    title.textContent = v.title;

    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.src = buildVideoUrl(v.file_path);

    const meta = document.createElement("div");
    meta.className = "video-card__meta";
    meta.textContent = `Автор: ${v.email} • ${new Date(
      v.created_at
    ).toLocaleString()}`;

    const actions = document.createElement("div");
    actions.className = "video-card__actions";

    const likeBtn = document.createElement("button");
    likeBtn.className = "button button--secondary";
    likeBtn.type = "button";
    likeBtn.textContent = "Лайк";

    const likes = document.createElement("div");
    likes.className = "video-card__likes";
    likes.textContent = `Лайки: ${v.likes}`;

    likeBtn.addEventListener("click", async () => {
      const res = (await fetch(`${API}/videos_like.php`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: v.id }),
      }).then((r) => r.json())) as ApiResponse<{
        videoId: number;
        likes: number;
      }>;

      if (!isApiOk(res)) {
        if (res.error === "Unauthorized") {
          alert("Сначала войдите в аккаунт");
        }
        return;
      }

      v.likes = res.data.likes;
      likes.textContent = `Лайки: ${v.likes}`;
      await loadVideos();
    });

    actions.append(likeBtn, likes);
    body.append(title, video, meta, actions);
    card.append(body);
    frag.append(card);
  });

  videosGrid.append(frag);
}

async function loadVideos(): Promise<void> {
  const q = (searchInput?.value || "").trim();
  const sort = sortSelect?.value || "date_desc";

  const url = new URL(`${location.origin}${API}/videos_list.php`);
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("sort", sort);

  const res = (await fetch(url.toString(), { credentials: "same-origin" }).then(
    (r) => r.json()
  )) as ApiResponse<Video[]>;

  if (!isApiOk(res)) return;
  renderVideos(res.data);
}

function uploadWithProgress(formData: FormData): Promise<ApiResponse<Video>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/videos_upload.php`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const p = Math.round((e.loaded / e.total) * 100);
      setUploadProgress(p);
    };

    xhr.onload = () => {
      setUploadProgress(0);

      if (xhr.status === 401) {
        resolve({ ok: false, error: "Сначала войдите в аккаунт" });
        return;
      }

      try {
        resolve(JSON.parse(xhr.responseText) as ApiResponse<Video>);
      } catch {
        resolve({ ok: false, error: "Bad response" });
      }
    };

    xhr.onerror = () => {
      setUploadProgress(0);
      resolve({ ok: false, error: "Network error" });
    };

    xhr.send(formData);
  });
}

async function loadMe(): Promise<void> {
  const data = await apiGet<User>(`${API}/auth_me.php`);

  if (!isApiOk(data)) {
    setAppState(null);
    return;
  }

  setAppState(data.data);

  if (data.data) {
    await loadVideos();
  }
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(loginMsg, "");

  const fd = new FormData(loginForm);
  const email = String(fd.get("email") || "").trim();
  const password = String(fd.get("password") || "");

  const err = validateAuth(email, password);
  if (err) return setMsg(loginMsg, err);

  const send = new FormData();
  send.set("email", email);
  send.set("password", password);

  const res = await apiPost<{ id: number; email: string }>(
    `${API}/auth_login.php`,
    send
  );
  if (!isApiOk(res)) return setMsg(loginMsg, res.error || "Ошибка");

  await loadMe();
});

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(registerMsg, "");

  const fd = new FormData(registerForm);
  const email = String(fd.get("email") || "").trim();
  const password = String(fd.get("password") || "");

  const err = validateAuth(email, password);
  if (err) return setMsg(registerMsg, err);

  const send = new FormData();
  send.set("email", email);
  send.set("password", password);

  const res = await apiPost<{ id: number; email: string }>(
    `${API}/auth_register.php`,
    send
  );
  if (!isApiOk(res)) return setMsg(registerMsg, res.error || "Ошибка");

  await loadMe();
});

logoutBtn?.addEventListener("click", async () => {
  const send = new FormData();
  const res = await apiPost<boolean>(`${API}/auth_logout.php`, send);
  if (isApiOk(res)) setAppState(null);
});

uploadForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(uploadMsg, "");

  const submitBtn = uploadForm.querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement | null;
  if (!submitBtn) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Загрузка...";

  const title = String(
    (uploadForm.elements.namedItem("title") as HTMLInputElement | null)
      ?.value || ""
  ).trim();
  const file = (
    uploadForm.elements.namedItem("video") as HTMLInputElement | null
  )?.files?.[0];

  const err = validateUpload(title, file);
  if (err) {
    setMsg(uploadMsg, err);
    submitBtn.disabled = false;
    submitBtn.textContent = "Загрузить";
    return;
  }

  const fd = new FormData();
  fd.set("title", title);
  fd.set("video", file as File);

  const res = await uploadWithProgress(fd);

  if (!isApiOk(res)) {
    setMsg(uploadMsg, res.error || "Ошибка");
    submitBtn.disabled = false;
    submitBtn.textContent = "Загрузить";
    return;
  }

  uploadForm.reset();
  await loadVideos();

  submitBtn.disabled = false;
  submitBtn.textContent = "Загрузить";
});

searchBtn?.addEventListener("click", loadVideos);
sortSelect?.addEventListener("change", loadVideos);

searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadVideos();
});

let searchTimer = 0;
searchInput?.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    loadVideos();
  }, 300);
});

loadMe();
