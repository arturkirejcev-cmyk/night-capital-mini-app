"use strict";

/*
=========================================================
 NIGHTBORN FRONTEND
=========================================================

 Цей файл працює як frontend Mini App.

 Якщо API розміщений на іншому домені:
 const API_BASE = "https://твій-api-домен";

 Якщо frontend і backend знаходяться на одному домені:
 const API_BASE = "";

=========================================================
*/

const API_BASE = "";


/* =====================================================
   TELEGRAM
===================================================== */

const tg = window.Telegram?.WebApp || null;

try {
    tg?.ready();
    tg?.expand();

    tg?.setHeaderColor?.("#030711");
    tg?.setBackgroundColor?.("#030711");
} catch (error) {
    console.warn("Telegram WebApp:", error);
}

const telegramUser = tg?.initDataUnsafe?.user || null;
const initData = tg?.initData || "";


/* =====================================================
   STATE
===================================================== */

const state = {
    screen: "home",

    user: null,

    sponsors: [],

    sponsorPage: 0,

    tasks: [],

    history: [],

    bonus: null,

    admin: false,

    initialized: false
};


/* =====================================================
   DOM
===================================================== */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));


/* =====================================================
   HELPERS
===================================================== */

function haptic(type = "light") {
    try {
        if (!tg?.HapticFeedback) return;

        if (type === "success") {
            tg.HapticFeedback.notificationOccurred("success");
        } else if (type === "error") {
            tg.HapticFeedback.notificationOccurred("error");
        } else {
            tg.HapticFeedback.impactOccurred("light");
        }
    } catch (_) {}
}


function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
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


function money(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0.00";
    }

    return number.toFixed(2);
}


function getName(user) {
    if (!user) {
        return "Користувач";
    }

    const first =
        user.first_name ||
        user.firstName ||
        "";

    const last =
        user.last_name ||
        user.lastName ||
        "";

    const full =
        `${first} ${last}`.trim();

    return (
        user.name ||
        user.full_name ||
        full ||
        user.username ||
        "Користувач"
    );
}


function getUsername(user) {
    if (!user) {
        return "@username";
    }

    const username =
        user.username ||
        user.user_name ||
        "";

    if (!username) {
        return "Без username";
    }

    return `@${String(username).replace(/^@/, "")}`;
}


function getUserId(user) {
    if (!user) {
        return "—";
    }

    return (
        user.id ||
        user.telegram_id ||
        user.user_id ||
        "—"
    );
}


function firstLetter(name) {
    if (!name) return "N";

    return String(name)
        .trim()
        .charAt(0)
        .toUpperCase() || "N";
}


/* =====================================================
   API
===================================================== */

function apiUrl(path) {
    if (!API_BASE) {
        return path;
    }

    return (
        API_BASE.replace(/\/$/, "") +
        "/" +
        path.replace(/^\//, "")
    );
}


async function api(path, options = {}) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (initData) {
        headers["X-Telegram-Init-Data"] = initData;
    }

    const response = await fetch(
        apiUrl(path),
        {
            ...options,
            headers
        }
    );

    const text = await response.text();

    let data = null;

    try {
        data = text
            ? JSON.parse(text)
            : null;
    } catch (_) {
        data = {
            raw: text
        };
    }

    if (!response.ok) {
        const error = new Error(
            data?.detail ||
            data?.error ||
            `HTTP ${response.status}`
        );

        error.status = response.status;

        throw error;
    }

    return data;
}


function apiErrorMessage(error) {

    if (!error) {
        return "Не вдалося виконати дію";
    }

    if (
        error.name === "TypeError" ||
        String(error.message || "").includes("fetch")
    ) {
        return "Сервер недоступний";
    }

    if (error.status === 404) {
        return "Функція ще не підключена на сервері";
    }

    if (error.status === 401) {
        return "Потрібна авторизація Telegram";
    }

    if (error.status === 403) {
        return "Недостатньо прав";
    }

    return error.message ||
        "Не вдалося виконати дію";
}


/* =====================================================
   LOADER
===================================================== */

