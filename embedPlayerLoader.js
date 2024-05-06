const TIVIO_EMBED_CONFIG = {
  // Timeout which is acceptable in order to load the iframe
  timeoutSeconds: 10,
  // Timeout which is acceptable in order to receive a confirmation message from the player
  messageTimeoutSeconds: 10,
  // Total number of retries before giving up
  maxRetryCount: 6,
  sources: ["https://iihf.embed.tivio.studio"],
};

function renderPlayer(playerElement, options) {
  let currentSourceIndex = 0;
  let retryCount = 0;
  const { source, sourceUrl, playerParams, success } = options || {}

  if (source) {
    const sourceIndex = TIVIO_EMBED_CONFIG.sources.indexOf(source);
    if (sourceIndex !== -1) {
      currentSourceIndex = sourceIndex;
    } else {
      TIVIO_EMBED_CONFIG.sources.unshift(source);
    }
  }

  const params = {
    ...(playerParams || {}),
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
  iframe.width = "100%";
  iframe.style.aspectRatio = "16/9";
  iframe.style.overflow = "hidden";
  iframe.style.border = "none";
  iframe.allow = "fullscreen";

  const timeout = { iframeTimeoutId: null, messageTimeoutId: null, isSuccess: false }
  function embedIframe() {
    if (timeout.isSuccess) {
      return;
    }
    if (timeout.iframeTimeoutId) {
      clearTimeoutProxy(timeout.iframeTimeoutId, 'embedIframe');
    }
    if (timeout.messageTimeoutId) {
      clearTimeoutProxy(timeout.messageTimeoutId, 'embedIframe');
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

    const source = TIVIO_EMBED_CONFIG.sources[currentSourceIndex];
    iframe.src = `${source}?${toQueryString(params)}`;

    timeout.iframeTimeoutId = setTimeout(retry, TIVIO_EMBED_CONFIG.timeoutSeconds * 1000);

    iframe.onload = function () {
      console.info("Iframe loaded successfully", Date.now());

      if (timeout.iframeTimeoutId) {
        clearTimeoutProxy(timeout.iframeTimeoutId, 'iframe.onload');
      }

      if (!success || timeout.isSuccess) {
        return
      }

      console.log({
        success,
        source,
        sourceUrl,
        timeout,
      })
      timeout.messageTimeoutId = setTimeout(function () {
        console.error("Failed to receive confirmation message from player", Date.now());
        retry();
      }, TIVIO_EMBED_CONFIG.timeoutSeconds * 1000);
      console.log('Set timeout to receive confirmation message from player. Message Timeout ID: ', timeout.messageTimeoutId)
    };
    iframe.onerror = function () {
      console.error("Failed to load player; switching sources", Date.now());
      retry();
    };

    playerElement.appendChild(iframe);
  }

  function retry() {
    if (timeout.isSuccess) {
      return;
    }

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
      console.info("Received confirmation message from player", Date.now());
      console.log({
        timeout,
      }, Date.now())
      timeout.isSuccess = true;
      clearTimeoutProxy(timeout.iframeTimeoutId, 'message');
      clearTimeoutProxy(timeout.messageTimeoutId, 'message');
    }
  });

  function clearTimeoutProxy(id, source) {
    console.log('Clearing timeout ID ', id, ' from source ', source)
    clearTimeout(id);
    console.log('Cleared timeout', id)
  }

  embedIframe();
}

async function checkIsAvailable(channelName) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 10000);
  try {
    const response = await fetch(`https://iihf-embed.tivio.workers.dev/?channelName=${channelName}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: abortController.signal,
    })

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
