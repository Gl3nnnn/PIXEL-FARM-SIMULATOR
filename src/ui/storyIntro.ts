import { el } from './uiKit';

interface StoryPage {
  kicker: string;
  title: string;
  paragraphs: string[];
  art: string;
}

export interface StoryIntroOptions {
  onDone: () => void;
}

const ART_LETTER = `
<svg viewBox="0 0 480 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A letter, a brass key and a candle on an old farmhouse table beside a dawn window">
  <defs>
    <linearGradient id="art1-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2a20"/>
      <stop offset="1" stop-color="#1c130e"/>
    </linearGradient>
    <linearGradient id="art1-window" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5f7fa5"/>
      <stop offset="0.55" stop-color="#b58a8c"/>
      <stop offset="1" stop-color="#f3b77b"/>
    </linearGradient>
    <radialGradient id="art1-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffd68a" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#ffd68a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="480" height="640" fill="url(#art1-wall)"/>
  <g opacity="0.18" fill="#070504">
    <rect x="66" y="0" width="3" height="640"/>
    <rect x="150" y="0" width="3" height="640"/>
    <rect x="234" y="0" width="3" height="640"/>
    <rect x="318" y="0" width="3" height="640"/>
    <rect x="402" y="0" width="3" height="640"/>
  </g>
  <rect x="0" y="292" width="480" height="18" fill="#120c09" opacity="0.55"/>
  <g>
    <rect x="292" y="70" width="146" height="196" rx="3" fill="#0d0907"/>
    <rect x="302" y="80" width="126" height="176" fill="url(#art1-window)"/>
    <rect x="302" y="80" width="126" height="176" fill="none" stroke="#0d0907" stroke-width="8"/>
    <rect x="362" y="80" width="6" height="176" fill="#0d0907"/>
    <rect x="302" y="164" width="126" height="6" fill="#0d0907"/>
    <path d="M292 70 h-32 q10 98 0 196 h32 z" fill="#6d2a25" opacity="0.9" class="story-curtain"/>
    <path d="M292 70 h-12 q6 98 0 196 h12 z" fill="#8a3a32" opacity="0.5"/>
    <path d="M438 70 h30 q-8 98 0 196 h-30 z" fill="#5c241f" opacity="0.85" class="story-curtain"/>
    <path d="M320 250 q40 16 92 0" fill="none" stroke="#e9b47c" stroke-width="3" opacity="0.35"/>
  </g>
  <ellipse cx="360" cy="330" rx="150" ry="80" fill="url(#art1-glow)" opacity="0.5"/>
  <g>
    <rect x="150" y="0" width="4" height="118" fill="#241811"/>
    <path d="M118 118 h68 l-10 26 h-48 z" fill="#3b2a1c"/>
    <path d="M124 144 h56 l-8 8 h-40 z" fill="#d6a65c"/>
    <circle cx="152" cy="156" r="40" fill="url(#art1-glow)" class="story-glow"/>
    <circle cx="152" cy="152" r="7" fill="#ffd986" class="story-lantern"/>
  </g>
  <g fill="#1a110c">
    <rect x="34" y="318" width="10" height="172"/>
    <rect x="72" y="318" width="10" height="172"/>
    <rect x="34" y="318" width="48" height="14"/>
    <rect x="34" y="360" width="48" height="10"/>
    <rect x="34" y="404" width="60" height="12"/>
    <rect x="84" y="416" width="10" height="74"/>
  </g>
  <g>
    <rect x="0" y="430" width="480" height="26" fill="#5c3d28"/>
    <rect x="0" y="430" width="480" height="7" fill="#7b563a"/>
    <rect x="46" y="456" width="26" height="184" fill="#3b271b"/>
    <rect x="408" y="456" width="26" height="184" fill="#3b271b"/>
    <rect x="86" y="500" width="308" height="10" fill="#2a1b13" opacity="0.55"/>
  </g>
  <g transform="rotate(-7 214 382)">
    <rect x="126" y="336" width="176" height="92" rx="3" fill="#efe1c2"/>
    <rect x="126" y="336" width="176" height="92" rx="3" fill="none" stroke="#c8b58e" stroke-width="2"/>
    <g fill="#7d6a4d" opacity="0.75">
      <rect x="146" y="358" width="118" height="4" rx="2"/>
      <rect x="146" y="372" width="136" height="4" rx="2"/>
      <rect x="146" y="386" width="104" height="4" rx="2"/>
      <rect x="146" y="400" width="122" height="4" rx="2"/>
    </g>
    <circle cx="280" cy="408" r="12" fill="#9b3d32"/>
    <circle cx="280" cy="408" r="7" fill="#b74b3d"/>
  </g>
  <g transform="rotate(18 334 420)">
    <circle cx="334" cy="420" r="13" fill="none" stroke="#d9a94f" stroke-width="6"/>
    <rect x="346" y="417" width="46" height="6" fill="#d9a94f"/>
    <rect x="376" y="423" width="6" height="12" fill="#d9a94f"/>
    <rect x="388" y="423" width="6" height="9" fill="#d9a94f"/>
  </g>
  <g>
    <rect x="66" y="384" width="18" height="46" fill="#e8d6ac"/>
    <rect x="66" y="384" width="7" height="46" fill="#f5e7c6" opacity="0.7"/>
    <rect x="62" y="428" width="26" height="6" rx="3" fill="#3f2a1c"/>
    <path d="M75 384 q-6 -10 0 -18 q6 8 0 18" fill="#ffd06a" class="story-lantern"/>
    <circle cx="75" cy="372" r="34" fill="url(#art1-glow)" class="story-glow"/>
  </g>
  <g fill="#ffe2a0">
    <circle cx="118" cy="212" r="1.8" class="story-dust" style="--drift:8px; animation-delay:-1s"/>
    <circle cx="176" cy="204" r="1.2" class="story-dust" style="--drift:-5px; animation-delay:-3.5s"/>
    <circle cx="140" cy="248" r="1.4" class="story-dust" style="--drift:10px; animation-delay:-5s"/>
    <circle cx="92" cy="330" r="1.3" class="story-dust" style="--drift:-7px; animation-delay:-2s"/>
    <circle cx="206" cy="348" r="1.5" class="story-dust" style="--drift:6px; animation-delay:-4.2s"/>
  </g>
</svg>`;

