<script>
  import { geoInterpolate } from 'd3-geo';
  import { onDestroy, onMount } from 'svelte';


  let wrapper, container, globe, ro;
  let animationProgress = 0;

  const locations = [
    { name: 'Home',      coords: [104.0665, 30.5728], desc: 'Chengdu, China', icon: '/image/MaterialSymbolsHomePinOutline.png' },
    { name: 'DKU',       coords: [120.9807, 31.3856], desc: 'Kunshan, China',  icon: '/image/DKU.png' },
    { name: 'Duke',      coords: [-78.9382, 36.0014], desc: 'Durham, USA',    icon: '/image/duke.png' },
    { name: 'Dartmouth', coords: [-72.2887, 43.7044], desc: 'Hanover, USA',   icon: '/image/D-Pine_RGB.png' }
  ];

  const arcs = locations.slice(0, -1).map((d, i) => ({
    startLat:  d.coords[1],
    startLng:  d.coords[0],
    endLat:    locations[i+1].coords[1],
    endLng:    locations[i+1].coords[0],
    order:     i
  }));

  const arcCount = arcs.length;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function updateVisualization() {
    const total   = arcCount;
    const raw     = animationProgress * total;
    const segIdx  = Math.floor(raw);
    const segProg = raw - segIdx;

    globe.arcsData(arcs.map(a => ({
      ...a,
      initGap:
        a.order < segIdx       ? 0 :
        a.order === segIdx     ? 1 - segProg :
                                 1
    })));

    let focusLat, focusLng;
    if (segIdx < total) {
      const arc    = arcs[segIdx];
      const interp = geoInterpolate(
        [ arc.startLng, arc.startLat ],
        [ arc.endLng,   arc.endLat   ]
      );
      [ focusLng, focusLat ] = interp(segProg);
    } else {
      [ focusLng, focusLat ] = locations[locations.length - 1].coords;
    }
    globe.pointOfView({ lat: focusLat, lng: focusLng, altitude: 3 }, 0);

    const markers = container.querySelectorAll('.marker');
    markers.forEach(marker => {
      const idx = +marker.dataset.idx;
      const threshold = idx / total;
      const img = marker.querySelector('img');
      img.style.display = animationProgress >= threshold ? 'block' : 'none';
    });
  }

  function handleWheel(e) {
    const rect = wrapper.getBoundingClientRect();
    const down = e.deltaY > 0;
    const vh   = window.innerHeight;

    // 向下滚动：先滚动页面，直到地球完全可见底部
    if (down) {
      if (rect.bottom > vh) {
        document.body.style.overflow = 'auto';
        return;
      }
      // 如果动画已完成，恢复页面滚动
      if (animationProgress >= 1) {
        document.body.style.overflow = 'auto';
        return;
      }
    }
    // 向上滚动：先滚动页面，直到地球完全可见顶部
    else {
      if (rect.top < 0) {
        document.body.style.overflow = 'auto';
        return;
      }
      if (animationProgress <= 0) {
        document.body.style.overflow = 'auto';
        return;
      }
    }

    // 拦截并处理动画滚动
    e.preventDefault();
    document.body.style.overflow = 'hidden';

    // 限制每次滚动不会跨过超过一个段落
    const rawDelta = e.deltaY / (vh * 5);
    const maxDelta = 1 / arcCount;
    const delta    = clamp(rawDelta, -maxDelta, maxDelta);
    animationProgress = clamp(animationProgress + delta, 0, 1);

    updateVisualization();
  }

  onMount(async () => {
    const { default: Globe } = await import('globe.gl');

    globe = Globe()(container)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundColor('rgba(0,0,0,0)')
      .arcsData([])
      .arcColor(() => '#ab89e9')
      .arcStroke(1.2)
      .arcAltitude(0.25)
      .arcDashLength(1)
      .arcDashGap(0)
      .arcDashInitialGap(d => d.initGap)
      .arcsTransitionDuration(0)
      .htmlElementsData(locations.map((d, i) => ({ ...d, idx: i })))
      .htmlLat(d => d.coords[1])
      .htmlLng(d => d.coords[0])
      .htmlAltitude(0.02)
      .htmlElement(d => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.dataset.idx = d.idx;
        if (d.idx === 2) {
          el.innerHTML = `
            <div class="title">${d.name}</div>
            <div class="desc">${d.desc}</div>
            <img src="${d.icon}" alt="icon" />
          `;
        } else {
          el.innerHTML = `
            <img src="${d.icon}" alt="icon" />
            <div class="title">${d.name}</div>
            <div class="desc">${d.desc}</div>
          `;
        }
        el.querySelector('img').style.display = 'none';
        return el;
      })
      .htmlTransitionDuration(0)
      .pointOfView({ lat: locations[0].coords[1], lng: locations[0].coords[0], altitude: 3 }, 0);

    globe.controls().enableZoom = false;

    ro = new ResizeObserver(entries => {
      for (let { contentRect } of entries) {
        globe.width(contentRect.width).height(contentRect.height);
      }
    });
    ro.observe(wrapper);

    window.addEventListener('wheel', handleWheel, { passive: false });
    updateVisualization();
  });

  onDestroy(() => {
    ro.disconnect();
    window.removeEventListener('wheel', handleWheel);
    document.body.style.overflow = 'auto';
  });
</script>

<style>
  .globe-wrapper {
    position: sticky;
    top: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    z-index: 10;
  }
  .globe-canvas {
    position: absolute;
    inset: 0;
  }
  :global(.globe-canvas canvas),
  :global(.globe-canvas > div) {
    position: absolute;
    inset: 0;
  }
  :global(.marker) {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -150%);
    pointer-events: auto;
    text-align: center;
    color: #fff;
  }
  :global(.marker img) {
    /* 默认图标大小，可自行调整 */
    --icon-size: 24px;
    max-width: var(--icon-size);
    max-height: var(--icon-size);
    width: auto;
    height: auto;
    margin-bottom: 4px;
  }
  /* Duke 标志放大一倍：使用 CSS 变量覆盖 */
  :global(.marker[data-idx="2"] img) {
    --icon-size: 48px;
  }
  /* Home 黑色图标变白 */
  :global(.marker[data-idx="0"] img) {
    filter: invert(1);
  }
  :global(.marker .title) { font-size: 0.9rem; font-weight: bold; }
  :global(.marker .desc)  { font-size: 0.75rem; }
</style>

<div bind:this={wrapper} class="globe-wrapper">
  <div bind:this={container} class="globe-canvas"></div>
</div>
