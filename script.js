const body = document.body;

const colorPool = [
  'rgba(168, 85, 247, 0.14)',
  'rgba(96, 165, 250, 0.12)',
  'rgba(34, 197, 94, 0.1)',
  'rgba(248, 113, 113, 0.1)',
  'rgba(59, 130, 246, 0.12)',
  'rgba(168, 85, 247, 0.11)',
  'rgba(56, 189, 248, 0.11)'
];

const baseColors = ['#050914', '#050b13', '#040912', '#070d18'];
const selectedBase = baseColors[Math.floor(Math.random() * baseColors.length)];

const glowLayers = Array.from({ length: 6 }, () => {
  const color = colorPool[Math.floor(Math.random() * colorPool.length)];
  const brightnessBoost = (Math.random() * 0.16) + 1.06;
  const alpha = Number.parseFloat(color.match(/0\.\d+/)?.[0] || '0.14');
  const adjusted = color.replace(/0\.\d+\)/, `${(alpha * brightnessBoost).toFixed(3)})`);

  return `radial-gradient(circle at ${Math.random() * 100}% ${Math.random() * 100}%, ${adjusted}, transparent ${18 + Math.random() * 18}%)`;
}).join(', ');

const overlayOpacity = (Math.random() * 0.12) + 0.09;
const overlayHue = colorPool[Math.floor(Math.random() * colorPool.length)];

const ambient = document.createElement('div');
ambient.setAttribute('aria-hidden', 'true');
ambient.style.position = 'fixed';
ambient.style.inset = '-24%';
ambient.style.pointerEvents = 'none';
ambient.style.zIndex = '0';
ambient.style.background = glowLayers;
ambient.style.filter = 'blur(30px)';
ambient.style.opacity = '0.95';
ambient.style.mixBlendMode = 'screen';
ambient.style.transformOrigin = 'center';
ambient.style.animation = 'ambientDrift 8s ease-in-out infinite alternate, pulseGlow 16s ease-in-out infinite alternate';
body.appendChild(ambient);

body.style.background = `${glowLayers}, ${selectedBase}`;
body.style.setProperty('--bg-base', selectedBase);
body.style.isolation = 'isolate';

const overlay = document.createElement('div');
overlay.setAttribute('aria-hidden', 'true');
overlay.style.position = 'fixed';
overlay.style.inset = '0';
overlay.style.pointerEvents = 'none';
overlay.style.zIndex = '-1';
overlay.style.background = `linear-gradient(120deg, ${overlayHue.replace(/0\.\d+\)/, `${overlayOpacity})`)}, rgba(15, 23, 42, ${overlayOpacity * 0.7}) 40%, rgba(2, 6, 23, 0.9) 100%)`;
body.appendChild(overlay);

const style = document.createElement('style');
style.textContent = `
  @keyframes ambientDrift {
    0% {
      transform: translate3d(-5%, 3%, 0) scale(0.95) rotate(0deg);
    }
    25% {
      transform: translate3d(4%, -4%, 0) scale(1.08) rotate(4deg);
    }
    50% {
      transform: translate3d(-3%, 6%, 0) scale(1.14) rotate(8deg);
    }
    75% {
      transform: translate3d(6%, 2%, 0) scale(1.06) rotate(-4deg);
    }
    100% {
      transform: translate3d(-4%, -3%, 0) scale(1.12) rotate(-8deg);
    }
  }

  @keyframes pulseGlow {
    0% {
      opacity: 0.45;
      filter: blur(28px) saturate(0.8);
    }
    50% {
      opacity: 1;
      filter: blur(36px) saturate(1.3);
    }
    100% {
      opacity: 0.65;
      filter: blur(30px) saturate(1.05);
    }
  }
`;
document.head.appendChild(style);
