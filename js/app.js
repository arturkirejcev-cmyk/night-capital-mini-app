"use strict";

/*
============================================================
NIGHTBORN ☾ — MINI APP
============================================================
*/

const tg = window.Telegram?.WebApp;

const API_BASE = "https://YOUR-PUBLIC-API-DOMAIN";

let currentUser = null;
let sponsors = [];


// ==========================================================
// TELEGRAM
// ==========================================================

function initTelegram() {

    if (!tg) {
        return;
    }

    tg.ready();
    tg.expand();

    if (tg.setHeaderColor) {
        tg.setHeaderColor("#02050d");
    }

    if (tg.setBackgroundColor) {
        tg.setBackgroundColor("#02050d");
    }
}


// ==========================================================
// API
// ==========================================================

async function api(path, options = {}) {

    if (!tg || !tg.initData) {
        throw new Error(
            "Mini App потрібно відкрити через Telegram."
        );
    }

    const headers = {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": tg.initData,
        ...(options.headers || {})
    };

    const response = await fetch(
        API_BASE + path,
        {
            ...options,
            headers
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "Сервер повернув неправильну відповідь."
        );
    }

    if (!response.ok || data.ok === false) {

        if (response.status === 401) {
            throw new Error(
                "Помилка авторизації Telegram."
            );
        }

        if (response.status === 403) {
            throw new Error(
                "Доступ заборонено."
            );
        }

        throw new Error(
            data.error ||
            data.message ||
            "Помилка сервера."
        );
    }

    return data;
}


// ==========================================================
// LOADER
// ==========================================================

function hideLoader() {

    const loader =
        document.getElementById("loader");

    const app =
        document.getElementById("app");

    if (!loader || !app) {
        return;
    }

    setTimeout(() => {

        loader.style.transition =
            "opacity .5s ease";

        loader.style.opacity = "0";

        setTimeout(() => {

            loader.remove();
            app.classList.remove("hidden");

        }, 500);

    }, 700);
}


// ==========================================================
// AVATAR
// ==========================================================

function setAvatar(img, user) {

    if (!img) {
        return;
    }

    if (
        tg &&
        tg.initDataUnsafe &&
        tg.initDataUnsafe.user &&
        tg.initDataUnsafe.user.photo_url
    ) {

        img.src =
            tg.initDataUnsafe.user.photo_url;

        img.onerror = () => {
            img.src = "";
        };

        return;
    }

    img.src = "";
}


// ==========================================================
// USER
// ==========================================================

function renderUser(user) {

    currentUser = user;

    const name =
        user.first_name ||
        "Користувач";

    const username =
        user.username
            ? "@" + user.username
            : "username не вказано";

    const balance =
        Number(user.balance || 0)
            .toFixed(2);

    document.getElementById(
        "welcomeName"
    ).textContent =
        `${name} ☾`;

    document.getElementById(
        "playerName"
    ).textContent =
        name;

    document.getElementById(
        "playerUsername"
    ).textContent =
        username;

    document.getElementById(
        "playerId"
    ).textContent =
        `ID: ${user.id}`;

    document.getElementById(
        "balance"
    ).textContent =
        `${balance} ₴`;

    document.getElementById(
        "referrals"
    ).textContent =
        user.referrals || 0;

    document.getElementById(
        "refEarned"
    ).textContent =
        `${Number(
            user.referral_earned || 0
        ).toFixed(2)} ₴`;

    document.getElementById(
        "referralLink"
    ).value =
        user.referral_link || "";

    document.getElementById(
        "profileId"
    ).textContent =
        user.id;

    document.getElementById(
        "profileBalance"
    ).textContent =
        `${balance} ₴`;

    document.getElementById(
        "profileRefs"
    ).textContent =
        user.referrals || 0;

    document.getElementById(
        "profileRefEarned"
    ).textContent =
        `${Number(
            user.referral_earned || 0
        ).toFixed(2)} ₴`;

    document.getElementById(
        "profileFullName"
    ).textContent =
        name;

    document.getElementById(
        "profileUsername"
    ).textContent =
        username;

    setAvatar(
        document.getElementById("avatar"),
        user
    );

    setAvatar(
        document.getElementById("profileAvatar"),
        user
    );
}


