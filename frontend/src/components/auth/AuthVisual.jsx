import React from "react"

/**
 * Editorial still-life artwork in Cobalt & Bone palette.
 * Pure vector SVG with directional window light, cast shadows,
 * stepped plaster plinths, ceramic vessels, and cobalt accents.
 */
const AuthVisual = ({ headline, sub }) => {
    return (
        <aside className="auth-visual" aria-hidden="true">
            <figure className="auth-visual-frame">
                <svg
                    className="auth-visual-img"
                    viewBox="0 0 800 1000"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        {/* Soft directional window light */}
                        <linearGradient id="wall-gradient" x1="0" y1="0" x2="800" y2="1000" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#f5f4ef" />
                            <stop offset="45%" stopColor="#eceae3" />
                            <stop offset="100%" stopColor="#dedbd1" />
                        </linearGradient>

                        <linearGradient id="sun-beam" x1="0" y1="0" x2="600" y2="900" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </linearGradient>

                        {/* Plaster block gradients */}
                        <linearGradient id="plinth-top" x1="200" y1="620" x2="680" y2="620" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#faf9f6" />
                            <stop offset="100%" stopColor="#edebe4" />
                        </linearGradient>
                        <linearGradient id="plinth-front" x1="280" y1="670" x2="280" y2="880" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#dedbd1" />
                            <stop offset="100%" stopColor="#c5c1b4" />
                        </linearGradient>
                        <linearGradient id="plinth-side" x1="680" y1="620" x2="740" y2="820" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#aba79a" />
                            <stop offset="100%" stopColor="#969183" />
                        </linearGradient>

                        {/* Left small plinth */}
                        <linearGradient id="left-plinth-top" x1="120" y1="560" x2="320" y2="560" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#f2f0e9" />
                        </linearGradient>
                        <linearGradient id="left-plinth-front" x1="120" y1="600" x2="120" y2="790" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#e4e1d7" />
                            <stop offset="100%" stopColor="#cfcbc0" />
                        </linearGradient>

                        {/* Cobalt glaze vase */}
                        <linearGradient id="cobalt-glaze" x1="560" y1="460" x2="670" y2="650" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#3d5eff" />
                            <stop offset="25%" stopColor="#2440c8" />
                            <stop offset="70%" stopColor="#182c91" />
                            <stop offset="100%" stopColor="#0f1c61" />
                        </linearGradient>

                        <linearGradient id="cobalt-specular" x1="570" y1="480" x2="605" y2="610" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
                            <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
                        </linearGradient>

                        {/* Matte ceramic cup */}
                        <linearGradient id="ceramic-cup" x1="180" y1="470" x2="270" y2="580" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="50%" stopColor="#eeebe2" />
                            <stop offset="100%" stopColor="#d3cebe" />
                        </linearGradient>

                        {/* Leather notebook */}
                        <linearGradient id="leather-cover" x1="320" y1="680" x2="520" y2="760" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#c98a58" />
                            <stop offset="50%" stopColor="#b47443" />
                            <stop offset="100%" stopColor="#8d542b" />
                        </linearGradient>

                        {/* Folded cobalt linen cloth */}
                        <linearGradient id="linen-cloth" x1="260" y1="520" x2="480" y2="640" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#3352ea" />
                            <stop offset="40%" stopColor="#2440c8" />
                            <stop offset="100%" stopColor="#192e9e" />
                        </linearGradient>

                        {/* Soft ambient drop shadows */}
                        <filter id="soft-shadow" x="-20%" y="-20%" width="150%" height="150%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="16" />
                            <feOffset dx="10" dy="24" />
                            <feComponentTransfer><feFuncA type="linear" slope="0.22" /></feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Seamless background wall */}
                    <rect width="800" height="1000" fill="url(#wall-gradient)" />

                    {/* Diagonal window light beam cast across background */}
                    <path d="M-50 -50 L480 -50 L180 1050 L-50 1050 Z" fill="url(#sun-beam)" />

                    {/* Soft ambient ground shadow for entire composition */}
                    <ellipse cx="440" cy="850" rx="340" ry="70" fill="#252422" opacity="0.12" filter="blur(28px)" />

                    {/* === Step 1: Main back/lower plinth === */}
                    <g filter="url(#soft-shadow)">
                        {/* Top surface */}
                        <polygon points="260,650 640,600 730,640 350,690" fill="url(#plinth-top)" />
                        {/* Front surface */}
                        <polygon points="350,690 730,640 730,830 350,880" fill="url(#plinth-front)" />
                        {/* Side left shadow crevice */}
                        <polygon points="260,650 350,690 350,880 260,840" fill="#9f9a8c" />
                    </g>

                    {/* === Step 2: Left elevated plaster cube === */}
                    <g filter="url(#soft-shadow)">
                        <polygon points="130,550 310,510 390,545 210,585" fill="url(#left-plinth-top)" />
                        <polygon points="210,585 390,545 390,750 210,790" fill="url(#left-plinth-front)" />
                        <polygon points="130,550 210,585 210,790 130,755" fill="#a8a394" />
                    </g>

                    {/* === Folded cobalt linen cloth draped over plinth === */}
                    <g filter="url(#soft-shadow)">
                        <path
                            d="M260,535 C310,520 410,510 480,535 C500,542 510,560 495,572 C450,605 380,620 310,610 C270,605 250,580 252,560 Z"
                            fill="url(#linen-cloth)"
                        />
                        {/* Cloth folds & creases */}
                        <path
                            d="M290,540 Q390,530 460,552"
                            stroke="#516fff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            opacity="0.5"
                        />
                        <path
                            d="M275,565 Q370,560 475,572"
                            stroke="#101f70"
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.6"
                        />
                        <path
                            d="M285,585 Q350,590 420,592"
                            stroke="#13247d"
                            strokeWidth="2"
                            opacity="0.5"
                        />
                    </g>

                    {/* === Matte Ceramic Cup on left cube === */}
                    <g filter="url(#soft-shadow)">
                        {/* Cast shadow under cup */}
                        <ellipse cx="265" cy="545" rx="36" ry="12" fill="#1f1e1c" opacity="0.25" filter="blur(4px)" />
                        {/* Body */}
                        <path
                            d="M232,460 L298,460 C298,460 292,540 282,545 C275,548 255,548 248,545 C238,540 232,460 232,460 Z"
                            fill="url(#ceramic-cup)"
                        />
                        {/* Inner rim & rim lip */}
                        <ellipse cx="265" cy="460" rx="33" ry="9" fill="#ece8dc" stroke="#dfdad0" strokeWidth="1.5" />
                        <ellipse cx="265" cy="462" rx="27" ry="6" fill="#35332f" opacity="0.4" />
                        {/* Specular soft vertical rim highlight */}
                        <path d="M238,470 Q240,510 248,536" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                    </g>

                    {/* === Cobalt Glaze Ceramic Vase on right === */}
                    <g filter="url(#soft-shadow)">
                        {/* Cast shadow under vase */}
                        <ellipse cx="600" cy="635" rx="52" ry="16" fill="#13193a" opacity="0.32" filter="blur(6px)" />
                        {/* Rounded amphora/bottle body */}
                        <path
                            d="M592,445 
                               C590,465 572,485 558,520 
                               C540,560 546,610 575,630 
                               C595,644 625,642 642,626 
                               C668,602 668,555 646,518 
                               C630,488 615,465 612,445 
                               Z"
                            fill="url(#cobalt-glaze)"
                        />
                        {/* Neck & mouth */}
                        <ellipse cx="602" cy="445" rx="12" ry="4" fill="#2440c8" stroke="#3d5eff" strokeWidth="1" />
                        <ellipse cx="602" cy="446" rx="8" ry="2.5" fill="#0b1342" />
                        {/* Rich specular glare curving across vessel */}
                        <path
                            d="M572,525 C560,555 565,595 585,612"
                            stroke="url(#cobalt-specular)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            opacity="0.85"
                            filter="blur(1px)"
                        />
                        <path
                            d="M573,530 C565,555 568,588 584,606"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            opacity="0.9"
                        />
                    </g>

                    {/* === Leather-bound maker's journal on front plinth === */}
                    <g filter="url(#soft-shadow)">
                        {/* Shadow under book */}
                        <polygon points="350,715 520,685 545,715 375,745" fill="#181816" opacity="0.3" filter="blur(5px)" />
                        {/* Book pages edge (bone/parchment) */}
                        <polygon points="370,720 520,690 525,704 375,734" fill="#eeebe1" />
                        {/* Leather book cover top */}
                        <polygon points="360,705 515,675 535,690 380,720" fill="url(#leather-cover)" />
                        {/* Spine wrap */}
                        <polygon points="360,705 380,720 375,735 355,720" fill="#754320" />
                        {/* Leather wrap cord/stitch */}
                        <path d="M435,690 L455,725" stroke="#f1d6b8" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
                    </g>
                </svg>

                <figcaption className="auth-visual-caption">
                    <p className="auth-visual-headline">{headline}</p>
                    <p className="auth-visual-sub">{sub}</p>
                </figcaption>
            </figure>
        </aside>
    )
}

export default AuthVisual