function startLoader() {

    const loader = $("#loader");
    const app = $("#app");
    const status = $("#loaderStatus");
    const progress = $("#loaderProgress");

    if (!loader || !app) {
        return;
    }

    const messages = [
        "Пробудження NightBorn",
        "Синхронізація нічного ядра",
        "Встановлення зв'язку",
        "Завантаження капіталу",
        "Підготовка системи",
        "Система готова"
    ];

    let index = 0;
    let value = 0;

    const started = Date.now();

    const interval = setInterval(() => {

        if (status) {
            status.textContent =
                messages[index % messages.length];
        }

        index++;

        value = Math.min(
            94,
            value + 4
        );

        if (progress) {
            progress.style.width =
                `${value}%`;
        }

    }, 500);


    window.finishNightBornLoader = function () {

        const minimum =
            2800 - (Date.now() - started);

        setTimeout(() => {

            clearInterval(interval);

            if (status) {
                status.textContent =
                    "Система готова";
            }

            if (progress) {
                progress.style.width = "100%";
            }

            setTimeout(() => {

                loader.classList.add("hide");
                app.classList.remove("hidden");

            }, 500);

        }, Math.max(0, minimum));
    };


    /* Захист від вічного loader */
    setTimeout(() => {

        if (!loader.classList.contains("hide")) {
            window.finishNightBornLoader();
        }

    }, 10 * 60 * 1000);
}


/* =====================================================
   NAVIGATION
===================================================== */

function navigate(screen) {

    const target =
        $(`#screen-${screen}`);

    if (!target) {
        return;
    }

    $$(".screen").forEach(item => {
        item.classList.remove("active");
    });

    target.classList.add("active");

    state.screen = screen;

    $$(".nav-button").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.screen === screen
        );

    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    haptic("light");

    if (screen === "tasks") {
        loadTasks();
    }

    if (screen === "history") {
        loadHistory();
    }

    if (screen === "bonus") {
        prepareBonus();
    }

    if (screen === "referrals") {
        prepareReferral();
    }
}


/* =====================================================
   USER
===================================================== */

function buildLocalUser() {

    if (telegramUser) {
        return {
            ...telegramUser
        };
    }

    return {
        first_name: "Користувач",
        username: "",
        id: ""
    };
}


function normalizeUser(data) {

    if (!data) {
        return buildLocalUser();
    }

    return (
        data.user ||
        data.profile ||
        data
    );
}


function applyUser(user) {

    state.user = {
        ...buildLocalUser(),
        ...user
    };

    const name = getName(state.user);
    const username = getUsername(state.user);
    const id = getUserId(state.user);

    const balanceValue =
        state.user.balance ??
        state.user.balance_uah ??
        state.user.amount ??
        0;

    const referralCount =
        state.user.referral_count ??
        state.user.referrals_count ??
        state.user.referrals ??
        0;

    $("#userName").textContent = name;
    $("#userUsername").textContent = username;
    $("#userId").textContent = id;

    $("#profileName").textContent = name;
    $("#profileUsername").textContent = username;

    $("#homeAvatar").textContent =
        firstLetter(name);

    $("#profileAvatar").textContent =
        firstLetter(name);

    $("#balance").textContent =
        money(balanceValue);

    $("#availableBalance").textContent =
        `${money(balanceValue)} ₴`;

    $("#profileBalance").textContent =
        `${money(balanceValue)} ₴`;

    $("#referralCount").textContent =
        referralCount;

    $("#profileReferrals").textContent =
        referralCount;

    $("#referralEarned").textContent =
        `${money(
            state.user.referral_earned ||
            state.user.referrals_earned ||
            0
        )} ₴`;

    prepareReferral();
}


/* =====================================================
   LOAD USER
===================================================== */

async function loadUser() {

    const localUser =
        buildLocalUser();

    applyUser(localUser);

    try {

        const data =
            await api("/api/me");

        const user =
            normalizeUser(data);

        applyUser(user);

    } catch (error) {

        /*
        Якщо backend /api/me ще не готовий,
        Telegram-користувач все одно залишається
        доступним у frontend.
        */

        console.warn(
            "Не вдалося завантажити /api/me:",
            error
        );
    }
}


/* =====================================================
   REFERRAL
===================================================== */

function getBotUsername() {

    const fromUser =
        state.user?.bot_username;

    if (fromUser) {
        return String(fromUser)
            .replace(/^@/, "");
    }

    const fromTelegram =
        tg?.initDataUnsafe?.bot_username;

    if (fromTelegram) {
        return String(fromTelegram)
            .replace(/^@/, "");
    }

    /*
    Якщо backend поверне username бота —
    використовується він.

    Якщо ні — пробуємо Telegram Mini App
    через поточну URL.
    */

    return "";
}


