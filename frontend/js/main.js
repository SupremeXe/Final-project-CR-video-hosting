"use strict";
const API = "/video-hosting/backend/api";
function $(id) {
    return document.getElementById(id);
}
function setMsg(el, text) {
    if (!el)
        return;
    el.textContent = text;
}
function isApiOk(res) {
    return res.ok === true;
}
async function apiGet(url) {
    const res = await fetch(url, { credentials: "same-origin" });
    return (await res.json());
}
async function apiPost(url, formData) {
    const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
    });
    return (await res.json());
}
function validateAuth(email, password) {
    if (!email || !password)
        return "Заполните email и пароль";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email))
        return "Некорректный email";
    if (password.length < 6)
        return "Пароль минимум 6 символов";
    return "";
}
function validateUpload(title, file) {
    if (!title)
        return "Введите название";
    if (!file)
        return "Выберите видеофайл";
    const max = 200 * 1024 * 1024;
    if (file.size > max)
        return "Файл слишком большой";
    const okTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (!okTypes.includes(file.type))
        return "Неверный формат файла";
    return "";
}
function buildVideoUrl(filePath) {
    return `/video-hosting/${filePath}`;
}
const authSection = $("authSection");
const appSection = $("appSection");
const userBox = $("userBox");
const loginForm = $("loginForm");
const registerForm = $("registerForm");
const logoutBtn = $("logoutBtn");
const loginMsg = $("loginMsg");
const registerMsg = $("registerMsg");
const uploadForm = $("uploadForm");
const uploadMsg = $("uploadMsg");
const uploadBar = $("uploadBar");
const videosGrid = $("videosGrid");
const emptyState = $("emptyState");
const searchInput = $("searchInput");
const sortSelect = $("sortSelect");
const searchBtn = $("searchBtn");
function setAppState(user) {
    if (!authSection || !appSection || !userBox)
        return;
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
function setUploadProgress(percent) {
    if (!uploadBar)
        return;
    const box = uploadBar.parentElement;
    if (!box)
        return;
    if (percent <= 0) {
        box.hidden = true;
        uploadBar.style.width = "0%";
        return;
    }
    box.hidden = false;
    uploadBar.style.width = `${percent}%`;
}
function renderVideos(list) {
    if (!videosGrid || !emptyState)
        return;
    videosGrid.innerHTML = "";
    if (!list.length) {
        const q = ((searchInput === null || searchInput === void 0 ? void 0 : searchInput.value) || "").trim();
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
        meta.textContent = `Автор: ${v.email} • ${new Date(v.created_at).toLocaleString()}`;
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
            }).then((r) => r.json()));
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
async function loadVideos() {
    const q = ((searchInput === null || searchInput === void 0 ? void 0 : searchInput.value) || "").trim();
    const sort = (sortSelect === null || sortSelect === void 0 ? void 0 : sortSelect.value) || "date_desc";
    const url = new URL(`${location.origin}${API}/videos_list.php`);
    if (q)
        url.searchParams.set("q", q);
    url.searchParams.set("sort", sort);
    const res = (await fetch(url.toString(), { credentials: "same-origin" }).then((r) => r.json()));
    if (!isApiOk(res))
        return;
    renderVideos(res.data);
}
function uploadWithProgress(formData) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API}/videos_upload.php`);
        xhr.withCredentials = true;
        xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable)
                return;
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
                resolve(JSON.parse(xhr.responseText));
            }
            catch {
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
async function loadMe() {
    const data = await apiGet(`${API}/auth_me.php`);
    if (!isApiOk(data)) {
        setAppState(null);
        return;
    }
    setAppState(data.data);
    if (data.data) {
        await loadVideos();
    }
}
loginForm === null || loginForm === void 0 ? void 0 : loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(loginMsg, "");
    const fd = new FormData(loginForm);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const err = validateAuth(email, password);
    if (err)
        return setMsg(loginMsg, err);
    const send = new FormData();
    send.set("email", email);
    send.set("password", password);
    const res = await apiPost(`${API}/auth_login.php`, send);
    if (!isApiOk(res))
        return setMsg(loginMsg, res.error || "Ошибка");
    await loadMe();
});
registerForm === null || registerForm === void 0 ? void 0 : registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(registerMsg, "");
    const fd = new FormData(registerForm);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const err = validateAuth(email, password);
    if (err)
        return setMsg(registerMsg, err);
    const send = new FormData();
    send.set("email", email);
    send.set("password", password);
    const res = await apiPost(`${API}/auth_register.php`, send);
    if (!isApiOk(res))
        return setMsg(registerMsg, res.error || "Ошибка");
    await loadMe();
});
logoutBtn === null || logoutBtn === void 0 ? void 0 : logoutBtn.addEventListener("click", async () => {
    const send = new FormData();
    const res = await apiPost(`${API}/auth_logout.php`, send);
    if (isApiOk(res))
        setAppState(null);
});
uploadForm === null || uploadForm === void 0 ? void 0 : uploadForm.addEventListener("submit", async (e) => {
    var _a, _b, _c;
    e.preventDefault();
    setMsg(uploadMsg, "");
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    if (!submitBtn)
        return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Загрузка...";
    const title = String(((_a = uploadForm.elements.namedItem("title")) === null || _a === void 0 ? void 0 : _a.value) || "").trim();
    const file = (_c = (_b = uploadForm.elements.namedItem("video")) === null || _b === void 0 ? void 0 : _b.files) === null || _c === void 0 ? void 0 : _c[0];
    const err = validateUpload(title, file);
    if (err) {
        setMsg(uploadMsg, err);
        submitBtn.disabled = false;
        submitBtn.textContent = "Загрузить";
        return;
    }
    const fd = new FormData();
    fd.set("title", title);
    fd.set("video", file);
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
searchBtn === null || searchBtn === void 0 ? void 0 : searchBtn.addEventListener("click", loadVideos);
sortSelect === null || sortSelect === void 0 ? void 0 : sortSelect.addEventListener("change", loadVideos);
searchInput === null || searchInput === void 0 ? void 0 : searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter")
        loadVideos();
});
let searchTimer = 0;
searchInput === null || searchInput === void 0 ? void 0 : searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
        loadVideos();
    }, 300);
});
loadMe();
