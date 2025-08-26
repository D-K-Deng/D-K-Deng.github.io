<script lang="ts">
  import { onMount } from 'svelte';

  // Core
  export let start = 0;
  export let end = 0;
  export let duration = 1200;        // number & highlighter animation duration (ms)
  export let decimals = 0;
  export let locale: string | undefined = undefined;
  export let format: 'standard' | 'compact' = 'standard';

  // Display
  export let prefix = '';
  export let suffix = '';
  export let plus = false;

  // Accent styling
  export let color = '#ab8ae3';
  export let weight: number | string = 700;
  export let scale = 1.12;           // slightly larger than surrounding text

  // Highlighter
  export let highlight = false;
  export let highlightColor = 'rgba(171,138,227,0.25)';
  export let highlightRadius = '0.35em';
  export let highlightPadY = '0.12em';
  export let highlightPadX = '0.18em';

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  let display = '';

  function formatNumber(n: number) {
    const opts: Intl.NumberFormatOptions =
      format === 'compact'
        ? { notation: 'compact', maximumFractionDigits: 1 }
        : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    return n.toLocaleString(locale, opts);
  }

  function run() {
    const t0 = performance.now();
    const from = start, to = end;

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const v = from + (to - from) * easeOutCubic(p);
      display = formatNumber(p < 1 ? v : to);
      if (p < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  onMount(run);
</script>

<span
  class="countup"
  class:with-hl={highlight}
  style="
    --dur: {duration}ms;
    --scale: {scale};
    --color: {color};
    --weight: {weight};
    --hl-color: {highlightColor};
    --hl-radius: {highlightRadius};
    --pad-y: {highlightPadY};
    --pad-x: {highlightPadX};
  "
>
  {#if highlight}<span class="hl" aria-hidden="true"></span>{/if}
  <span class="txt">{prefix}{display}{plus ? '+' : ''}{suffix}</span>
</span>

<style>
  .countup {
    position: relative;
    display: inline-block;
    line-height: 1.1;
    font-size: calc(1em * var(--scale));
    color: var(--color);
    font-weight: var(--weight);
    vertical-align: baseline;
  }
  .countup .txt { position: relative; z-index: 1; }

  .countup.with-hl .hl {
    position: absolute;
    z-index: 0;
    left: calc(var(--pad-x) * -1);
    right: calc(var(--pad-x) * -1);
    top: calc(var(--pad-y) * -1);
    bottom: calc(var(--pad-y) * -1);
    border-radius: var(--hl-radius);
    background: var(--hl-color);
    transform: scaleX(0);
    transform-origin: left center;
    animation: sweep var(--dur) ease-out forwards;
  }

  @keyframes sweep { to { transform: scaleX(1); } }
</style>