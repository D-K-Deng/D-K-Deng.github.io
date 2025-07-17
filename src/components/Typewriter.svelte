<script>
  export let lines = ["Hello, I'm Zhaowen Deng."];
  let text = '';
  let i = 0;
  let j = 0;
  let isDeleting = false;

  const speed = 80;
  const pause = 1500;

  import { onMount } from 'svelte';

  onMount(() => {
    setTimeout(type, speed);
  });

  function type() {
    const fullText = lines[i];

    if (isDeleting) {
      j--;
      text = fullText.substring(0, j);
    } else {
      j++;
      text = fullText.substring(0, j);
    }

    if (!isDeleting && j === fullText.length) {
      setTimeout(() => {
        isDeleting = true;
        type();
      }, pause);
      return;
    }

    if (isDeleting && j === 0) {
      isDeleting = false;
      i = (i + 1) % lines.length;
    }

    setTimeout(type, isDeleting ? speed / 2 : speed);
  }
</script>

<div class="text-[2rem] md:text-[1.75rem] font-bold text-[var(--color-accent)] dark:text-white whitespace-nowrap h-[1.8em]">
  {text}<span class="animate-blink">|</span>
</div>

<style>
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .animate-blink {
    animation: blink 1s step-start infinite;
  }
</style>
