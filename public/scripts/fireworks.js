document.addEventListener("DOMContentLoaded", () => {
  let isFiring = false; 
  let lastFireTime = 0;
  const MIN_INTERVAL = 300; 

  document.documentElement.addEventListener("click", (e) => {
    const now = Date.now();

    if (isFiring || now - lastFireTime < MIN_INTERVAL) return;
    isFiring = true;
    lastFireTime = now;

    const themeColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-accent")
        .trim() || "#ab89e5"; //color

    const count = 20;
    const originX = e.clientX;
    const originY = e.clientY;

    let finishedCount = 0;

    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i;
      const distance = Math.random() * 40 + 30;

      const line = document.createElement("div");

      Object.assign(line.style, {
        position: "fixed",
        left: `${originX}px`,
        top: `${originY}px`,
        width: "2px",
        height: "14px",
        backgroundColor: themeColor,
        transform: `rotate(${angle}deg) translateY(0)`,
        transformOrigin: "center bottom",
        opacity: 1,
        zIndex: 9999,
        pointerEvents: "none",
        borderRadius: "1px",
        filter: "brightness(1)",
        willChange: "transform, opacity, filter",
      });

      document.body.appendChild(line);

      const animation = line.animate(
        [
          {
            transform: `rotate(${angle}deg) translateY(0)`,
            opacity: 1,
            filter: "brightness(1)",
            backgroundColor: themeColor,
          },
          {
            transform: `rotate(${angle}deg) translateY(-${distance * 0.5}px)`,
            opacity: 1,
            filter: "brightness(1.3)",
            backgroundColor: themeColor,
          },
          {
            transform: `rotate(${angle}deg) translateY(-${distance}px)`,
            opacity: 0,
            filter: "brightness(2)",
            backgroundColor: "#ffffff",
          },
        ],
        {
          duration: 1000,
          easing: "ease-out",
          fill: "none",
        }
      );

      animation.onfinish = () => {
        line.remove();
        finishedCount++;

        if (finishedCount >= count) {
          isFiring = false;
        }
      };
    }
  });
});
