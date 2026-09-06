/* =========================================================
   NIGHT CAPITAL
   MAIN JAVASCRIPT
========================================================= */

"use strict";


/* =========================================================
   TELEGRAM
========================================================= */

const tg =
    window.Telegram &&
    window.Telegram.WebApp
        ? window.Telegram.WebApp
        : null;

if (tg) {
    tg.ready();
    tg.expand();

    try {
        tg.setHeaderColor("#030711");
        tg.setBackgroundColor("#030711");
    } catch (e) {
        console.log("Telegram UI setup:", e);
    }
}


/* =========================================================
   CONFIG
========================================================= */

/*
    ВАЖЛИВО:

    Сюди потрібно буде поставити адресу твого
    публічного Python API.

    Наприклад:

    const API_BASE =
        "https://my-api.example.com";

    Поки API не підключений, Mini App не зламається,
    але серверні дані не завантажаться.
*/

const API_BASE = (
    window.NIGHT_API_BASE ||
    "https://YOUR-PUBLIC-API-DOMAIN"
).replace(/\/+$/, "");


/* =========================================================
   STATE
========================================================= */

const state = {

    user: null,

    tasks: [],

    sponsors: [],

    history: [],

    admin: false,

    currentPage: "home",

    language: "uk"

};


/* =========================================================
   HELPERS
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}


function $$(selector) {
    return Array.from(
        document.querySelectorAll(selector)
    );
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatMoney(value) {

    const number = Number(value || 0);

    return number.toFixed(2);
}


function formatDate(value) {

    if (!value) {
        return "";
    }

    try {

        const date = new Date(value);

        return date.toLocaleString(
            "uk-UA",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch (e) {
        return String(value);
    }
}


function showTelegramAlert(message) {

    if (
        tg &&
        typeof tg.showAlert === "function"
    ) {

        tg.showAlert(String(message));

        return;
    }

    alert(String(message));
}


function showPopup(message) {

    if (
        tg &&
        typeof tg.showPopup === "function"
    ) {

        tg.showPopup({
            title: "Night Capital",
            message: String(message),
            buttons: [
                {
                    type: "ok"
                }
            ]
        });

        return;
    }

    alert(String(message));
}


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

    const loader = $("#loader");

    if (!loader) {
        return;
    }

    loader.classList.add("hidden");

    setTimeout(() => {

        if (loader.parentNode) {
            loader.remove();
        }

    }, 550);
}


/* =========================================================
   API
========================================================= */

function getInitData() {

    if (!tg) {
        return "";
    }

    return tg.initData || "";
}


async function api(
    path,
    options = {}
) {

    const url =
        API_BASE + path;

    const headers = {
        "Content-Type":
            "application/json",

        ...(options.headers || {})
    };


    const initData =
        getInitData();

    if (initData) {

        headers[
            "X-Telegram-Init-Data"
        ] = initData;

    }


    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            12000
        );


    try {

        const response =
            await fetch(
                url,
                {
                    ...options,
                    headers,
                    signal:
                        controller.signal
                }
            );


        let data = null;

        const text =
            await response.text();


        if (text) {

            try {
                data = JSON.parse(text);
            } catch (e) {
                data = {
                    raw: text
                };
            }

        }


        if (!response.ok) {

            const message =
                data &&
                data.detail
                    ? data.detail
                    : data &&
                      data.error
                        ? data.error
                        : `HTTP ${response.status}`;

            throw new Error(message);
        }


        return data || {};

    } finally {

        clearTimeout(timeout);

    }
}


/* =========================================================
   API AVAILABILITY
========================================================= */

function isApiConfigured() {

    return (
        API_BASE &&
        !API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    );
}


/* =========================================================
   USER
========================================================= */