const ART_ROAD = `
<svg viewBox="0 0 480 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A winding dirt road leading back to a quiet valley town beneath a pale morning sky">
  <defs>
    <linearGradient id="art2-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#63788f"/>
      <stop offset="0.55" stop-color="#ad9793"/>
      <stop offset="1" stop-color="#e5bb8d"/>
    </linearGradient>
    <linearGradient id="art2-hill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#657a6c"/>
      <stop offset="1" stop-color="#435a4a"/>
    </linearGradient>
    <radialGradient id="art2-sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe0a8" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#ffe0a8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="480" height="640" fill="url(#art2-sky)"/>
  <circle cx="348" cy="156" r="92" fill="url(#art2-sun)" class="story-glow"/>
  <circle cx="348" cy="156" r="30" fill="#ffe0a8" opacity="0.5" class="story-sun"/>
  <g fill="#d7c8c2" opacity="0.22">
    <rect x="26" y="98" width="146" height="12" rx="6" class="story-cloud"/>
    <rect x="70" y="86" width="74" height="12" rx="6" class="story-cloud"/>
    <rect x="252" y="214" width="170" height="10" rx="5" class="story-cloud"/>
    <rect x="300" y="202" width="82" height="12" rx="6" class="story-cloud"/>
    <rect x="0" y="182" width="90" height="9" rx="4" class="story-cloud"/>
  </g>
  <path d="M0 330 L52 304 L108 322 L162 296 L214 318 L268 292 L322 314 L374 290 L428 312 L480 296 L480 410 L0 410Z" fill="#75877b" opacity="0.85"/>
  <path d="M0 362 L58 338 L114 354 L172 330 L228 350 L286 326 L342 348 L398 326 L452 346 L480 334 L480 440 L0 440Z" fill="url(#art2-hill)"/>
  <path d="M0 398 L64 376 L128 392 L190 368 L250 390 L312 366 L374 388 L436 368 L480 384 L480 470 L0 470Z" fill="#4d6852"/>
  <g>
    <rect x="156" y="352" width="42" height="32" fill="#5a4232"/>
    <path d="M150 354 L177 330 L204 354Z" fill="#7c4a3a"/>
    <rect x="168" y="364" width="9" height="11" fill="#f2c97a" opacity="0.55"/>
    <rect x="204" y="356" width="36" height="28" fill="#4c3a2d"/>
    <path d="M199 358 L222 338 L245 358Z" fill="#6b4134"/>
    <rect x="216" y="366" width="8" height="9" fill="#1b1712" opacity="0.6"/>
    <rect x="246" y="344" width="26" height="40" fill="#564233"/>
    <path d="M240 346 L259 318 L278 346Z" fill="#714436"/>
    <path d="M259 318 L259 304" stroke="#3b2c22" stroke-width="3"/>
    <rect x="250" y="356" width="7" height="10" fill="#f2c97a" opacity="0.4"/>
    <rect x="176" y="384" width="80" height="4" fill="#3e2c21" opacity="0.5"/>
  </g>
  <g>
    <path d="M356 372 q34 -42 74 -34 q30 6 46 34 z" fill="#3f5846"/>
    <path d="M382 372 q6 -26 26 -26 q18 0 26 26 z" fill="#131914"/>
    <rect x="382" y="338" width="4" height="34" fill="#6e5436"/>
    <rect x="430" y="338" width="4" height="34" fill="#6e5436"/>
    <rect x="382" y="338" width="52" height="4" fill="#6e5436"/>
    <path d="M370 372 h76" stroke="#7a5a38" stroke-width="3"/>
  </g>
  <path d="M0 430 L58 410 L120 424 L180 404 L240 422 L304 400 L368 420 L432 402 L480 416 L480 640 L0 640Z" fill="#415c46"/>
  <path d="M306 640 C292 570 318 536 296 496 C274 456 238 434 246 394 L266 394 C262 434 300 454 320 496 C344 542 312 576 328 640Z" fill="#b08a5e"/>
  <path d="M315 640 C306 574 328 540 308 500 C288 462 258 440 258 394 L264 394 C266 440 298 462 320 500 C344 542 321 576 332 640Z" fill="#c7a171" opacity="0.45"/>
  <g stroke="#6d5439" stroke-width="5" opacity="0.7">
    <rect x="96" y="472" width="6" height="46"/>
    <rect x="58" y="486" width="6" height="40"/>
    <rect x="380" y="480" width="6" height="46"/>
    <rect x="420" y="494" width="6" height="40"/>
  </g>
  <path d="M58 492 q28 8 44 4 M380 500 q26 8 46 2" fill="none" stroke="#8a6b47" stroke-width="2" opacity="0.5"/>
  <g class="story-sign">
    <rect x="44" y="430" width="128" height="42" rx="3" fill="#5f442f" transform="rotate(-3 108 451)"/>
    <rect x="50" y="437" width="116" height="28" rx="2" fill="none" stroke="#9a7a55" stroke-width="2" opacity="0.55" transform="rotate(-3 108 451)"/>
    <rect x="100" y="470" width="8" height="92" fill="#4a3323"/>
    <path d="M118 421 q10 -8 20 0 q-10 8 -20 0" fill="#2b2a26"/>
    <circle cx="138" cy="424" r="4" fill="#2b2a26"/>
    <path d="M143 423 l8 2 l-8 3 z" fill="#2b2a26"/>
  </g>
  <g fill="#2a2b25" class="story-walker">
    <circle cx="278" cy="512" r="7"/>
    <path d="M270 520 q8 -4 16 0 l4 28 h-24 z"/>
    <rect x="270" y="546" width="6" height="22"/>
    <rect x="280" y="546" width="6" height="22"/>
    <rect x="286" y="522" width="13" height="20" rx="4"/>
  </g>
  <g fill="#31452f" opacity="0.8" class="story-grass">
    <rect x="60" y="560" width="4" height="12"/>
    <rect x="78" y="556" width="3" height="10"/>
    <rect x="118" y="562" width="4" height="12"/>
    <rect x="356" y="558" width="4" height="12"/>
    <rect x="392" y="566" width="3" height="10"/>
    <rect x="442" y="562" width="4" height="12"/>
  </g>
  <g fill="#f4e6c6" opacity="0.7">
    <circle cx="196" cy="478" r="1.5" class="story-dust" style="--drift:7px; animation-delay:-1.5s"/>
    <circle cx="218" cy="530" r="1.2" class="story-dust" style="--drift:-6px; animation-delay:-4s"/>
    <circle cx="340" cy="510" r="1.4" class="story-dust" style="--drift:9px; animation-delay:-2.5s"/>
    <circle cx="386" cy="548" r="1.1" class="story-dust" style="--drift:-4px; animation-delay:-5.5s"/>
  </g>
  <g stroke="#33404c" stroke-width="2" fill="none" opacity="0.55">
    <path d="M108 132 l7 -5 l7 5" class="story-bird"/>
    <path d="M134 120 l6 -4 l6 4" class="story-bird"/>
  </g>
</svg>`;

