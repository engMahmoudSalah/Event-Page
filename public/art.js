// AI Summit visual identity: stage lighting, equalizer bars, confetti, ticket stubs.
export const theme = {
  tilt: true, bar: true,
  badge: (k, s) => `<span class="tk" style="width:${s * 1.2}px;height:${s}px"><svg viewBox="0 0 48 40" aria-hidden="true"><path class="tkp" d="M4 6h40v10a4 4 0 000 8v10H4V24a4 4 0 000-8z"/><path class="tkd" d="M32 8v24"/><path class="tks" d="M12 15h12M12 21h9M12 27h12"/></svg></span>`,
  empty: () => `<svg class="te" viewBox="0 0 200 110" width="200" aria-hidden="true"><path class="tb1" d="M20 22h160v26a8 8 0 000 16v26H20V64a8 8 0 000-16z"/><path class="tb2" d="M140 24v68"/><g class="teq"><rect x="40" y="54" width="8" height="24"/><rect x="54" y="44" width="8" height="34"/><rect x="68" y="60" width="8" height="18"/><rect x="82" y="40" width="8" height="38"/><rect x="96" y="56" width="8" height="22"/></g><path class="tb3" d="M152 40h18M152 52h14"/></svg>`,
};
const BARS = Array.from({ length: 28 }, (_, i) => `<i style="--d:${(i * 0.17).toFixed(2)}s;--h:${30 + ((i * 53) % 60)}%"></i>`).join("");
const CONF = Array.from({ length: 18 }, (_, i) => `<b style="--x:${(i * 37) % 100}%;--d:${(i * 0.45).toFixed(2)}s;--c:${["#f59e0b", "#ec4899", "#22d3ee", "#a78bfa", "#34d399"][i % 5]}"></b>`).join("");
export const stageHero = () => `<div class="stage" aria-hidden="true"><div class="beam b1"></div><div class="beam b2"></div><div class="beam b3"></div><div class="conf">${CONF}</div><div class="eq">${BARS}</div></div>`;
export const beamsOnly = () => `<div class="stage mini" aria-hidden="true"><div class="beam b1"></div><div class="beam b3"></div><div class="conf">${CONF}</div></div>`;