function buildReferralLink() {

    const userId =
        getUserId(state.user);

    const explicit =
        state.user?.referral_link ||
        state.user?.ref_link ||
        state.user?.invite_link;

    if (explicit) {
        return String(explicit);
    }

    const botUsername =
        getBotUsername();

    if (botUsername && userId) {

        return (
            `https://t.me/${botUsername}?start=ref_${userId}`
        );
    }

    /*
    Якщо bot username ще не переданий,
    використовуємо URL Mini App як запасний
    варіант, щоб поле ніколи не залишалось
    порожнім.
    */

    if (userId) {

        const current =
            window.location.href
                .split("?")[0];

        return (
            `${current}?ref=${encodeURIComponent(userId)}`
        );
    }

    return "";
}


function prepareReferral() {

    const input =
        $("#referralLink");

    if (!input) return;

    const link =
        buildReferralLink();

    input.value = link;

    if (!link) {
        input.placeholder =
            "Посилання буде сформовано після авторизації";
    }
}


/* =====================================================
   COPY REFERRAL
===================================================== */

async function copyReferral() {

    const input =
        $("#referralLink");

    const link =
        input?.value ||
        buildReferralLink();

    if (!link) {

        showToast(
            "Не вдалося сформувати реферальне посилання"
        );

        haptic("error");

        return;
    }


    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                link
            );

        } else {

            const temp =
                document.createElement("textarea");

            temp.value = link;

            temp.style.position = "fixed";
            temp.style.opacity = "0";

            document.body.appendChild(temp);

            temp.focus();
            temp.select();

            document.execCommand("copy");

            temp.remove();
        }

        showToast(
            "Реферальне посилання скопійовано"
        );

        haptic("success");

    } catch (error) {

        showToast(
            "Не вдалося скопіювати посилання"
        );

        haptic("error");
    }
}


/* =====================================================
   SPONSORS
===================================================== */

function normalizeSponsors(data) {

    if (Array.isArray(data)) {
        return data;
    }

    return (
        data?.sponsors ||
        data?.channels ||
        data?.items ||
        []
    );
}


async function loadSponsors() {

    const block =
        $("#sponsorsHomeBlock");

    if (!block) return;

    try {

        const data =
            await api("/api/sponsors");

        state.sponsors =
            normalizeSponsors(data);

        renderSponsors();

    } catch (error) {

        console.warn(
            "Sponsors:",
            error
        );

        state.sponsors = [];

        renderSponsors();
    }
}


function renderSponsors() {

    const block =
        $("#sponsorsHomeBlock");

    const list =
        $("#sponsorsList");

    const counter =
        $("#sponsorCounter");

    if (!block || !list) return;

    const sponsors =
        state.sponsors;

    if (!sponsors.length) {

        block.classList.add("hidden");

        return;
    }

    block.classList.remove("hidden");

    const start =
        state.sponsorPage * 4;

    const current =
        sponsors.slice(
            start,
            start + 4
        );

    list.innerHTML =
        current.map((sponsor, index) => {

            const name =
                sponsor.title ||
                sponsor.name ||
                sponsor.channel_name ||
                "Канал";

            const username =
                sponsor.username ||
                sponsor.channel ||
                "";

            const url =
                sponsor.url ||
                sponsor.link ||
                sponsor.invite_link ||
                (
                    username
                        ? `https://t.me/${String(username).replace(/^@/, "")}`
                        : "#"
                );

            return `
                <div class="sponsor-item">

                    <div class="sponsor-logo">
                        ${escapeHtml(
                            String(name).charAt(0).toUpperCase()
                        )}
                    </div>

                    <div class="sponsor-info">
                        <strong>${escapeHtml(name)}</strong>
                        <span>
                            ${escapeHtml(
                                username
                                    ? `@${String(username).replace(/^@/, "")}`
                                    : "Telegram канал"
                            )}
                        </span>
                    </div>

                    <button
                        class="sponsor-open"
                        type="button"
                        data-url="${escapeHtml(url)}"
                    >
                        Відкрити
                    </button>

                </div>
            `;

        }).join("");

    if (counter) {

        counter.textContent =
            `${Math.min(
                start + current.length,
                sponsors.length
            )}/${sponsors.length}`;
    }
}