const ART_LAMP = `
<svg viewBox="0 0 480 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="The old farmhouse porch at night, with a lit window, a hanging lantern, and tools left waiting">
  <defs>
    <linearGradient id="art3-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#08101f"/>
      <stop offset="0.6" stop-color="#1d3446"/>
      <stop offset="1" stop-color="#35505c"/>
    </linearGradient>
    <linearGradient id="art3-house" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#241a15"/>
      <stop offset="1" stop-color="#120d0a"/>
    </linearGradient>
    <radialGradient id="art3-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffc46a" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#ffc46a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="480" height="640" fill="url(#art3-sky)"/>
  <g fill="#e8e7d4">
    <circle cx="60" cy="72" r="1.6" opacity="0.8"/>
    <circle cx="128" cy="46" r="1.2" opacity="0.6"/>
    <circle cx="188" cy="96" r="1.8" opacity="0.7"/>
    <circle cx="246" cy="40" r="1.2" opacity="0.55"/>
    <circle cx="322" cy="78" r="1.5" opacity="0.6"/>
    <circle cx="396" cy="44" r="1.2" opacity="0.5"/>
    <circle cx="448" cy="104" r="1.6" opacity="0.7"/>
    <circle cx="158" cy="150" r="1.1" opacity="0.45"/>
    <circle cx="356" cy="148" r="1.3" opacity="0.5"/>
  </g>
  <circle cx="86" cy="100" r="34" fill="#e9e4cf" opacity="0.85"/>
  <circle cx="98" cy="92" r="30" fill="#101a2a"/>
  <path d="M0 360 L58 340 L120 354 L184 334 L250 352 L314 332 L380 350 L442 334 L480 344 L480 470 L0 470Z" fill="#14251f"/>
  <path d="M0 402 L70 382 L140 396 L210 378 L280 394 L350 376 L420 392 L480 382 L480 500 L0 500Z" fill="#1b3028"/>
  <rect x="0" y="500" width="480" height="140" fill="#13231c"/>
  <g fill="#0b1612" class="story-tree">
    <path d="M52 500 L64 500 L60 360 L54 360 Z"/>
    <path d="M58 372 q-38 -18 -46 -64 q-4 -18 6 -22 q10 26 44 52 z"/>
    <path d="M58 398 q42 -12 66 -54 q8 -16 -2 -22 q-18 30 -70 52 z"/>
    <path d="M58 336 q-14 -26 -4 -48 q14 8 18 30 z"/>
    <circle cx="28" cy="288" r="30" opacity="0.9"/>
    <circle cx="84" cy="310" r="24" opacity="0.9"/>
    <circle cx="54" cy="260" r="24" opacity="0.9"/>
  </g>
  <rect x="212" y="286" width="268" height="300" fill="url(#art3-house)"/>
  <path d="M186 288 L344 196 L502 288Z" fill="#38231d"/>
  <g stroke="#1c110d" stroke-width="3" opacity="0.55">
    <path d="M224 274 L358 216"/>
    <path d="M266 256 L388 236"/>
    <path d="M210 282 L456 286"/>
  </g>
  <rect x="176" y="360" width="304" height="20" fill="#2c1c15"/>
  <rect x="170" y="548" width="310" height="14" fill="#241610"/>
  <rect x="190" y="380" width="10" height="168" fill="#3b2a20"/>
  <rect x="430" y="380" width="10" height="168" fill="#3b2a20"/>
  <rect x="186" y="562" width="164" height="16" fill="#33241b"/>
  <rect x="198" y="578" width="140" height="16" fill="#2c1f18"/>
  <rect x="210" y="594" width="116" height="16" fill="#251a14"/>
  <ellipse cx="292" cy="430" rx="110" ry="94" fill="url(#art3-glow)" class="story-glow"/>
  <rect x="250" y="382" width="86" height="94" fill="#ffcf78"/>
  <rect x="250" y="382" width="86" height="94" fill="none" stroke="#4a2f1e" stroke-width="8"/>
  <rect x="291" y="382" width="5" height="94" fill="#4a2f1e"/>
  <rect x="250" y="425" width="86" height="5" fill="#4a2f1e"/>
  <rect x="380" y="404" width="58" height="144" fill="#2d1d14"/>
  <rect x="388" y="414" width="42" height="62" fill="#3a261a"/>
  <circle cx="430" cy="492" r="3" fill="#c79a58"/>
  <rect x="316" y="380" width="3" height="30" fill="#1a120d"/>
  <path d="M300 410 h38 l-6 16 h-26 z" fill="#3b2a1c"/>
  <circle cx="319" cy="428" r="44" fill="url(#art3-glow)" class="story-glow"/>
  <circle cx="319" cy="428" r="6" fill="#ffe0a0" class="story-lantern"/>
  <g fill="#ffe0a0">
    <circle cx="296" cy="404" r="1.6" class="story-moth"/>
    <circle cx="338" cy="398" r="1.3" class="story-moth" style="animation-delay:-1.1s"/>
    <circle cx="312" cy="458" r="1.4" class="story-moth" style="animation-delay:-2.3s"/>
    <circle cx="344" cy="442" r="1.1" class="story-moth" style="animation-delay:-0.7s"/>
    <circle cx="294" cy="438" r="1.2" class="story-moth" style="animation-delay:-1.7s"/>
    <circle cx="332" cy="414" r="1" class="story-moth" style="animation-delay:-2.8s"/>
  </g>
  <g>
    <rect x="186" y="392" width="7" height="176" fill="#6b4a2e" transform="rotate(13 190 480)"/>
    <path d="M198 560 q-16 6 -18 22 q18 8 28 -8 z" fill="#8a8c86"/>
  </g>
  <g fill="#4a5f63">
    <rect x="286" y="526" width="46" height="26" rx="4"/>
    <rect x="286" y="520" width="46" height="8" rx="3"/>
    <path d="M332 530 l26 -10 l4 8 l-26 10 z"/>
    <path d="M300 520 q0 -14 12 -14 q12 0 12 14" fill="none" stroke="#4a5f63" stroke-width="5"/>
  </g>
  <g fill="#7a5a38">
    <path d="M352 534 q-8 8 -8 20 h34 q0 -12 -8 -20 z"/>
    <rect x="352" y="528" width="18" height="8" rx="4"/>
    <path d="M361 528 q-8 -6 0 -10 q8 4 0 10" fill="#c9a45c"/>
  </g>
  <g fill="#0b0908">
    <ellipse cx="456" cy="536" rx="13" ry="9"/>
    <circle cx="447" cy="526" r="6"/>
    <path d="M443 521 l-2 -6 l6 3 z"/>
    <path d="M451 521 l1 -6 l5 4 z"/>
    <path d="M467 538 q10 2 8 -8" fill="none" stroke="#0b0908" stroke-width="3" class="story-tail"/>
  </g>
  <g fill="#ffe0a0">
    <circle cx="132" cy="540" r="1.8" class="story-dust" style="--drift:9px; animation-delay:-1s"/>
    <circle cx="170" cy="510" r="1.3" class="story-dust" style="--drift:-6px; animation-delay:-3.2s"/>
    <circle cx="212" cy="580" r="1.5" class="story-dust" style="--drift:11px; animation-delay:-5s"/>
    <circle cx="356" cy="502" r="1.2" class="story-dust" style="--drift:-5px; animation-delay:-2.2s"/>
    <circle cx="408" cy="590" r="1.6" class="story-dust" style="--drift:8px; animation-delay:-4.4s"/>
    <circle cx="252" cy="500" r="1.1" class="story-dust" style="--drift:-8px; animation-delay:-3.8s"/>
  </g>
  <path d="M0 620 q60 -18 120 -8 q70 12 140 0 q80 -14 140 4 q40 10 80 4 L480 640 L0 640Z" fill="#12221c"/>
</svg>`;

