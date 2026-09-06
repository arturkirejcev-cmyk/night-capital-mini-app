"use strict";

/*
=========================================================
 NIGHTBORN FRONTEND
=========================================================

 ВАЖЛИВО:

 Вкажи тут адресу свого API.

 Наприклад:

 const API_BASE = "https://example.com";

 Якщо API знаходиться на тому ж домені,
 можна залишити:

 const API_BASE = "";

=========================================================
*/

const API_BASE = "";


/* ========================================================
   TELEGRAM
======================================================== */

const tg = window.Telegram?.WebApp || null;

if (tg) {
    try {
        tg.ready();
        tg.expand();

        if (tg.setHeaderColor) {
            tg.setHeaderColor("#030711");
        }

        if (tg.setBackgroundColor) {
            tg.setBackgroundColor("#030711");
        }
    } catch (error) {
        console.warn("Telegram WebApp:", error);
    }
}


const initData = tg?.initData || "";


/* ========================================================
   STATE
======================================================== */

const state = {
    screen: "home",

    language:
        localStorage.getItem("nightborn_language") || "uk",

    user: null,

    sponsors: [],

    sponsorPage: 0,

    tasks: [],

    history: [],

    loading: false,

    admin: false
};


/* ========================================================
   TRANSLATIONS
======================================================== */

const TEXT = {

    uk: {

        loading: [
            "Пробудження NightBorn",
            "Синхронізація нічного ядра",
            "Встановлення зв'язку",
            "Завантаження капіталу",
            "Підготовка системи",
            "Система готова"
        ],

        copySuccess:
            "Посилання скопійовано",

        copyError:
            "Не вдалося скопіювати посилання",

        noApi:
            "Сервер поки не підключений",

        loadingData:
            "Завантаження даних…",

        emptyTasks:
            "Зараз немає доступних завдань",

        emptyHistory:
            "Історія поки порожня",

        sponsorDone:
            "Підписка на всі канали підтверджена",

        sponsorNotDone:
            "Потрібно підписатися на всі канали",

        bonusSuccess:
            "Бонус успішно отримано",

        bonusAlready:
            "Сьогодні бонус уже отримано",

        supportEmpty:
            "Напиши повідомлення",

        supportSuccess:
            "Повідомлення надіслано адміністратору",

        supportError:
            "Не вдалося надіслати повідомлення",

        networkError:
            "Не вдалося отримати дані від сервера",

        taskOpened:
            "Виконай завдання, після цього перевір його",

        taskDone:
            "Завдання виконано",

        adminUnavailable:
            "Ця функція ще не підключена на сервері"

    },

    ru: {

        loading: [
            "Пробуждение NightBorn",
            "Синхронизация ночного ядра",
            "Установка связи",
            "Загрузка капитала",
            "Подготовка системы",
            "Система готова"
        ],

        copySuccess:
            "Ссылка скопирована",

        copyError:
            "Не удалось скопировать ссылку",

        noApi:
            "Сервер пока не подключен",

        loadingData:
            "Загрузка данных…",

        emptyTasks:
            "Сейчас нет доступных заданий",

        emptyHistory:
            "История пока пуста",

        sponsorDone:
            "Подписка на все каналы подтверждена",

        sponsorNotDone:
            "Нужно подписаться на все каналы",

        bonusSuccess:
            "Бонус успешно получен",

        bonusAlready:
            "Сегодня бонус уже получен",

        supportEmpty:
            "Напиши сообщение",

        supportSuccess:
            "Сообщение отправлено администратору",

        supportError:
            "Не удалось отправить сообщение",

        networkError:
            "Не удалось получить данные от сервера",

        taskOpened:
            "Выполни задание, после этого проверь его",

        taskDone:
            "Задание выполнено",

        adminUnavailable:
            "Эта функция пока не подключена на сервере"

    }

};


function t(key) {

    const lang =
        TEXT[state.language] || TEXT.uk;

    return lang[key] ?? TEXT.uk[key] ?? key;
}


