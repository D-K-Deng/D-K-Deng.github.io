<script>
  import CountUp from "@components/CountUp.svelte";
  import Typewriter from "@components/Typewriter.svelte";
  import { onMount } from 'svelte';

  // --- 1. 数据配置 ---
  const steps = [
    {
      id: 'intro',
      location: 'Chengdu, China',
      icon: 'home_pin',
      content: `
        <div class="mb-6 pl-2">
            <div class="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Introduction</div>
            <h2 class="text-4xl font-bold text-slate-900 dark:text-white">Origins</h2>
        </div>
        <p class="text-xl opacity-90 leading-relaxed text-slate-700 dark:text-slate-300 pl-2">
          I'm from <strong class="text-purple-600 dark:text-purple-400">Chengdu</strong>. This is where my story begins. 
          A city of spice, culture, and innovation.
        </p>
      `
    },
    {
      id: 'academic',
      location: 'Hanover & Durham, USA',
      icon: 'school',
      content: `
        <div class="mb-6">
            <div class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Academic Journey</div>
            <h2 class="text-4xl font-bold text-slate-900 dark:text-white">Dartmouth & Duke</h2>
        </div>
        <p class="mb-6 opacity-90 leading-relaxed text-slate-700 dark:text-slate-300 text-lg">
           Pursuing a <strong>Master’s in Computer Science</strong>. Focusing on HCI and Software Engineering.
        </p>
        <div class="flex flex-wrap gap-3">
            <span class="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-bold border border-blue-200 dark:border-blue-800">Dartmouth</span>
            <span class="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm border border-slate-200 dark:border-slate-700">Duke</span>
        </div>
      `
    },
    {
      id: 'work',
      location: 'Kunshan, China',
      icon: 'science',
      content: `
        <div class="mb-6">
            <div class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Experience</div>
            <h2 class="text-4xl font-bold text-slate-900 dark:text-white">Innovation Lab</h2>
        </div>
        <p class="opacity-90 leading-relaxed mb-6 text-slate-700 dark:text-slate-300 text-lg">
           Supervised a team to provide solutions on supplies and equipment. Managed A/V, electronics, and daily operations.
        </p>
      `
    },
    {
      id: 'interest',
      location: 'Tencent Music',
      icon: 'music_note',
      hasComponent: true, 
    }
  ];

  // --- 2. 状态变量 ---
  let containerRef;
  let scrollY = 0;
  
  // 视口尺寸，用于计算坐标
  let containerWidth = 0;
  let viewportHeight = 0;

  // 动画状态
  let activeIndex = 0;
  let globalProgress = 0; // 0 ~ steps.length
  
  // Logo/Ball 的实时位置
  let ballPos = { x: 0, y: 0 };
  // 当前形态：0=Logo, 1=Ball (0.5是中间态)
  let morphFactor = 0; 

  // 路径点缓存
  $: pathPoints = steps.map((_, i) => {
      if (!containerWidth) return { x: 0, y: 0 };
      // 偶数行(0,2): Logo在右侧 (75%)
      // 奇数行(1,3): Logo在左侧 (25%)
      const x = i % 2 === 0 ? containerWidth * 0.75 : containerWidth * 0.25;
      // Y轴相对位置：固定在屏幕垂直中心
      return { x, y: 0 }; 
  });

  // 贝塞尔插值
  function getBezierPoint(p0, p1, p2, p3, t) {
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;
    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;
    const x = (ax * Math.pow(t, 3)) + (bx * Math.pow(t, 2)) + (cx * t) + p0.x;
    const y = (ay * Math.pow(t, 3)) + (by * Math.pow(t, 2)) + (cy * t) + p0.y;
    return { x, y };
  }

  function handleScroll() {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const totalHeight = rect.height - viewportHeight; // 可滚动的总距离
    
    // 计算当前滚动的相对进度 (0 到 1)
    // rect.top 是负数，表示向上滚动的距离
    const p = Math.max(0, Math.min(1, Math.abs(Math.min(0, rect.top)) / totalHeight));
    
    // 映射到具体的步数 (例如 3.5 表示第3步走了一半)
    // 我们留最后一段作为空白
    const mappedProgress = p * (steps.length - 0.5); 
    globalProgress = mappedProgress;
    activeIndex = Math.floor(mappedProgress);
    
    const segmentProgress = mappedProgress - activeIndex; // 0~1 当前段落内的进度

    // --- 核心动画逻辑 ---
    // 定义时间窗口：
    // 0.0 - 0.7: 停留 (Hold)，显示文字和Logo
    // 0.7 - 1.0: 移动 (Travel)，文字消失，Logo变球移动
    
    if (segmentProgress < 0.7) {
        // 停留阶段
        ballPos = { x: pathPoints[activeIndex].x, y: 0 };
        morphFactor = 0; // 显示 Logo
    } else {
        // 移动阶段 (0.7 ~ 1.0) -> 归一化为 0~1
        const travelT = (segmentProgress - 0.7) / 0.3;
        
        // 目标点 (防止数组越界)
        const nextIndex = Math.min(activeIndex + 1, steps.length - 1);
        
        // 贝塞尔曲线起点和终点
        const start = pathPoints[activeIndex];
        const end = pathPoints[nextIndex];
        
        // Y轴动态计算：不仅仅是左右动，还要有一个向下再向上的弧度感? 
        // 不，这里我们是在 Sticky 容器里，Y轴是相对固定的，但为了感觉，可以加一点Y轴偏移
        // 比如向下沉一点
        
        // 构建控制点 S型
        const controlY = 100; // 弯曲幅度
        const p0 = { x: start.x, y: 0 };
        const p3 = { x: end.x, y: 0 };
        const p1 = { x: start.x, y: controlY };
        const p2 = { x: end.x, y: controlY };
        
        const pos = getBezierPoint(p0, p1, p2, p3, travelT);
        ballPos = pos;
        
        // 变形因子：完全变成球
        morphFactor = 1;
    }
  }

  function updateDimensions() {
      if(containerRef) {
          containerWidth = containerRef.clientWidth;
          viewportHeight = window.innerHeight;
      }
  }

  onMount(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,400,1,0';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
        window.removeEventListener('resize', updateDimensions);
        window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<style>
    .snake-path {
        fill: none;
        stroke: #a855f7;
        stroke-width: 3;
        stroke-dasharray: 10 10;
        stroke-linecap: round;
        opacity: 0.3;
    }
    
    .logo-container {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
</style>

<div class="w-full max-w-6xl mx-auto px-6 pt-10 mb-20">
    <div class="flex flex-col items-start text-left pl-2">
        <div class="mb-8">
            <Typewriter lines={["About Me", "My Journey"]} client:load />
        </div>
        <div class="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img 
                src="/image/5-mini.gif" 
                class="w-full h-auto object-cover block" 
                alt="Zhaowen Deng"
            />
        </div>
    </div>
</div>

<div 
    bind:this={containerRef} 
    class="relative w-full"
    style="height: {steps.length * 100 + 50}vh;"
>
    <div class="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <div class="relative w-full max-w-6xl h-full flex items-center">
            
            <svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                </svg>

            <div 
                class="absolute top-1/2 left-0 z-20 flex items-center justify-center pointer-events-none will-change-transform"
                style="
                    transform: translate3d({ballPos.x}px, {ballPos.y}px, 0) translate(-50%, -50%);
                    transition: transform 0.1s linear; /* 增加一点平滑度 */
                "
            >
                <div 
                    class="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-2xl border-4 border-slate-100 dark:border-slate-700 transition-all duration-300 overflow-hidden"
                    style="
                        width: {morphFactor > 0.5 ? '0px' : '100px'};
                        height: {morphFactor > 0.5 ? '0px' : '100px'};
                        opacity: {1 - morphFactor};
                        transform: scale({1 - morphFactor});
                    "
                >
                    <span class="material-symbols-rounded text-5xl text-purple-600 dark:text-purple-400">
                        {steps[activeIndex]?.icon || 'circle'}
                    </span>
                </div>

                <div 
                    class="absolute bg-purple-600 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.8)] transition-all duration-300"
                    style="
                        width: {morphFactor > 0.5 ? '24px' : '0px'};
                        height: {morphFactor > 0.5 ? '24px' : '0px'};
                        opacity: {morphFactor};
                    "
                >
                    <div class="absolute inset-0 bg-white rounded-full animate-ping opacity-50"></div>
                </div>
                
                <div 
                    class="absolute top-full mt-6 whitespace-nowrap px-4 py-2 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 shadow-lg transition-all duration-300"
                    style="
                        opacity: {1 - morphFactor};
                        transform: translateY({morphFactor * 20}px);
                    "
                >
                    {steps[activeIndex]?.location}
                </div>
            </div>

            <div class="w-full h-full relative">
                {#each steps as step, i}
                    <div 
                        class={`
                            absolute top-1/2 -translate-y-1/2 w-[40%] px-8 transition-all duration-500 ease-out
                            ${i % 2 === 0 ? 'left-0 text-right pr-20' : 'right-0 text-left pl-20'}
                        `}
                        style="
                            opacity: {activeIndex === i && morphFactor < 0.3 ? 1 : 0};
                            transform: translateY({activeIndex === i ? '-50%' : (activeIndex < i ? '0%' : '-100%')}) scale({activeIndex === i && morphFactor < 0.3 ? 1 : 0.9});
                            filter: blur({activeIndex === i && morphFactor < 0.3 ? 0 : 10}px);
                            pointer-events: {activeIndex === i ? 'auto' : 'none'};
                        "
                    >
                        <div class="bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-2xl">
                            {#if step.hasComponent}
                                <div class="flex flex-col gap-2">
                                    <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Interests</h2>
                                    <div class="text-6xl font-black text-purple-600 dark:text-purple-400 my-2">
                                        <CountUp end={370200} format="standard" plus={true} duration={3000} suffix="" highlight/>
                                    </div>
                                    <p class="text-sm opacity-60 uppercase tracking-widest text-slate-500 dark:text-slate-400">Plays on Tencent Music</p>
                                </div>
                            {:else}
                                {@html step.content}
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

        </div>
    </div>
</div>