const ART_MORNING = `
<svg viewBox="0 0 480 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sunrise over a freshly tilled field, with a farmer and a hoe facing the valley">
  <defs>
    <linearGradient id="art4-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#25345a"/>
      <stop offset="0.46" stop-color="#8f5b63"/>
      <stop offset="0.76" stop-color="#f4b877"/>
      <stop offset="1" stop-color="#ffd99a"/>
    </linearGradient>
    <radialGradient id="art4-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe2a8" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#ffe2a8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="art4-soil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a4b32"/>
      <stop offset="1" stop-color="#3a271b"/>
    </linearGradient>
  </defs>
  <rect width="480" height="640" fill="url(#art4-sky)"/>
  <circle cx="336" cy="292" r="150" fill="url(#art4-glow)" class="story-glow"/>
  <circle cx="336" cy="292" r="62" fill="#ffe0a0" opacity="0.35"/>
  <circle cx="336" cy="292" r="42" fill="#ffe6b0" class="story-sun"/>
  <g fill="#f6c9a1" opacity="0.24">
    <rect x="18" y="164" width="150" height="12" rx="6" class="story-cloud"/>
    <rect x="68" y="152" width="72" height="12" rx="6" class="story-cloud"/>
    <rect x="286" y="130" width="158" height="10" rx="5" class="story-cloud"/>
    <rect x="334" y="118" width="78" height="12" rx="6" class="story-cloud"/>
    <rect x="0" y="236" width="92" height="9" rx="4" class="story-cloud"/>
  </g>
  <g fill="#ffdf9e" opacity="0.09" class="story-rays">
    <path d="M336 292 L110 0 L172 0 Z"/>
    <path d="M336 292 L286 0 L354 0 Z"/>
    <path d="M336 292 L470 0 L480 0 L480 72 Z"/>
  </g>
  <path d="M0 356 L54 334 L116 350 L182 328 L246 348 L310 328 L376 346 L438 330 L480 340 L480 430 L0 430Z" fill="#63766e"/>
  <path d="M0 390 L62 366 L128 382 L192 360 L256 380 L320 358 L384 378 L444 362 L480 372 L480 470 L0 470Z" fill="#4d6553"/>
  <path d="M0 426 L66 402 L132 418 L198 396 L264 416 L330 394 L396 414 L456 398 L480 406 L480 520 L0 520Z" fill="#3d5945"/>
  <g>
    <rect x="76" y="322" width="96" height="66" fill="#5a4030"/>
    <path d="M66 324 L124 280 L182 324Z" fill="#7a4a3a"/>
    <rect x="108" y="340" width="14" height="18" fill="#ffcf78" opacity="0.55"/>
    <rect x="140" y="340" width="14" height="18" fill="#2a1d15"/>
    <rect x="76" y="352" width="96" height="5" fill="#3b2a20" opacity="0.6"/>
    <rect x="166" y="334" width="70" height="54" fill="#4a3728"/>
    <path d="M158 336 L201 304 L244 336Z" fill="#673f31"/>
    <rect x="192" y="352" width="24" height="26" fill="#35251b"/>
    <rect x="308" y="336" width="34" height="26" fill="#574233"/>
    <path d="M302 338 L325 320 L348 338Z" fill="#704537"/>
    <rect x="346" y="340" width="26" height="22" fill="#4e3b2d"/>
    <path d="M340 342 L359 326 L378 342Z" fill="#673f31"/>
    <rect x="382" y="344" width="30" height="18" fill="#574233"/>
    <path d="M376 346 L397 332 L418 346Z" fill="#704537"/>
    <rect x="414" y="330" width="6" height="32" fill="#6b4a2e"/>
  </g>
  <path d="M0 444 L480 444 L480 640 L0 640Z" fill="url(#art4-soil)"/>
  <g stroke="#7d5a3b" stroke-width="3" opacity="0.55">
    <path d="M238 444 L0 640"/>
    <path d="M240 444 L88 640"/>
    <path d="M242 444 L176 640"/>
    <path d="M244 444 L264 640"/>
    <path d="M246 444 L352 640"/>
    <path d="M248 444 L440 640"/>
    <path d="M250 444 L480 574"/>
  </g>
  <g stroke="#8c6643" stroke-width="2" opacity="0.35">
    <path d="M0 560 q120 -12 240 0 q120 12 240 0"/>
    <path d="M0 594 q120 -12 240 0 q120 12 240 0"/>
  </g>
  <g fill="#7ea24e">
    <path d="M72 590 q-10 -14 2 -24 q10 10 2 24 z" class="story-sprout"/>
    <path d="M130 610 q-9 -12 2 -22 q9 9 2 22 z" class="story-sprout"/>
    <path d="M204 582 q-10 -14 2 -24 q10 10 2 24 z" class="story-sprout"/>
    <path d="M286 606 q-9 -12 2 -22 q9 9 2 22 z" class="story-sprout"/>
    <path d="M374 586 q-10 -14 2 -24 q10 10 2 24 z" class="story-sprout"/>
    <path d="M430 612 q-9 -12 2 -22 q9 9 2 22 z" class="story-sprout"/>
  </g>
  <g fill="#5f7f3d">
    <path d="M100 566 q-6 -10 1 -16 q7 6 1 16 z" class="story-sprout"/>
    <path d="M246 560 q-6 -10 1 -16 q7 6 1 16 z" class="story-sprout"/>
    <path d="M340 570 q-6 -10 1 -16 q7 6 1 16 z" class="story-sprout"/>
    <path d="M416 554 q-6 -10 1 -16 q7 6 1 16 z" class="story-sprout"/>
  </g>
  <g fill="#ffe8b0" opacity="0.8">
    <circle cx="150" cy="470" r="1.6" class="story-dust" style="--drift:11px; animation-delay:-1.2s"/>
    <circle cx="228" cy="522" r="1.3" class="story-dust" style="--drift:-8px; animation-delay:-3.4s"/>
    <circle cx="306" cy="470" r="1.4" class="story-dust" style="--drift:7px; animation-delay:-5.1s"/>
    <circle cx="420" cy="526" r="1.2" class="story-dust" style="--drift:-6px; animation-delay:-2.3s"/>
    <circle cx="462" cy="480" r="1.5" class="story-dust" style="--drift:9px; animation-delay:-4.7s"/>
  </g>
  <g fill="#201a14" class="story-farmer">
    <circle cx="362" cy="470" r="12"/>
    <path d="M338 480 q24 -10 48 0 l10 46 h-68 z"/>
    <rect x="344" y="526" width="14" height="58"/>
    <rect x="368" y="526" width="14" height="58"/>
    <rect x="338" y="582" width="22" height="10" rx="4"/>
    <rect x="368" y="582" width="22" height="10" rx="4"/>
    <path d="M330 476 q32 -16 64 0 l-4 8 q-28 -12 -56 0 z"/>
    <path d="M394 454 L352 602" fill="none" stroke="#6b4a2e" stroke-width="6" stroke-linecap="round"/>
    <path d="M348 602 q-16 2 -20 12 q16 8 28 -4 z" fill="#8a8c86"/>
  </g>
  <g stroke="#2f3d4a" stroke-width="2" fill="none" opacity="0.6">
    <path d="M74 112 l8 -6 l8 6" class="story-bird"/>
    <path d="M104 98 l7 -5 l7 5" class="story-bird"/>
    <path d="M134 86 l6 -4 l6 4" class="story-bird"/>
  </g>
</svg>`;

