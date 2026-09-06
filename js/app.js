/* =========================================================
   NIGHTBORN
   APPLICATION LOGIC
========================================================= */


/*
    ВАЖЛИВО:

    GitHub Pages НЕ запускає Python API.

    Тут потрібно вказати адресу твого публічного
    HTTPS API.

    Наприклад:

    const API_BASE = "https://my-api.example.com";

    Поки бекенд не підключений, Mini App не зможе
    отримувати реальний баланс, завдання та інші
    дані з бази.
*/

const API_BASE =
    "https://YOUR-PUBLIC-API-DOMAIN";


/* =========================================================
   TELEGRAM
========================================================= */

const tg =
    window.Telegram &&
    window.Telegram.WebApp
        ? window.Telegram.WebApp
        : null;


if (tg) {

    try {
        tg.ready();
        tg.expand();

        if (tg.setHeaderColor) {
            tg.setHeaderColor("#020611");
        }

        if (tg.setBackgroundColor) {
            tg.setBackgroundColor("#020611");
        }

    } catch (error) {

        console.warn(
            "Telegram WebApp init error:",
            error
        );

    }
}


/* =========================================================
   STATE
========================================================= */

const state = {

    user: null,

    tasks: [],

    sponsors: [],

    history: [],

    language: "uk",

    isAdmin: false,

    loaded: false

};


/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}


function $all(selector) {
    return Array.from(
        document.querySelectorAll(selector)
    );
}


/* =========================================================
   TELEGRAM INIT DATA
========================================================= */

function getInitData() {

    if (
        tg &&
        tg.initData
    ) {
        return tg.initData;
    }

    return "";
}


/* =========================================================
   API URL
========================================================= */

function apiUrl(path) {

    if (!API_BASE) {
        return path;
    }

    return (
        API_BASE.replace(/\/+$/, "") +
        "/" +
        path.replace(/^\/+/, "")
    );
}


/* =========================================================
   API REQUEST
========================================================= */

async function api(
    path,
    options = {}
) {

    const url = apiUrl(path);

    const headers = {

        "Content-Type":
            "application/json",

        "X-Telegram-Init-Data":
            getInitData(),

        ...(options.headers || {})

    };


    const request = {

        ...options,

        headers

    };


    const response =
        await fetch(
            url,
            request
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = null;

    }


    if (!response.ok) {

        const message =
            data &&
            (
                data.detail ||
                data.message ||
                data.error
            )
            ? (
                data.detail ||
                data.message ||
                data.error
            )
            : `HTTP ${response.status}`;

        throw new Error(message);
    }


    return data;
}


/* =========================================================
   SAFE API REQUEST
========================================================= */

async function safeApi(
    path,
    options = {},
    fallback = null
) {

    try {

        return await api(
            path,
            options
        );

    } catch (error) {

        console.warn(
            `API ${path}:`,
            error
        );

        return fallback;
    }
}


/* =========================================================
   FORMAT MONEY
========================================================= */

function money(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {
        return "0.00";
    }


    return number.toLocaleString(
        "uk-UA",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


/* =========================================================
   TELEGRAM USER FALLBACK
========================================================= */

function getTelegramUser() {

    if (
        tg &&
        tg.initDataUnsafe &&
        tg.initDataUnsafe.user
    ) {

        return tg.initDataUnsafe.user;

    }

    return null;
}


/* =========================================================
   INITIAL LOCAL USER
========================================================= */

function createLocalUser() {

    const telegramUser =
        getTelegramUser();


    if (!telegramUser) {
        return null;
    }


    const firstName =
        telegramUser.first_name ||
        "";


    const lastName =
        telegramUser.last_name ||
        "";


    const fullName =
        `${firstName} ${lastName}`
            .trim() ||
        "Користувач";


    const username =
        telegramUser.username
            ? `@${telegramUser.username}`
            : "Username не вказано";


    return {

        id:
            telegramUser.id,

        name:
            fullName,

        username,

        balance: 0,

        referrals: 0,

        referral_count: 0,

        referral_earned: 0,

        tasks_completed: 0,

        earned: 0,

        referral_link: "",

        avatar_url:
            telegramUser.photo_url ||
            "",

        language: "uk",

        is_admin: false

    };
}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(
    pageName
) {

    const pages =
        $all(".page");


    pages.forEach(
        page => {

            page.classList.remove(
                "active"
            );

        }
    );


    const target =
        document.getElementById(
            `page-${pageName}`
        );


    if (!target) {
        return;
    }


    target.classList.add(
        "active"
    );


    const navItems =
        $all(".nav-item");


    navItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page === pageName
            );

        }
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );


    /*
       Довантажуємо потрібні дані
       тільки коли сторінка відкривається.
    */

    if (pageName === "tasks") {
        loadTasks();
    }


    if (pageName === "history") {
        loadHistory();
    }


    if (pageName === "bonus") {
        loadBonus();
    }


    if (pageName === "referrals") {
        loadReferrals();
    }


    if (pageName === "admin") {

        if (state.isAdmin) {
            loadAdmin();
        }

    }
}


