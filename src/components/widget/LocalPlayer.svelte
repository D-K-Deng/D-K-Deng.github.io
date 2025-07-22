<script>
  import { onDestroy, onMount, tick } from "svelte";

  // external input
  export let audioList = [];

  // component state
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

  // helpers
  function formatTime(t) {
    const m = Math.floor(t / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  // playback controls
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
    audio.play().then(() => {
      playing = true;
    });
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
    if (!audio) return;
    audio.currentTime = +e.target.value;
    current = audio.currentTime;
  }

  // title marquee
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

  // lifecycle
  onMount(async () => {
    audio = new Audio();
    audio.loop = false;

    audio.addEventListener("loadedmetadata", () => {
      duration = audio.duration;
    });

    audio.addEventListener("timeupdate", () => {
      current = audio.currentTime;
    });

    audio.addEventListener("ended", () => next());

    playCurrent();

    timer = setInterval(() => {
      if (audio) current = audio.currentTime;
    }, 200);

    await tick();
    setupScroll();
  });

  onDestroy(() => {
    clearInterval(timer);
    clearInterval(scrollInterval);
    if (audio) {
      audio.pause();
      audio.src = "";
      audio = null;
    }
  });
</script>

<div class="bg-[#ffffff] dark:bg-[#1e1b22] rounded-2xl p-4 w-full box-border">
  <div
    class="flex items-center gap-2 w-full text-neutral-800 dark:text-neutral-200"
  >
    <button
      on:click={togglePlay}
      aria-label={playing ? "Pause track" : "Play track"}
      class="w-[50px] h-[50px] rounded-full overflow-hidden p-0 border-none bg-transparent shrink-0"
    >
      <img
        src={audioList[currentIndex]?.cover}
        alt={audioList[currentIndex]?.name}
        class="w-full h-full object-cover spinning"
        style="animation-play-state: {playing ? 'running' : 'paused'};"
      />
    </button>

    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <div bind:this={containerEl} class="overflow-hidden w-full">
        <div
          bind:this={titleEl}
          class="inline-block whitespace-nowrap"
          style="transform: translateX(-{offset}px);"
        >
          {audioList[currentIndex]?.name}
        </div>
      </div>

      <div class="text-xs text-gray-500 dark:text-gray-400">
        {formatTime(current)} / {formatTime(duration)}
      </div>

      <input
        type="range"
        min="0"
        max={duration}
        step="0.01"
        bind:value={current}
        on:input={seek}
        class="w-full h-1 rounded bg-gray-300 dark:bg-gray-600 appearance-none"
      />
    </div>

    <div class="flex gap-1 shrink-0">
      <button
        on:click={prev}
        aria-label="Last"
        class="w-8 h-8 bg-violet-100 dark:bg-[#bc98f8] rounded-full flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="#000">
          <path d="M6 5h2v14H6V5zm3 7l9 7V5l-9 7z" />
        </svg>
      </button>

      <button
        on:click={togglePlay}
        aria-label="Play/Pause"
        class="w-8 h-8 bg-violet-100 dark:bg-[#bc98f8] rounded-full flex items-center justify-center"
      >
        {#if playing}
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="#000">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="#000">
            <path d="M8 5v14l11-7z" />
          </svg>
        {/if}
      </button>

      <button
        on:click={next}
        aria-label="Next"
        class="w-8 h-8 bg-violet-100 dark:bg-[#bc98f8] rounded-full flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="#000">
          <path d="M6 5l9 7-9 7V5z M17 5h2v14h-2V5z" />
        </svg>
      </button>
    </div>
  </div>
</div>

<style>
  .spinning {
    animation: spin 10s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
