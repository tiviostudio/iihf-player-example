const TIVIO_EMBED_CONFIG = {
  // In case there is an outage with primary sources, use the fallback immediately
  forceFallback: false,
  // Timeout which is acceptable in order to load the iframe
  timeoutSeconds: 5,
  // Timeout which is acceptable in order to receive a confirmation message from the player
  messageTimeoutSeconds: 5,
  // Total number of retries before giving up
  maxRetryCount: 3,
  sources: ["https://iihf-player.web.app", "https://iihf-player.pages.dev"],
};

if (TIVIO_EMBED_CONFIG.forceFallback) {
  TIVIO_EMBED_CONFIG.sources = [TIVIO_EMBED_CONFIG.sources[1]];
}

function loadPlayer(playerElement) {
  let currentSourceIndex = 0;
  let retryCount = 0;

  const params = {
    channelName: playerElement.getAttribute("channelName"),
    startTime: new Date(playerElement.getAttribute("startTime")),
    endTime: new Date(playerElement.getAttribute("endTime")),
    nameLeft: playerElement.getAttribute("nameLeft"),
    nameRight: playerElement.getAttribute("nameRight"),
    backgroundImage: playerElement.getAttribute("backgroundImage"),
    leftFlagImage: playerElement.getAttribute("leftFlagImage"),
    rightFlagImage: playerElement.getAttribute("rightFlagImage"),
  };

  const toQueryString = (params) =>
    Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");

  const iframe = document.createElement("iframe");
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
      return;
    }

    iframe.src = `${
      TIVIO_EMBED_CONFIG.sources[currentSourceIndex]
    }?${toQueryString(params)}`;

    timeoutId = setTimeout(retry, TIVIO_EMBED_CONFIG.timeoutSeconds * 1000);

    iframe.onload = function () {
      console.info("Iframe loaded successfully");
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(function () {
        console.error("Failed to receive confirmation message from player")
        retry();
      }, TIVIO_EMBED_CONFIG.timeoutSeconds * 1000);

      window.addEventListener("message", function (event) {
        if (event.data === "initialized") {
          clearTimeout(timeoutId);
        }
      });
    };
    iframe.onerror = function () {
      console.error("Failed to load player; switching sources");
      retry();
    };

    document.body.appendChild(iframe);
  }

  function retry() {
    console.info("Retrying to load player");
    currentSourceIndex = (currentSourceIndex + 1) % TIVIO_EMBED_CONFIG.sources.length;
    retryCount++;
    embedIframe();
  }

  embedIframe();
}

function loadEmbedPlayerUrl() {

  const players = document.getElementsByClassName('tivio-iihf-player')

  for (const playerElement of players) {
      renderPlayer(playerElement)
  }
}

// Trigger the dynamic loading process when the window loads
window.onload = loadEmbedPlayerUrl;
