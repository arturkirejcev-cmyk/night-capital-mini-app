/* =========================================================
   NIGHTBORN MINI APP
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

/*
   Тут потрібно буде вказати справжню публічну адресу
   твого Python API після його розміщення.

   Наприклад:
   https://api.nightborn.example
*/

const API_BASE = "https://YOUR-PUBLIC-API-DOMAIN";


const tg = window.Telegram?.WebApp || null;


/* =========================================================
   STATE
========================================================= */

const state = {
    user: null,
    tasks: [],
    sponsors: [],
    history: [],
    language: "uk",
    currentScreen: "home",
    initialized: false
};


/* =========================================================
   LOADER
========================================================= */

const loader = document.getElementById("loader");

const loaderStartedAt = Date.now();

const MIN_LOADER_TIME = 4800;
const MAX_LOADER_TIME = 10 * 60 * 1000;

let loaderHidden = false;

const loaderMessages = [
    "Пробудження NightBorn",
    "Відкриття нічного світу",
    "Синхронізація системи",
    "Формування нічної енергії",
    "Майже готово…"
];

let loaderMessageIndex = 0;


/* Зміна тексту завантаження */

const loaderStatus =
    document.getElementById("loaderStatus");

let loaderMessageTimer = null;

function startLoaderMessages() {

    if (!loaderStatus) {
        return;
    }

    loaderStatus.textContent =
        loaderMessages[0];

    loaderMessageTimer = setInterval(() => {

        loaderMessageIndex =
            (loaderMessageIndex + 1) %
            loaderMessages.length;

        loaderStatus.style.opacity = "0";

        setTimeout(() => {

            loaderStatus.textContent =
                loaderMessages[loaderMessageIndex];

            loaderStatus.style.opacity = "1";

        }, 180);

    }, 950);
}


function hideLoader() {

    if (loaderHidden) {
        return;
    }

    loaderHidden = true;

    if (loaderMessageTimer) {
        clearInterval(loaderMessageTimer);
    }

    const elapsed =
        Date.now() - loaderStartedAt;

    const remaining =
        Math.max(
            0,
            MIN_LOADER_TIME - elapsed
        );

    setTimeout(() => {

        if (loader) {
            loader.classList.add("hidden");
        }

        const app =
            document.getElementById("app");

        if (app) {
            app.classList.remove("hidden");
        }

    }, remaining);
}


/*
   Захист від нескінченного loader,
   якщо API або сервер не відповідає.
*/

setTimeout(() => {

    hideLoader();

}, MAX_LOADER_TIME);


/* =========================================================
   TELEGRAM
========================================================= */

function setupTelegram() {

    if (!tg) {
        return;
    }

    try {

        tg.ready();

        tg.expand();

        if (tg.setHeaderColor) {
            tg.setHeaderColor("#030914");
        }

        if (tg.setBackgroundColor) {
            tg.setBackgroundColor("#030914");
        }

    } catch (error) {

        console.warn(
            "Telegram WebApp setup error:",
            error
        );

    }
}


function getInitData() {

    if (!tg) {
        return "";
    }

    return tg.initData || "";
}


function getTelegramUser() {

    if (!tg) {
        return null;
    }

    return tg.initDataUnsafe?.user || null;
}


/* =========================================================
   API
========================================================= */

async function apiRequest(
    path,
    options = {}
) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    const initData = getInitData();

    if (initData) {

        headers[
            "X-Telegram-Init-Data"
        ] = initData;

    }


    const url =
        `${API_BASE}${path}`;


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let data = null;


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        data = await response.json();

    } else {

        const text =
            await response.text();

        data = {
            detail: text
        };

    }


    if (!response.ok) {

        const error =
            new Error(
                data?.detail ||
                data?.message ||
                "Помилка сервера"
            );

        error.status =
            response.status;

        throw error;
    }


    return data;
}


/* =========================================================
   HELPERS
========================================================= */

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