/* ========================================================
   DOM
======================================================== */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));


/* ========================================================
   HELPERS
======================================================== */

function haptic(type = "light") {

    try {

        if (
            tg &&
            tg.HapticFeedback
        ) {

            if (type === "success") {

                tg.HapticFeedback.notificationOccurred(
                    "success"
                );

            } else if (type === "error") {

                tg.HapticFeedback.notificationOccurred(
                    "error"
                );

            } else {

                tg.HapticFeedback.impactOccurred(
                    "light"
                );
            }
        }

    } catch (_) {}
}


function showToast(message) {

    const toast = $("#toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        showToast.timer
    );

    showToast.timer = setTimeout(
        () => {
            toast.classList.remove("show");
        },
        2600
    );
}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
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

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0.00";
    }

    return number.toFixed(2);
}


function getUserName(user) {

    if (!user) {
        return "—";
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
        "—"
    );
}


function getUsername(user) {

    if (!user) {
        return "—";
    }

    const username =
        user.username ||
        user.user_name ||
        "";

    return username
        ? `@${String(username).replace(/^@/, "")}`
        : "—";
}


function getTelegramUser() {

    return tg?.initDataUnsafe?.user || null;
}


/* ========================================================
   API
======================================================== */

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


async function api(
    path,
    options = {}
) {

    const url =
        apiUrl(path);


    const headers = {
        "Content-Type":
            "application/json",

        ...(options.headers || {})
    };


    if (initData) {

        headers[
            "X-Telegram-Init-Data"
        ] = initData;
    }


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    const text =
        await response.text();


    let data = null;


    try {

        data =
            text
                ? JSON.parse(text)
                : null;

    } catch (_) {

        data = {
            raw: text
        };
    }


    if (!response.ok) {

        const error =
            new Error(
                data?.detail ||
                data?.error ||
                `HTTP ${response.status}`
            );

        error.status =
            response.status;

        throw error;
    }


    return data;
}


function hasApi() {

    return Boolean(
        API_BASE ||
        location.protocol === "http:" ||
        location.protocol === "https:"
    );
}


/* ========================================================
   LOADER
======================================================== */

function runLoader() {

    const loader =
        $("#loader");

    const app =
        $("#app");

    const status =
        $("#loaderStatus");

    const progress =
        $("#loaderProgressBar");


    if (!loader || !app) {
        return;
    }


    const messages =
        t("loading");


    let index = 0;

    let progressValue = 0;


    function update() {

        if (status) {

            status.textContent =
                messages[index];
        }


        progressValue =
            Math.min(
                100,
                progressValue + 20
            );


        if (progress) {

            progress.style.width =
                `${progressValue}%`;
        }


        index++;

        if (
            index >= messages.length
        ) {
            index = 0;
        }
    }


    update();


    const interval =
        setInterval(
            update,
            700
        );


    /*
       Мінімальний час заставки.

       Після цього ми ховаємо loader,
       коли базове завантаження завершене.

       Додатковий таймер захищає від
       вічного зависання заставки.
    */

    const minimumTime =
        new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    3000
                )
        );


    const safety =
        setTimeout(
            finish,
            10 * 60 * 1000
        );


    window.finishNightBornLoader =
        async function () {

            await minimumTime;

            finish();
        };


    function finish() {

        clearInterval(interval);

        clearTimeout(safety);

        if (progress) {
            progress.style.width = "100%";
        }

        if (status) {
            status.textContent =
                messages[messages.length - 1];
        }

        setTimeout(
            () => {

                loader.classList.add("hide");

                app.classList.remove("hidden");

                document.body.classList.add(
                    "app-ready"
                );

            },
            500
        );
    }
}


/* ========================================================
   NAVIGATION
======================================================== */