/* =====================================================
   CHECK SPONSORS
===================================================== */

async function checkSponsors() {

    const button =
        $("#checkSponsorsBtn");

    if (button) {
        button.disabled = true;
        button.textContent =
            "Перевірка…";
    }

    try {

        const data =
            await api(
                "/api/sponsor/check",
                {
                    method: "POST",
                    body: JSON.stringify({
                        init_data: initData
                    })
                }
            );

        const ok =
            data?.ok ??
            data?.success ??
            data?.subscribed ??
            data?.all_subscribed;

        if (ok) {

            showToast(
                "Підписка на всі канали підтверджена"
            );

            haptic("success");

        } else {

            showToast(
                "Потрібно підписатися на всі канали"
            );

            haptic("error");
        }

    } catch (error) {

        showToast(
            apiErrorMessage(error)
        );

        haptic("error");

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "Перевірити підписку";
        }
    }
}


/* =====================================================
   TASKS
===================================================== */

function normalizeTasks(data) {

    if (Array.isArray(data)) {
        return data;
    }

    return (
        data?.tasks ||
        data?.items ||
        []
    );
}


async function loadTasks() {

    const container =
        $("#tasksList");

    if (!container) return;

    container.innerHTML =
        `<div class="loading-card">Завантаження завдань…</div>`;

    try {

        const data =
            await api("/api/tasks");

        state.tasks =
            normalizeTasks(data);

        renderTasks();

    } catch (error) {

        console.warn(
            "Tasks:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">
                Зараз немає доступних завдань.
            </div>
        `;
    }
}


function renderTasks() {

    const container =
        $("#tasksList");

    if (!container) return;

    if (!state.tasks.length) {

        container.innerHTML = `
            <div class="empty-state">
                Зараз немає доступних завдань.
            </div>
        `;

        return;
    }

    container.innerHTML =
        state.tasks.map((task, index) => {

            const id =
                task.id ??
                task.task_id ??
                index;

            const title =
                task.title ||
                task.name ||
                "Завдання";

            const description =
                task.description ||
                task.text ||
                "Виконай завдання";

            const reward =
                task.reward ??
                task.amount ??
                task.reward_uah ??
                0;

            return `
                <div class="task-card">

                    <div class="task-top">

                        <div class="task-icon">
                            ▣
                        </div>

                        <div class="task-info">
                            <strong>
                                ${escapeHtml(title)}
                            </strong>

                            <span>
                                ${escapeHtml(description)}
                            </span>
                        </div>

                        <div class="task-reward">
                            +${money(reward)} ₴
                        </div>

                    </div>

                    <div class="task-actions">

                        <button
                            type="button"
                            data-task-open="${escapeHtml(id)}"
                        >
                            Виконати
                        </button>

                        <button
                            class="primary"
                            type="button"
                            data-task-check="${escapeHtml(id)}"
                        >
                            Перевірити
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


function findTask(id) {

    return state.tasks.find(task =>
        String(
            task.id ??
            task.task_id
        ) === String(id)
    );
}


function openTask(id) {

    const task =
        findTask(id);

    if (!task) {
        showToast("Завдання не знайдено");
        return;
    }

    const url =
        task.url ||
        task.link ||
        task.telegram_url ||
        task.channel_url;

    if (url) {

        try {
            tg?.openTelegramLink?.(url);
        } catch (_) {
            window.open(url, "_blank");
        }

        showToast(
            "Виконай завдання, після цього перевір його"
        );

        haptic("light");

    } else {

        showToast(
            "Посилання завдання відсутнє"
        );

        haptic("error");
    }
}


async function checkTask(id) {

    try {

        const data =
            await api(
                `/api/tasks/${encodeURIComponent(id)}/check`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        task_id: id,
                        init_data: initData
                    })
                }
            );

        if (
            data?.success ||
            data?.ok ||
            data?.completed
        ) {

            showToast(
                "Завдання виконано"
            );

            haptic("success");

            await loadUser();
            await loadTasks();

        } else {

            showToast(
                data?.message ||
                "Завдання ще не виконано"
            );

            haptic("error");
        }

    } catch (error) {

        showToast(
            apiErrorMessage(error)
        );

        haptic("error");
    }
}