function formatBalance(value) {

    const number =
        Number(value || 0);

    return number.toFixed(2);
}


function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        showToast.timeout
    );

    showToast.timeout =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2800);
}


function getDisplayName(user) {

    if (!user) {
        return "—";
    }

    if (user.name) {
        return user.name;
    }

    if (user.first_name) {

        return [
            user.first_name,
            user.last_name
        ]
            .filter(Boolean)
            .join(" ");

    }

    return "Користувач";
}


function getUsername(user) {

    if (!user) {
        return "—";
    }

    if (user.username) {

        return user.username
            .startsWith("@")
            ? user.username
            : `@${user.username}`;

    }

    return "Не вказано";
}


function getUserId(user) {

    return (
        user?.id ??
        user?.telegram_id ??
        "—"
    );
}


/* =========================================================
   USER RENDER
========================================================= */

function renderUser() {

    const user =
        state.user ||
        getTelegramUser();


    if (!user) {
        return;
    }


    const name =
        getDisplayName(user);

    const username =
        getUsername(user);

    const id =
        getUserId(user);


    document.getElementById(
        "userName"
    ).textContent = name;


    document.getElementById(
        "userUsername"
    ).textContent = username;


    document.getElementById(
        "userId"
    ).textContent = id;


    document.getElementById(
        "profileName"
    ).textContent = name;


    document.getElementById(
        "profileUsername"
    ).textContent = username;


    document.getElementById(
        "profileId"
    ).textContent = id;


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (avatar) {

        avatar.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase() || "N";

    }


    const balance =
        Number(
            user.balance ||
            user.balance_uah ||
            0
        );


    document.getElementById(
        "balance"
    ).textContent =
        formatBalance(balance);


    document.getElementById(
        "profileBalance"
    ).textContent =
        formatBalance(balance);


    const referrals =
        Number(
            user.referrals_count ||
            user.referral_count ||
            user.referrals ||
            0
        );


    document.getElementById(
        "referralCount"
    ).textContent =
        referrals;


    document.getElementById(
        "profileReferrals"
    ).textContent =
        referrals;


    const referralLink =
        user.referral_link ||
        user.referralLink ||
        "";


    const referralInput =
        document.getElementById(
            "referralLink"
        );


    if (referralInput) {

        referralInput.value =
            referralLink;

    }
}


/* =========================================================
   LOAD USER
========================================================= */

async function loadUser() {

    /*
       Якщо backend ще не підключений,
       беремо Telegram-профіль,
       але не вигадуємо баланс.
    */

    try {

        const data =
            await apiRequest(
                "/api/me"
            );


        state.user =
            data?.user ||
            data;


    } catch (error) {

        console.warn(
            "Не вдалося отримати дані користувача:",
            error
        );


        const telegramUser =
            getTelegramUser();


        if (telegramUser) {

            state.user = {
                ...telegramUser,
                balance: 0
            };

        }

    }


    renderUser();
}


/* =========================================================
   SPONSORS
========================================================= */

async function loadSponsors() {

    try {

        const data =
            await apiRequest(
                "/api/sponsors"
            );


        const sponsors =
            Array.isArray(data)
                ? data
                : (
                    data?.sponsors ||
                    []
                );


        /*
           ВАЖЛИВО:
           ніяких тестових спонсорів тут немає.
        */

        state.sponsors =
            sponsors.filter(
                sponsor =>
                    sponsor &&
                    (
                        sponsor.active === undefined ||
                        sponsor.active === true ||
                        sponsor.active === 1
                    )
            );


        renderSponsors();

    } catch (error) {

        console.warn(
            "Не вдалося завантажити спонсорів:",
            error
        );


        state.sponsors = [];

        renderSponsors();

    }
}