// ==========================================================
// SPONSORS
// ==========================================================

function renderSponsors(list) {

    const container =
        document.getElementById(
            "sponsors"
        );

    const counter =
        document.getElementById(
            "sponsorCounter"
        );

    sponsors = Array.isArray(list)
        ? list
        : [];

    counter.textContent =
        `0/${sponsors.length}`;

    container.innerHTML = "";

    if (!sponsors.length) {

        container.innerHTML = `
            <div class="empty-state">
                Зараз активних спонсорів немає.
            </div>
        `;

        return;
    }

    sponsors.forEach((sponsor, index) => {

        const card =
            document.createElement("div");

        card.className =
            "sponsor-card";

        const logo =
            sponsor.logo_url ||
            "";

        card.innerHTML = `
            <img
                class="sponsor-logo"
                src="${escapeHtml(logo)}"
                alt=""
                onerror="this.style.visibility='hidden'"
            >

            <div class="sponsor-info">

                <div class="sponsor-name">
                    ${escapeHtml(
                        sponsor.name
                    )}
                </div>

                <div class="sponsor-status">
                    Підпишись та перевір
                </div>

            </div>

            <button
                class="sponsor-btn"
                data-id="${sponsor.id}"
                data-index="${index}"
            >
                Перейти
            </button>
        `;

        container.appendChild(card);
    });

    container
        .querySelectorAll(".sponsor-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        Number(
                            button.dataset.id
                        );

                    const index =
                        Number(
                            button.dataset.index
                        );

                    await openSponsor(
                        id,
                        index
                    );
                }
            );

        });
}


async function openSponsor(
    sponsorId,
    index
) {

    const sponsor =
        sponsors.find(
            x =>
                Number(x.id) ===
                Number(sponsorId)
        );

    if (!sponsor) {
        return;
    }

    if (tg) {

        tg.openTelegramLink(
            sponsor.url
        );

    } else {

        window.open(
            sponsor.url,
            "_blank"
        );
    }

    setTimeout(async () => {

        try {

            const result =
                await api(
                    "/api/sponsor/check",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            sponsor_id:
                                sponsorId
                        })
                    }
                );

            if (result.subscribed) {

                if (
                    currentUser
                ) {
                    await reloadUser();
                }

                showToast(
                    "✅ Підписку підтверджено"
                );

            } else {

                showToast(
                    "❌ Підписку ще не підтверджено"
                );
            }

        } catch (error) {

            showToast(
                error.message
            );

        }

    }, 1200);
}


// ==========================================================
// HISTORY
// ==========================================================

async function loadHistory() {

    const container =
        document.getElementById(
            "history"
        );

    container.innerHTML =
        `<div class="empty-state">
            Завантаження...
        </div>`;

    try {

        const data =
            await api(
                "/api/history"
            );

        container.innerHTML = "";

        if (!data.history.length) {

            container.innerHTML =
                `<div class="empty-state">
                    Історія поки порожня.
                </div>`;

            return;
        }

        data.history.forEach(
            item => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "history-item";

                const positive =
                    Number(item.amount) >= 0;

                const sign =
                    positive
                        ? "+"
                        : "";

                row.innerHTML = `
                    <div class="history-main">

                        <strong>
                            ${escapeHtml(
                                item.description ||
                                item.type
                            )}
                        </strong>

                        <strong class="${
                            positive
                                ? "history-positive"
                                : "history-negative"
                        }">
                            ${sign}${Number(
                                item.amount
                            ).toFixed(2)} ₴
                        </strong>

                    </div>

                    <div class="history-desc">
                        Баланс:
                        ${Number(
                            item.balance_after
                        ).toFixed(2)} ₴
                    </div>
                `;

                container.appendChild(row);
            }
        );

    } catch (error) {

        container.innerHTML =
            `<div class="empty-state">
                ${escapeHtml(
                    error.message
                )}
            </div>`;
    }
}


