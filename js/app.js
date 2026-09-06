"use strict";

/*
    NIGHTBORN 🌙
    Mini App frontend
*/

const API_BASE = "https://YOUR-PUBLIC-API-DOMAIN";

const tg = window.Telegram && window.Telegram.WebApp
    ? window.Telegram.WebApp
    : null;

let player = null;
let sponsors = [];
let isAdmin = false;


/* =========================================================
   TELEGRAM
========================================================= */

function initTelegram() {

    if (!tg) {
        return;
    }

    tg.ready();
    tg.expand();

    if (tg.setHeaderColor) {
        tg.setHeaderColor("#020817");
    }

    if (tg.setBackgroundColor) {
        tg.setBackgroundColor("#020817");
    }
}


/* =========================================================
   API
========================================================= */

async function api(path, options = {}) {

    const headers = {
        "Content-Type": "application/json"
    };

    if (tg && tg.initData) {
        headers["X-Telegram-Init-Data"] = tg.initData;
    }

    const response = await fetch(API_BASE + path, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Сервер повернув неправильну відповідь.");
    }

    if (!response.ok || data.ok === false) {

        if (response.status === 401) {
            throw new Error(
                "Помилка авторизації. Відкрий Mini App через Telegram."
            );
        }

        throw new Error(data.error || "Помилка сервера.");
    }

    return data;
}


/* =========================================================
   LOAD PLAYER
========================================================= */

async function loadPlayer() {

    const data = await api("/api/me");

    player = data.user;
    isAdmin = !!data.is_admin;

    renderPlayer();

    if (isAdmin) {

        document
            .getElementById("adminNav")
            .classList.remove("hidden");

        await loadAdmin();
    }
}


/* =========================================================
   PLAYER UI
========================================================= */

function renderPlayer() {

    if (!player) {
        return;
    }

    const name =
        player.first_name ||
        player.username ||
        "Користувач";

    const username =
        player.username
            ? "@" + player.username
            : "username відсутній";

    const balance =
        Number(player.balance || 0).toFixed(2);

    document.getElementById("playerName").textContent = name;
    document.getElementById("playerUsername").textContent = username;
    document.getElementById("playerId").textContent = player.user_id;

    document.getElementById("balance").textContent = balance;

    document.getElementById("profileName").textContent = name;
    document.getElementById("profileUsername").textContent = username;
    document.getElementById("profileId").textContent = player.user_id;
    document.getElementById("profileBalance").textContent = balance;

    document.getElementById("referralCount").textContent =
        player.referrals || 0;

    document.getElementById("profileReferrals").textContent =
        player.referrals || 0;

    if (player.photo_url) {

        const avatar = document.getElementById("avatar");
        const profileAvatar =
            document.getElementById("profileAvatar");

        avatar.innerHTML = "";
        profileAvatar.innerHTML = "";

        avatar.style.backgroundImage =
            `url("${player.photo_url}")`;

        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";

        profileAvatar.style.backgroundImage =
            `url("${player.photo_url}")`;

        profileAvatar.style.backgroundSize = "cover";
        profileAvatar.style.backgroundPosition = "center";
    }
}


/* =========================================================
   SPONSORS
========================================================= */

