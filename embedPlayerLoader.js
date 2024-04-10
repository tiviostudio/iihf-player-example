async function renderPlayer(playerElement) {
    const params = {
        channelName: playerElement.getAttribute('channelName'),
        startTime: new Date(playerElement.getAttribute('startTime')),
        endTime: new Date(playerElement.getAttribute('endTime')),
        nameLeft: playerElement.getAttribute('nameLeft'),
        nameRight: playerElement.getAttribute('nameRight'),
        backgroundImage: playerElement.getAttribute('backgroundImage'),
        leftFlagImage: playerElement.getAttribute('leftFlagImage'),
        rightFlagImage: playerElement.getAttribute('rightFlagImage'),
    }

    console.log('params', params)


    // Function to convert the params object into a query string
    const toQueryString = (params) =>
        Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

    let embedPlayerUrl = 'https://iihf-player.web.app';
    try {
        // const response = await fetch('https://iihf-player.web.app');
        // embedPlayerUrl = ''
    } catch (error) {
        // console.error('Error fetching Google Embedded Player, trying AWS now', error);
        // const fallbackResponse = await fetch('https://youtube.com');
        // embedPlayerUrl = fallbackResponse.url;
    } finally {
        // Append the query string to the embedPlayerUrl
        embedPlayerUrl += "?" + toQueryString(params);

        console.log('Embedded Player URL:', embedPlayerUrl);

        // Create a new iframe element and set its src to the embedPlayerUrl with parameters
        let iframe = document.createElement('iframe');
        iframe.title = 'Tivio IIHF Player iframe';
        iframe.width = '100%';
        iframe.style.aspectRatio = '16/9';
        iframe.style.overflow = 'hidden'
        iframe.allow = 'fullscreen';
        iframe.src = embedPlayerUrl; // Set the src with query parameters

        // Append the iframe to the div
        playerElement.appendChild(iframe);
    }
}

async function loadEmbedPlayerUrl() {

    const players = document.getElementsByClassName('tivio-iihf-player')

    for (const playerElement of players) {
        renderPlayer(playerElement)
    }
}


// Trigger the dynamic loading process when the window loads
window.onload = loadEmbedPlayerUrl;