/* =========================================================
   NAVIGATION EVENTS
========================================================= */

$all(
    "[data-page]"
).forEach(
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


/* =========================================================
   TOP SUPPORT
========================================================= */

const topSupport =
    $("#top-support-button");


if (topSupport) {

    topSupport.addEventListener(
        "click",
        () => {
            showPage("support");
        }
    );

}


/* =========================================================
   RENDER AVATAR
========================================================= */

function renderAvatar(
    element,
    user
) {

    if (!element) {
        return;
    }


    const avatar =
        user &&
        (
            user.avatar_url ||
            user.photo_url
        );


    if (avatar) {

        element.innerHTML =
            `<img src="${escapeHtmlAttribute(avatar)}" alt="">`;

        return;
    }


    const name =
        user &&
        (
            user.name ||
            user.first_name
        )
        ? (
            user.name ||
            user.first_name
        )
        : "К";


    element.textContent =
        name
            .trim()
            .charAt(0)
            .toUpperCase();
}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeHtmlAttribute(
    value
) {

    return escapeHtml(value);
}


/* =========================================================
   RENDER USER
========================================================= */

function renderUser() {

    if (!state.user) {
        return;
    }


    const user =
        state.user;


    const name =
        user.name ||
        user.first_name ||
        "Користувач";


    const username =
        user.username
            ? (
                String(user.username)
                    .startsWith("@")
                    ? String(user.username)
                    : `@${user.username}`
            )
            : "Username не вказано";


    const id =
        user.id ||
        user.telegram_id ||
        "—";


    const balance =
        user.balance ??
        user.amount ??
        0;


    const referrals =
        user.referrals ??
        user.referral_count ??
        0;


    const earned =
        user.earned ??
        user.total_earned ??
        user.referral_earned ??
        0;


    const tasksCompleted =
        user.tasks_completed ??
        user.completed_tasks ??
        0;



    /* HOME */

    const homeName =
        $("#home-name");


    if (homeName) {
        homeName.textContent =
            name;
    }


    const homeUsername =
        $("#home-username");


    if (homeUsername) {
        homeUsername.textContent =
            username;
    }


    const balanceValue =
        $("#balance-value");


    if (balanceValue) {

        balanceValue.textContent =
            money(balance);

    }


    /* PROFILE */

    const profileName =
        $("#profile-name");


    if (profileName) {
        profileName.textContent =
            name;
    }


    const profileUsername =
        $("#profile-username");


    if (profileUsername) {
        profileUsername.textContent =
            username;
    }


    const detailName =
        $("#detail-name");


    if (detailName) {
        detailName.textContent =
            name;
    }


    const detailUsername =
        $("#detail-username");


    if (detailUsername) {
        detailUsername.textContent =
            username;
    }


    const detailId =
        $("#detail-id");


    if (detailId) {
        detailId.textContent =
            String(id);
    }


    const profileBalance =
        $("#profile-balance");


    if (profileBalance) {
        profileBalance.textContent =
            money(balance);
    }


    const profileReferrals =
        $("#profile-referrals");


    if (profileReferrals) {
        profileReferrals.textContent =
            referrals;
    }


    const profileTasks =
        $("#profile-tasks");


    if (profileTasks) {
        profileTasks.textContent =
            tasksCompleted;
    }


    const profileEarned =
        $("#profile-earned");


    if (profileEarned) {
        profileEarned.textContent =
            money(earned);
    }


    /* REFERRALS */

    const referralCount =
        $("#referral-count");


    if (referralCount) {
        referralCount.textContent =
            referrals;
    }


    const referralEarned =
        $("#referral-earned");


    if (referralEarned) {
        referralEarned.textContent =
            money(
                user.referral_earned ??
                user.referrals_earned ??
                0
            );
    }


    /* AVATARS */

    renderAvatar(
        $("#home-avatar"),
        user
    );


    renderAvatar(
        $("#profile-avatar"),
        user
    );


    /* ADMIN */

    state.isAdmin =
        Boolean(
            user.is_admin ||
            user.admin ||
            user.isAdmin
        );


    const adminButton =
        $("#open-admin");


    if (adminButton) {

        adminButton.style.display =
            state.isAdmin
                ? "flex"
                : "none";

    }


    /* LANGUAGE */

    if (
        user.language === "ru" ||
        user.language === "uk"
    ) {

        state.language =
            user.language;

    }

}


/* =========================================================
   LOAD USER
========================================================= */

async function loadUser() {

    const localUser =
        createLocalUser();


    if (localUser) {

        state.user =
            localUser;

        renderUser();

    }


    /*
       Якщо API не налаштований,
       не зависаємо на заставці.
    */

    if (
        !API_BASE ||
        API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    ) {

        console.warn(
            "API_BASE ще не налаштований."
        );

        return;

    }


    const data =
        await safeApi(
            "/api/me",
            {
                method: "GET"
            },
            null
        );


    if (!data) {
        return;
    }


    /*
       Підтримуємо кілька типових
       форматів відповіді API.
    */

    state.user =
        data.user ||
        data;


    renderUser();
}


/* =========================================================
   LOAD SPONSORS
========================================================= */

async function loadSponsors() {

    const container =
        $("#home-sponsors");


    if (!container) {
        return;
    }


    const block =
        $("#home-sponsors-block");


    if (
        !API_BASE ||
        API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    ) {

        /*
           Не показуємо вигаданих
           тестових спонсорів.
        */

        if (block) {
            block.style.display = "none";
        }

        return;
    }


    const data =
        await safeApi(
            "/api/sponsors",
            {
                method: "GET"
            },
            []
        );


    const sponsors =
        Array.isArray(data)
            ? data
            : (
                data &&
                Array.isArray(data.sponsors)
                    ? data.sponsors
                    : []
            );


    state.sponsors =
        sponsors;


    /*
       Якщо активних спонсорів немає,
       весь блок прибираємо.
    */

    if (
        state.sponsors.length === 0
    ) {

        if (block) {
            block.style.display = "none";
        }

        return;
    }


    if (block) {
        block.style.display = "";
    }


    renderSponsors();
}


/* =========================================================
   RENDER SPONSORS
========================================================= */

function renderSponsors() {

    const container =
        $("#home-sponsors");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    state.sponsors.forEach(
        sponsor => {

            const title =
                sponsor.title ||
                sponsor.name ||
                sponsor.channel_name ||
                "Канал";


            const username =
                sponsor.username ||
                sponsor.channel_username ||
                "";


            const url =
                sponsor.url ||
                sponsor.link ||
                sponsor.channel_url ||
                "#";


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "sponsor-card";


            card.innerHTML = `

                <div class="sponsor-avatar">
                    #
                </div>

                <div class="sponsor-info">

                    <div class="sponsor-title">
                        ${escapeHtml(title)}
                    </div>

                    <div class="sponsor-username">
                        ${escapeHtml(username)}
                    </div>

                </div>

                <button
                    class="sponsor-button"
                    type="button">

                    Відкрити

                </button>

            `;


            const button =
                card.querySelector(
                    ".sponsor-button"
                );


            if (button) {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        openExternal(
                            url
                        );

                    }
                );

            }


            container.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   OPEN EXTERNAL
========================================================= */

function openExternal(
    url
) {

    if (
        !url ||
        url === "#"
    ) {
        return;
    }


    try {

        if (
            tg &&
            tg.openTelegramLink &&
            url.includes("t.me/")
        ) {

            tg.openTelegramLink(
                url
            );

            return;
        }


        if (
            tg &&
            tg.openLink
        ) {

            tg.openLink(
                url
            );

            return;
        }


        window.open(
            url,
            "_blank"
        );

    } catch {

        window.open(
            url,
            "_blank"
        );

    }
}


/* =========================================================
   LOAD TASKS
========================================================= */

async function loadTasks() {

    const container =
        $("#tasks-list");


    if (!container) {
        return;
    }


    if (
        !API_BASE ||
        API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    ) {

        container.innerHTML = `

            <div class="error-card">
                API ще не підключено.
            </div>

        `;

        return;
    }


    container.innerHTML = `

        <div class="loading-card">
            Завантаження завдань...
        </div>

    `;


    const data =
        await safeApi(
            "/api/tasks",
            {
                method: "GET"
            },
            []
        );


    const tasks =
        Array.isArray(data)
            ? data
            : (
                data &&
                Array.isArray(data.tasks)
                    ? data.tasks
                    : []
            );


    state.tasks =
        tasks;


    renderTasks();
}


/* =========================================================
   RENDER TASKS
========================================================= */

function renderTasks() {

    const container =
        $("#tasks-list");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        state.tasks.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-small">
                Наразі доступних завдань немає.
            </div>

        `;

        return;
    }


    state.tasks.forEach(
        task => {

            const id =
                task.id ||
                task.task_id;


            const title =
                task.title ||
                task.name ||
                "Завдання";


            const reward =
                task.reward ??
                task.amount ??
                0;


            const url =
                task.url ||
                task.link ||
                "#";


            const completed =
                Boolean(
                    task.completed ||
                    task.is_completed
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "task-card";


            card.innerHTML = `

                <div class="task-card-top">

                    <div class="task-icon">
                        ✓
                    </div>

                    <div class="task-main">

                        <div class="task-title">
                            ${escapeHtml(title)}
                        </div>

                        <div class="task-reward">
                            +${money(reward)} ₴
                        </div>

                    </div>

                </div>

                <button
                    class="task-action"
                    type="button"
                    ${completed ? "disabled" : ""}>

                    ${
                        completed
                            ? "Виконано"
                            : "Відкрити завдання"
                    }

                </button>

            `;


            const button =
                card.querySelector(
                    ".task-action"
                );


            if (
                button &&
                !completed
            ) {

                button.addEventListener(
                    "click",
                    async () => {

                        if (url !== "#") {

                            openExternal(
                                url
                            );

                        }


                        /*
                           Після відкриття посилання
                           повідомляємо API про виконання.

                           Фактичну перевірку має
                           робити бекенд.
                        */

                        if (id) {

                            await completeTask(
                                id
                            );

                        }

                    }
                );

            }


            container.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   COMPLETE TASK
========================================================= */

async function completeTask(
    taskId
) {

    if (
        !API_BASE ||
        API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    ) {
        return;
    }


    const result =
        await safeApi(
            `/api/tasks/${encodeURIComponent(taskId)}/complete`,
            {
                method: "POST"
            },
            null
        );


    if (!result) {
        return;
    }


    if (
        result.user
    ) {

        state.user =
            result.user;

        renderUser();

    }


    await loadTasks();
}


/* =========================================================
   LOAD REFERRALS
========================================================= */

async function loadReferrals() {

    if (
        !API_BASE ||
        API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    ) {
        return;
    }


    const data =
        await safeApi(
            "/api/referrals",
            {
                method: "GET"
            },
            null
        );


    if (!data) {
        return;
    }


    const count =
        data.count ??
        data.referrals ??
        0;


    const earned =
        data.earned ??
        data.total_earned ??
        0;


    const link =
        data.referral_link ||
        data.link ||
        "";


    const referralCount =
        $("#referral-count");


    if (referralCount) {
        referralCount.textContent =
            count;
    }


    const referralEarned =
        $("#referral-earned");


    if (referralEarned) {
        referralEarned.textContent =
            money(earned);
    }


    setReferralLink(
        link
    );
}


/* =========================================================
   REFERRAL LINK
========================================================= */

function setReferralLink(
    link
) {

    const element =
        $("#referral-link");


    if (!element) {
        return;
    }


    if (link) {

        element.textContent =
            link;

        element.dataset.link =
            link;

        return;
    }


    /*
       Не вигадуємо реферальне посилання,
       якщо бот не передав його.
    */

    element.textContent =
        "Посилання недоступне";

    element.dataset.link =
        "";
}


/* =========================================================
   COPY REFERRAL
========================================================= */

const copyReferral =
    $("#copy-referral");


if (copyReferral) {

    copyReferral.addEventListener(
        "click",
        async () => {

            const element =
                $("#referral-link");


            const link =
                element &&
                element.dataset.link
                    ? element.dataset.link
                    : "";


            if (!link) {

                showTelegramAlert(
                    "Реферальне посилання ще недоступне."
                );

                return;
            }


            try {

                await navigator.clipboard.writeText(
                    link
                );


                showTelegramAlert(
                    "Посилання скопійовано."
                );


            } catch {

                showTelegramAlert(
                    "Не вдалося скопіювати посилання."
                );

            }

        }
    );

}


/* =========================================================
   BONUS
========================================================= */

async function loadBonus() {

    const button =
        $("#claim-bonus");


    const status =
        $("#bonus-status");


    const amount =
        $("#bonus-amount");


    if (
        !button ||
        !status ||
        !amount
    ) {
        return;
    }


    if (
        !API_BASE ||
        API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    ) {

        status.textContent =
            "API ще не підключено.";

        button.disabled =
            true;

        return;
    }


    const data =
        await safeApi(
            "/api/bonus/daily",
            {
                method: "GET"
            },
            null
        );


    if (!data) {

        status.textContent =
            "Не вдалося отримати дані.";

        button.disabled =
            true;

        return;
    }


    const reward =
        data.reward ??
        data.amount ??
        0;


    amount.textContent =
        money(reward);


    const claimed =
        Boolean(
            data.claimed ||
            data.received ||
            data.already_claimed
        );


    if (claimed) {

        status.textContent =
            data.message ||
            "Бонус вже отримано.";

        button.disabled =
            true;

        return;
    }


    status.textContent =
        data.message ||
        "Бонус доступний.";

    button.disabled =
        false;
}


/* =========================================================
   CLAIM BONUS
========================================================= */

const claimBonus =
    $("#claim-bonus");


if (claimBonus) {

    claimBonus.addEventListener(
        "click",
        async () => {

            claimBonus.disabled =
                true;


            const result =
                await safeApi(
                    "/api/bonus/daily",
                    {
                        method: "POST"
                    },
                    null
                );


            if (!result) {

                claimBonus.disabled =
                    false;

                showTelegramAlert(
                    "Не вдалося отримати бонус."
                );

                return;
            }


            if (
                result.user
            ) {

                state.user =
                    result.user;

                renderUser();

            }


            const status =
                $("#bonus-status");


            if (status) {

                status.textContent =
                    result.message ||
                    "Бонус отримано.";

            }


            showTelegramAlert(
                result.message ||
                "Бонус отримано."
            );

        }
    );

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


    if (
        !API_BASE ||
        API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    ) {

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


    const data =
        await safeApi(
            "/api/history",
            {
                method: "GET"
            },
            []
        );


    const history =
        Array.isArray(data)
            ? data
            : (
                data &&
                Array.isArray(data.history)
                    ? data.history
                    : []
            );


    state.history =
        history;


    renderHistory();
}


/* =========================================================
   RENDER HISTORY
========================================================= */

function renderHistory() {

    const container =
        $("#history-list");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        state.history.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-small">
                Історія операцій порожня.
            </div>

        `;

        return;
    }


    state.history.forEach(
        item => {

            const title =
                item.title ||
                item.description ||
                item.type ||
                "Операція";


            const value =
                Number(
                    item.amount ??
                    item.value ??
                    0
                );


            const date =
                item.created_at ||
                item.date ||
                "";


            const isPlus =
                value >= 0;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "history-item";


            element.innerHTML = `

                <div class="history-icon">
                    ${isPlus ? "+" : "−"}
                </div>

                <div class="history-main">

                    <div class="history-title">
                        ${escapeHtml(title)}
                    </div>

                    <div class="history-date">
                        ${escapeHtml(formatDate(date))}
                    </div>

                </div>

                <div class="
                    history-amount
                    ${isPlus ? "plus" : "minus"}
                ">

                    ${isPlus ? "+" : ""}
                    ${money(value)} ₴

                </div>

            `;


            container.appendChild(
                element
            );

        }
    );
}


/* =========================================================
   DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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


/* =========================================================
   SUPPORT
========================================================= */

const openSupport =
    $("#open-support");


if (openSupport) {

    openSupport.addEventListener(
        "click",
        () => {

            /*
               Відкриваємо Telegram-бота,
               якщо бекенд передав support_url.
            */

            const supportUrl =
                state.user &&
                state.user.support_url
                    ? state.user.support_url
                    : "";


            if (supportUrl) {

                openExternal(
                    supportUrl
                );

                return;
            }


            showTelegramAlert(
                "Напиши повідомлення адміністратору через бота."
            );

        }
    );

}


/* =========================================================
   ADMIN
========================================================= */

async function loadAdmin() {

    if (!state.isAdmin) {
        return;
    }


    if (
        !API_BASE ||
        API_BASE.includes(
            "YOUR-PUBLIC-API-DOMAIN"
        )
    ) {
        return;
    }


    const data =
        await safeApi(
            "/api/admin/stats",
            {
                method: "GET"
            },
            null
        );


    if (!data) {
        return;
    }


    const users =
        data.users ??
        data.users_count ??
        0;


    const balance =
        data.balance ??
        data.total_balance ??
        0;


    const tasks =
        data.tasks ??
        data.tasks_count ??
        0;


    const sponsors =
        data.sponsors ??
        data.sponsors_count ??
        0;


    const adminUsers =
        $("#admin-users");


    if (adminUsers) {
        adminUsers.textContent =
            users;
    }


    const adminBalance =
        $("#admin-balance");


    if (adminBalance) {
        adminBalance.textContent =
            money(balance);
    }


    const adminTasks =
        $("#admin-tasks");


    if (adminTasks) {
        adminTasks.textContent =
            tasks;
    }


    const adminSponsors =
        $("#admin-sponsors");


    if (adminSponsors) {
        adminSponsors.textContent =
            sponsors;
    }
}


/* =========================================================
   ADMIN ADD TASK
========================================================= */

const adminAddTask =
    $("#admin-add-task");


if (adminAddTask) {

    adminAddTask.addEventListener(
        "click",
        async () => {

            const title =
                $("#admin-task-title")
                    ?.value
                    .trim();


            const url =
                $("#admin-task-url")
                    ?.value
                    .trim();


            const reward =
                Number(
                    $("#admin-task-reward")
                        ?.value
                );


            if (
                !title ||
                !url ||
                !Number.isFinite(reward) ||
                reward <= 0
            ) {

                showTelegramAlert(
                    "Заповни всі поля."
                );

                return;
            }


            adminAddTask.disabled =
                true;


            const result =
                await safeApi(
                    "/api/admin/tasks",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                {
                                    title,
                                    url,
                                    reward
                                }
                            )
                    },
                    null
                );


            adminAddTask.disabled =
                false;


            if (!result) {

                showTelegramAlert(
                    "Не вдалося додати завдання."
                );

                return;
            }


            $("#admin-task-title")
                .value = "";


            $("#admin-task-url")
                .value = "";


            $("#admin-task-reward")
                .value = "";


            showTelegramAlert(
                "Завдання додано."
            );


            await loadAdmin();

        }
    );

}