function navigate(screen) {

    if (!screen) {
        return;
    }


    const target =
        $(`#screen-${screen}`);


    if (!target) {
        return;
    }


    $$(".screen")
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

                item.style.display =
                    "none";
            }
        );


    target.classList.add("active");

    target.style.display =
        "block";


    state.screen =
        screen;


    $$(".nav-item")
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.screen === screen
                );

            }
        );


    haptic("light");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (screen === "tasks") {
        loadTasks();
    }

    if (screen === "history") {
        loadHistory();
    }

    if (screen === "referrals") {
        renderReferrals();
    }

    if (screen === "profile") {
        renderUser();
    }

    if (screen === "admin") {
        loadAdminAccess();
    }
}


/* ========================================================
   USER
======================================================== */

function getLocalUser() {

    const telegramUser =
        getTelegramUser();

    if (telegramUser) {
        return telegramUser;
    }


    return {
        id: "—",
        first_name: "NightBorn",
        username: ""
    };
}


function normalizeUser(data) {

    if (!data) {
        return getLocalUser();
    }


    return (
        data.user ||
        data.profile ||
        data
    );
}


function renderUser() {

    const user =
        state.user ||
        getLocalUser();


    state.user =
        user;


    const name =
        getUserName(user);


    const username =
        getUsername(user);


    const id =
        user.id ??
        user.telegram_id ??
        user.telegramId ??
        "—";


    const balance =
        user.balance ??
        user.amount ??
        user.wallet_balance ??
        0;


    const referrals =
        user.referrals ??
        user.referral_count ??
        user.referrals_count ??
        0;


    const setText =
        (selector, value) => {

            const element =
                $(selector);

            if (element) {
                element.textContent =
                    String(value);
            }
        };


    setText(
        "#userName",
        name
    );

    setText(
        "#userUsername",
        username
    );

    setText(
        "#userId",
        id
    );


    setText(
        "#balance",
        formatMoney(balance)
    );


    setText(
        "#profileName",
        name
    );

    setText(
        "#profileUsername",
        username
    );

    setText(
        "#profileId",
        id
    );

    setText(
        "#profileBalance",
        formatMoney(balance)
    );

    setText(
        "#referralCount",
        referrals
    );

    setText(
        "#profileReferrals",
        referrals
    );


    const avatar =
        $("#profileAvatar");


    if (avatar) {

        avatar.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase() || "N";
    }


    renderReferrals();
}


async function loadUser() {

    try {

        if (!API_BASE) {

            state.user =
                getLocalUser();

            renderUser();

            return;
        }


        const data =
            await api(
                "/api/me"
            );


        state.user =
            normalizeUser(data);


        renderUser();


    } catch (error) {

        console.warn(
            "User load:",
            error
        );


        state.user =
            getLocalUser();

        renderUser();
    }
}


/* ========================================================
   REFERRALS
======================================================== */

function getReferralLink() {

    const user =
        state.user ||
        getLocalUser();


    if (
        user.referral_link
    ) {
        return user.referral_link;
    }


    if (
        user.referralLink
    ) {
        return user.referralLink;
    }


    const botUsername =
        user.bot_username ||
        user.botUsername;


    const id =
        user.id ||
        user.telegram_id;


    if (
        botUsername &&
        id
    ) {

        return (
            `https://t.me/${botUsername}` +
            `?start=ref_${id}`
        );
    }


    return "";
}


function renderReferrals() {

    const input =
        $("#referralLink");


    if (!input) {
        return;
    }


    input.value =
        getReferralLink();
}


async function copyReferral() {

    const input =
        $("#referralLink");


    const value =
        input?.value || "";


    if (!value) {

        showToast(
            state.language === "ru"
                ? "Реферальная ссылка пока недоступна"
                : "Реферальне посилання поки недоступне"
        );

        return;
    }


    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                value
            );

        } else {

            input.focus();

            input.select();

            document.execCommand(
                "copy"
            );
        }


        haptic("success");

        showToast(
            t("copySuccess")
        );

    } catch (error) {

        console.warn(
            "Clipboard:",
            error
        );

        showToast(
            t("copyError")
        );
    }
}


