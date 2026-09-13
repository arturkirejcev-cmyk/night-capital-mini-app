(() => {

  "use strict";


  /* ==================================================
     CONFIG
     ================================================== */

  const config =
    window.NIGHTBORN_CONFIG || {};

  const API_BASE_URL =
    String(
      config.API_BASE_URL || ""
    ).replace(/\/+$/, "");

  const INTRO_DURATION =
    Number(config.INTRO_DURATION) > 0
      ? Number(config.INTRO_DURATION)
      : 3200;


  /* ==================================================
     TELEGRAM
     ================================================== */

  const tg =
    window.Telegram?.WebApp || null;


  /* ==================================================
     STATE
     ================================================== */

  const state = {

    user: null,

    sponsors: [],

    page: 0,

    pageSize: 4,

    apiReady: false,

    apiError: null,

    checking: false

  };


  /* ==================================================
     DOM
     ================================================== */

  const splash =
    document.getElementById("splash");

  const application =
    document.getElementById("application");

  const loadingBar =
    document.getElementById("loadingBar");

  const loadingPercent =
    document.getElementById("loadingPercent");

  const loadingText =
    document.getElementById("loadingText");

  const errorScreen =
    document.getElementById("errorScreen");

  const sponsorScreen =
    document.getElementById("sponsorScreen");

  const mainMenu =
    document.getElementById("mainMenu");

  const errorText =
    document.getElementById("errorText");

  const retryButton =
    document.getElementById("retryButton");

  const checkButton =
    document.getElementById("checkButton");

  const channelsList =
    document.getElementById("channelsList");

  const counterCurrent =
    document.getElementById("counterCurrent");

  const counterTotal =
    document.getElementById("counterTotal");

  const message =
    document.getElementById("message");


  /* ==================================================
     TELEGRAM INIT
     ================================================== */

  function initTelegram() {

    if (!tg) {

      console.warn(
        "Telegram WebApp API unavailable"
      );

      return;

    }


    try {

      tg.ready();

      tg.expand();


      if (tg.setHeaderColor) {

        tg.setHeaderColor(
          "#020405"
        );

      }


      if (tg.setBackgroundColor) {

        tg.setBackgroundColor(
          "#020405"
        );

      }

    } catch (error) {

      console.warn(
        "Telegram init error:",
        error
      );

    }


    state.user =
      tg.initDataUnsafe?.user ||
      null;


    renderUser();

  }


  /* ==================================================
     USER
     ================================================== */

  function renderUser() {

    const name =
      document.getElementById(
        "profileName"
      );

    const username =
      document.getElementById(
        "profileUsername"
      );

    const id =
      document.getElementById(
        "profileId"
      );


    if (!state.user) {

      name.textContent =
        "NightBorn";

      username.textContent =
        "@username";

      id.textContent =
        "ID: —";

      return;

    }


    name.textContent =
      [
        state.user.first_name,
        state.user.last_name
      ]
        .filter(Boolean)
        .join(" ") ||
      "Користувач";


    username.textContent =
      state.user.username
        ? `@${state.user.username}`
        : "Username не вказаний";


    id.textContent =
      `ID: ${state.user.id}`;

  }


  /* ==================================================
     API
     ================================================== */

  function apiIsConfigured() {

    return (
      /^https:\/\//i.test(
        API_BASE_URL
      ) &&
      !API_BASE_URL.includes(
        "YOUR-PUBLIC-API-DOMAIN"
      )
    );

  }


  async function apiRequest(
    path,
    options = {}
  ) {

    if (!apiIsConfigured()) {

      throw new Error(
        "API_BASE_URL не налаштований."
      );

    }


    if (!tg?.initData) {

      throw new Error(
        "Telegram initData відсутній."
      );

    }


    const headers =
      new Headers(
        options.headers || {}
      );


    headers.set(
      "Accept",
      "application/json"
    );


    headers.set(
      "X-Telegram-Init-Data",
      tg.initData
    );


    if (options.body) {

      headers.set(
        "Content-Type",
        "application/json"
      );

    }


    const response =
      await fetch(
        `${API_BASE_URL}${path}`,
        {
          ...options,
          headers,
          cache: "no-store"
        }
      );


    let data;


    try {

      data =
        await response.json();

    } catch (_) {

      data = null;

    }


    if (
      !response.ok ||
      !data?.ok
    ) {

      throw new Error(
        data?.error ||
        `HTTP ${response.status}`
      );

    }


    return data;

  }


  /* ==================================================
     LOAD API
     ================================================== */

  async function loadApplicationData() {

    try {

      const data =
        await apiRequest(
          "/api/sponsors"
        );


      state.sponsors =
        Array.isArray(
          data.sponsors
        )
          ? data.sponsors
          : [];


      state.apiReady =
        true;


      state.apiError =
        null;


    } catch (error) {

      console.error(
        "NightBorn API:",
        error
      );


      state.apiReady =
        false;

      state.apiError =
        error;

    }

  }


  /* ==================================================
     SPLASH PROGRESS
     ================================================== */

  function setProgress(
    percent,
    text
  ) {

    const value =
      Math.max(
        0,
        Math.min(
          100,
          percent
        )
      );


    loadingBar.style.width =
      `${value}%`;


    loadingPercent.textContent =
      `${Math.round(value)}%`;


    if (text) {

      loadingText.textContent =
        text;

    }

  }


  /* ==================================================
     RUN SPLASH
     ================================================== */

  async function runSplash() {

    /*
     * API запускаємо одразу.
     * Заставка НЕ чекає API.
     */

    const apiPromise =
      loadApplicationData();


    const started =
      performance.now();


    /*
     * Всього приблизно 3,2 секунди.
     */

    await new Promise(
      resolve => {

        const timer =
          setInterval(() => {

            const elapsed =
              performance.now() -
              started;


            const percent =
              Math.min(
                100,
                elapsed /
                INTRO_DURATION *
                100
              );


            let text =
              "Ініціалізація…";


            if (
              percent >= 25 &&
              percent < 50
            ) {

              text =
                "Підключення…";

            } else if (
              percent >= 50 &&
              percent < 75
            ) {

              text =
                "Синхронізація…";

            } else if (
              percent >= 75 &&
              percent < 95
            ) {

              text =
                "Підготовка…";

            } else if (
              percent >= 95
            ) {

              text =
                "Готово";

            }


            setProgress(
              percent,
              text
            );


            if (
              elapsed >=
              INTRO_DURATION
            ) {

              clearInterval(
                timer
              );


              setProgress(
                100,
                "Готово"
              );


              resolve();

            }

          }, 50);

      }
    );


    /*
     * Якщо API встигло завантажитися —
     * одразу відкриваємо.
     *
     * Якщо сервер трохи повільний,
     * даємо йому ще максимум 1.2 сек,
     * а не тримаємо заставку хвилинами.
     */

    if (!state.apiReady) {

      await Promise.race([

        apiPromise,

        new Promise(
          resolve =>
            setTimeout(
              resolve,
              1200
            )
        )

      ]);

    }


    openApplication();

  }


  /* ==================================================
     SCREENS
     ================================================== */

  function showScreen(
    screen
  ) {

    [
      errorScreen,
      sponsorScreen,
      mainMenu
    ].forEach(
      element => {

        element.classList.add(
          "hidden"
        );

      }
    );


    if (screen) {

      screen.classList.remove(
        "hidden"
      );

    }

  }


  /* ==================================================
     OPEN APPLICATION
     ================================================== */

  function openApplication() {

    splash.classList.add(
      "hidden"
    );


    application.classList.remove(
      "hidden"
    );


    if (!state.apiReady) {

      errorText.textContent =
        state.apiError?.message ||
        "Сервер не відповідає.";


      showScreen(
        errorScreen
      );


      return;

    }


    /*
     * Якщо спонсорів 0 —
     * перевірку взагалі не показуємо.
     */

    if (
      state.sponsors.length === 0
    ) {

      showScreen(
        mainMenu
      );

      return;

    }


    renderSponsors();


    showScreen(
      sponsorScreen
    );

  }


  /* ==================================================
     SPONSORS
     ================================================== */

  function getCurrentSponsors() {

    const start =
      state.page *
      state.pageSize;


    return state.sponsors.slice(
      start,
      start + state.pageSize
    );

  }


  function renderSponsors() {

    channelsList.replaceChildren();


    const items =
      getCurrentSponsors();


    const start =
      state.page *
      state.pageSize;


    counterTotal.textContent =
      String(
        state.sponsors.length
      );


    counterCurrent.textContent =
      String(
        Math.min(
          start + items.length,
          state.sponsors.length
        )
      );


    items.forEach(
      (sponsor, index) => {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "channel";


        const number =
          document.createElement(
            "div"
          );


        number.className =
          "channel-number";


        number.textContent =
          String(
            start + index + 1
          );


        const info =
          document.createElement(
            "div"
          );


        info.className =
          "channel-info";


        const name =
          document.createElement(
            "div"
          );


        name.className =
          "channel-name";


        name.textContent =
          sponsor.name ||
          "Канал";


        const status =
          document.createElement(
            "div"
          );


        status.className =
          "channel-status";


        status.textContent =
          "Натисни → щоб відкрити";


        info.append(
          name,
          status
        );


        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";

        button.className =
          "channel-button";

        button.textContent =
          "→";


        button.addEventListener(
          "click",
          () => {

            if (
              !sponsor.url
            ) {

              showMessage(
                "Посилання на канал відсутнє.",
                "error"
              );

              return;

            }


            if (
              tg?.openTelegramLink &&
              /^https:\/\/t\.me\//i.test(
                sponsor.url
              )
            ) {

              tg.openTelegramLink(
                sponsor.url
              );

            } else if (
              tg?.openLink
            ) {

              tg.openLink(
                sponsor.url
              );

            } else {

              window.open(
                sponsor.url,
                "_blank"
              );

            }

          }
        );


        row.append(
          number,
          info,
          button
        );


        channelsList.appendChild(
          row
        );

      }
    );

  }


  /* ==================================================
     CHECK SPONSORS
     ================================================== */

  async function checkSponsors() {

    if (state.checking) {

      return;

    }


    const items =
      getCurrentSponsors();


    if (!items.length) {

      showScreen(
        mainMenu
      );

      return;

    }


    state.checking =
      true;


    checkButton.disabled =
      true;


    checkButton.textContent =
      "Перевіряємо…";


    clearMessage();


    try {

      const results =
        await Promise.all(
          items.map(
            async sponsor => {

              try {

                const result =
                  await apiRequest(
                    "/api/sponsor/check",
                    {
                      method:
                        "POST",

                      body:
                        JSON.stringify({
                          sponsor_id:
                            Number(
                              sponsor.id
                            )
                        })
                    }
                  );


                return Boolean(
                  result.subscribed
                );

              } catch (_) {

                return false;

              }

            }
          )
        );


      const allSubscribed =
        results.every(
          Boolean
        );


      if (!allSubscribed) {

        showMessage(
          "Ти ще не підписався на всі канали цієї сторінки.",
          "error"
        );

        return;

      }


      const totalPages =
        Math.ceil(
          state.sponsors.length /
          state.pageSize
        );


      if (
        state.page <
        totalPages - 1
      ) {

        state.page += 1;


        renderSponsors();


        showMessage(
          "Готово. Наступна сторінка.",
          "success"
        );

      } else {

        showMessage(
          "Підписки підтверджено!",
          "success"
        );


        setTimeout(
          () => {

            showScreen(
              mainMenu
            );

          },
          450
        );

      }

    } finally {

      state.checking =
        false;


      checkButton.disabled =
        false;


      checkButton.textContent =
        "Перевірити підписки";

    }

  }


  /* ==================================================
     MESSAGE
     ================================================== */

  function showMessage(
    text,
    type
  ) {

    message.textContent =
      text;

    message.className =
      `message show ${type || ""}`;

  }


  function clearMessage() {

    message.textContent =
      "";

    message.className =
      "message";

  }


  /* ==================================================
     RETRY
     ================================================== */

  retryButton.addEventListener(
    "click",
    async () => {

      retryButton.disabled =
        true;

      retryButton.textContent =
        "Підключення…";


      await loadApplicationData();


      retryButton.disabled =
        false;

      retryButton.textContent =
        "Спробувати ще раз";


      openApplication();

    }
  );


  /* ==================================================
     EVENTS
     ================================================== */

  checkButton.addEventListener(
    "click",
    checkSponsors
  );


  /* ==================================================
     START
     ================================================== */

  initTelegram();

  runSplash();


})();