async function loadSponsors() {

    const box =
        document.getElementById("sponsorsList");

    box.innerHTML =
        `<div class="loading-box">Завантаження спонсорів...</div>`;

    try {

        const data = await api("/api/sponsors");

        sponsors = data.sponsors || [];

        document.getElementById("sponsorCounter")
            .textContent = `0/${sponsors.length}`;

        if (!sponsors.length) {

            box.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">🌙</div>
                    <h3>Спонсорів немає</h3>
                    <p>
                        Зараз немає активних каналів для підписки.
                    </p>
                </div>
            `;

            return;
        }

        renderSponsors();

    } catch (error) {

        box.innerHTML = `
            <div class="error-box">
                ❌ ${escapeHtml(error.message)}
            </div>
        `;
    }
}


function renderSponsors() {

    const box =
        document.getElementById("sponsorsList");

    box.innerHTML = "";

    let checked = 0;

    sponsors.forEach(sponsor => {

        const item =
            document.createElement("div");

        item.className = "sponsor";

        const logo =
            sponsor.logo_url
                ? `<img class="sponsor-logo"
                        src="${escapeAttribute(sponsor.logo_url)}"
                        onerror="this.style.display='none'">`
                : `<div class="sponsor-logo"
                        style="display:flex;align-items:center;justify-content:center;font-size:22px">
                        📢
                   </div>`;

        item.innerHTML = `

            ${logo}

            <div class="sponsor-info">

                <div class="sponsor-name">
                    ${escapeHtml(sponsor.name)}
                </div>

                <div id="status-${sponsor.id}"
                     class="sponsor-status">
                    Потрібна підписка
                </div>

            </div>

            <button
                class="sponsor-btn"
                data-id="${sponsor.id}"
                data-url="${escapeAttribute(sponsor.url)}">
                Перейти
            </button>
        `;

        box.appendChild(item);
    });

    box.querySelectorAll(".sponsor-btn")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const id =
                    Number(button.dataset.id);

                const url =
                    button.dataset.url;

                if (url) {

                    if (tg && tg.openTelegramLink) {
                        tg.openTelegramLink(url);
                    } else {
                        window.open(url, "_blank");
                    }
                }

                button.textContent = "Перевірити...";

                try {

                    const result =
                        await api("/api/sponsor/check", {
                            method: "POST",
                            body: JSON.stringify({
                                sponsor_id: id
                            })
                        });

                    if (result.subscribed) {

                        button.textContent = "✓ Виконано";
                        button.classList.add("checked");

                        document.getElementById(
                            `status-${id}`
                        ).textContent = "Підписку підтверджено";

                    } else {

                        button.textContent = "Не підписаний";

                        document.getElementById(
                            `status-${id}`
                        ).textContent =
                            "Підписка не знайдена";
                    }

                    updateSponsorCounter();

                } catch (error) {

                    button.textContent = "Перевірити";

                    showModal(
                        "Помилка",
                        error.message
                    );
                }
            });
        });
}


function updateSponsorCounter() {

    const buttons =
        document.querySelectorAll(".sponsor-btn.checked");

    document.getElementById("sponsorCounter")
        .textContent =
        `${buttons.length}/${sponsors.length}`;
}


/* =========================================================
   REFERRAL
========================================================= */

function getReferralLink() {

    if (!player || !player.referral_link) {
        return "";
    }

    return player.referral_link;
}


async function copyReferral() {

    const link = getReferralLink();

    if (!link) {

        showModal(
            "Реферальне посилання",
            "Посилання ще не створено."
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(link);

        showModal(
            "Готово 🌙",
            "Реферальне посилання скопійовано."
        );

    } catch {

        showModal(
            "Реферальне посилання",
            `<div style="word-break:break-all">
                ${escapeHtml(link)}
             </div>`
        );
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function initNavigation() {

    document.querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener("click", () => {

                const page =
                    button.dataset.page;

                if (!page) {
                    return;
                }

                document.querySelectorAll(".page")
                    .forEach(p =>
                        p.classList.remove("active")
                    );

                document
                    .getElementById(page)
                    .classList.add("active");

                document.querySelectorAll(".nav-item")
                    .forEach(b =>
                        b.classList.remove("active")
                    );

                button.classList.add("active");

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                if (page === "adminPage" && isAdmin) {
                    loadAdmin();
                }
            });
        });
}


/* =========================================================
   ADMIN
========================================================= */

async function loadAdmin() {

    if (!isAdmin) {
        return;
    }

    try {

        const data =
            await api("/api/admin/statistics");

        document.getElementById("adminUsers")
            .textContent = data.users;

        document.getElementById("adminSponsors")
            .textContent = data.total_sponsors;

        document.getElementById("adminActiveSponsors")
            .textContent = data.active_sponsors;

        document.getElementById("adminBalance")
            .textContent =
            Number(data.total_balance || 0).toFixed(2);

    } catch (error) {

        console.error(error);
    }

    await loadAdminSponsors();
    await loadAdminUsers();
}


async function loadAdminSponsors() {

    const box =
        document.getElementById("adminSponsorsList");

    try {

        const data =
            await api("/api/admin/sponsors");

        box.innerHTML = "";

        data.sponsors.forEach(sponsor => {

            const item =
                document.createElement("div");

            item.className = "admin-sponsor";

            item.innerHTML = `

                <div class="admin-sponsor-info">

                    <div class="admin-sponsor-name">
                        ${escapeHtml(sponsor.name)}
                    </div>

                    <div class="admin-sponsor-status">
                        ${sponsor.is_active
                            ? "🟢 Активний"
                            : "🔴 Вимкнений"}
                    </div>

                </div>

                <div class="admin-actions">

                    <button
                        class="admin-action toggle-sponsor"
                        data-id="${sponsor.id}"
                        data-active="${sponsor.is_active}">
                        ${sponsor.is_active ? "🔴" : "🟢"}
                    </button>

                    <button
                        class="admin-action danger delete-sponsor"
                        data-id="${sponsor.id}">
                        🗑
                    </button>

                </div>
            `;

            box.appendChild(item);
        });

        box.querySelectorAll(".toggle-sponsor")
            .forEach(btn => {

                btn.addEventListener("click", async () => {

                    await api(
                        "/api/admin/sponsors/toggle",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                sponsor_id:
                                    Number(btn.dataset.id),

                                active:
                                    btn.dataset.active !== "1"
                            })
                        }
                    );

                    await loadAdmin();
                    await loadSponsors();
                });
            });

        box.querySelectorAll(".delete-sponsor")
            .forEach(btn => {

                btn.addEventListener("click", async () => {

                    if (!confirm("Видалити цього спонсора?")) {
                        return;
                    }

                    await api(
                        "/api/admin/sponsors/delete",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                sponsor_id:
                                    Number(btn.dataset.id)
                            })
                        }
                    );

                    await loadAdmin();
                    await loadSponsors();
                });
            });

    } catch (error) {

        box.innerHTML = `
            <div class="error-box">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}


/* =========================================================
   ADMIN USERS
========================================================= */

async function loadAdminUsers() {

    const box =
        document.getElementById("adminUsersList");

    try {

        const data =
            await api("/api/admin/users");

        box.innerHTML = "";

        data.users.forEach(user => {

            const item =
                document.createElement("div");

            item.className = "admin-user";

            item.innerHTML = `

                <div>
                    <b>
                        ${escapeHtml(
                            user.first_name || "Користувач"
                        )}
                    </b>

                    <br>

                    <span>
                        ID: ${escapeHtml(
                            String(user.user_id)
                        )}
                    </span>
                </div>

                <div>
                    <b>
                        ${Number(
                            user.balance || 0
                        ).toFixed(2)}
                    </b>

                    <br>

                    <span>GRAM</span>
                </div>
            `;

            box.appendChild(item);
        });

    } catch (error) {

        box.innerHTML = `
            <div class="error-box">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}


/* =========================================================
   ADD SPONSOR
========================================================= */

function initAdmin() {

    document
        .getElementById("adminAddSponsor")
        .addEventListener("click", () => {

            if (!isAdmin) {
                return;
            }

            showModal(
                "➕ Додати спонсора",
                `
                <p style="color:#7288a3;font-size:12px">
                    Заповни дані нового Telegram-каналу.
                </p>

                <input
                    id="sponsorName"
                    class="admin-input"
                    placeholder="Назва">

                <input
                    id="sponsorChannel"
                    class="admin-input"
                    placeholder="@username або ID">

                <input
                    id="sponsorUrl"
                    class="admin-input"
                    placeholder="Посилання https://t.me/...">

                <input
                    id="sponsorLogo"
                    class="admin-input"
                    placeholder="URL логотипу (необов'язково)">

                <button
                    id="saveSponsor"
                    class="primary-btn">
                    Додати
                </button>
                `
            );

            document
                .getElementById("saveSponsor")
                .addEventListener("click", addSponsor);
        });
}


async function addSponsor() {

    const name =
        document.getElementById("sponsorName").value.trim();

    const channel =
        document.getElementById("sponsorChannel").value.trim();

    const url =
        document.getElementById("sponsorUrl").value.trim();

    const logo =
        document.getElementById("sponsorLogo").value.trim();

    if (!name || !channel || !url) {

        alert("Заповни всі обов'язкові поля.");

        return;
    }

    try {

        await api(
            "/api/admin/sponsors/add",
            {
                method: "POST",

                body: JSON.stringify({
                    name,
                    channel,
                    join_url: url,
                    logo_url: logo
                })
            }
        );

        closeModal();

        await loadAdmin();
        await loadSponsors();

        showModal(
            "Готово",
            "Спонсора успішно додано."
        );

    } catch (error) {

        alert(error.message);
    }
}


/* =========================================================
   MODAL
========================================================= */

function showModal(title, content) {

    const modal =
        document.getElementById("modal");

    const box =
        document.getElementById("modalContent");

    box.innerHTML = `
        <h2 style="margin-top:0">
            ${escapeHtml(title)}
        </h2>

        ${content}
    `;

    modal.classList.remove("hidden");
}


function closeModal() {

    document
        .getElementById("modal")
        .classList.add("hidden");
}


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {
    return escapeHtml(value);
}


/* =========================================================
   LOADER
========================================================= */

async function startApp() {

    initTelegram();

    const status =
        document.getElementById("loaderStatus");

    try {

        if (!tg || !tg.initData) {

            status.textContent =
                "Відкрий Mini App через Telegram";

            setTimeout(() => {

                document
                    .getElementById("loader")
                    .classList.add("hidden");

                document
                    .getElementById("app")
                    .classList.remove("hidden");

                showModal(
                    "🌙 NightBorn",
                    "Цей додаток потрібно відкривати через Telegram."
                );

            }, 1300);

            return;
        }

        status.textContent =
            "Перевірка Telegram...";

        await loadPlayer();

        status.textContent =
            "Завантаження профілю...";

        await loadSponsors();

        status.textContent =
            "Готово ✨";

        setTimeout(() => {

            document
                .getElementById("loader")
                .classList.add("hidden");

            document
                .getElementById("app")
                .classList.remove("hidden");

        }, 700);

    } catch (error) {

        console.error(error);

        status.textContent =
            "Помилка завантаження";

        setTimeout(() => {

            document
                .getElementById("loader")
                .classList.add("hidden");

            document
                .getElementById("app")
                .classList.remove("hidden");

            showModal(
                "❌ Не вдалося завантажити",
                escapeHtml(error.message)
            );

        }, 800);
    }
}


/* =========================================================
   EVENTS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initNavigation();
    initAdmin();

    document
        .getElementById("copyReferralBtn")
        .addEventListener("click", copyReferral);

    document
        .getElementById("copyReferralBig")
        .addEventListener("click", copyReferral);

    document
        .getElementById("refreshBtn")
        .addEventListener("click", async () => {

            try {

                await loadPlayer();
                await loadSponsors();

            } catch (error) {

                showModal(
                    "Помилка",
                    error.message
                );
            }
        });

    document
        .getElementById("closeModal")
        .addEventListener("click", closeModal);

    document
        .getElementById("modal")
        .addEventListener("click", event => {

            if (event.target.id === "modal") {
                closeModal();
            }
        });

    startApp();
});
