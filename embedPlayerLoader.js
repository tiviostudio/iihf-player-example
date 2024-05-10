const TIVIO_EMBED_CONFIG = {
  // Timeout which is acceptable in order to load the iframe
  timeoutSeconds: 9,
  // Timeout which is acceptable in order to receive a confirmation message from the player
  messageTimeoutSeconds: 3,
  loadingMessageSeconds: 3,
  // Total number of retries before giving up
  maxRetryCount: 6,
  sources: ["https://iihf-player.web.app", "https://iihf.embed.tivio.studio"],
  version: "1.0.2",
};

function renderPlayer(playerElement, options, loadingElement) {
  let currentSourceIndex = 0;
  let retryCount = 0;
  const { source, sourceUrl, playerParams, success } = options || {};

  if (
    source &&
    typeof source === "string" &&
    source !== "" &&
    source !== "undefined"
  ) {
    const sourceIndex = TIVIO_EMBED_CONFIG.sources.indexOf(source);
    if (sourceIndex !== -1 && currentSourceIndex !== undefined) {
      currentSourceIndex = sourceIndex;
    } else {
      TIVIO_EMBED_CONFIG.sources.unshift(source);
    }
  }

  if (!TIVIO_EMBED_CONFIG.sources[currentSourceIndex]) {
    currentSourceIndex = 0;
  }

  const params = {
    ...(playerParams || {}),
    ...(sourceUrl ? { sourceUrl } : {}),
    channelName: playerElement.getAttribute("channelName"),
    protocol: "dash",
  };

  const toQueryString = (params) =>
    Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");

  const iframe = document.createElement("iframe");
  iframe.width = "100%";
  iframe.style.aspectRatio = "16/9";
  iframe.style.overflow = "hidden";
  iframe.style.border = "none";
  iframe.allow = "fullscreen";

  const timeout = {
    iframeTimeoutId: null,
    messageTimeoutId: null,
    loadingMessageTimeoutId: null,
    isSuccess: false,
  };

  function showLoadingMessage() {
    if (!timeout.isSuccess && loadingElement && playerElement.contains(loadingElement)) {
      loadingElement.innerHTML = "Načítavanie...";
    }
  }

  function hideLoadingMessage() {
    if (loadingElement && playerElement.contains(loadingElement)) {
      loadingElement.style.display = "none";
      loadingElement.parentNode.removeChild(loadingElement);
    }
    clearTimeoutProxy(timeout.loadingMessageTimeoutId);
  }

  timeout.loadingMessageTimeoutId = setTimeout(
    showLoadingMessage,
    TIVIO_EMBED_CONFIG.loadingMessageSeconds * 1000
  );

  iframe.onload = function () {
    console.info("Iframe loaded successfully", Date.now());

    if (timeout.iframeTimeoutId) {
      clearTimeoutProxy(timeout.iframeTimeoutId);
    }

    if ((!success && options) || timeout.isSuccess) {
      hideLoadingMessage();
      return;
    }

    console.log("Expecting confirmation message from player", Date.now());
    timeout.messageTimeoutId = setTimeout(function () {
      console.error(
        `(v${TIVIO_EMBED_CONFIG.version}) Failed to receive confirmation message from player`,
        Date.now()
      );
      retry();
    }, TIVIO_EMBED_CONFIG.timeoutSeconds * 1000);
    console.log(
      "Set timeout to receive confirmation message from player. Message Timeout ID: ",
      timeout.messageTimeoutId
    );
  };
  iframe.onerror = function () {
    console.error(
      `(v${TIVIO_EMBED_CONFIG.version}) Failed to load player; switching sources`,
      Date.now()
    );
    retry();
  };

  playerElement.appendChild(iframe);

  function embedIframe() {
    if (timeout.isSuccess) {
      return;
    }
    if (timeout.loadingMessageTimeoutId) {
      clearTimeoutProxy(timeout.loadingMessageTimeoutId);
    }
    if (timeout.iframeTimeoutId) {
      clearTimeoutProxy(timeout.iframeTimeoutId);
    }
    if (timeout.messageTimeoutId) {
      clearTimeoutProxy(timeout.messageTimeoutId);
    }

    if (retryCount >= TIVIO_EMBED_CONFIG.maxRetryCount) {
      console.error(
        "Failed to load player after " +
          TIVIO_EMBED_CONFIG.maxRetryCount +
          " attempts"
      );
      // TODO Show error message in UI
      return;
    }

    let iframeSource = TIVIO_EMBED_CONFIG.sources[currentSourceIndex];

    if (
      !iframeSource ||
      typeof iframeSource !== "string" ||
      iframeSource === "" ||
      iframeSource === "undefined"
    ) {
      currentSourceIndex = 0;
      iframeSource = TIVIO_EMBED_CONFIG.sources[currentSourceIndex];
    }

    iframe.src = `${iframeSource}?${toQueryString(params)}`;

    timeout.iframeTimeoutId = setTimeout(
      retry,
      TIVIO_EMBED_CONFIG.timeoutSeconds * 1000
    );
  }

  function retry() {
    if (timeout.isSuccess) {
      return;
    }

    console.info("Retrying to load player");
    loadingElement.innerHTML = "Načítavanie...";
    currentSourceIndex =
      (currentSourceIndex + 1) % TIVIO_EMBED_CONFIG.sources.length;
    retryCount++;
    embedIframe();
  }

  window.addEventListener("message", function (event) {
    if (typeof event.data === "object" && event.data.type === "ready") {
      console.info("Received confirmation message from player", Date.now());
      console.log(
        {
          timeout,
        },
        Date.now()
      );

      timeout.isSuccess = true;
      clearTimeoutProxy(timeout.iframeTimeoutId);
      clearTimeoutProxy(timeout.messageTimeoutId);
      hideLoadingMessage();
    }
  });

  function clearTimeoutProxy(id) {
    clearTimeout(id);
  }

  embedIframe();
}

async function checkIsAvailable(channelName) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 10000);
  try {
    const response = await fetch(
      `https://iihf.worker.tivio.studio/?channelName=${channelName}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
      }
    );

    if (!response.ok) {
      console.log(
        "Failed to fetch response from worker",
        response.status,
        response.statusText
      );
      return null;
    }

    const { success, source, sourceUrl, playerParams } = await response.json();
    return {
      success,
      source,
      sourceUrl,
      playerParams,
    };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadEmbedPlayerUrl() {
  console.log(`IIHF Embed Player Loader v${TIVIO_EMBED_CONFIG.version}`);

  const players = document.getElementsByClassName("tivio-iihf-player");
  const playerElement = players[0];

  if (!playerElement) {
    console.error("No player element found");
    return;
  }

  playerElement.style.position = "relative";

  const loadingElement = document.createElement("div");
  loadingElement.className = "tivio-iihf-loading";
  loadingElement.style.position = "absolute";
  loadingElement.style.top = "0px";
  loadingElement.style.left = "0px";
  loadingElement.style.width = "100%";
  loadingElement.style.height = "100%";
  loadingElement.style.backgroundColor = "black";
  loadingElement.style.display = "flex";
  loadingElement.style.justifyContent = "center";
  loadingElement.style.alignItems = "center";
  loadingElement.style.color = "white";

  playerElement.appendChild(loadingElement);

  const channelName = playerElement.getAttribute("channelName");
  const isAvailable = await checkIsAvailable(channelName);

  if (isAvailable) {
    renderPlayer(playerElement, isAvailable, loadingElement);
  } else {
    renderPlayer(playerElement, null, loadingElement);
  }
}

// Trigger the dynamic loading process when the window loads
window.onload = loadEmbedPlayerUrl;