function renderUser(user) {

    if (!user) {
        return;
    }

    state.user = user;


    const firstName =
        user.first_name ||
        user.name ||
        "Користувач";

    const lastName =
        user.last_name || "";

    const fullName =
        `${firstName} ${lastName}`
            .trim();


    const username =
        user.username
            ? "@" + user.username
            : "Telegram користувач";


    const balance =
        Number(
            user.balance || 0
        );


    const referrals =
        Number(
            user.referrals_count ||
            user.referrals ||
            0
        );


    const completedTasks =
        Number(
            user.completed_tasks ||
            user.tasks_completed ||
            0
        );


    const earned =
        Number(
            user.total_earned ||
            user.earned ||
            0
        );


    setText(
        "#balance-value",
        formatMoney(balance)
    );

    setText(
        "#profile-balance",
        formatMoney(balance)
    );

    setText(
        "#profile-referrals",
        referrals
    );

    setText(
        "#profile-tasks",
        completedTasks
    );

    setText(
        "#profile-earned",
        formatMoney(earned)
    );

    setText(
        "#referral-count",
        referrals
    );

    setText(
        "#referral-earned",
        formatMoney(
            Number(
                user.referral_earned ||
                0
            )
        )
    );


    setText(
        "#home-name",
        fullName
    );

    setText(
        "#home-username",
        username
    );

    setText(
        "#profile-name",
        fullName
    );

    setText(
        "#profile-username",
        username
    );


    const initials =
        (
            firstName.charAt(0) +
            (
                lastName
                    ? lastName.charAt(0)
                    : ""
            )
        ).toUpperCase();


    setText(
        "#home-avatar",
        initials || "?"
    );

    setText(
        "#profile-avatar",
        initials || "?"
    );


    const bonus =
        Number(
            user.daily_bonus_amount ||
            1
        );


    setText(
        "#bonus-amount",
        formatMoney(bonus)
    );


    if (
        user.daily_bonus_available === false
    ) {

        const status =
            $("#bonus-status");

        if (status) {
            status.textContent =
                "Бонус ще не доступний";
        }

        const button =
            $("#claim-bonus");

        if (button) {
            button.disabled = true;
        }

    }


    if (user.is_admin) {
        state.admin = true;
        showAdminEntry();
    }

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    selector,
    value
) {

    const element =
        $(selector);

    if (element) {
        element.textContent =
            value;
    }
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageName) {

    const target =
        document.getElementById(
            "page-" + pageName
        );

    if (!target) {
        return;
    }


    $$(".page").forEach(page => {
        page.classList.remove("active");
    });


    target.classList.add("active");


    state.currentPage =
        pageName;


    $$(".nav-item").forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (pageName === "tasks") {
        loadTasks();
    }

    if (pageName === "history") {
        loadHistory();
    }

    if (pageName === "bonus") {
        loadBonusState();
    }

    if (pageName === "admin") {
        loadAdmin();
    }

}


/* =========================================================
   NAVIGATION EVENTS
========================================================= */

function setupNavigation() {

    $$("[data-page]").forEach(
        element => {

            element.addEventListener(
                "click",
                () => {

                    const page =
                        element.dataset.page;

                    if (page) {
                        showPage(page);
                    }

                }
            );

        }
    );


    const supportButton =
        $("#top-support-button");

    if (supportButton) {

        supportButton.addEventListener(
            "click",
            () => showPage("support")
        );

    }


    const supportOpen =
        $("#open-support");

    if (supportOpen) {

        supportOpen.addEventListener(
            "click",
            openSupport
        );

    }

}


/* =========================================================
   TASKS
========================================================= */

async function loadTasks() {

    const container =
        $("#tasks-list");

    if (!container) {
        return;
    }


    if (!isApiConfigured()) {

        container.innerHTML = `
            <div class="error-card">
                API ще не підключено.
                У js/app.js потрібно вказати
                адресу твого публічного API.
            </div>
        `;

        return;
    }


    container.innerHTML = `
        <div class="loading-card">
            Завантаження завдань...
        </div>
    `;


    try {

        const data =
            await api("/api/tasks");


        state.tasks =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(data.tasks)
                        ? data.tasks
                        : []
                );


        renderTasks();

    } catch (error) {

        console.error(
            "Tasks error:",
            error
        );

        container.innerHTML = `
            <div class="error-card">
                Не вдалося завантажити завдання.
                Спробуй ще раз пізніше.
            </div>
        `;

    }

}