/* =====================================================
   BONUS
===================================================== */

async function prepareBonus() {

    const description =
        $("#bonusDescription");

    const value =
        $("#bonusValue");

    try {

        const data =
            await api("/api/bonus/daily");

        state.bonus =
            data?.bonus ||
            data;

        const amount =
            state.bonus?.amount ??
            state.bonus?.reward ??
            data?.amount ??
            0;

        if (value) {
            value.textContent =
                `+${money(amount)} ₴`;
        }

        if (description) {

            if (
                state.bonus?.available === false ||
                data?.available === false
            ) {

                description.textContent =
                    "Сьогодні бонус уже отримано.";

            } else {

                description.textContent =
                    "Твій щоденний бонус доступний.";
            }
        }

    } catch (error) {

        /*
        Не пишемо «недоступно».

        Якщо backend не має endpoint,
        кнопка все одно залишається нормальною,
        а натискання покаже конкретний стан.
        */

        if (description) {

            description.textContent =
                "Натисни кнопку, щоб отримати щоденну винагороду.";
        }

        if (value) {
            value.textContent =
                "+0.00 ₴";
        }
    }
}


async function claimBonus() {

    const button =
        $("#claimBonusBtn");

    if (button) {
        button.disabled = true;
        button.textContent =
            "Отримання…";
    }

    try {

        const data =
            await api(
                "/api/bonus/daily",
                {
                    method: "POST",
                    body: JSON.stringify({
                        init_data: initData
                    })
                }
            );

        if (
            data?.success ||
            data?.ok ||
            data?.claimed
        ) {

            const amount =
                data?.amount ??
                data?.reward ??
                data?.bonus ??
                0;

            showToast(
                `Бонус отримано: +${money(amount)} ₴`
            );

            haptic("success");

            await loadUser();
            await prepareBonus();

        } else {

            showToast(
                data?.message ||
                "Сьогодні бонус уже отримано"
            );

            haptic("error");
        }

    } catch (error) {

        showToast(
            apiErrorMessage(error)
        );

        haptic("error");

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "Отримати бонус";
        }
    }
}


/* =====================================================
   HISTORY
===================================================== */

function normalizeHistory(data) {

    if (Array.isArray(data)) {
        return data;
    }

    return (
        data?.history ||
        data?.transactions ||
        data?.items ||
        []
    );
}


async function loadHistory() {

    const container =
        $("#historyList");

    if (!container) return;

    container.innerHTML =
        `<div class="loading-card">Завантаження історії…</div>`;

    try {

        const data =
            await api("/api/history");

        state.history =
            normalizeHistory(data);

        renderHistory();

    } catch (error) {

        container.innerHTML = `
            <div class="empty-state">
                Історія поки порожня.
            </div>
        `;
    }
}


function renderHistory() {

    const container =
        $("#historyList");

    if (!container) return;

    if (!state.history.length) {

        container.innerHTML = `
            <div class="empty-state">
                Історія поки порожня.
            </div>
        `;

        return;
    }

    container.innerHTML =
        state.history.map(item => {

            const title =
                item.title ||
                item.description ||
                item.type ||
                "Операція";

            const amount =
                Number(
                    item.amount ??
                    item.value ??
                    0
                );

            const date =
                item.created_at ||
                item.date ||
                item.timestamp ||
                "";

            return `
                <div class="history-card">

                    <div class="history-icon">
                        ${amount >= 0 ? "+" : "−"}
                    </div>

                    <div class="history-info">
                        <strong>
                            ${escapeHtml(title)}
                        </strong>

                        <span>
                            ${escapeHtml(
                                formatDate(date)
                            )}
                        </span>
                    </div>

                    <div class="history-amount">
                        ${amount >= 0 ? "+" : ""}
                        ${money(amount)} ₴
                    </div>

                </div>
            `;

        }).join("");
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

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
}


/* =====================================================
   SUPPORT
===================================================== */

function updateSupportCounter() {

    const textarea =
        $("#supportMessage");

    const counter =
        $("#supportCounter");

    if (!textarea || !counter) return;

    counter.textContent =
        `${textarea.value.length}/2000`;
}