/* ========================================================
   SPONSORS
======================================================== */

function normalizeSponsors(data) {

    if (Array.isArray(data)) {
        return data;
    }


    return (
        data?.sponsors ||
        data?.items ||
        data?.channels ||
        []
    );
}


function getSponsorName(sponsor) {

    return (
        sponsor.title ||
        sponsor.name ||
        sponsor.channel_name ||
        sponsor.username ||
        "Канал"
    );
}


function getSponsorLink(sponsor) {

    return (
        sponsor.url ||
        sponsor.link ||
        sponsor.invite_link ||
        sponsor.channel_url ||
        ""
    );
}


function renderSponsors() {

    const block =
        $("#sponsorsHomeBlock");

    const list =
        $("#sponsorsList");

    const counter =
        $("#sponsorCounter");


    if (
        !block ||
        !list ||
        !counter
    ) {
        return;
    }


    const sponsors =
        state.sponsors;


    if (!sponsors.length) {

        block.style.display =
            "none";

        return;
    }


    block.style.display =
        "block";


    const start =
        state.sponsorPage * 4;


    const current =
        sponsors.slice(
            start,
            start + 4
        );


    if (!current.length) {

        state.sponsorPage = 0;

        return renderSponsors();
    }


    const completed =
        sponsors.filter(
            sponsor =>
                sponsor.subscribed === true ||
                sponsor.is_subscribed === true
        ).length;


    counter.textContent =
        `${Math.min(completed, sponsors.length)}/${sponsors.length}`;


    list.innerHTML =
        current
            .map(
                sponsor => {

                    const name =
                        getSponsorName(
                            sponsor
                        );

                    const link =
                        getSponsorLink(
                            sponsor
                        );


                    const initial =
                        name
                            .trim()
                            .charAt(0)
                            .toUpperCase() ||
                        "N";


                    return `
                        <div class="sponsor-item">

                            <div class="sponsor-avatar">
                                ${escapeHtml(initial)}
                            </div>

                            <div class="sponsor-info">

                                <strong>
                                    ${escapeHtml(name)}
                                </strong>

                                <span>
                                    Підпишись на канал
                                </span>

                            </div>

                            ${
                                link
                                    ? `
                                        <a
                                            class="sponsor-link"
                                            href="${escapeHtml(link)}"
                                            target="_blank"
                                            rel="noopener"
                                        >
                                            Відкрити
                                        </a>
                                    `
                                    : ""
                            }

                        </div>
                    `;
                }
            )
            .join("");
}


async function loadSponsors() {

    try {

        const data =
            await api(
                "/api/sponsors"
            );


        state.sponsors =
            normalizeSponsors(data);


        /*
           Реальні спонсори.

           Якщо сервер повернув 0 —
           блок повністю ховається.
        */

        state.sponsorPage =
            0;


        renderSponsors();


    } catch (error) {

        console.warn(
            "Sponsors:",
            error
        );


        state.sponsors =
            [];


        renderSponsors();
    }
}


async function checkSponsors() {

    const button =
        $("#checkSponsorsBtn");


    if (button) {
        button.disabled = true;
    }


    try {

        const data =
            await api(
                "/api/sponsor/check",
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );


        const success =
            data?.success === true ||
            data?.subscribed === true ||
            data?.all_subscribed === true;


        if (success) {

            haptic("success");

            showToast(
                t("sponsorDone")
            );

            state.sponsors =
                state.sponsors.map(
                    sponsor => ({
                        ...sponsor,
                        subscribed: true
                    })
                );

            renderSponsors();

        } else {

            haptic("error");

            showToast(
                t("sponsorNotDone")
            );
        }


    } catch (error) {

        console.warn(
            "Sponsor check:",
            error
        );


        showToast(
            t("networkError")
        );

    } finally {

        if (button) {
            button.disabled = false;
        }
    }
}


