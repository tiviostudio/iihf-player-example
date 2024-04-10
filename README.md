# Tivio IIHF Embedded Player
## Integration
1. Paste the provided javascript file to your CMS.
2. Create new div with id “tivio-iihf-iframe-wrapper” where the player should be located e.g.

```html
<div id="tivio-iihf-iframe-wrapper">
   <!-- The iframe will be appended here by the script -->
</div>
```

3. Import the script into the html page and set the parameters to match the event you want to play e.g.

```html
<script
    channelName="7tl6We5FhLyCfZcmSG6F"
    startTime="2024-04-10T10:30:00"
    endTime="2024-04-10T12:30:00"
    nameLeft="Slovensko"
    nameRight="USA"
    backgroundImage="https://www.insportline.cz/upload/image/category/Ledni-hokej.png"
    leftFlagImage="https://flagdownload.com/wp-content/uploads/Flag_of_Slovakia_Flat_Square-128x128.png"
    rightFlagImage="https://flagdownload.com/wp-content/uploads/Flag_of_United_States_Flat_Square-128x128.png"
    scoreLeft="0"
    scoreRight="0"
    type="text/javascript"
    src="embedPlayerLoader.js"> // Path to the actual script
</script>
```



## Parameters
`channelName: string`\
Channel name where the event you want to play takes place

`startTime: string (2024-04-10T10:30:00)`\
Start of the stream, used for the countdown.

`endTime: string (2024-04-10T12:30:00)`\
endTime marks the end of the stream, at this time, video will be stopped.

`nameLeft: string`\
Name of the team displayed on the left side of the screen

`nameRight: string`\
Name of the team displayed on the right side of the screen

`backgroundImage: URL`\
Image used on the background of not started event

`leftFlagImage: URL`\
Image which will be displayed on the left side of the screen

`rightFlagImage: URL`\
Image which will be displayed on the right side of the screen

`scoreLeft: number`\
Score which will be displayed on the left side of the screen

`scoreRight: number`\
Score which will be displayed on the right side of the screen