function renderTasks() {

    const container =
        $("#tasks-list");

    if (!container) {
        return;
    }


    if (!state.tasks.length) {

        container.innerHTML = `
            <div class="empty-small">
                Зараз активних завдань немає.
            </div>
        `;

        return;
    }


    container.innerHTML =
        state.tasks.map(
            task => {

                const id =
                    task.id;

                const title =
                    escapeHtml(
                        task.title ||
                        "Завдання"
                    );

                const description =
                    escapeHtml(
                        task.description ||
                        "Виконай умову завдання."
                    );

                const reward =
                    formatMoney(
                        task.reward || 0
                    );

                const completed =
                    Boolean(
                        task.completed ||
                        task.is_completed
                    );


                return `
                    <div
                        class="task-card"
                        data-task-id="${id}">

                        <div class="task-top">

                            <div class="task-icon">
                                📋
                            </div>

                            <div class="task-info">

                                <div class="task-title">
                                    ${title}
                                </div>

                                <div class="task-description">
                                    ${description}
                                </div>

                            </div>

                            <div class="task-reward">
                                +${reward} ₴
                            </div>

                        </div>


                        <div class="task-bottom">

                            ${
                                completed
                                ?
                                `
                                <button
                                    class="task-action done"
                                    type="button"
                                    disabled>
                                    ✓ Виконано
                                </button>
                                `
                                :
                                `
                                <button
                                    class="task-action"
                                    type="button"
                                    onclick="completeTask(${Number(id)})">
                                    Виконати завдання
                                </button>
                                `
                            }

                        </div>

                    </div>
                `;

            }
        ).join("");

}


/* =========================================================
   COMPLETE TASK
========================================================= */

async function completeTask(taskId) {

    const task =
        state.tasks.find(
            item =>
                Number(item.id) ===
                Number(taskId)
        );


    if (!task) {
        return;
    }


    if (task.url) {

        try {

            if (tg) {

                tg.openTelegramLink(
                    task.url
                );

            } else {

                window.open(
                    task.url,
                    "_blank"
                );

            }

        } catch (e) {

            window.open(
                task.url,
                "_blank"
            );

        }

    }


    if (!isApiConfigured()) {
        return;
    }


    try {

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    900
                )
        );


        const result =
            await api(
                `/api/tasks/${Number(taskId)}/complete`,
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );


        if (result.user) {
            renderUser(result.user);
        }


        showTelegramAlert(
            result.message ||
            "Завдання виконано. Винагороду зараховано."
        );


        await loadTasks();

    } catch (error) {

        console.error(
            "Complete task:",
            error
        );

        showTelegramAlert(
            error.message ||
            "Не вдалося підтвердити завдання."
        );

    }

}


/* =========================================================
   SPONSORS
========================================================= */

async function loadSponsors() {

    const container =
        $("#home-sponsors");

    if (!container) {
        return;
    }


    if (!isApiConfigured()) {

        container.innerHTML = `
            <div class="empty-small">
                Спонсори з'являться після підключення API.
            </div>
        `;

        return;
    }


    try {

        const data =
            await api(
                "/api/sponsors"
            );


        state.sponsors =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(data.sponsors)
                        ? data.sponsors
                        : []
                );


        renderSponsors();

    } catch (error) {

        console.error(
            "Sponsors:",
            error
        );

        container.innerHTML = `
            <div class="empty-small">
                Не вдалося завантажити спонсорів.
            </div>
        `;

    }

}