function renderSponsors() {

    const block =
        document.getElementById(
            "sponsorsHomeBlock"
        );


    const list =
        document.getElementById(
            "sponsorsList"
        );


    const counter =
        document.getElementById(
            "sponsorCounter"
        );


    if (!block || !list) {
        return;
    }


    /*
       Якщо реальних активних спонсорів немає —
       блок взагалі не показуємо.
    */

    if (state.sponsors.length === 0) {

        block.style.display =
            "none";

        return;
    }


    block.style.display =
        "block";


    const visibleSponsors =
        state.sponsors.slice(0, 4);


    list.innerHTML =
        visibleSponsors
            .map(
                (sponsor, index) => {

                    const title =
                        sponsor.title ||
                        sponsor.name ||
                        sponsor.channel_name ||
                        `Канал ${index + 1}`;


                    const username =
                        sponsor.username ||
                        sponsor.channel_username ||
                        "";


                    const url =
                        sponsor.url ||
                        sponsor.link ||
                        (
                            username
                                ? `https://t.me/${String(username).replace("@", "")}`
                                : "#"
                        );


                    const firstLetter =
                        title
                            .trim()
                            .charAt(0)
                            .toUpperCase();


                    return `
                        <div class="sponsor-item">

                            <div class="sponsor-avatar">
                                ${escapeHtml(firstLetter || "N")}
                            </div>

                            <div class="sponsor-info">

                                <strong>
                                    ${escapeHtml(title)}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        username || "Telegram"
                                    )}
                                </span>

                            </div>

                            <a
                                class="sponsor-link"
                                href="${escapeHtml(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Відкрити
                            </a>

                        </div>
                    `;

                }
            )
            .join("");


    if (counter) {

        counter.textContent =
            `0/${state.sponsors.length}`;

    }
}


/* =========================================================
   CHECK SPONSORS
========================================================= */

async function checkSponsors() {

    if (state.sponsors.length === 0) {

        return;

    }


    const button =
        document.getElementById(
            "checkSponsorsBtn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Перевіряємо…";

    }


    try {

        const data =
            await apiRequest(
                "/api/sponsor/check",
                {
                    method: "POST",

                    body: JSON.stringify({
                        sponsors:
                            state.sponsors
                                .slice(0, 4)
                                .map(
                                    sponsor =>
                                        sponsor.id ??
                                        sponsor.channel_id
                                )
                    })
                }
            );


        const subscribed =
            Boolean(
                data?.subscribed ||
                data?.success
            );


        if (subscribed) {

            showToast(
                "Підписка підтверджена."
            );

        } else {

            showToast(
                "Потрібно підписатися на всі канали."
            );

        }


        await loadSponsors();


    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Не вдалося перевірити підписку."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Перевірити підписку";

        }

    }
}


/* =========================================================
   TASKS
========================================================= */

async function loadTasks() {

    const list =
        document.getElementById(
            "tasksList"
        );


    if (!list) {
        return;
    }


    try {

        const data =
            await apiRequest(
                "/api/tasks"
            );


        state.tasks =
            Array.isArray(data)
                ? data
                : (
                    data?.tasks ||
                    []
                );


        renderTasks();


    } catch (error) {

        console.warn(
            "Не вдалося завантажити завдання:",
            error
        );


        state.tasks = [];

        list.innerHTML = `
            <div class="empty-state">
                Завдання поки недоступні.
            </div>
        `;

    }
}