// ==========================================================
// BONUS
// ==========================================================

async function claimBonus() {

    const button =
        document.getElementById(
            "claimBonus"
        );

    const message =
        document.getElementById(
            "bonusMessage"
        );

    button.disabled = true;

    try {

        const data =
            await api(
                "/api/bonus/daily",
                {
                    method: "POST"
                }
            );

        if (data.ok) {

            message.textContent =
                `🎉 +${Number(
                    data.amount
                ).toFixed(2)} ₴ отримано!`;

            await reloadUser();

            showToast(
                "🎁 Бонус отримано!"
            );

        } else {

            message.textContent =
                data.message ||
                "Бонус уже отримано.";
        }

    } catch (error) {

        message.textContent =
            error.message;

    } finally {

        button.disabled = false;
    }
}


// ==========================================================
// REFERRAL
// ==========================================================

async function copyReferral() {

    const input =
        document.getElementById(
            "referralLink"
        );

    const value =
        input.value.trim();

    if (!value) {

        showToast(
            "Реферальне посилання ще не завантажено."
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(
            value
        );

        showToast(
            "🔗 Посилання скопійовано!"
        );

    } catch {

        input.select();

        document.execCommand(
            "copy"
        );

        showToast(
            "🔗 Посилання скопійовано!"
        );
    }
}


function shareReferral() {

    const link =
        currentUser?.referral_link;

    if (!link) {

        showToast(
            "Посилання ще не завантажено."
        );

        return;
    }

    const text =
        "🌙 Приєднуйся до NightBorn ☾";

    if (
        tg &&
        tg.openTelegramLink
    ) {

        const url =
            "https://t.me/share/url" +
            "?url=" +
            encodeURIComponent(link) +
            "&text=" +
            encodeURIComponent(text);

        tg.openTelegramLink(url);

    } else {

        navigator.clipboard
            .writeText(link);

        showToast(
            "Посилання скопійовано!"
        );
    }
}


// ==========================================================
// NAVIGATION
// ==========================================================

function showPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active"
            );
        });

    const target =
        document.getElementById(
            `page-${pageName}`
        );

    if (target) {
        target.classList.add(
            "active"
        );
    }

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                pageName
            );

        });

    if (pageName === "history") {
        loadHistory();
    }

    if (pageName === "bonus") {
        // Нічого додаткового
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================================
// ADMIN
// ==========================================================

async function loadAdmin() {

    try {

        const [
            statsData,
            sponsorData,
            userData
        ] = await Promise.all([

            api(
                "/api/admin/statistics"
            ),

            api(
                "/api/admin/sponsors"
            ),

            api(
                "/api/admin/users"
            )
        ]);

        const s =
            statsData.statistics;

        document.getElementById(
            "adminUsers"
        ).textContent =
            s.users;

        document.getElementById(
            "adminSponsors"
        ).textContent =
            s.active_sponsors;

        document.getElementById(
            "adminBalance"
        ).textContent =
            `${Number(
                s.total_balance
            ).toFixed(2)} ₴`;

        renderAdminSponsors(
            sponsorData.sponsors
        );

        renderAdminUsers(
            userData.users
        );

    } catch (error) {

        showToast(
            error.message
        );
    }
}


function renderAdminSponsors(
    list
) {

    const container =
        document.getElementById(
            "adminSponsorList"
        );

    container.innerHTML = "";

    if (!list.length) {

        container.innerHTML =
            `<div class="empty-state">
                Спонсорів немає.
            </div>`;

        return;
    }

    list.forEach(
        sponsor => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "admin-row";

            row.innerHTML = `
                <div>
                    <div class="admin-row-title">
                        ${
                            sponsor.is_active
                                ? "🟢"
                                : "🔴"
                        }
                        ${escapeHtml(
                            sponsor.name
                        )}
                    </div>

                    <div class="admin-row-sub">
                        ${
                            sponsor.channel_username ||
                            sponsor.channel_id
                        }
                    </div>
                </div>

                <div class="admin-row-actions">

                    <button
                        class="admin-small-btn"
                        data-toggle="${sponsor.id}"
                    >
                        ${
                            sponsor.is_active
                                ? "Вимк."
                                : "Увімк."
                        }
                    </button>

                    <button
                        class="admin-small-btn"
                        data-delete="${sponsor.id}"
                    >
                        🗑
                    </button>

                </div>
            `;

            container.appendChild(row);
        }
    );

    container
        .querySelectorAll(
            "[data-toggle]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => toggleSponsor(
                    button.dataset.toggle,
                    !(
                        list.find(
                            s =>
                                String(s.id) ===
                                String(
                                    button.dataset.toggle
                                )
                        )?.is_active
                    )
                )
            );
        });

    container
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteSponsor(
                    button.dataset.delete
                )
            );
        });
}