function renderSponsors() {

    const container =
        $("#home-sponsors");

    const block =
        $("#home-sponsors-block");


    if (!container) {
        return;
    }


    if (!state.sponsors.length) {

        if (block) {
            block.style.display =
                "none";
        }

        return;
    }


    if (block) {
        block.style.display =
            "block";
    }


    container.innerHTML =
        state.sponsors.map(
            sponsor => {

                const id =
                    Number(sponsor.id);

                const title =
                    escapeHtml(
                        sponsor.title ||
                        sponsor.name ||
                        "Канал"
                    );

                const username =
                    escapeHtml(
                        sponsor.username ||
                        ""
                    );

                const url =
                    sponsor.url ||
                    sponsor.invite_link ||
                    "#";


                return `
                    <div class="sponsor-card">

                        <div class="sponsor-icon">
                            ◉
                        </div>

                        <div class="sponsor-info">

                            <div class="sponsor-title">
                                ${title}
                            </div>

                            <div class="sponsor-username">
                                ${username}
                            </div>

                        </div>

                        <button
                            class="sponsor-button"
                            type="button"
                            onclick="openSponsor('${escapeAttribute(url)}')">
                            Відкрити
                        </button>

                    </div>
                `;

            }
        ).join("");

}


function escapeAttribute(value) {

    return String(value || "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}


function openSponsor(url) {

    if (!url || url === "#") {
        return;
    }


    try {

        if (
            tg &&
            url.startsWith(
                "https://t.me/"
            )
        ) {

            tg.openTelegramLink(url);

            return;
        }


        window.open(
            url,
            "_blank"
        );

    } catch (e) {

        window.open(
            url,
            "_blank"
        );

    }

}


/* =========================================================
   REFERRAL
========================================================= */

function setupReferral() {

    const button =
        $("#copy-referral");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            const link =
                state.user &&
                (
                    state.user.referral_link ||
                    state.user.ref_link
                );


            if (!link) {

                showTelegramAlert(
                    "Реферальне посилання ще не готове."
                );

                return;
            }


            try {

                await navigator.clipboard.writeText(
                    link
                );

                showTelegramAlert(
                    "Реферальне посилання скопійовано."
                );

            } catch (error) {

                showTelegramAlert(
                    link
                );

            }

        }
    );

}


/* =========================================================
   BONUS
========================================================= */

function loadBonusState() {

    if (!state.user) {
        return;
    }


    const available =
        state.user.daily_bonus_available;


    const button =
        $("#claim-bonus");

    const status =
        $("#bonus-status");


    if (
        available === false
    ) {

        if (button) {
            button.disabled = true;
        }

        if (status) {
            status.textContent =
                "Бонус ще не доступний";
        }

    } else {

        if (button) {
            button.disabled = false;
        }

        if (status) {
            status.textContent =
                "Бонус доступний";
        }

    }

}


async function claimBonus() {

    if (!isApiConfigured()) {

        showTelegramAlert(
            "API ще не підключено."
        );

        return;
    }


    const button =
        $("#claim-bonus");

    if (button) {
        button.disabled = true;
    }


    try {

        const result =
            await api(
                "/api/bonus/daily",
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );


        if (result.user) {
            renderUser(result.user);
        }


        if (result.balance !== undefined) {

            setText(
                "#balance-value",
                formatMoney(
                    result.balance
                )
            );

        }


        setText(
            "#bonus-status",
            "Бонус отримано ✓"
        );


        showTelegramAlert(
            result.message ||
            "Щоденний бонус отримано!"
        );

    } catch (error) {

        console.error(
            "Bonus:",
            error
        );

        showTelegramAlert(
            error.message ||
            "Не вдалося отримати бонус."
        );

        if (button) {
            button.disabled = false;
        }

    }

}


/* =========================================================
   HISTORY
========================================================= */

async function loadHistory() {

    const container =
        $("#history-list");

    if (!container) {
        return;
    }


    if (!isApiConfigured()) {

        container.innerHTML = `
            <div class="error-card">
                API ще не підключено.
            </div>
        `;

        return;
    }


    container.innerHTML = `
        <div class="loading-card">
            Завантаження історії...
        </div>
    `;


    try {

        const data =
            await api(
                "/api/history"
            );


        state.history =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(data.history)
                        ? data.history
                        : []
                );


        renderHistory();

    } catch (error) {

        console.error(
            "History:",
            error
        );

        container.innerHTML = `
            <div class="error-card">
                Не вдалося завантажити історію.
            </div>
        `;

    }

}