const PAGES: StoryPage[] = [
  {
    kicker: 'A prologue',
    title: 'The Letter',
    paragraphs: [
      'The letter came on the first warm morning of spring. A brass key slipped out onto the table, then a deed to a farm at the edge of Valley Town.',
      '"I kept the soil turned as long as I could," the old farmer wrote, in a hand that trembled. "The rest is yours now."',
      'It was signed only: the old farmer. You read it twice. The second time, you were already packing.'
    ],
    art: ART_LETTER
  },
  {
    kicker: 'Chapter I',
    title: 'The Road Back',
    paragraphs: [
      'You remember this valley from one bright summer of childhood: long fields, a pond full of stars, a village that danced when the harvest came in.',
      'The road back is quieter now. Shutters lean closed. The festival stage has gone grey. The old mine sleeps under the hill, and the community bundles hang empty in the square.',
      'At the crossroads, the town sign leans in the weeds. No one has painted it in years.'
    ],
    art: ART_ROAD
  },
  {
    kicker: 'Chapter II',
    title: 'The Lamp Still Lit',
    paragraphs: [
      'The farmhouse still smells of woodsmoke. On the porch waits a hoe, a watering can, and a pouch of spring seeds, laid out as if the old farmer meant to return.',
      'The fields have gone wild. The fences lean. But the lamp in the window is lit.',
      'You do not know why he left. You only know he kept it burning for whoever came next.'
    ],
    art: ART_LAMP
  },
  {
    kicker: 'Chapter III',
    title: 'The First Morning',
    paragraphs: [
      'This is not an inheritance. It is an invitation.',
      'Wake the soil. Fill the village\'s empty tables. Light the mine again. One seed at a time, the valley will remember what it was - and become something better.',
      'The sun is rising. Your story begins now.'
    ],
    art: ART_MORNING
  }
];