/* =========================================================
   ADMIN ADD SPONSOR
========================================================= */

const adminAddSponsor =
    $("#admin-add-sponsor");


if (adminAddSponsor) {

    adminAddSponsor.addEventListener(
        "click",
        async () => {

            const title =
                $("#admin-sponsor-title")
                    ?.value
                    .trim();


            const username =
                $("#admin-sponsor-username")
                    ?.value
                    .trim();


            const url =
                $("#admin-sponsor-url")
                    ?.value
                    .trim();


            if (
                !title ||
                !url
            ) {

                showTelegramAlert(
                    "Заповни назву та посилання."
                );

                return;
            }


            adminAddSponsor.disabled =
                true;


            const result =
                await safeApi(
                    "/api/admin/sponsors",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                {
                                    title,
                                    username,
                                    url
                                }
                            )
                    },
                    null
                );


            adminAddSponsor.disabled =
                false;


            if (!result) {

                showTelegramAlert(
                    "Не вдалося додати спонсора."
                );

                return;
            }


            $("#admin-sponsor-title")
                .value = "";


            $("#admin-sponsor-username")
                .value = "";


            $("#admin-sponsor-url")
                .value = "";


            showTelegramAlert(
                "Спонсора додано."
            );


            await loadAdmin();

            await loadSponsors();

        }
    );

}


