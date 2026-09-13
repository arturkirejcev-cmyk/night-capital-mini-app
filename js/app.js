(() => {

  "use strict";


  /* =====================================================
     TELEGRAM
     ===================================================== */

  const tg =
    window.Telegram?.WebApp || null;


  /* =====================================================
     CONFIG
     ===================================================== */

  const config =
    window.NIGHTBORN_CONFIG || {};


  const API_BASE_URL =
    String(
      config.API_BASE_URL || ""
    ).replace(/\/+$/, "");


  /*
   * Заставка.
   *
   * За замовчуванням 10 хвилин.
   */

  const INTRO_DURATION =
    Number(config.INTRO_DURATION) > 0
      ? Number(config.INTRO_DURATION)
      : 600000;


  /* =====================================================
     STATE
     ===================================================== */

  const state = {

    sponsors: [],

    page: 0,

    pageSize: 4,

    user: null,

    checking: false,

    applicationReady: false,

    apiError: null

  };


  /* =====================================================
     DOM
     ===================================================== */

  const $ = (id) =>
    document.getElementById(id);


  const introScreen =
    $("introScreen");

  const application =
    $("application");

  const errorScreen =
    $("errorScreen");

  const sponsorScreen =
    $("sponsorScreen");

  const mainMenu =
    $("mainMenu");

  const channelsList =
    $("channelsList");

  const checkButton =
    $("checkButton");

  const retryButton =
    $("retryButton");

  const message =
    $("message");

  const errorText =
    $("errorText");

  const counterCurrent =
    $("counterCurrent");

  const counterTotal =
    $("counterTotal");

  const welcomeText =
    $("welcomeText");

  const loadingProgress =
    $("loadingProgress");

  const loadingPercent =
    $("loadingPercent");

  const loadingStatus =
    $("loadingStatus");


  /* =====================================================
     TELEGRAM INITIALIZATION
     ===================================================== */

  function initTelegram() {

    if (!tg) {

      console.warn(
        "Telegram WebApp API недоступний."
      );

      return;

    }


    try {

      tg.ready();

      tg.expand();


      if (tg.setHeaderColor) {

        tg.setHeaderColor(
          "#020607"
        );

      }


      if (tg.setBackgroundColor) {

        tg.setBackgroundColor(
          "#020607"
        );

      }


      if (tg.disableVerticalSwipes) {

        try {

          tg.disableVerticalSwipes();

        } catch (_) {}

      }

    } catch (error) {

      console.warn(
        "Telegram initialization:",
        error
      );

    }


    state.user =
      tg.initDataUnsafe?.user || null;


    if (
      state.user &&
      state.user.first_name
    ) {

      welcomeText.textContent =
        `${state.user.first_name}, ти успішно відкрив NightBorn.`;

    }

  }


  /* =====================================================
     API
     ===================================================== */

  function apiConfigured() {

    return Boolean(
      API_BASE_URL &&
      !API_BASE_URL.includes(
        "YOUR-PUBLIC-API-DOMAIN"
      ) &&
      /^https:\/\//i.test(
        API_BASE_URL
      )
    );

  }


  async function apiRequest(
    path,
    options = {}
  ) {

    if (!apiConfigured()) {

      throw new Error(
        "Не вказана публічна HTTPS-адреса API в NIGHTBORN_CONFIG."
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


    if (options.body) {

      headers.set(
        "Content-Type",
        "application/json"
      );

    }


    const initData =
      tg?.initData || "";


    if (!initData) {

      throw new Error(
        "Mini App відкрито не через Telegram або initData відсутній."
      );

    }


    headers.set(
      "X-Telegram-Init-Data",
      initData
    );


    const response =
      await fetch(
        `${API_BASE_URL}${path}`,
        {
          ...options,
          headers,
          cache: "no-store"
        }
      );


    let data = null;


    try {

      data =
        await response.json();

    } catch (_) {}


    if (
      !response.ok ||
      !data?.ok
    ) {

      const code =
        data?.error ||
        `HTTP ${response.status}`;


      throw new Error(
        `API: ${code}`
      );

    }


    return data;

  }


  /* =====================================================
     SCREEN MANAGEMENT
     ===================================================== */

  function showOnly(screen) {

    [
      errorScreen,
      sponsorScreen,
      mainMenu
    ].forEach((element) => {

      if (element) {

        element.classList.add(
          "hidden"
        );

      }

    });


    if (screen) {

      screen.classList.remove(
        "hidden"
      );

    }

  }


  /* =====================================================
     MESSAGE
     ===================================================== */

  function showMessage(
    text,
    type = ""
  ) {

    if (!message) return;


    message.textContent =
      text;


    message.className =
      "message show" +
      (
        type
          ? ` ${type}`
          : ""
      );

  }


  function clearMessage() {

    if (!message) return;


    message.textContent =
      "";


    message.className =
      "message";

  }


  /* =====================================================
     SPONSORS
     ===================================================== */

  function currentPageSponsors() {

    const start =
      state.page *
      state.pageSize;


    return state.sponsors.slice(
      start,
      start + state.pageSize
    );

  }


  function renderSponsors() {

    if (!channelsList) {
      return;
    }


    const pageSponsors =
      currentPageSponsors();


    const totalPages =
      Math.max(
        1,
        Math.ceil(
          state.sponsors.length /
          state.pageSize
        )
      );


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
          start +
          pageSponsors.length,
          state.sponsors.length
        )
      );


    channelsList.replaceChildren();


    pageSponsors.forEach(
      (sponsor, index) => {

        const row =
          document.createElement(
            "article"
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
            "p"
          );


        name.className =
          "channel-name";


        name.textContent =
          sponsor.name ||
          "Канал";


        const status =
          document.createElement(
            "p"
          );


        status.className =
          "channel-status";


        status.textContent =
          "Натисни → та підпишись";


        info.append(
          name,
          status
        );


        const button =
          document.createElement(
            "button"
          );


        button.className =
          "channel-button";


        button.type =
          "button";


        button.textContent =
          "→";


        button.setAttribute(
          "aria-label",
          `Відкрити ${
            sponsor.name ||
            "канал"
          }`
        );


        button.addEventListener(
          "click",
          () =>
            openSponsor(
              sponsor
            )
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


    checkButton.textContent =
      state.page <
      totalPages - 1
        ? "Перевірити підписки"
        : "Перевірити та відкрити";


    checkButton.disabled =
      pageSponsors.length === 0 ||
      state.checking;

  }


  function openSponsor(
    sponsor
  ) {

    const url =
      sponsor?.url;


    if (!url) {

      showMessage(
        "Для цього спонсора немає посилання.",
        "error"
      );

      return;

    }


    if (
      tg?.openTelegramLink &&
      /^https:\/\/t\.me\//i.test(
        url
      )
    ) {

      tg.openTelegramLink(
        url
      );

    } else if (
      tg?.openLink
    ) {

      tg.openLink(
        url
      );

    } else {

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

    }

  }


  /* =====================================================
     LOAD SPONSORS
     ===================================================== */

  async function loadSponsors() {

    clearMessage();


    try {

      initTelegram();


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


      state.page = 0;

      state.applicationReady =
        true;


    } catch (error) {

      console.error(
        "NightBorn API:",
        error
      );


      state.apiError =
        error;


      state.applicationReady =
        false;

    }

  }


  /* =====================================================
     SHOW APPLICATION
     ===================================================== */

  function showApplication() {

    introScreen.classList.add(
      "hidden"
    );


    application.classList.remove(
      "hidden"
    );


    if (state.applicationReady) {

      if (
        state.sponsors.length === 0
      ) {

        showOnly(
          mainMenu
        );

      } else {

        renderSponsors();

        showOnly(
          sponsorScreen
        );

      }

      return;

    }


    errorText.textContent =
      state.apiError?.message ||
      "Не вдалося підключитися до API.";


    showOnly(
      errorScreen
    );

  }


  /* =====================================================
     LOADING ANIMATION
     ===================================================== */

  function updateLoading(
    percent
  ) {

    const safePercent =
      Math.max(
        0,
        Math.min(
          100,
          percent
        )
      );


    if (loadingProgress) {

      loadingProgress.style.width =
        `${safePercent}%`;

    }


    if (loadingPercent) {

      loadingPercent.textContent =
        `${Math.round(
          safePercent
        )}%`;

    }


    if (!loadingStatus) {
      return;
    }


    if (safePercent < 12) {

      loadingStatus.textContent =
        "Ініціалізація NightBorn";

    } else if (
      safePercent < 25
    ) {

      loadingStatus.textContent =
        "Створення захищеного з'єднання";

    } else if (
      safePercent < 40
    ) {

      loadingStatus.textContent =
        "Підключення Telegram";

    } else if (
      safePercent < 55
    ) {

      loadingStatus.textContent =
        "Синхронізація профілю";

    } else if (
      safePercent < 70
    ) {

      loadingStatus.textContent =
        "Перевірка серверів";

    } else if (
      safePercent < 85
    ) {

      loadingStatus.textContent =
        "Завантаження NightBorn";

    } else if (
      safePercent < 98
    ) {

      loadingStatus.textContent =
        "Підготовка простору";

    } else {

      loadingStatus.textContent =
        "NightBorn готовий";

    }

  }


  /* =====================================================
     10 MINUTE INTRO
     ===================================================== */

  async function runIntro() {

    /*
     * API запускаємо одразу,
     * не чекаємо завершення заставки.
     */

    const apiPromise =
      loadSponsors();


    const startedAt =
      Date.now();


    /*
     * Анімація прогресу.
     *
     * Вона спеціально не доходить до 100%
     * занадто рано.
     */

    let lastPercent = 0;


    const animation =
      new Promise((resolve) => {

        const timer =
          setInterval(() => {

            const elapsed =
              Date.now() -
              startedAt;


            let percent =
              (
                elapsed /
                INTRO_DURATION
              ) * 100;


            /*
             * Ніколи не показуємо 100%
             * до завершення заставки.
             */

            if (percent >= 99) {

              percent = 99;

            }


            /*
             * Робимо рух природнішим.
             */

            if (
              percent <
              lastPercent
            ) {

              percent =
                lastPercent;

            }


            lastPercent =
              percent;


            updateLoading(
              percent
            );


            if (
              elapsed >=
              INTRO_DURATION
            ) {

              clearInterval(
                timer
              );

              updateLoading(
                100
              );

              resolve();

            }

          }, 300);

      });


    /*
     * Чекаємо завершення заставки.
     */

    await animation;


    /*
     * API вже могло завершитися.
     * Якщо ні — дочекаємося його.
     */

    try {

      await apiPromise;

    } catch (error) {

      state.apiError =
        error;

    }


    updateLoading(
      100
    );


    /*
     * Маленька пауза після 100%.
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          700
        )
    );


    showApplication();

  }


  /* =====================================================
     CHECK CURRENT PAGE
     ===================================================== */

  async function checkCurrentPage() {

    if (
      state.checking
    ) {

      return;

    }


    const pageSponsors =
      currentPageSponsors();


    if (
      !pageSponsors.length
    ) {

      showOnly(
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

          pageSponsors.map(
            async (
              sponsor
            ) => {

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


                return {

                  sponsor,

                  subscribed:
                    Boolean(
                      result.subscribed
                    )

                };

              } catch (error) {

                return {

                  sponsor,

                  subscribed:
                    false,

                  error

                };

              }

            }
          )

        );


      const failed =
        results.filter(
          result =>
            !result.subscribed
        );


      if (
        failed.length
      ) {

        showMessage(
          `Потрібно підписатися на всі канали цієї сторінки. Не пройдено: ${failed.length}.`,
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
          "Готово! Переходимо до наступних каналів.",
          "success"
        );

      } else {

        showMessage(
          "Усі підписки підтверджено. Доступ відкрито!",
          "success"
        );


        setTimeout(
          () => {

            showOnly(
              mainMenu
            );

          },
          500
        );

      }

    } finally {

      state.checking =
        false;


      if (
        mainMenu.classList.contains(
          "hidden"
        )
      ) {

        renderSponsors();

      }

    }

  }


  /* =====================================================
     MENU
     ===================================================== */

  function handleMenuAction(
    action
  ) {

    const labels = {

      balance:
        "Баланс",

      referrals:
        "Реферали",

      flyer:
        "Flyer",

      tasks:
        "Завдання",

      promocodes:
        "Промокоди",

      top:
        "Топ",

      mining:
        "Mining",

      animals:
        "Тварини",

      settings:
        "Налаштування",

      support:
        "Інфо та підтримка"

    };


    const label =
      labels[action] ||
      "Розділ";


    /*
     * Поки API цих розділів
     * не реалізований у backend,
     * не робимо вигляд, що він працює.
     */

    showMessage(
      `Розділ «${label}» очікує підключення відповідного API.`,
      ""
    );

  }


  /* =====================================================
     EVENTS
     ===================================================== */

  document
    .querySelectorAll(
      ".menu-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            handleMenuAction(
              button.dataset.action
            )
        );

      }
    );


  if (checkButton) {

    checkButton.addEventListener(
      "click",
      checkCurrentPage
    );

  }


  if (retryButton) {

    retryButton.addEventListener(
      "click",
      async () => {

        showOnly(
          null
        );


        state.apiError =
          null;


        await loadSponsors();


        if (
          state.applicationReady
        ) {

          if (
            state.sponsors.length === 0
          ) {

            showOnly(
              mainMenu
            );

          } else {

            renderSponsors();

            showOnly(
              sponsorScreen
            );

          }

        } else {

          errorText.textContent =
            state.apiError?.message ||
            "Не вдалося підключитися до API.";


          showOnly(
            errorScreen
          );

        }

      }
    );

  }


  /* =====================================================
     GLOBAL ERRORS
     ===================================================== */

  window.addEventListener(
    "error",
    event => {

      console.error(
        "NightBorn runtime error:",
        event.error ||
        event.message
      );

    }
  );


  window.addEventListener(
    "unhandledrejection",
    event => {

      console.error(
        "NightBorn promise error:",
        event.reason
      );

    }
  );


  /* =====================================================
     START
     ===================================================== */

  initTelegram();

  runIntro();


})();
