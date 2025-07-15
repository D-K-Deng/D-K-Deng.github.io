<script>
  import { onMount, onDestroy } from 'svelte';

  export let src = '';
  export let cover = '';
  export let name = '';

  let audio;
  let playing = false;
  let duration = 0;
  let current = 0;
  let timer;

  function formatTime(t) {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function toggle() {
    if (!audio) return;
    if (playing) {
      audio.pause();
      playing = false;
    } else {
      audio.play();
      playing = true;
    }
  }

  onMount(() => {
    audio = new Audio(src);
    audio.volume = 0.5;
    audio.addEventListener('loadedmetadata', () => {
      duration = audio.duration;
    });
    audio.addEventListener('timeupdate', () => {
      current = audio.currentTime;
    });
    audio.play().then(() => playing = true).catch(() => {});
    timer = setInterval(() => current = audio?.currentTime ?? 0, 200);
  });

  onDestroy(() => {
    clearInterval(timer);
    if (audio) {
      audio.pause();
      audio.src = '';
      audio = null;
    }
  });
</script>

<div class="player" on:click={toggle}>
  <img
    class="cover"
    class:spinning={playing}
    src={cover}
    alt={name}
  />
  <div class="info">
    <div class="title">{name}</div>
    <div class="time">{formatTime(current)} / {formatTime(duration)}</div>
  </div>
  <div class="icon">
    {#if playing}
      <svg viewBox="0 0 24 24">
        <rect x="6" y="5" width="4" height="14" rx="1"/>
        <rect x="14" y="5" width="4" height="14" rx="1"/>
      </svg>
    {:else}
      <svg viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z"/>
      </svg>
    {/if}
  </div>
</div>

<style>
  .player {
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 100%;
    padding: 0.25rem 0;
    box-sizing: border-box;
  }

  /* 圆形封面 & 旋转动画（改为10秒一圈） */
  .cover {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 50%;
    transition: transform 0.3s linear;
  }
  .spinning {
    animation: spin 10s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .info {
    flex: 1;
    margin: 0 0.5rem;
    font-size: 0.8rem;
    overflow: hidden;
  }
  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .time {
    font-size: 0.7rem;
    color: #666;
    margin-top: 0.1em;
  }

  /* 按钮背景色改为 #f2ebfd */
  .icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f2ebfd;
    border-radius: 50%;
  }
  .icon svg {
    width: 16px;
    height: 16px;
    fill: #333;
  }
</style>