/* =========================================================
   LANGUAGE
========================================================= */

const languageSelect =
    $("#language-select");


if (languageSelect) {

    languageSelect.value =
        state.language;


    languageSelect.addEventListener(
        "change",
        async event => {

            const language =
                event.target.value;


            if (
                language !== "uk" &&
                language !== "ru"
            ) {
                return;
            }


            state.language =
                language;


            if (
                !API_BASE ||
                API_BASE.includes(
                    "YOUR-PUBLIC-API-DOMAIN"
                )
            ) {
                return;
            }


            await safeApi(
                "/api/settings/language",
                {
                    method: "POST",

                    body:
                        JSON.stringify(
                            {
                                language
                            }
                        )
                },
                null
            );

        }
    );

}


/* =========================================================
   TELEGRAM ALERT
========================================================= */

function showTelegramAlert(
    message
) {

    if (
        tg &&
        tg.showAlert
    ) {

        tg.showAlert(
            String(message)
        );

        return;
    }


    window.alert(
        String(message)
    );
}


/* =========================================================
   LOADER
========================================================= */

const loader =
    $("#loader");


const loaderStartedAt =
    Date.now();


/*
   Заставка не зависає назавжди.

   Мінімальний час:
   1.8 секунди — щоб анімація встигла
   нормально показати корону та NightBorn.

   Максимальний час:
   10 хвилин — навіть якщо API
   повністю зависне.

   Якщо все завантажилося раніше,
   10 хвилин чекати НЕ потрібно.
*/