function renderTasks() {

    const list =
        document.getElementById(
            "tasksList"
        );


    if (!list) {
        return;
    }


    if (state.tasks.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                Зараз немає доступних завдань.
            </div>
        `;

        return;
    }


    list.innerHTML =
        state.tasks
            .map(
                task => {

                    const title =
                        task.title ||
                        task.name ||
                        "Завдання";


                    const description =
                        task.description ||
                        "Виконай завдання";


                    const reward =
                        Number(
                            task.reward ||
                            0
                        );


                    return `
                        <div
                            class="list-item"
                            data-task-id="${escapeHtml(
                                task.id ?? ""
                            )}"
                        >

                            <div class="list-icon">
                                ▣
                            </div>

                            <div class="list-content">

                                <strong>
                                    ${escapeHtml(title)}
                                </strong>

                                <span>
                                    ${escapeHtml(description)}
                                </span>

                            </div>

                            <div class="list-reward">
                                +${reward.toFixed(2)} ₴
                            </div>

                        </div>
                    `;

                }
            )
            .join("");
}


/* =========================================================
   HISTORY
========================================================= */

async function loadHistory() {

    const list =
        document.getElementById(
            "historyList"
        );


    if (!list) {
        return;
    }


    try {

        const data =
            await apiRequest(
                "/api/history"
            );


        state.history =
            Array.isArray(data)
                ? data
                : (
                    data?.history ||
                    []
                );


        renderHistory();


    } catch (error) {

        console.warn(
            "Не вдалося завантажити історію:",
            error
        );


        state.history = [];


        list.innerHTML = `
            <div class="empty-state">
                Історія поки недоступна.
            </div>
        `;

    }
}


function renderHistory() {

    const list =
        document.getElementById(
            "historyList"
        );


    if (!list) {
        return;
    }


    if (state.history.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                Історія операцій порожня.
            </div>
        `;

        return;
    }


    list.innerHTML =
        state.history
            .map(
                item => {

                    const title =
                        item.title ||
                        item.type ||
                        "Операція";


                    const amount =
                        Number(
                            item.amount ||
                            0
                        );


                    const sign =
                        amount >= 0
                            ? "+"
                            : "";


                    return `
                        <div class="list-item">

                            <div class="list-icon">
                                ◴
                            </div>

                            <div class="list-content">

                                <strong>
                                    ${escapeHtml(title)}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        item.created_at ||
                                        item.date ||
                                        ""
                                    )}
                                </span>

                            </div>

                            <div class="list-reward">
                                ${sign}${amount.toFixed(2)} ₴
                            </div>

                        </div>
                    `;

                }
            )
            .join("");
}


/* =========================================================
   DAILY BONUS
========================================================= */

async function claimBonus() {

    const button =
        document.getElementById(
            "claimBonusBtn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Отримання…";

    }


    try {

        const data =
            await apiRequest(
                "/api/bonus/daily",
                {
                    method: "POST"
                }
            );


        const reward =
            Number(
                data?.reward ||
                data?.amount ||
                0
            );


        if (reward > 0) {

            showToast(
                `Отримано ${reward.toFixed(2)} ₴`
            );

        } else {

            showToast(
                data?.message ||
                "Бонус отримано."
            );

        }


        await loadUser();


    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Не вдалося отримати бонус."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Отримати бонус";

        }

    }
}


/* =========================================================
   SUPPORT
========================================================= */

async function sendSupport() {

    const textarea =
        document.getElementById(
            "supportMessage"
        );


    if (!textarea) {
        return;
    }


    const message =
        textarea.value.trim();


    if (!message) {

        showToast(
            "Напиши повідомлення."
        );

        return;
    }


    const button =
        document.getElementById(
            "sendSupportBtn"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            "Надсилання…";

    }


    try {

        await apiRequest(
            "/api/support",
            {
                method: "POST",

                body: JSON.stringify({
                    message
                })
            }
        );


        textarea.value = "";


        showToast(
            "Повідомлення надіслано адміністратору."
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Не вдалося надіслати повідомлення."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Надіслати";

        }

    }
}


/* =========================================================
   COPY REFERRAL
========================================================= */