export class StoryIntro {
  private root: HTMLElement | null = null;
  private card!: HTMLElement;
  private art!: HTMLElement;
  private copy!: HTMLElement;
  private kicker!: HTMLElement;
  private title!: HTMLElement;
  private text!: HTMLElement;
  private dots!: HTMLElement;
  private nextBtn!: HTMLButtonElement;
  private backBtn!: HTMLButtonElement;
  private keyHint!: HTMLElement;
  private page = 0;
  private readonly onDone: () => void;
  private keyHandler?: (event: KeyboardEvent) => void;

  constructor(options: StoryIntroOptions) {
    this.onDone = options.onDone;
  }

  mount(): void {
    const root = el('div', 'story-intro');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Prologue: the valley that waited');
    root.innerHTML = `
      <div class="story-letterbox top"></div>
      <div class="story-letterbox bottom"></div>
      <div class="story-motes" aria-hidden="true"></div>
      <button type="button" class="story-skip">Skip prologue</button>
      <div class="story-card" tabindex="-1">
        <div class="story-art"></div>
        <div class="story-copy">
          <div class="story-overline"><span class="story-overline-line"></span><span>Pixel Farm Simulator</span></div>
          <div class="story-kicker"></div>
          <h1 class="story-title"></h1>
          <div class="story-text"></div>
          <div class="story-footer">
            <div class="story-dots"></div>
            <div class="story-actions">
              <button type="button" class="btn ghost story-back">Back</button>
              <button type="button" class="btn primary story-next">Continue</button>
            </div>
          </div>
          <p class="story-key-hint">Enter to continue</p>
        </div>
      </div>`;

    const motes = root.querySelector<HTMLElement>('.story-motes');
    for (let i = 0; i < 18; i++) {
      const mote = el('span', 'story-mote');
      mote.style.left = `${8 + Math.random() * 84}%`;
      mote.style.top = `${35 + Math.random() * 60}%`;
      mote.style.animationDelay = `${Math.random() * 7}s`;
      mote.style.animationDuration = `${6 + Math.random() * 7}s`;
      mote.style.setProperty('--drift', `${-30 + Math.random() * 60}px`);
      motes?.appendChild(mote);
    }

    this.root = root;
    this.card = root.querySelector<HTMLElement>('.story-card')!;
    this.art = root.querySelector<HTMLElement>('.story-art')!;
    this.copy = root.querySelector<HTMLElement>('.story-copy')!;
    this.kicker = root.querySelector<HTMLElement>('.story-kicker')!;
    this.title = root.querySelector<HTMLElement>('.story-title')!;
    this.text = root.querySelector<HTMLElement>('.story-text')!;
    this.dots = root.querySelector<HTMLElement>('.story-dots')!;
    this.nextBtn = root.querySelector<HTMLButtonElement>('.story-next')!;
    this.backBtn = root.querySelector<HTMLButtonElement>('.story-back')!;
    this.keyHint = root.querySelector<HTMLElement>('.story-key-hint')!;

    root.querySelector<HTMLButtonElement>('.story-skip')!.addEventListener('click', () => this.finish());
    this.nextBtn.addEventListener('click', () => this.next());
    this.backBtn.addEventListener('click', () => this.back());

    this.renderPage();
    document.body.appendChild(root);
    this.card.focus({ preventScroll: true });
    this.keyHandler = (event: KeyboardEvent) => this.handleKey(event);
    window.addEventListener('keydown', this.keyHandler);
  }

