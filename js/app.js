(() => {
    "use strict";

    /*
     * =====================================================
     * NIGHT CAPITAL
     * Головний JavaScript Mini App
     *
     * ВАЖЛИВО:
     * Тут НІКОЛИ не створюються фейкові спонсори.
     * Якщо API не відповідає — показується помилка.
     * Якщо API повертає 0 спонсорів — показується 0.
     * =====================================================
     */


    /* =====================================================
       НАЛАШТУВАННЯ API
       ===================================================== */

    const API_BASE =
        "https://YOUR-PUBLIC-API-DOMAIN";


    /* =====================================================
       TELEGRAM
       ===================================================== */

    const telegram =
        window.Telegram &&
        window.Telegram.WebApp
            ? window.Telegram.WebApp
            : null;


    if (telegram) {
        telegram.ready();
        telegram.expand();
    }


    /* =====================================================
       DOM
       ===================================================== */

    const elements = {

        playerAvatar:
            document.getElementById("playerAvatar"),

        playerName:
            document.getElementById("playerName"),

        playerUsername:
            document.getElementById("playerUsername"),

        playerBalance:
            document.getElementById("playerBalance"),

        profileAvatar:
            document.getElementById("profileAvatar"),

        profileName:
            document.getElementById("profileName"),

        profileUsername:
            document.getElementById("profileUsername"),

        profileId:
            document.getElementById("profileId"),

        profileBalance:
            document.getElementById("profileBalance"),

        referralCount:
            document.getElementById("referralCount"),

        sponsorCounter:
            document.getElementById("sponsorCounter"),

        sponsorLoading:
            document.getElementById("sponsorLoading"),

        sponsorError:
            document.getElementById("sponsorError"),

        sponsorErrorText:
            document.getElementById("sponsorErrorText"),

        sponsorList:
            document.getElementById("sponsorList"),

        noSponsors:
            document.getElementById("noSponsors"),

        retrySponsors:
            document.getElementById("retrySponsors"),

        closeApp:
            document.getElementById("closeApp"),

        balanceAction:
            document.getElementById("balanceAction"),

        profileAction:
            document.getElementById("profileAction"),

        adminPanel:
            document.getElementById("adminPanel"),

        closeAdmin:
            document.getElementById("closeAdmin"),

        adminContent:
            document.getElementById("adminContent"),

        toast:
            document.getElementById("toast")
    };


    /* =====================================================
       STATE
       ===================================================== */

    const state = {

        user: null,

        sponsors: [],

        subscribed: new Set(),

        currentPage: "home",

        isAdmin: false
    };


    /* =====================================================
       HELPERS
       ===================================================== */

    function showToast(message) {

        elements.toast.textContent =
            String(message);

        elements.toast.classList.add("show");

        clearTimeout(
            showToast.timeout
        );

        showToast.timeout =
            setTimeout(() => {

                elements.toast.classList.remove(
                    "show"
                );

            }, 2500);
    }


    function formatMoney(value) {

        const number =
            Number(value);

        if (!Number.isFinite(number)) {
            return "0.00 ₴";
        }

        return (
            number.toFixed(2) +
            " ₴"
        );
    }


    function getInitials(user) {

        if (!user) {
            return "?";
        }

        const first =
            String(
                user.first_name || ""
            ).trim();

        const last =
            String(
                user.last_name || ""
            ).trim();

        if (first && last) {
            return (
                first.charAt(0) +
                last.charAt(0)
            ).toUpperCase();
        }

        if (first) {
            return first
                .substring(0, 2)
                .toUpperCase();
        }

        return "?";
    }


    function telegramInitData() {

        if (!telegram) {
            return "";
        }

        return telegram.initData || "";
    }


    /* =====================================================
       API
       ===================================================== */

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const headers = {
            "Accept":
                "application/json",

            ...(options.headers || {})
        };


        const initData =
            telegramInitData();


        if (initData) {

            headers[
                "X-Telegram-Init-Data"
            ] = initData;
        }


        if (options.body) {

            headers[
                "Content-Type"
            ] = "application/json";
        }


        const response =
            await fetch(
                API_BASE + endpoint,
                {
                    ...options,
                    headers
                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "Сервер повернув некоректну відповідь."
            );
        }


        if (!response.ok) {

            throw new Error(
                data &&
                data.error
                    ? data.error
                    : `Помилка сервера: ${response.status}`
            );
        }


        if (
            data &&
            data.ok === false
        ) {

            throw new Error(
                data.error ||
                "Сервер відхилив запит."
            );
        }


        return data;
    }


    /* =====================================================
       USER
       ===================================================== */

    async function loadUser() {

        try {

            const data =
                await apiRequest(
                    "/api/me"
                );


            if (
                !data ||
                !data.user
            ) {

                throw new Error(
                    "Сервер не повернув дані користувача."
                );
            }


            state.user =
                data.user;


            state.isAdmin =
                Boolean(
                    data.user.is_admin
                );


            renderUser();

        } catch (error) {

            console.error(
                "USER ERROR:",
                error
            );


            elements.playerName.textContent =
                "Не вдалося завантажити";

            elements.playerUsername.textContent =
                "Помилка авторизації";

            elements.playerBalance.textContent =
                "—";

            showToast(
                "Не вдалося завантажити профіль."
            );
        }
    }


    function renderUser() {

        const user =
            state.user;


        if (!user) {
            return;
        }


        const firstName =
            user.first_name ||
            "Користувач";


        const username =
            user.username
                ? "@" + user.username
                : "Username відсутній";


        const balance =
            user.balance || 0;


        const initials =
            getInitials(user);


        elements.playerAvatar.textContent =
            initials;


        elements.profileAvatar.textContent =
            initials;


        elements.playerName.textContent =
            firstName;


        elements.playerUsername.textContent =
            username;


        elements.playerBalance.textContent =
            formatMoney(balance);


        elements.profileName.textContent =
            (
                user.first_name ||
                ""
            ) +
            (
                user.last_name
                    ? " " +
                      user.last_name
                    : ""
            ) ||
            "—";


        elements.profileUsername.textContent =
            username;


        elements.profileId.textContent =
            user.id
                ? String(user.id)
                : "—";


        elements.profileBalance.textContent =
            formatMoney(balance);


        if (
            typeof user.referrals_count !==
            "undefined"
        ) {

            elements.referralCount.textContent =
                String(
                    user.referrals_count
                );
        }
    }


    /* =====================================================
       SPONSORS
       ===================================================== */

    async function loadSponsors() {

        setSponsorLoading(
            true
        );


        try {

            const data =
                await apiRequest(
                    "/api/sponsors"
                );


            if (
                !data ||
                !Array.isArray(
                    data.sponsors
                )
            ) {

                throw new Error(
                    "Сервер не повернув правильний список спонсорів."
                );
            }


            /*
             * ЖОДНИХ ФЕЙКОВИХ ДАНИХ.
             * Беремо тільки те,
             * що реально прийшло від API.
             */

            state.sponsors =
                data.sponsors;


            renderSponsors();


        } catch (error) {

            console.error(
                "SPONSORS ERROR:",
                error
            );


            state.sponsors = [];


            showSponsorError(
                error.message
            );
        }
    }


    function setSponsorLoading(
        loading
    ) {

        if (loading) {

            elements.sponsorLoading.classList.remove(
                "hidden"
            );

            elements.sponsorError.classList.add(
                "hidden"
            );

            elements.sponsorList.innerHTML = "";

            elements.noSponsors.classList.add(
                "hidden"
            );

            return;
        }


        elements.sponsorLoading.classList.add(
            "hidden"
        );
    }


    function showSponsorError(
        message
    ) {

        elements.sponsorLoading.classList.add(
            "hidden"
        );

        elements.sponsorList.innerHTML = "";

        elements.noSponsors.classList.add(
            "hidden"
        );

        elements.sponsorError.classList.remove(
            "hidden"
        );

        elements.sponsorErrorText.textContent =
            message ||
            "Сервер недоступний.";

        elements.sponsorCounter.textContent =
            "0/0";
    }


    function renderSponsors() {

        elements.sponsorLoading.classList.add(
            "hidden"
        );

        elements.sponsorError.classList.add(
            "hidden"
        );

        elements.sponsorList.innerHTML = "";


        const sponsors =
            state.sponsors;


        elements.sponsorCounter.textContent =
            `0/${sponsors.length}`;


        if (!sponsors.length) {

            elements.noSponsors.classList.remove(
                "hidden"
            );

            return;
        }


        elements.noSponsors.classList.add(
            "hidden"
        );


        sponsors.forEach(
            sponsor => {

                elements.sponsorList.appendChild(
                    createSponsorCard(
                        sponsor
                    )
                );
            }
        );
    }


    function createSponsorCard(
        sponsor
    ) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "sponsor-card";


        const logo =
            document.createElement(
                "div"
            );

        logo.className =
            "sponsor-logo";


        if (
            sponsor.logo_url
        ) {

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                sponsor.logo_url;

            image.alt = "";

            image.className =
                "sponsor-logo";


            image.onerror =
                () => {

                    image.remove();

                    logo.textContent =
                        "📢";
                };


            card.appendChild(
                image
            );

        } else {

            logo.textContent =
                "📢";

            card.appendChild(
                logo
            );
        }


        const information =
            document.createElement(
                "div"
            );

        information.className =
            "sponsor-information";


        const name =
            document.createElement(
                "div"
            );

        name.className =
            "sponsor-name";

        name.textContent =
            sponsor.name ||
            "Без назви";


        const status =
            document.createElement(
                "div"
            );

        status.className =
            "sponsor-status";

        status.textContent =
            state.subscribed.has(
                sponsor.id
            )
                ? "Підписку підтверджено"
                : "Підписка не перевірена";


        if (
            state.subscribed.has(
                sponsor.id
            )
        ) {

            status.classList.add(
                "success"
            );
        }


        information.appendChild(
            name
        );

        information.appendChild(
            status
        );


        const buttons =
            document.createElement(
                "div"
            );

        buttons.className =
            "sponsor-buttons";


        const openButton =
            document.createElement(
                "button"
            );

        openButton.type =
            "button";

        openButton.className =
            "sponsor-button primary";

        openButton.textContent =
            "Відкрити";


        openButton.addEventListener(
            "click",
            () => {

                openSponsor(
                    sponsor.url
                );
            }
        );


        const checkButton =
            document.createElement(
                "button"
            );

        checkButton.type =
            "button";

        checkButton.className =
            "sponsor-button check";

        checkButton.textContent =
            state.subscribed.has(
                sponsor.id
            )
                ? "✓"
                : "Перевірити";


        if (
            state.subscribed.has(
                sponsor.id
            )
        ) {

            checkButton.disabled =
                true;
        }


        checkButton.addEventListener(
            "click",
            async () => {

                await checkSponsor(
                    sponsor,
                    status,
                    checkButton
                );
            }
        );


        buttons.appendChild(
            openButton
        );

        buttons.appendChild(
            checkButton
        );


        card.appendChild(
            information
        );

        card.appendChild(
            buttons
        );


        return card;
    }


    function openSponsor(
        url
    ) {

        if (!url) {

            showToast(
                "У цього спонсора немає посилання."
            );

            return;
        }


        if (
            telegram &&
            telegram.openTelegramLink &&
            url.startsWith(
                "https://t.me/"
            )
        ) {

            telegram.openTelegramLink(
                url
            );

            return;
        }


        window.open(
            url,
            "_blank"
        );
    }


    async function checkSponsor(
        sponsor,
        statusElement,
        button
    ) {

        button.disabled =
            true;

        const oldText =
            button.textContent;

        button.textContent =
            "...";


        try {

            const result =
                await apiRequest(
                    "/api/sponsor/check",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                sponsor_id:
                                    sponsor.id
                            })
                    }
                );


            if (
                result.subscribed
            ) {

                state.subscribed.add(
                    sponsor.id
                );


                statusElement.textContent =
                    "Підписку підтверджено";


                statusElement.classList.add(
                    "success"
                );


                button.textContent =
                    "✓";


                elements.sponsorCounter.textContent =
                    `${
                        state.subscribed.size
                    }/${state.sponsors.length}`;


                showToast(
                    "Підписку підтверджено."
                );


            } else {

                statusElement.textContent =
                    "Підписку не знайдено";


                button.textContent =
                    oldText;


                showToast(
                    "Підписку ще не знайдено."
                );
            }


        } catch (error) {

            console.error(
                "CHECK SPONSOR ERROR:",
                error
            );


            button.textContent =
                oldText;


            showToast(
                error.message ||
                "Помилка перевірки."
            );


        } finally {

            if (
                !state.subscribed.has(
                    sponsor.id
                )
            ) {

                button.disabled =
                    false;
            }
        }
    }


    /* =====================================================
       NAVIGATION
       ===================================================== */

    function switchPage(
        page
    ) {

        const pages =
            document.querySelectorAll(
                ".page"
            );


        const buttons =
            document.querySelectorAll(
                ".navigation-button"
            );


        pages.forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.id ===
                    `page-${page}`
                );
            }
        );


        buttons.forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.page ===
                    page
                );
            }
        );


        state.currentPage =
            page;
    }


    /* =====================================================
       ADMIN
       ===================================================== */

    function openAdmin() {

        if (
            !state.isAdmin
        ) {

            showToast(
                "У вас немає доступу до адмін-панелі."
            );

            return;
        }


        elements.adminPanel.classList.remove(
            "hidden"
        );
    }


    function closeAdmin() {

        elements.adminPanel.classList.add(
            "hidden"
        );
    }


    async function loadAdminPage(
        page
    ) {

        if (
            !state.isAdmin
        ) {

            showToast(
                "Доступ заборонено."
            );

            return;
        }


        elements.adminContent.innerHTML =
            `
                <div class="loading-card">
                    Завантаження...
                </div>
            `;


        try {

            let endpoint =
                "/api/admin/" +
                page;


            const data =
                await apiRequest(
                    endpoint
                );


            renderAdminPage(
                page,
                data
            );


        } catch (error) {

            elements.adminContent.innerHTML =
                `
                    <div class="error-card">
                        <div class="error-icon">
                            ⚠️
                        </div>

                        <div>
                            <strong>
                                Не вдалося завантажити
                            </strong>

                            <p>
                                ${escapeHtml(
                                    error.message
                                )}
                            </p>
                        </div>
                    </div>
                `;
        }
    }


    function renderAdminPage(
        page,
        data
    ) {

        /*
         * Дані адмін-панелі приходять
         * тільки з API.
         */

        if (
            page === "statistics"
        ) {

            elements.adminContent.innerHTML =
                `
                    <div class="profile-card">
                        <div class="profile-row">
                            <span>Користувачі</span>
                            <strong>
                                ${
                                    data.users ??
                                    0
                                }
                            </strong>
                        </div>

                        <div class="profile-row">
                            <span>Спонсори</span>
                            <strong>
                                ${
                                    data.sponsors ??
                                    0
                                }
                            </strong>
                        </div>

                        <div class="profile-row">
                            <span>Активні спонсори</span>
                            <strong>
                                ${
                                    data.active_sponsors ??
                                    0
                                }
                            </strong>
                        </div>
                    </div>
                `;

            return;
        }


        if (
            page === "sponsors"
        ) {

            renderAdminSponsors(
                data
            );

            return;
        }


        if (
            page === "users"
        ) {

            renderAdminUsers(
                data
            );

            return;
        }


        if (
            page === "tasks"
        ) {

            elements.adminContent.innerHTML =
                `
                    <div class="empty-card">
                        <div class="empty-icon">
                            📋
                        </div>

                        <strong>
                            Завдання
                        </strong>

                        <p>
                            Список завдань буде
                            отримано з API.
                        </p>
                    </div>
                `;

            return;
        }


        elements.adminContent.innerHTML =
            `
                <div class="empty-card">
                    Дані відсутні.
                </div>
            `;
    }


    function renderAdminSponsors(
        data
    ) {

        const list =
            Array.isArray(
                data.sponsors
            )
                ? data.sponsors
                : [];


        if (!list.length) {

            elements.adminContent.innerHTML =
                `
                    <div class="empty-card">
                        <div class="empty-icon">
                            📢
                        </div>

                        <strong>
                            Спонсорів немає
                        </strong>

                        <p>
                            У базі немає жодного спонсора.
                        </p>
                    </div>
                `;

            return;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "sponsor-list";


        list.forEach(
            sponsor => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "sponsor-card";


                const info =
                    document.createElement(
                        "div"
                    );

                info.className =
                    "sponsor-information";


                const name =
                    document.createElement(
                        "div"
                    );

                name.className =
                    "sponsor-name";

                name.textContent =
                    sponsor.name ||
                    "Без назви";


                const status =
                    document.createElement(
                        "div"
                    );

                status.className =
                    "sponsor-status";

                status.textContent =
                    sponsor.is_active
                        ? "🟢 Активний"
                        : "🔴 Вимкнений";


                info.appendChild(
                    name
                );

                info.appendChild(
                    status
                );


                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "sponsor-button primary";

                button.textContent =
                    sponsor.is_active
                        ? "Вимкнути"
                        : "Увімкнути";


                button.addEventListener(
                    "click",
                    async () => {

                        await toggleAdminSponsor(
                            sponsor.id,
                            !sponsor.is_active
                        );
                    }
                );


                item.appendChild(
                    info
                );

                item.appendChild(
                    button
                );

                wrapper.appendChild(
                    item
                );
            }
        );


        elements.adminContent.innerHTML =
            "";

        elements.adminContent.appendChild(
            wrapper
        );
    }


    async function toggleAdminSponsor(
        sponsorId,
        active
    ) {

        try {

            await apiRequest(
                "/api/admin/sponsors/toggle",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            sponsor_id:
                                sponsorId,

                            active:
                                active
                        })
                }
            );


            showToast(
                active
                    ? "Спонсора увімкнено."
                    : "Спонсора вимкнено."
            );


            await loadAdminPage(
                "sponsors"
            );


            await loadSponsors();


        } catch (error) {

            showToast(
                error.message
            );
        }
    }


    function renderAdminUsers(
        data
    ) {

        const users =
            Array.isArray(
                data.users
            )
                ? data.users
                : [];


        if (!users.length) {

            elements.adminContent.innerHTML =
                `
                    <div class="empty-card">
                        Користувачів немає.
                    </div>
                `;

            return;
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "profile-card";


        users.forEach(
            user => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "profile-row";


                const left =
                    document.createElement(
                        "span"
                    );


                left.textContent =
                    user.username
                        ? "@" +
                          user.username
                        : (
                            user.first_name ||
                            "Користувач"
                        );


                const right =
                    document.createElement(
                        "strong"
                    );


                right.textContent =
                    formatMoney(
                        user.balance
                    );


                row.appendChild(
                    left
                );

                row.appendChild(
                    right
                );


                wrapper.appendChild(
                    row
                );
            }
        );


        elements.adminContent.innerHTML =
            "";

        elements.adminContent.appendChild(
            wrapper
        );
    }


    /* =====================================================
       SECURITY
       ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(value)
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


    /* =====================================================
       EVENTS
       ===================================================== */

    document
        .querySelectorAll(
            ".navigation-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        switchPage(
                            button.dataset.page
                        );
                    }
                );
            }
        );


    elements.closeApp
        .addEventListener(
            "click",
            () => {

                if (telegram) {
                    telegram.close();
                }
            }
        );


    elements.retrySponsors
        .addEventListener(
            "click",
            () => {

                loadSponsors();
            }
        );


    elements.balanceAction
        .addEventListener(
            "click",
            () => {

                switchPage(
                    "profile"
                );

                showToast(
                    "Твій баланс: " +
                    formatMoney(
                        state.user
                            ? state.user.balance
                            : 0
                    )
                );
            }
        );


    elements.profileAction
        .addEventListener(
            "click",
            () => {

                switchPage(
                    "profile"
                );
            }
        );


    elements.closeAdmin
        .addEventListener(
            "click",
            closeAdmin
        );


    document
        .querySelectorAll(
            ".admin-card"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        loadAdminPage(
                            button.dataset.adminPage
                        );
                    }
                );
            }
        );


    /* =====================================================
       START
       ===================================================== */

    async function start() {

        if (!telegram) {

            showToast(
                "Відкрий Night Capital через Telegram."
            );
        }


        await Promise.all([
            loadUser(),
            loadSponsors()
        ]);
    }


    start();

})();