/* ========================================================
   TASKS
======================================================== */

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


function renderTasks() {

    const container =
        $("#tasksList");


    if (!container) {
        return;
    }


    if (!state.tasks.length) {

        container.innerHTML =
            `
                <div class="empty-state">
                    ${escapeHtml(
                        t("emptyTasks")
                    )}
                </div>
            `;

        return;
    }


    container.innerHTML =
        state.tasks
            .map(
                (task, index) => {

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
                        "";


                    const reward =
                        task.reward ??
                        task.amount ??
                        task.reward_amount ??
                        0;


                    const completed =
                        task.completed === true ||
                        task.done === true;


                    return `
                        <div class="item-card">

                            <div class="item-card-header">

                                <div>

                                    <div class="item-card-title">
                                        ${escapeHtml(title)}
                                    </div>

                                    <div class="item-card-description">
                                        ${escapeHtml(description)}
                                    </div>

                                </div>

                                <div class="item-card-reward">
                                    +${formatMoney(reward)} ₴
                                </div>

                            </div>

                            <button
                                class="item-action"
                                type="button"
                                data-task-id="${escapeHtml(id)}"
                                data-task-url="${escapeHtml(
                                    task.url ||
                                    task.link ||
                                    task.telegram_url ||
                                    ""
                                )}"
                            >
                                ${
                                    completed
                                        ? "Виконано"
                                        : "Відкрити завдання"
                                }
                            </button>

                        </div>
                    `;
                }
            )
            .join("");


    $$("#tasksList .item-action")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        handleTask(
                            button.dataset.taskId,
                            button.dataset.taskUrl
                        );

                    }
                );

            }
        );
}


async function loadTasks() {

    const container =
        $("#tasksList");


    if (!container) {
        return;
    }


    if (!state.tasks.length) {

        container.innerHTML =
            `
                <div class="empty-state">
                    ${escapeHtml(
                        t("loadingData")
                    )}
                </div>
            `;
    }


    try {

        const data =
            await api(
                "/api/tasks"
            );


        state.tasks =
            normalizeTasks(data);


        renderTasks();


    } catch (error) {

        console.warn(
            "Tasks:",
            error
        );


        state.tasks =
            [];


        renderTasks();
    }
}


async function handleTask(
    taskId,
    taskUrl
) {

    haptic("light");


    if (taskUrl) {

        try {

            if (tg?.openTelegramLink &&
                taskUrl.includes("t.me")
            ) {

                tg.openTelegramLink(
                    taskUrl
                );

            } else if (tg?.openLink) {

                tg.openLink(
                    taskUrl
                );

            } else {

                window.open(
                    taskUrl,
                    "_blank",
                    "noopener"
                );
            }

        } catch (_) {

            window.open(
                taskUrl,
                "_blank"
            );
        }
    }


    showToast(
        t("taskOpened")
    );


    /*
       Якщо бекенд підтримує перевірку
       виконання завдання.
    */

    if (
        API_BASE &&
        taskId
    ) {

        try {

            await api(
                `/api/tasks/${encodeURIComponent(taskId)}/check`,
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );

        } catch (error) {

            console.warn(
                "Task check:",
                error
            );
        }
    }
}


/* ========================================================
   HISTORY
======================================================== */

function normalizeHistory(data) {

    if (Array.isArray(data)) {
        return data;
    }


    return (
        data?.history ||
        data?.items ||
        data?.transactions ||
        []
    );
}