function renderAdminUsers(
    list
) {

    const container =
        document.getElementById(
            "adminUserList"
        );

    container.innerHTML = "";

    if (!list.length) {

        container.innerHTML =
            `<div class="empty-state">
                Користувачів немає.
            </div>`;

        return;
    }

    list.forEach(
        user => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "admin-row";

            row.innerHTML = `
                <div>

                    <div class="admin-row-title">
                        ${escapeHtml(
                            user.first_name ||
                            "Користувач"
                        )}
                    </div>

                    <div class="admin-row-sub">
                        ID: ${user.user_id}
                        ${
                            user.username
                                ? " • @" +
                                  escapeHtml(
                                      user.username
                                  )
                                : ""
                        }
                    </div>

                </div>

                <strong>
                    ${Number(
                        user.balance
                    ).toFixed(2)} ₴
                </strong>
            `;

            container.appendChild(row);
        }
    );
}


async function addSponsor() {

    const name =
        document.getElementById(
            "adminSponsorName"
        ).value.trim();

    const channel =
        document.getElementById(
            "adminSponsorChannel"
        ).value.trim();

    const url =
        document.getElementById(
            "adminSponsorUrl"
        ).value.trim();

    const logo =
        document.getElementById(
            "adminSponsorLogo"
        ).value.trim();

    if (!name || !channel || !url) {

        showToast(
            "Заповни назву, канал і посилання."
        );

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
                    url,
                    logo_url: logo
                })
            }
        );

        document.getElementById(
            "adminSponsorName"
        ).value = "";

        document.getElementById(
            "adminSponsorChannel"
        ).value = "";

        document.getElementById(
            "adminSponsorUrl"
        ).value = "";

        document.getElementById(
            "adminSponsorLogo"
        ).value = "";

        showToast(
            "✅ Спонсора додано!"
        );

        await loadAdmin();
        await loadSponsors();

    } catch (error) {

        showToast(
            error.message
        );
    }
}


async function toggleSponsor(
    id,
    active
) {

    try {

        await api(
            `/api/admin/sponsors/${id}/toggle`,
            {
                method: "POST",
                body: JSON.stringify({
                    active
                })
            }
        );

        await loadAdmin();
        await loadSponsors();

    } catch (error) {

        showToast(
            error.message
        );
    }
}


async function deleteSponsor(id) {

    if (
        !confirm(
            "Видалити цього спонсора?"
        )
    ) {
        return;
    }

    try {

        await api(
            `/api/admin/sponsors/${id}`,
            {
                method: "DELETE"
            }
        );

        showToast(
            "🗑 Спонсора видалено."
        );

        await loadAdmin();
        await loadSponsors();

    } catch (error) {

        showToast(
            error.message
        );
    }
}


// ==========================================================
// LOAD
// ==========================================================

async function reloadUser() {

    const data =
        await api(
            "/api/me"
        );

    renderUser(
        data.user
    );
}


async function loadSponsors() {

    const data =
        await api(
            "/api/sponsors"
        );

    renderSponsors(
        data.sponsors
    );
}


// ==========================================================
// ADMIN DETECTION
// ==========================================================

function isCurrentUserAdmin() {

    if (!currentUser) {
        return false;
    }

    return [
        1976272634,
        8652027118
    ].includes(
        Number(currentUser.id)
    );
}