function renderHistory() {

    const container =
        $("#history-list");

    if (!container) {
        return;
    }


    if (!state.history.length) {

        container.innerHTML = `
            <div class="empty-small">
                Історія поки порожня.
            </div>
        `;

        return;
    }


    container.innerHTML =
        state.history.map(
            item => {

                const amount =
                    Number(
                        item.amount || 0
                    );

                const positive =
                    amount >= 0;

                const sign =
                    positive
                        ? "+"
                        : "";


                const title =
                    escapeHtml(
                        item.title ||
                        item.description ||
                        item.type ||
                        "Операція"
                    );


                return `
                    <div class="history-item">

                        <div class="history-icon">
                            ${positive ? "↑" : "↓"}
                        </div>

                        <div class="history-info">

                            <div class="history-title">
                                ${title}
                            </div>

                            <div class="history-date">
                                ${formatDate(
                                    item.created_at ||
                                    item.date
                                )}
                            </div>

                        </div>

                        <div
                            class="history-amount"
                            style="color:${positive ? "" : "var(--danger)"}">

                            ${sign}${formatMoney(amount)} ₴

                        </div>

                    </div>
                `;

            }
        ).join("");

}


/* =========================================================
   SUPPORT
========================================================= */

function openSupport() {

    if (tg) {

        try {

            tg.showPopup({
                title: "Підтримка",
                message:
                    "Напиши своє питання адміністратору в Telegram.",
                buttons: [
                    {
                        id: "support",
                        type: "default",
                        text: "Написати"
                    },
                    {
                        type: "cancel"
                    }
                ]
            }, buttonId => {

                if (buttonId === "support") {

                    const support =
                        state.user &&
                        state.user.support_username
                            ? state.user.support_username
                            : "";

                    if (support) {

                        const url =
                            support.startsWith("@")
                                ? "https://t.me/" +
                                  support.substring(1)
                                : support;

                        tg.openTelegramLink(url);

                    } else {

                        showTelegramAlert(
                            "Адресу підтримки ще не налаштовано."
                        );

                    }

                }

            });

            return;

        } catch (e) {}

    }


    showTelegramAlert(
        "Напиши адміністратору через Telegram."
    );

}


/* =========================================================
   ADMIN
========================================================= */

function showAdminEntry() {

    if (!state.admin) {
        return;
    }


    const profilePage =
        $("#page-profile");

    if (!profilePage) {
        return;
    }


    if (
        document.getElementById(
            "admin-menu-button"
        )
    ) {
        return;
    }


    const button =
        document.createElement("button");


    button.id =
        "admin-menu-button";

    button.className =
        "menu-row";

    button.type =
        "button";

    button.innerHTML = `
        <span class="menu-row-icon">
            🔐
        </span>

        <span class="menu-row-title">
            Адмін-панель
        </span>

        <span class="menu-row-arrow">
            ›
        </span>
    `;


    button.addEventListener(
        "click",
        () => showPage("admin")
    );


    profilePage.appendChild(
        button
    );

}


async function loadAdmin() {

    if (!state.admin) {
        return;
    }


    if (!isApiConfigured()) {
        return;
    }


    try {

        const data =
            await api(
                "/api/admin/stats"
            );


        setText(
            "#admin-users",
            data.users || 0
        );

        setText(
            "#admin-balance",
            formatMoney(
                data.balance || 0
            )
        );

        setText(
            "#admin-tasks",
            data.tasks || 0
        );

        setText(
            "#admin-sponsors",
            data.sponsors || 0
        );


        await loadAdminItems();

    } catch (error) {

        console.error(
            "Admin:",
            error
        );

    }

}


