async function loadEmbedPlayerUrl() {

    const scripts = document.getElementsByTagName('script');
    const index = scripts.length - 1;
    const myScript = scripts[index];

    const params = {
        channelName: myScript.getAttribute('channelName'),
        startTime: new Date(myScript.getAttribute('startTime')),
        endTime: new Date(myScript.getAttribute('endTime')),
        nameLeft: myScript.getAttribute('nameLeft'),
        nameRight: myScript.getAttribute('nameRight'),
        backgroundImage: myScript.getAttribute('backgroundImage'),
        leftFlagImage: myScript.getAttribute('leftFlagImage'),
        rightFlagImage: myScript.getAttribute('rightFlagImage'),
        scoreLeft: myScript.getAttribute('scoreLeft'),
        scoreRight: myScript.getAttribute('scoreRight'),
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
        iframe.id = 'tivio-iihf-iframe';
        iframe.title = 'Tivio IIHF Player iframe';
        iframe.width = '100%';
        iframe.style.aspectRatio = '16/9';
        iframe.allow = 'fullscreen';
        iframe.src = embedPlayerUrl; // Set the src with query parameters

        // Append the iframe to the div
        document.getElementById('tivio-iihf-iframe-wrapper').appendChild(iframe);
    }
}


// Trigger the dynamic loading process when the window loads
window.onload = loadEmbedPlayerUrl;