function addAdminNav() {

    if (!isCurrentUserAdmin()) {
        return;
    }

    const nav =
        document.querySelector(
            ".bottom-nav"
        );

    if (
        document.getElementById(
            "adminNav"
        )
    ) {
        return;
    }

    const button =
        document.createElement(
            "button"
        );

    button.id =
        "adminNav";

    button.className =
        "nav-item";

    button.innerHTML =
        "<span>♛</span><small>Адмін</small>";

    button.addEventListener(
        "click",
        async () => {

            showPage("admin");

            await loadAdmin();
        }
    );

    nav.appendChild(button);
}


// ==========================================================
// TOAST
// ==========================================================

function showToast(
    message
) {

    let toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "toast";

        toast.style.position =
            "fixed";

        toast.style.left =
            "50%";

        toast.style.bottom =
            "90px";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.zIndex =
            "999999";

        toast.style.maxWidth =
            "calc(100% - 30px)";

        toast.style.padding =
            "12px 17px";

        toast.style.borderRadius =
            "13px";

        toast.style.background =
            "rgba(8,24,42,.95)";

        toast.style.border =
            "1px solid rgba(89,184,255,.25)";

        toast.style.color =
            "#eaf7ff";

        toast.style.fontSize =
            "13px";

        toast.style.textAlign =
            "center";

        document.body.appendChild(
            toast
        );
    }

    toast.textContent =
        message;

    toast.style.opacity =
        "1";

    clearTimeout(
        window.__toastTimer
    );

    window.__toastTimer =
        setTimeout(
            () => {
                toast.style.opacity =
                    "0";
            },
            2600
        );
}


// ==========================================================
// ESCAPE HTML
// ==========================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==========================================================
// EVENTS
// ==========================================================

function setupEvents() {

    document
        .querySelectorAll(
            ".nav-item[data-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );
                }
            );
        });


    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(button => {

            if (
                button.classList.contains(
                    "nav-item"
                )
            ) {
                return;
            }

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );
                }
            );
        });


    document
        .getElementById(
            "copyReferral"
        )
        .addEventListener(
            "click",
            copyReferral
        );


    document
        .getElementById(
            "shareReferral"
        )
        .addEventListener(
            "click",
            shareReferral
        );


    document
        .getElementById(
            "claimBonus"
        )
        .addEventListener(
            "click",
            claimBonus
        );


    document
        .getElementById(
            "refreshBtn"
        )
        .addEventListener(
            "click",
            async () => {

                try {

                    await reloadUser();
                    await loadSponsors();

                    if (
                        isCurrentUserAdmin()
                    ) {
                        await loadAdmin();
                    }

                    showToast(
                        "↻ Оновлено"
                    );

                } catch (error) {

                    showToast(
                        error.message
                    );
                }
            }
        );


    document
        .getElementById(
            "adminAddSponsor"
        )
        .addEventListener(
            "click",
            addSponsor
        );
}


// ==========================================================
// START
// ==========================================================

async function start() {

    initTelegram();

    try {

        if (!tg || !tg.initData) {

            throw new Error(
                "Відкрий Mini App через Telegram."
            );
        }

        await reloadUser();

        await loadSponsors();

        setupEvents();

        addAdminNav();

        hideLoader();

    } catch (error) {

        console.error(error);

        const loader =
            document.getElementById(
                "loader"
            );

        if (loader) {

            loader.innerHTML = `
                <div
                    style="
                        text-align:center;
                        padding:25px;
                        color:#dff4ff;
                    "
                >
                    <div
                        style="
                            font-size:55px;
                            text-shadow:
                                0 0 25px #008cff;
                        "
                    >
                        ♛
                    </div>

                    <div
                        style="
                            margin-top:15px;
                            font-size:24px;
                            font-weight:900;
                        "
                    >
                        NightBorn ☾
                    </div>

                    <div
                        style="
                            margin-top:15px;
                            color:#ff9da7;
                            font-size:13px;
                        "
                    >
                        ${escapeHtml(
                            error.message
                        )}
                    </div>
                </div>
            `;
        }
    }
}


start();
