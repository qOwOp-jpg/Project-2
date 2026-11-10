# Project 2: The Not So Dark Side of the Moon

An interactive music player that combines audio visuals with moon data. Built with HTML, CSS, and JavaScript, the website displays a textured moon, a circular audio spectrum, and an animated background that responds to music.

## Main Features

- **Music player:** Add local audio files or direct audio URLs. Play, pause, skip tracks, seek, adjust volume, shuffle, and repeat.
- **Playlist:** Drag and drop files, reorder songs, remove individual tracks, or clear the playlist.
- **Audio visuals:** Watch the circular spectrum and background react to bass, mid, and treble frequencies. Adjust the audio reactivity slider to change the intensity.
- **Moon information:** Request moon phase, illumination, and moonrise data from the SunriseSunset.io API using Mississauga as the default location.
- **Date exploration:** Choose a date or use the new moon, first quarter, full moon, and last quarter shortcuts to explore the lunar cycle.
- **Responsive layout:** Supports desktop and mobile screens, with collapsible lunar controls on mobile.

## How to Use

1. Open `index.html` in a modern browser, preferably through a local server such as VS Code Live Server.
2. Click **Add Files** or drag audio files into the playlist. You can also use **Audio URL** to add a direct audio file link.
3. Play a track to see the audio visuals respond.
4. Select a date to explore the moon information and shading.

## Project Files

- `index.html` — Page structure and controls.
- `style.css` — Layout, colors, and responsive styling.
- `app.js` — Audio playback, playlist controls, API requests, moon rendering, and audio visuals.
- `assets/` — Image assets, including the moon texture.

## Notes

Local audio stays in the browser session, and the playlist is not saved after a reload. Audio format support depends on the browser. Direct audio URLs must allow cross-origin access for visualization; YouTube and Spotify page links are not supported. Moon data requires an internet connection. If the request fails, the interface displays an offline status and demo moon information.