async function loadAdminItems() {

    const container =
        $("#admin-items");

    if (!container) {
        return;
    }


    container.innerHTML =
        `
        <h3>
            Керування
        </h3>

        <div class="loading-card">
            Завантаження...
        </div>
        `;


    try {

        const tasksData =
            await api(
                "/api/admin/tasks"
            );


        const sponsorsData =
            await api(
                "/api/admin/sponsors"
            );


        const tasks =
            Array.isArray(tasksData)
                ? tasksData
                : (
                    tasksData.tasks || []
                );


        const sponsors =
            Array.isArray(sponsorsData)
                ? sponsorsData
                : (
                    sponsorsData.sponsors || []
                );


        let html =
            "<h3>Завдання</h3>";


        if (!tasks.length) {

            html += `
                <div class="empty-small">
                    Завдань немає.
                </div>
            `;

        } else {

            html += tasks.map(
                task => `
                    <div class="history-item">

                        <div class="history-info">

                            <div class="history-title">
                                ${escapeHtml(
                                    task.title
                                )}
                            </div>

                            <div class="history-date">
                                ${task.active ? "Активне" : "Вимкнене"}
                            </div>

                        </div>

                        <button
                            class="sponsor-button"
                            onclick="toggleAdminTask(${Number(task.id)})"
                            type="button">
                            ${task.active ? "Вимкнути" : "Увімкнути"}
                        </button>

                    </div>
                `
            ).join("");

        }


        html +=
            "<h3 style='margin-top:20px'>Спонсори</h3>";


        if (!sponsors.length) {

            html += `
                <div class="empty-small">
                    Спонсорів немає.
                </div>
            `;

        } else {

            html += sponsors.map(
                sponsor => `
                    <div class="history-item">

                        <div class="history-info">

                            <div class="history-title">
                                ${escapeHtml(
                                    sponsor.title ||
                                    sponsor.name ||
                                    "Спонсор"
                                )}
                            </div>

                            <div class="history-date">
                                ${sponsor.active ? "Активний" : "Вимкнений"}
                            </div>

                        </div>

                        <button
                            class="sponsor-button"
                            onclick="toggleAdminSponsor(${Number(sponsor.id)})"
                            type="button">
                            ${sponsor.active ? "Вимкнути" : "Увімкнути"}
                        </button>

                    </div>
                `
            ).join("");

        }


        container.innerHTML =
            html;


    } catch (error) {

        console.error(
            "Admin items:",
            error
        );

        container.innerHTML = `
            <div class="error-card">
                Не вдалося завантажити дані адмін-панелі.
            </div>
        `;

    }

}


/* =========================================================
   ADMIN ADD TASK
========================================================= */

async function addAdminTask() {

    const title =
        $("#admin-task-title")?.value.trim();

    const url =
        $("#admin-task-url")?.value.trim();

    const reward =
        Number(
            $("#admin-task-reward")?.value
        );


    if (!title) {

        showTelegramAlert(
            "Вкажи назву завдання."
        );

        return;
    }


    if (!url) {

        showTelegramAlert(
            "Вкажи посилання."
        );

        return;
    }


    if (
        !Number.isFinite(reward) ||
        reward <= 0
    ) {

        showTelegramAlert(
            "Вкажи правильну винагороду."
        );

        return;
    }


    try {

        await api(
            "/api/admin/tasks",
            {
                method: "POST",
                body: JSON.stringify({
                    title,
                    url,
                    reward
                })
            }
        );


        showTelegramAlert(
            "Завдання додано."
        );


        $("#admin-task-title").value = "";
        $("#admin-task-url").value = "";
        $("#admin-task-reward").value = "";


        await loadAdmin();

    } catch (error) {

        showTelegramAlert(
            error.message ||
            "Не вдалося додати завдання."
        );

    }

}


/* =========================================================
   ADMIN ADD SPONSOR
========================================================= */

