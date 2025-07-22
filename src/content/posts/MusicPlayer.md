---

title: Add a Local Music Player to Astro Sidebar
published: 2025-07-15
description: 'A step-by-step guide to integrating a local audio player in the Astro sidebar using Svelte.'
# image: ''
tags: [Astro]
category:  'Tutorials'
# series: 'Blog Tutorials'
draft: false
seriesCategory: "Tutorials"
seriesCategoryDescription: "My Tutorials"
series: "Astro"
seriesDescription: "Step-by-step tutorials for using Astro"
---

::github{repo="D-K-Deng/Music-Player-to-Astro-Sidebar"}



:::caution
YouTube may be inaccessible in certain regions like China, and Bilibili may be unavailable in regions such as the United States. Please use a suitable network environment if you encounter issues.
:::


## YouTube (English)

<iframe width="100%" height="468" src="https://youtu.be/dMJ0erHYdnM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## Bilibili (Chinese)

<iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1nSuxz7EJs&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>



# Add a Local Music Player to Astro Sidebar

This tutorial shows you how to add a local music player to your Astro project's sidebar. The player supports multiple tracks, album cover display, playback controls, and progress tracking.

## Features

- The player automatically loads and plays the first track.
- Track titles scroll horizontally if they overflow.
- Clicking on the album cover toggles play and pause.
- Tailwind's `dark` class is supported for dark mode styling.

## Technology Stack

- Astro
- Svelte (for the interactive player)
- Tailwind CSS (for styling)

## Feature Overview

You will see a compact music player in your sidebar with:

- Album cover (animated when playing)
- Track title with scrolling effect
- Time display and seek bar
- Previous/Next/Play buttons

## Step 1: Prepare Music Files

1. Create a folder named `music` inside the `public/` directory of your Astro project.
2. Place your `.mp3` files and corresponding cover images inside it.
3. Use descriptive names to keep track of songs and images.

Example structure:

```
public/music/
├── baby_girl.mp3
├── aiaiai.mp3
├── 3.mp3
├── cover.jpg
├── cover2.jpg
├── cover3.jpg
```

## Step 2: Create Music Player Components

### 1. Create `Music.astro`

Path: `src/components/widget/Music.astro`

```astro
---
import LocalPlayer from './LocalPlayer.svelte';

const audioList = [
  {
    name: 'Baby Girl - DKD',
    src: '/music/baby_girl.mp3',
    cover: '/music/cover.jpg'
  },
  {
    name: '爱爱爱 - DKD',
    src: '/music/aiaiai.mp3',
    cover: '/music/cover2.jpg'
  },
  {
    name: '歌手与模特儿 - DKD',
    src: '/music/3.mp3',
    cover: '/music/cover3.jpg'
  }
];
---

<LocalPlayer client:load {audioList} />
```

### 2. Create `LocalPlayer.svelte`