function renderHistory() {

    const container =
        $("#historyList");


    if (!container) {
        return;
    }


    if (!state.history.length) {

        container.innerHTML =
            `
                <div class="empty-state">
                    ${escapeHtml(
                        t("emptyHistory")
                    )}
                </div>
            `;

        return;
    }


    container.innerHTML =
        state.history
            .map(
                item => {

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
                        item.createdAt ||
                        item.date ||
                        "";


                    const positive =
                        amount >= 0;


                    return `
                        <div class="item-card">

                            <div class="item-card-header">

                                <div>

                                    <div class="item-card-title">
                                        ${escapeHtml(title)}
                                    </div>

                                    ${
                                        date
                                            ? `
                                                <div class="item-card-description">
                                                    ${escapeHtml(
                                                        formatDate(date)
                                                    )}
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>

                                <div
                                    class="item-card-reward"
                                    style="color:${positive ? "var(--blue-light)" : "#ff8296"}"
                                >
                                    ${positive ? "+" : ""}
                                    ${formatMoney(amount)} ₴
                                </div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


function formatDate(value) {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }


    return date.toLocaleString(
        state.language === "ru"
            ? "ru-RU"
            : "uk-UA",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


async function loadHistory() {

    const container =
        $("#historyList");


    if (!container) {
        return;
    }


    try {

        const data =
            await api(
                "/api/history"
            );


        state.history =
            normalizeHistory(data);


        renderHistory();


    } catch (error) {

        console.warn(
            "History:",
            error
        );


        state.history =
            [];


        renderHistory();
    }
}


/* ========================================================
   BONUS
======================================================== */

async function claimBonus() {

    const button =
        $("#claimBonusBtn");


    if (button) {
        button.disabled = true;
    }


    try {

        const data =
            await api(
                "/api/bonus/daily",
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );


        if (
            data?.success === false ||
            data?.already_claimed === true
        ) {

            showToast(
                t("bonusAlready")
            );

            return;
        }


        const reward =
            data?.reward ??
            data?.amount;


        if (
            state.user &&
            reward !== undefined
        ) {

            state.user.balance =
                Number(
                    state.user.balance || 0
                ) +
                Number(reward || 0);

            renderUser();
        }


        haptic("success");

        showToast(
            t("bonusSuccess")
        );


    } catch (error) {

        console.warn(
            "Bonus:",
            error
        );


        showToast(
            t("networkError")
        );

    } finally {

        if (button) {
            button.disabled = false;
        }
    }
}


/* ========================================================
   SUPPORT
======================================================== */

async function sendSupport() {

    const textarea =
        $("#supportMessage");


    const message =
        textarea?.value.trim() || "";


    if (!message) {

        showToast(
            t("supportEmpty")
        );

        return;
    }


    const button =
        $("#sendSupportBtn");


    if (button) {
        button.disabled = true;
    }


    try {

        await api(
            "/api/support",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        message
                    })
            }
        );


        textarea.value = "";


        haptic("success");

        showToast(
            t("supportSuccess")
        );


    } catch (error) {

        console.warn(
            "Support:",
            error
        );


        showToast(
            t("supportError")
        );

    } finally {

        if (button) {
            button.disabled = false;
        }
    }
}


/* ========================================================
   LANGUAGE
======================================================== */

function applyLanguage() {

    const select =
        $("#languageSelect");


    if (select) {

        select.value =
            state.language;
    }


    /*
       Основна структура UI вже
       містить український текст.

       Тут можна розширити локалізацію
       після підключення словника.
    */

    renderSponsors();

    renderTasks();

    renderHistory();

    renderUser();
}


function changeLanguage(language) {

    if (
        language !== "uk" &&
        language !== "ru"
    ) {
        language = "uk";
    }


    state.language =
        language;


    localStorage.setItem(
        "nightborn_language",
        language
    );


    document.documentElement.lang =
        language;


    applyLanguage();


    showToast(
        language === "ru"
            ? "Язык изменён"
            : "Мову змінено"
    );
}


/* ========================================================
   ADMIN
======================================================== */

async function loadAdminAccess() {

    if (!API_BASE) {

        return;
    }


    try {

        const data =
            await api(
                "/api/me"
            );


        const admin =
            data?.admin === true ||
            data?.is_admin === true ||
            data?.user?.admin === true ||
            data?.user?.is_admin === true;


        state.admin =
            admin;


        const screen =
            $("#screen-admin");


        if (screen) {

            screen.style.display =
                admin
                    ? "block"
                    : "none";
        }


    } catch (error) {

        console.warn(
            "Admin:",
            error
        );
    }
}


async function adminAction(action) {

    if (!API_BASE) {

        showToast(
            t("adminUnavailable")
        );

        return;
    }


    const result =
        $("#adminResult");


    if (result) {

        result.classList.add(
            "visible"
        );

        result.textContent =
            t("loadingData");
    }


    const endpoints = {

        users:
            "/api/admin/users",

        tasks:
            "/api/admin/tasks",

        sponsors:
            "/api/admin/sponsors",

        promocodes:
            "/api/admin/promocodes"

    };


    const endpoint =
        endpoints[action];


    if (!endpoint) {

        showToast(
            t("adminUnavailable")
        );

        return;
    }


    try {

        const data =
            await api(
                endpoint
            );


        if (result) {

            result.textContent =
                JSON.stringify(
                    data,
                    null,
                    2
                );
        }


    } catch (error) {

        console.warn(
            "Admin action:",
            error
        );


        if (result) {

            result.textContent =
                error.message ||
                t("adminUnavailable");
        }
    }
}


/* ========================================================
   EVENT HANDLERS
======================================================== */

function bindEvents() {


    /*
       Усі кнопки з data-screen
    */

    $$("[data-screen]")
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        navigate(
                            element.dataset.screen
                        );

                    }
                );

            }
        );


    /*
       Налаштування зверху
    */

    const settings =
        $("#settingsTopBtn");


    if (settings) {

        settings.addEventListener(
            "click",
            () => {

                navigate(
                    "settings"
                );

            }
        );
    }


    /*
       Копіювання рефералу
    */

    const copy =
        $("#copyReferralBtn");


    if (copy) {

        copy.addEventListener(
            "click",
            copyReferral
        );
    }


    /*
       Спонсори
    */

    const sponsorCheck =
        $("#checkSponsorsBtn");


    if (sponsorCheck) {

        sponsorCheck.addEventListener(
            "click",
            checkSponsors
        );
    }


    /*
       Бонус
    */

    const bonus =
        $("#claimBonusBtn");


    if (bonus) {

        bonus.addEventListener(
            "click",
            claimBonus
        );
    }


    /*
       Support
    */

    const support =
        $("#sendSupportBtn");


    if (support) {

        support.addEventListener(
            "click",
            sendSupport
        );
    }


    /*
       Language
    */

    const language =
        $("#languageSelect");


    if (language) {

        language.addEventListener(
            "change",
            event => {

                changeLanguage(
                    event.target.value
                );

            }
        );
    }


    /*
       Admin
    */

    $$(".admin-card")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        adminAction(
                            button.dataset.adminAction
                        );

                    }
                );

            }
        );


    /*
       Клавіатура Telegram назад
    */

    if (
        tg &&
        tg.BackButton
    ) {

        tg.BackButton.onClick(
            () => {

                if (
                    state.screen !== "home"
                ) {

                    navigate(
                        "home"
                    );

                } else {

                    tg.close();
                }
            }
        );
    }
}


/* ========================================================
   INITIAL DATA
======================================================== */

async function loadInitialData() {

    state.loading = true;


    /*
       Виконуємо незалежні запити
       окремо, щоб падіння одного
       не ламало весь додаток.
    */

    await Promise.allSettled([

        loadUser(),

        loadSponsors(),

        loadTasks(),

        loadHistory()

    ]);


    state.loading = false;


    if (
        typeof window.finishNightBornLoader ===
        "function"
    ) {

        window.finishNightBornLoader();
    }
}


/* ========================================================
   START
======================================================== */

async function init() {

    document.documentElement.lang =
        state.language;


    bindEvents();

    applyLanguage();

    runLoader();

    renderUser();

    renderReferrals();

    await loadInitialData();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}
