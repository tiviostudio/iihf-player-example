# Tivio IIHF Embedded Player
## Integration
1. Paste the provided javascript file to your CMS.
2. Create new div with the parameters to match the channel you want to play e.g.

```html
<div
    class="tivio-iihf-player"
    channelName="sport1">
    <!-- The iframe will be appended here by the script -->
</div>
```

3. Import the script into the html page and set the parameters to match the event you want to play e.g.

```html
<script
    type="text/javascript"
    src="embedPlayerLoader.js">
</script>
```



## Parameters
`channelName: string`\
Channel name where the event you want to play takes place.

Accepts: sport1, sport2