Path: `src/components/widget/LocalPlayer.svelte`
```astro
---
<script>
  import { onMount, onDestroy, tick } from 'svelte';

  export let audioList = [];
  let audio;
  let currentIndex = 0;
  let playing = false;
  let duration = 0;
  let current = 0;
  let timer;

  let offset = 0;
  let dir = 1;
  let scrollDistance = 0;
  let scrollInterval;
  let titleEl;
  let containerEl;

  function formatTime(t) {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function togglePlay() {
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    playing = !playing;
  }

  function playCurrent() {
    const track = audioList[currentIndex];
    if (!track || !audio) return;
    audio.src = track.src;
    audio.play().then(() => { playing = true; });
    setupScroll();
  }

  function prev() {
    if (audioList.length === 0) return;
    currentIndex = (currentIndex - 1 + audioList.length) % audioList.length;
    playCurrent();
  }

  function next() {
    if (audioList.length === 0) return;
    currentIndex = (currentIndex + 1) % audioList.length;
    playCurrent();
  }

  function seek(e) {
    if (audio) {
      audio.currentTime = +e.target.value;
      current = audio.currentTime;
    }
  }

  onMount(async () => {
    audio = new Audio();
    audio.loop = false;
    audio.addEventListener('loadedmetadata', () => (duration = audio.duration));
    audio.addEventListener('timeupdate', () => (current = audio.currentTime));
    audio.addEventListener('ended', () => next());

    playCurrent();
    timer = setInterval(() => { if (audio) current = audio.currentTime; }, 200);

    await tick();
    setupScroll();
  });

  onDestroy(() => {
    clearInterval(timer);
    clearInterval(scrollInterval);
    if (audio) {
      audio.pause();
      audio.src = '';
      audio = null;
    }
  });

  async function setupScroll() {
    clearInterval(scrollInterval);
    offset = 0;
    dir = 1;
    await tick();
    if (titleEl && containerEl) {
      const sw = titleEl.scrollWidth;
      const cw = containerEl.clientWidth;
      scrollDistance = sw - cw;
      if (scrollDistance > 0) {
        scrollInterval = setInterval(() => {
          offset += dir;
          if (offset >= scrollDistance || offset <= 0) dir = -dir;
        }, 100);
      }
    }
  }
</script>

<div class="player">
  <img
    src={audioList[currentIndex]?.cover}
    alt={audioList[currentIndex]?.name}
    class="cover"
    class:spinning={playing}
    on:click={togglePlay}
  />

  <div class="info">
    <div bind:this={containerEl} class="title-container">
      <div
        bind:this={titleEl}
        class="title"
        style="transform: translateX(-{offset}px);"
      >
        {audioList[currentIndex]?.name}
      </div>
    </div>

    <div class="time">{formatTime(current)} / {formatTime(duration)}</div>

    <input
      type="range"
      min="0"
      max={duration}
      step="0.01"
      bind:value={current}
      on:input={seek}
      class="progress"
    />
  </div>

  <div class="controls">
    <button on:click={prev} aria-label="Last" class="ctrl">
      <svg viewBox="0 0 24 24"><path d="M16 5v14l-11-7z"/></svg>
    </button>
    <button on:click={togglePlay} aria-label="Play/Pause" class="ctrl play-pause">
      {#if playing}
        <svg viewBox="0 0 24 24">
          <rect x="6" y="5" width="4" height="14" rx="1"/>
          <rect x="14" y="5" width="4" height="14" rx="1"/>
        </svg>
      {:else}
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      {/if}
    </button>
    <button on:click={next} aria-label="Next" class="ctrl">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </button>
  </div>
</div>

<style>
  /* Light mode */
  .player {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    box-sizing: border-box;
    width: 100%;
    color: #333;
  }
  .time { font-size: 0.75rem; color: #666; }
  .progress { background: #ddd; }
  .ctrl { background: #f2ebfd; }

  /* Dark mode via Tailwind's .dark class */
  :global(html.dark) .player { color: #eee; }
  :global(html.dark) .time { color: #aaa; }
  :global(html.dark) .progress { background: #555; }
  :global(html.dark) .ctrl { background: #bc98f8; }

  .cover {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
    flex-shrink: 0;
  }
  .spinning { animation: spin 10s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .title-container {
    overflow: hidden;
    width: 100%;
  }
  .title {
    display: inline-block;
    white-space: nowrap;
  }

  .progress {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    appearance: none;
    cursor: pointer;
  }
  .progress::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: currentColor;
    border-radius: 50%;
    cursor: pointer;
  }

  .controls {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }
  .ctrl {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .ctrl svg { width: 16px; height: 16px; fill: currentColor; }
</style>
---
## Step 3: Add the Music Player to Sidebar

### Modify `Sidebar.astro`

Path: `src/components/widget/Sidebar.astro`

1. Import the `Music` component at the top:

```astro
import Music from "./Music.astro";
```

2. Insert the music player block below the `<Tag>` component:

```astro
<div id="music" class="flex flex-col w-full gap-4">
  <Music></Music>
</div>
```

3. The relevant portion of the final `Sidebar.astro` should look like this:

```astro
<div id="sidebar" class:list={[className, "w-full"]}>
  <div class="flex flex-col w-full gap-4 mb-4">
    <Profile></Profile>
  </div>
  <div id="sidebar-sticky" class="transition-all duration-700 flex flex-col w-full gap-4 top-4 sticky top-4">
    <div id="series" class="flex flex-col w-full gap-4">
      { series && <Series series={ series }></Series> }
    </div>
    <Categories class="onload-animation" style="animation-delay: 150ms"></Categories>
    <Tag class="onload-animation" style="animation-delay: 200ms"></Tag>
    <div id="music" class="flex flex-col w-full gap-4">
      <Music></Music>
    </div>
  </div>
</div>
```


## Full Code Summary

- `public/music/` contains your audio files and cover images
- `src/components/widget/Music.astro` loads the track list and renders the player
- `src/components/widget/LocalPlayer.svelte` handles playback logic
- `Sidebar.astro` includes the `<Music />` component in the layout

Once completed, your Astro sidebar will have a fully functional and customizable music player.
