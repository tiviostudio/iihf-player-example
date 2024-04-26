const TIVIO_EMBED_CONFIG = {
  // In case there is an outage with primary sources, use the fallback immediately
  forceFallback: false,
  // Timeout which is acceptable in order to load the iframe
  timeoutSeconds: 5,
  // Timeout which is acceptable in order to receive a confirmation message from the player
  messageTimeoutSeconds: 5,
  // Total number of retries before giving up
  maxRetryCount: 3,
  sources: ["https://iihf-player.web.app"],
};

if (TIVIO_EMBED_CONFIG.forceFallback) {
  TIVIO_EMBED_CONFIG.sources = [TIVIO_EMBED_CONFIG.sources[1]];
}

function renderPlayer(playerElement, source, videoSourceId) {
  let currentSourceIndex = 0;
  let retryCount = 0;

  if (source) {
    const sourceIndex = TIVIO_EMBED_CONFIG.sources.indexOf(source);
    if (sourceIndex !== -1) {
      currentSourceIndex = sourceIndex;
    } else {
      TIVIO_EMBED_CONFIG.sources.unshift(source);
    }
  }

  const params = {
    channelName: playerElement.getAttribute("channelName"),
    startTime: new Date(playerElement.getAttribute("startTime")),
    endTime: new Date(playerElement.getAttribute("endTime")),
    nameLeft: playerElement.getAttribute("nameLeft"),
    nameRight: playerElement.getAttribute("nameRight"),
    backgroundImage: playerElement.getAttribute("backgroundImage"),
    leftFlagImage: playerElement.getAttribute("leftFlagImage"),
    rightFlagImage: playerElement.getAttribute("rightFlagImage"),
    videoSourceId,
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
        console.error("Failed to receive confirmation message from player");
        retry();
      }, TIVIO_EMBED_CONFIG.timeoutSeconds * 1000);
    };
    iframe.onerror = function () {
      console.error("Failed to load player; switching sources");
      retry();
    };

    document.body.appendChild(iframe);
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
      event.data.type === "ready" &&
      event.data.channelName === params.channelName
    ) {
      console.info("Received confirmation message from player");
      clearTimeout(timeoutId);
    }
  });

  embedIframe();
}

const errorImage = 'https://firebasestorage.googleapis.com/v0/b/tivio-production.appspot.com/o/assets%2FJOJ%2Fcountry-block.jpeg?alt=media'
function renderPlayerError(playerElement) {
  const div = document.createElement("div");
  div.style.width = "100%";
  div.style.aspectRatio = "16/9";
  div.style.backgroundImage = `url(${errorImage})`;
  div.style.backgroundSize = "cover";
  div.style.backgroundPosition = "center";
  div.style.display = "flex";
  div.style.justifyContent = "center";
  div.style.alignItems = "center";
  div.style.color = "white";
  div.style.fontFamily = "Arial, sans-serif";
  div.style.fontSize = "1.5em";
  div.innerText = "Živý prenos je dostupný len zo Slovenska";
  playerElement.appendChild(div);
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

    const { success, source, videoSourceId } = await response.json();
    return {
      success,
      source,
      videoSourceId,
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

  if (isAvailable.success === false) {
    renderPlayerError(playerElement);
    return;
  }
  if (!isAvailable) {
    renderPlayerError(playerElement);
  }
  renderPlayer(playerElement, isAvailable.source, isAvailable.videoSourceId);
}

// Trigger the dynamic loading process when the window loads
window.onload = loadEmbedPlayerUrl;
