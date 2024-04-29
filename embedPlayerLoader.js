const TIVIO_EMBED_CONFIG = {
  // Timeout which is acceptable in order to load the iframe
  timeoutSeconds: 5,
  // Timeout which is acceptable in order to receive a confirmation message from the player
  messageTimeoutSeconds: 5,
  // Total number of retries before giving up
  maxRetryCount: 6,
  sources: ["https://iihf.embed.tivio.studio"],
};

function renderPlayer(playerElement, options) {
  let currentSourceIndex = 0;
  let retryCount = 0;
  const { source, sourceUrl, playerConfig, success } = options || {}

  if (source) {
    const sourceIndex = TIVIO_EMBED_CONFIG.sources.indexOf(source);
    if (sourceIndex !== -1) {
      currentSourceIndex = sourceIndex;
    } else {
      TIVIO_EMBED_CONFIG.sources.unshift(source);
    }
  }

  const params = {
    ...(playerConfig || {}),
    protocol: 'dash',
    sourceUrl,
  };

  const toQueryString = (params) =>
    Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");

  const iframe = document.createElement("iframe");
  iframe.title = "Tivio IIHF Player iframe";
  iframe.width = "100%";
  iframe.style.aspectRatio = "16/9";
  iframe.style.overflow = "hidden";
  iframe.style.border = "none";
  iframe.allow = "fullscreen";

  let timeoutId;
  function embedIframe() {
    if (timeoutId) {
      clearTimeout(timeoutId);
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

    iframe.src = `${source}?${toQueryString(params)}`;

    timeoutId = setTimeout(retry, TIVIO_EMBED_CONFIG.timeoutSeconds * 1000);

    iframe.onload = function () {
      console.info("Iframe loaded successfully");

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!success) {
        return
      }

      timeoutId = setTimeout(function () {
        console.error("Failed to receive confirmation message from player");
        retry();
      }, TIVIO_EMBED_CONFIG.timeoutSeconds * 1000);
    };
    iframe.onerror = function () {
      console.error("Failed to load player; switching sources");
      retry();
    };

    playerElement.appendChild(iframe);
  }

  function retry() {
    console.info("Retrying to load player");
    currentSourceIndex =
      (currentSourceIndex + 1) % TIVIO_EMBED_CONFIG.sources.length;
    retryCount++;
    embedIframe();
  }

  window.addEventListener("message", function (event) {
    if (
      typeof event.data === "object" &&
      event.data.type === "ready"
    ) {
      console.info("Received confirmation message from player");
      clearTimeout(timeoutId);
    }
  });

  embedIframe();
}

async function checkIsAvailable(channelName) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 5000);
  try {
    const response = await fetch(`https://iihf-embed.tivio.workers.dev/?channelName=${channelName}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: abortController.signal,
    })

    const { success, source, sourceUrl, playerConfig } = await response.json();
    return {
      success,
      source,
      sourceUrl,
      playerConfig,
    };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadEmbedPlayerUrl() {
  const players = document.getElementsByClassName("tivio-iihf-player");
  const playerElement = players[0];

  if (!playerElement) {
    console.error("No player element found");
    return;
  }

  const channelName = playerElement.getAttribute("channelName");
  const isAvailable = await checkIsAvailable(channelName);

  if (isAvailable) {
    renderPlayer(playerElement, isAvailable);
  } else {
    renderPlayer(playerElement)
  }
}

// Trigger the dynamic loading process when the window loads
window.onload = loadEmbedPlayerUrl;