async function sendSupport() {

    const textarea =
        $("#supportMessage");

    const button =
        $("#sendSupportBtn");

    const message =
        textarea?.value.trim() || "";

    if (!message) {

        showToast(
            "Напиши питання або проблему"
        );

        haptic("error");

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Надсилання…";
    }

    try {

        const data =
            await api(
                "/api/support",
                {
                    method: "POST",

                    body: JSON.stringify({
                        message,
                        text: message,
                        init_data: initData,
                        telegram_user: state.user
                    })
                }
            );

        if (
            data?.success ||
            data?.ok ||
            data?.sent
        ) {

            showToast(
                "Питання надіслано адміністратору"
            );

            textarea.value = "";

            updateSupportCounter();

            haptic("success");

        } else {

            throw new Error(
                data?.message ||
                "Сервер не підтвердив відправлення"
            );
        }

    } catch (error) {

        showToast(
            `Не вдалося надіслати: ${apiErrorMessage(error)}`
        );

        haptic("error");

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "Надіслати питання";
        }
    }
}


/* =====================================================
   ADMIN
===================================================== */

async function adminAction(action) {

    const output =
        $("#adminOutput");

    if (!output) return;

    output.textContent =
        "Завантаження…";

    try {

        const data =
            await api(
                `/api/admin/${encodeURIComponent(action)}`
            );

        output.textContent =
            JSON.stringify(
                data,
                null,
                2
            );

    } catch (error) {

        output.textContent =
            apiErrorMessage(error);

        showToast(
            apiErrorMessage(error)
        );
    }
}


/* =====================================================
   EVENT LISTENERS
===================================================== */

function setupEvents() {

    /*
    Навігація
    */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-screen]"
                );

            if (!button) return;

            const screen =
                button.dataset.screen;

            navigate(screen);
        }
    );


    /*
    Верхні налаштування
    */

    $("#settingsTopBtn")
        ?.addEventListener(
            "click",
            () => navigate("settings")
        );


    /*
    Підтримка
    */

    $("#supportSettingsBtn")
        ?.addEventListener(
            "click",
            () => navigate("support")
        );


    /*
    Копіювання
    */

    $("#copyReferralBtn")
        ?.addEventListener(
            "click",
            copyReferral
        );


    /*
    Спонсори
    */

    $("#checkSponsorsBtn")
        ?.addEventListener(
            "click",
            checkSponsors
        );


    /*
    Бонус
    */

    $("#claimBonusBtn")
        ?.addEventListener(
            "click",
            claimBonus
        );


    /*
    Підтримка
    */

    $("#sendSupportBtn")
        ?.addEventListener(
            "click",
            sendSupport
        );


    $("#supportMessage")
        ?.addEventListener(
            "input",
            updateSupportCounter
        );


    /*
    Завдання
    */

    document.addEventListener(
        "click",
        event => {

            const openButton =
                event.target.closest(
                    "[data-task-open]"
                );

            if (openButton) {

                openTask(
                    openButton.dataset.taskOpen
                );

                return;
            }


            const checkButton =
                event.target.closest(
                    "[data-task-check]"
                );

            if (checkButton) {

                checkTask(
                    checkButton.dataset.taskCheck
                );
            }
        }
    );


    /*
    Відкрити спонсора
    */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-url]"
                );

            if (!button) return;

            const url =
                button.dataset.url;

            if (!url || url === "#") {
                return;
            }

            try {
                tg?.openTelegramLink?.(url);
            } catch (_) {
                window.open(
                    url,
                    "_blank"
                );
            }
        }
    );


    /*
    Адмін
    */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-admin-action]"
                );

            if (!button) return;

            adminAction(
                button.dataset.adminAction
            );
        }
    );
}


/* =====================================================
   INITIALIZATION
===================================================== */

async function init() {

    startLoader();

    setupEvents();

    applyUser(
        buildLocalUser()
    );

    /*
    Основні дані запускаємо паралельно.
    Якщо один endpoint впаде —
    інші все одно продовжать працювати.
    */

    await Promise.allSettled([
        loadUser(),
        loadSponsors()
    ]);

    state.initialized = true;

    prepareReferral();

    if (
        typeof window.finishNightBornLoader ===
        "function"
    ) {
        window.finishNightBornLoader();
    }
}


/* =====================================================
   START
===================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}