async function addAdminSponsor() {

    const title =
        $("#admin-sponsor-title")?.value.trim();

    const username =
        $("#admin-sponsor-username")?.value.trim();

    const url =
        $("#admin-sponsor-url")?.value.trim();


    if (!title || !url) {

        showTelegramAlert(
            "Заповни назву та посилання."
        );

        return;
    }


    try {

        await api(
            "/api/admin/sponsors",
            {
                method: "POST",
                body: JSON.stringify({
                    title,
                    username,
                    url
                })
            }
        );


        showTelegramAlert(
            "Спонсора додано."
        );


        $("#admin-sponsor-title").value = "";
        $("#admin-sponsor-username").value = "";
        $("#admin-sponsor-url").value = "";


        await loadAdmin();
        await loadSponsors();

    } catch (error) {

        showTelegramAlert(
            error.message ||
            "Не вдалося додати спонсора."
        );

    }

}


/* =========================================================
   ADMIN TOGGLES
========================================================= */

async function toggleAdminTask(id) {

    try {

        await api(
            `/api/admin/tasks/${Number(id)}/toggle`,
            {
                method: "POST",
                body: JSON.stringify({})
            }
        );


        await loadAdmin();

    } catch (error) {

        showTelegramAlert(
            error.message ||
            "Помилка."
        );

    }

}


async function toggleAdminSponsor(id) {

    try {

        await api(
            `/api/admin/sponsors/${Number(id)}/toggle`,
            {
                method: "POST",
                body: JSON.stringify({})
            }
        );


        await loadAdmin();

        await loadSponsors();

    } catch (error) {

        showTelegramAlert(
            error.message ||
            "Помилка."
        );

    }

}


/* =========================================================
   LANGUAGE
========================================================= */

function setupLanguage() {

    const select =
        $("#language-select");

    if (!select) {
        return;
    }


    const saved =
        localStorage.getItem(
            "nightcapital_language"
        );


    if (
        saved === "uk" ||
        saved === "ru"
    ) {

        state.language =
            saved;

        select.value =
            saved;

    }


    select.addEventListener(
        "change",
        () => {

            state.language =
                select.value;

            localStorage.setItem(
                "nightcapital_language",
                state.language
            );


            /*
                Повна локалізація може бути
                підключена пізніше.
                Основний інтерфейс зараз
                залишається українським.
            */

        }
    );

}


/* =========================================================
   INIT USER
========================================================= */

async function loadUser() {

    if (!isApiConfigured()) {

        hideLoader();

        return;
    }


    if (!getInitData()) {

        console.warn(
            "Mini App відкрито без Telegram initData."
        );

        hideLoader();

        return;
    }


    try {

        const data =
            await api(
                "/api/me"
            );


        const user =
            data.user ||
            data;


        renderUser(user);


    } catch (error) {

        console.error(
            "User loading:",
            error
        );

    }

}


/* =========================================================
   INITIAL LOAD
========================================================= */

async function initialize() {

    setupNavigation();

    setupReferral();

    setupLanguage();


    const bonusButton =
        $("#claim-bonus");

    if (bonusButton) {

        bonusButton.addEventListener(
            "click",
            claimBonus
        );

    }


    const addTaskButton =
        $("#admin-add-task");

    if (addTaskButton) {

        addTaskButton.addEventListener(
            "click",
            addAdminTask
        );

    }


    const addSponsorButton =
        $("#admin-add-sponsor");

    if (addSponsorButton) {

        addSponsorButton.addEventListener(
            "click",
            addAdminSponsor
        );

    }


    /*
        Не блокуємо весь Mini App,
        якщо API тимчасово недоступний.
    */

    await loadUser();

    await loadSponsors();


    /*
        Якщо API довго не відповідає,
        loader все одно зникне.
    */

    setTimeout(
        hideLoader,
        800
    );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.completeTask =
    completeTask;

window.openSponsor =
    openSponsor;

window.toggleAdminTask =
    toggleAdminTask;

window.toggleAdminSponsor =
    toggleAdminSponsor;