  private handleKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.back();
    }
  }

  private next(): void {
    if (this.page >= PAGES.length - 1) {
      this.finish();
      return;
    }
    this.page += 1;
    this.renderPage();
  }

  private back(): void {
    if (this.page === 0) return;
    this.page -= 1;
    this.renderPage();
  }

  private renderPage(): void {
    const page = PAGES[this.page];
    this.kicker.textContent = page.kicker;
    this.title.textContent = page.title;
    this.text.replaceChildren(...page.paragraphs.map((line) => el('p', 'story-paragraph', line)));
    this.dots.replaceChildren(
      ...PAGES.map((_, index) => el('span', `story-dot${index === this.page ? ' is-active' : ''}`))
    );
    this.nextBtn.textContent = this.page === PAGES.length - 1 ? 'Design your farmer' : 'Continue';
    this.backBtn.classList.toggle('is-hidden', this.page === 0);
    this.keyHint.textContent = this.page === PAGES.length - 1 ? 'Enter to begin' : 'Enter to continue';

    this.art.innerHTML = page.art;

    this.copy.classList.remove('story-anim');
    void this.copy.offsetWidth;
    this.copy.classList.add('story-anim');
    this.copy.scrollTop = 0;
  }

  private finish(): void {
    this.cleanup();
    this.root?.remove();
    this.root = null;
    this.onDone();
  }

  private cleanup(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
  }
}