async function copyReferral() {

    const input =
        document.getElementById(
            "referralLink"
        );


    if (!input || !input.value) {

        showToast(
            "Реферальне посилання ще не завантажено."
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            input.value
        );


        showToast(
            "Посилання скопійовано."
        );


    } catch (error) {

        input.select();

        document.execCommand(
            "copy"
        );


        showToast(
            "Посилання скопійовано."
        );

    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function openScreen(screenName) {

    const target =
        document.getElementById(
            `screen-${screenName}`
        );


    if (!target) {
        return;
    }


    document
        .querySelectorAll(".screen")
        .forEach(
            screen => {

                screen.classList.remove(
                    "active"
                );

            }
        );


    target.classList.add(
        "active"
    );


    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.screen ===
                    screenName
                );

            }
        );


    state.currentScreen =
        screenName;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (screenName === "tasks") {
        loadTasks();
    }

    if (screenName === "history") {
        loadHistory();
    }
}


/* =========================================================
   LANGUAGE
========================================================= */

function loadLanguage() {

    const saved =
        localStorage.getItem(
            "nightborn_language"
        );


    if (
        saved === "uk" ||
        saved === "ru"
    ) {

        state.language =
            saved;

    } else {

        state.language =
            "uk";

    }


    const select =
        document.getElementById(
            "languageSelect"
        );


    if (select) {

        select.value =
            state.language;

    }
}


function saveLanguage(language) {

    if (
        language !== "uk" &&
        language !== "ru"
    ) {
        return;
    }


    state.language =
        language;


    localStorage.setItem(
        "nightborn_language",
        language
    );


    /*
       Тут можна підключити повну локалізацію
       після додавання словника backend/frontend.
    */

    showToast(
        language === "uk"
            ? "Мову змінено на українську."
            : "Язык изменён на русский."
    );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {


    /*
       Нижня навігація
    */

    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openScreen(
                            button.dataset.screen
                        );

                    }
                );

            }
        );


    /*
       Швидкі кнопки
    */

    document
        .querySelectorAll(
            ".quick-card"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openScreen(
                            button.dataset.screen
                        );

                    }
                );

            }
        );


    /*
       Налаштування
    */

    document
        .getElementById(
            "settingsTopBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                openScreen(
                    "settings"
                );

            }
        );


    /*
       Settings -> support
    */

    document
        .querySelectorAll(
            ".setting-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openScreen(
                            button.dataset.screen
                        );

                    }
                );

            }
        );


    /*
       Copy referral
    */

    document
        .getElementById(
            "copyReferralBtn"
        )
        ?.addEventListener(
            "click",
            copyReferral
        );


    /*
       Sponsors
    */

    document
        .getElementById(
            "checkSponsorsBtn"
        )
        ?.addEventListener(
            "click",
            checkSponsors
        );


    /*
       Bonus
    */

    document
        .getElementById(
            "claimBonusBtn"
        )
        ?.addEventListener(
            "click",
            claimBonus
        );


    /*
       Support
    */

    document
        .getElementById(
            "sendSupportBtn"
        )
        ?.addEventListener(
            "click",
            sendSupport
        );


    /*
       Language
    */

    document
        .getElementById(
            "languageSelect"
        )
        ?.addEventListener(
            "change",
            event => {

                saveLanguage(
                    event.target.value
                );

            }
        );

}


/* =========================================================
   INIT
========================================================= */

async function init() {

    setupTelegram();

    startLoaderMessages();

    loadLanguage();

    setupEvents();


    /*
       Виконуємо завантаження паралельно.
       Заставка не повинна чекати нескінченно.
    */

    await Promise.allSettled([

        loadUser(),

        loadSponsors(),

        loadTasks(),

        loadHistory()

    ]);


    state.initialized =
        true;


    /*
       Після завантаження всіх даних
       запускаємо красиве завершення заставки.
    */

    if (loaderStatus) {

        loaderStatus.textContent =
            "NightBorn готовий";

    }


    hideLoader();
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        init().catch(
            error => {

                console.error(
                    "NightBorn init error:",
                    error
                );


                /*
                   Навіть при помилці API
                   користувач не залишається
                   на заставці назавжди.
                */

                hideLoader();

            }
        );

    }
);