const MIN_LOADER_TIME =
    1800;


const MAX_LOADER_TIME =
    10 * 60 * 1000;


let loaderHidden =
    false;


function hideLoader() {

    if (
        loaderHidden ||
        !loader
    ) {
        return;
    }


    loaderHidden =
        true;


    const elapsed =
        Date.now() -
        loaderStartedAt;


    const remaining =
        Math.max(
            0,
            MIN_LOADER_TIME -
            elapsed
        );


    setTimeout(
        () => {

            loader.classList.add(
                "loader-hidden"
            );

        },
        remaining
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeApp() {

    try {

        await Promise.allSettled(
            [
                loadUser(),
                loadSponsors()
            ]
        );


        /*
           Якщо користувача отримали
           з API — оновлюємо інтерфейс.
        */

        if (state.user) {
            renderUser();
        }


        const languageSelect =
            $("#language-select");


        if (languageSelect) {

            languageSelect.value =
                state.language;

        }


        state.loaded =
            true;


    } catch (error) {

        console.error(
            "NightBorn initialization error:",
            error
        );

    } finally {

        /*
           Loader ховається навіть якщо
           API тимчасово недоступний.
        */

        hideLoader();

    }
}


/* =========================================================
   ABSOLUTE MAX LOADER TIME
========================================================= */

setTimeout(
    () => {

        hideLoader();

    },
    MAX_LOADER_TIME
);


/* =========================================================
   START
========================================================= */

initializeApp();
