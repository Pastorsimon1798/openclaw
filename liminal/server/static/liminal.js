// Liminal Creative Showcase v2.0
// WebGL Backgrounds + Web Audio + WebSocket Real-time Spinner

// ===== Shader Library =====
const SHADERS = {
    'liminal-noise': {
        name: 'Liminal Noise',
        vertex: `
            attribute vec2 position;
            void main() { gl_Position = vec4(position, 0.0, 1.0); }
        `,
        fragment: `
            precision mediump float;
            uniform float time;
            uniform vec2 resolution;
            
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            float smoothNoise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                float a = noise(i);
                float b = noise(i + vec2(1.0, 0.0));
                float c = noise(i + vec2(0.0, 1.0));
                float d = noise(i + vec2(1.0, 1.0));
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for(int i = 0; i < 5; i++) {
                    value += amplitude * smoothNoise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                float n = fbm(uv * 3.0 + time * 0.1);
                float n2 = fbm(uv * 5.0 - time * 0.15);
                vec3 purple = vec3(0.6, 0.35, 0.7);
                vec3 dark = vec3(0.04, 0.04, 0.04);
                vec3 accent = vec3(0.9, 0.3, 0.2);
                vec3 color = mix(dark, purple, n * 0.3);
                color = mix(color, accent, n2 * 0.1);
                float vignette = 1.0 - length(uv - 0.5) * 0.8;
                color *= vignette;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    'glitch-waves': {
        name: 'Glitch Waves',
        vertex: `
            attribute vec2 position;
            void main() { gl_Position = vec4(position, 0.0, 1.0); }
        `,
        fragment: `
            precision mediump float;
            uniform float time;
            uniform vec2 resolution;
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                float scanline = sin(uv.y * 800.0 + time * 2.0) * 0.02;
                float glitch = step(0.98, random(vec2(floor(uv.y * 20.0), floor(time * 10.0))));
                float blockOffset = (random(vec2(floor(uv.y * 10.0))) - 0.5) * 0.1 * glitch;
                float r = random(vec2(uv.x + 0.01 + blockOffset, uv.y + time * 0.1));
                float g = random(vec2(uv.x, uv.y + time * 0.15));
                float b = random(vec2(uv.x - 0.01 - blockOffset, uv.y + time * 0.2));
                float grid = step(0.98, fract(uv.x * 50.0)) + step(0.98, fract(uv.y * 50.0));
                vec3 color = vec3(r, g, b) * 0.15;
                color += vec3(grid * 0.3, grid * 0.1, grid * 0.4);
                color += vec3(scanline * 0.1);
                color += vec3(0.0, 0.2, 0.3) * glitch;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    'void-particles': {
        name: 'Void Particles',
        vertex: `
            attribute vec2 position;
            void main() { gl_Position = vec4(position, 0.0, 1.0); }
        `,
        fragment: `
            precision mediump float;
            uniform float time;
            uniform vec2 resolution;
            
            float circle(vec2 uv, vec2 pos, float r) {
                float d = length(uv - pos);
                return 1.0 - smoothstep(r * 0.8, r, d);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                uv.x *= resolution.x / resolution.y;
                vec3 color = vec3(0.02);
                for(float i = 0.0; i < 20.0; i++) {
                    float fi = i / 20.0;
                    float angle = time * (0.1 + fi * 0.2) + fi * 6.28;
                    float radius = 0.2 + fi * 0.5;
                    vec2 center = vec2(
                        0.5 * resolution.x / resolution.y + cos(angle) * radius,
                        0.5 + sin(angle * 1.3) * radius * 0.5
                    );
                    float size = 0.005 + fi * 0.01;
                    float intensity = 0.3 + fi * 0.4;
                    vec3 particleColor = mix(vec3(0.8, 0.4, 0.9), vec3(0.2, 0.8, 0.9), fi);
                    float c = circle(uv, center, size);
                    color += particleColor * c * intensity;
                }
                float centerGlow = 1.0 - length(uv - vec2(0.5 * resolution.x / resolution.y, 0.5)) * 0.5;
                color += vec3(0.1, 0.05, 0.15) * centerGlow * 0.3;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    'threshold-ripple': {
        name: 'Threshold Ripple',
        vertex: `
            attribute vec2 position;
            void main() { gl_Position = vec4(position, 0.0, 1.0); }
        `,
        fragment: `
            precision mediump float;
            uniform float time;
            uniform vec2 resolution;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                uv = (uv - 0.5) * 2.0;
                uv.x *= resolution.x / resolution.y;
                float dist = length(uv);
                float ripple = sin(dist * 20.0 - time * 3.0) * exp(-dist * 2.0);
                float ripple2 = sin(dist * 15.0 + time * 2.0) * exp(-dist * 1.5);
                float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
                float value = ripple + ripple2 * 0.5 + noise * 0.1;
                float threshold = step(0.0, value);
                vec3 colorA = vec3(0.05, 0.05, 0.08);
                vec3 colorB = vec3(0.9, 0.3, 0.5);
                vec3 colorC = vec3(0.2, 0.9, 0.8);
                vec3 color = mix(colorA, colorB, threshold);
                color = mix(color, colorC, step(0.5, value + dist * 0.5) * 0.5);
                float scanline = step(0.95, fract(gl_FragCoord.y * 0.5));
                color += vec3(scanline * 0.1);
                gl_FragColor = vec4(color, 1.0);
            }
        `
    },
    'spinner-energy': {
        name: 'Spinner Energy',
        vertex: `
            attribute vec2 position;
            void main() { gl_Position = vec4(position, 0.0, 1.0); }
        `,
        fragment: `
            precision mediump float;
            uniform float time;
            uniform vec2 resolution;
            uniform float spinEnergy;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                float energy = spinEnergy;
                
                // Radial burst based on energy
                vec2 center = vec2(0.5);
                float dist = length(uv - center);
                float angle = atan(uv.y - center.y, uv.x - center.x);
                
                float burst = sin(angle * 8.0 + time * 2.0) * 0.5 + 0.5;
                burst *= energy;
                
                float rings = sin(dist * 30.0 - time * 5.0 * energy) * 0.5 + 0.5;
                rings *= smoothstep(0.5, 0.0, dist) * energy;
                
                vec3 base = vec3(0.04, 0.04, 0.06);
                vec3 burstColor = vec3(0.9, 0.4, 0.9) * burst * 0.5;
                vec3 ringColor = vec3(0.2, 0.9, 0.8) * rings * 0.3;
                
                vec3 color = base + burstColor + ringColor;
                gl_FragColor = vec4(color, 1.0);
            }
        `
    }
};

// ===== Global State =====
let gl, program, timeUniform, resolutionUniform, spinEnergyUniform;
let audioContext, isAudioEnabled = false;
let currentMode = 'random';
let wsConnection = null;
let currentShader = 'liminal-noise';
let spinEnergy = 0.0;
let isSpinning = false;

// ===== WebGL Management =====
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function loadShader(shaderId) {
    const shader = SHADERS[shaderId];
    if (!shader) return false;
    
    if (program) {
        gl.deleteProgram(program);
    }
    
    const vertexShader = compileShader(gl.VERTEX_SHADER, shader.vertex);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, shader.fragment);
    
    if (!vertexShader || !fragmentShader) return false;
    
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link failed:', gl.getProgramInfoLog(program));
        return false;
    }
    
    // Set up geometry
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Get uniforms
    timeUniform = gl.getUniformLocation(program, 'time');
    resolutionUniform = gl.getUniformLocation(program, 'resolution');
    spinEnergyUniform = gl.getUniformLocation(program, 'spinEnergy');
    
    currentShader = shaderId;
    return true;
}

function initWebGL() {
    const canvas = document.getElementById('gl-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.log('WebGL not supported');
        return;
    }
    
    loadShader('liminal-noise');
    requestAnimationFrame(renderWebGL);
}

function renderWebGL(time) {
    if (!gl || !program) return;
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);
    
    gl.uniform1f(timeUniform, time * 0.001);
    gl.uniform2f(resolutionUniform, gl.canvas.width, gl.canvas.height);
    
    // Decay spin energy
    if (spinEnergy > 0) {
        spinEnergy *= 0.98;
        if (spinEnergy < 0.01) spinEnergy = 0;
    }
    
    if (spinEnergyUniform) {
        gl.uniform1f(spinEnergyUniform, spinEnergy);
    }
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(renderWebGL);
}

function switchShader(shaderId) {
    if (SHADERS[shaderId]) {
        loadShader(shaderId);
        console.log('Switched to shader:', SHADERS[shaderId].name);
    }
}

// ===== WebSocket =====
function initWebSocket() {
    const wsUrl = `ws://${window.location.host}/ws`;
    wsConnection = new WebSocket(wsUrl);
    
    wsConnection.onopen = () => {
        console.log('WebSocket connected');
        addTerminalLine('🔌 Connected to real-time server');
    };
    
    wsConnection.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleWebSocketMessage(msg);
    };
    
    wsConnection.onclose = () => {
        console.log('WebSocket disconnected');
        addTerminalLine('🔌 Disconnected');
        // Reconnect after 3 seconds
        setTimeout(initWebSocket, 3000);
    };
    
    wsConnection.onerror = (err) => {
        console.error('WebSocket error:', err);
    };
}

function handleWebSocketMessage(msg) {
    switch(msg.type) {
        case 'spin_start':
            isSpinning = true;
            spinEnergy = 1.0;
            switchShader('spinner-energy');
            addTerminalLine(`🎲 Spin started (${msg.payload.mode})`);
            playSpinSound();
            break;
            
        case 'spin_tick':
            spinEnergy = msg.payload.progress * 2;
            if (msg.payload.progress > 0.7) {
                addTerminalLine(`→ ${msg.payload.current_option}`, 0);
                playClickSound();
            }
            break;
            
        case 'spin_complete':
            isSpinning = false;
            spinEnergy = 0.5;
            setTimeout(() => {
                if (!isSpinning) switchShader('liminal-noise');
            }, 3000);
            addTerminalLine('');
            addTerminalLine('✨ RESULT ✨', 0.1);
            addTerminalLine(`→ ${msg.payload.result} ←`, 0.2);
            addTerminalLine('', 0.3);
            playWinSound();
            break;
            
        case 'connected':
            console.log('Session:', msg.payload.session_id);
            break;
    }
}

// ===== Web Audio =====
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function toggleAudio() {
    isAudioEnabled = !isAudioEnabled;
    const btn = document.getElementById('audio-btn');
    btn.textContent = isAudioEnabled ? '🔊' : '🔇';
    btn.classList.toggle('muted', !isAudioEnabled);
    
    if (isAudioEnabled) {
        initAudio();
        startAmbientDrone();
    }
}

function startAmbientDrone() {
    if (!isAudioEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 55;
    gainNode.gain.value = 0.03;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    
    setInterval(() => {
        if (isAudioEnabled) {
            oscillator.frequency.value = 55 + Math.random() * 10;
        }
    }, 8000);
}

function playClickSound() {
    if (!isAudioEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 600 + Math.random() * 200;
    gainNode.gain.value = 0.05;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    oscillator.stop(audioContext.currentTime + 0.05);
}

function playSpinSound() {
    if (!isAudioEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.6);
    
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.6);
}

function playWinSound() {
    if (!isAudioEnabled || !audioContext) return;
    
    const notes = [523.25, 659.25, 783.99]; // C major chord
    notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.1 + i * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(now + i * 0.08);
        oscillator.stop(now + 1.2);
    });
}

// ===== Decision Spinner =====
function addTerminalLine(text, delay = 0) {
    const terminal = document.getElementById('terminal');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    line.style.animationDelay = `${delay}s`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function clearTerminal() {
    document.getElementById('terminal').innerHTML = '<div class="terminal-line">Ready.</div>';
}

async function spin() {
    const input = document.getElementById('options-input').value;
    const options = input.split(',').map(s => s.trim()).filter(s => s);
    
    if (options.length < 2) {
        addTerminalLine('Error: Need at least 2 options.');
        return;
    }
    
    try {
        const response = await fetch('/api/spinner/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ options, mode: currentMode })
        });
        
        const data = await response.json();
        if (data.success) {
            // Result comes through WebSocket for visualization
            console.log('Spin initiated:', data.data);
        }
    } catch (err) {
        console.error('Spin failed:', err);
        // Fallback to local spin
        localSpin(options);
    }
}

function localSpin(options) {
    // Local fallback if API fails
    playSpinSound();
    switchShader('spinner-energy');
    spinEnergy = 1.0;
    
    addTerminalLine(`Mode: ${currentMode.toUpperCase()}`);
    addTerminalLine(`Options: ${options.join(', ')}`);
    addTerminalLine('Spinning...', 0.2);
    
    let spins = 0;
    const maxSpins = 12 + Math.floor(Math.random() * 8);
    
    const spinInterval = setInterval(() => {
        const randomOption = options[Math.floor(Math.random() * options.length)];
        addTerminalLine(`→ ${randomOption}`, 0);
        playClickSound();
        spins++;
        spinEnergy = (1 - spins/maxSpins) * 2;
        
        if (spins >= maxSpins) {
            clearInterval(spinInterval);
            setTimeout(() => {
                const result = options[Math.floor(Math.random() * options.length)];
                playWinSound();
                addTerminalLine('');
                addTerminalLine('✨ RESULT ✨', 0.1);
                addTerminalLine(`→ ${result} ←`, 0.2);
                addTerminalLine('', 0.3);
                addTerminalLine('(Remember: No wrong choices, only paths forward.)', 0.4);
                setTimeout(() => {
                    switchShader('liminal-noise');
                    spinEnergy = 0;
                }, 3000);
            }, 300);
        }
    }, 80 + (spins * 15));
}

function showSource() {
    addTerminalLine('');
    addTerminalLine('📄 Source: /home/liam/liminal/projects/decision-spinner/spinner.py');
    addTerminalLine('📖 README: /home/liam/liminal/projects/decision-spinner/README.md');
    addTerminalLine('');
    addTerminalLine('Run locally: python spinner.py "A" "B" "C"');
}

// ===== Shader Gallery =====
async function loadShaderGallery() {
    try {
        const response = await fetch('/api/shaders');
        const data = await response.json();
        
        if (data.success) {
            createShaderControls(data.data);
        }
    } catch (e) {
        console.log('Shader gallery not available');
    }
}

function createShaderControls(shaders) {
    const featured = document.querySelector('.featured');
    
    const shaderSection = document.createElement('div');
    shaderSection.style.marginTop = '2rem';
    shaderSection.innerHTML = `
        <h3 style="color: #9b59b6; margin-bottom: 1rem;">🎨 Ambient Shaders</h3>
        <div class="shader-controls" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${shaders.map(s => `
                <button class="shader-btn" data-shader="${s.id}" 
                    style="padding: 0.5rem 1rem; font-size: 0.8rem; opacity: 0.7;">
                    ${s.name}
                </button>
            `).join('')}
        </div>
    `;
    
    featured.appendChild(shaderSection);
    
    // Add click handlers
    document.querySelectorAll('.shader-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.shader-btn').forEach(b => b.style.opacity = '0.7');
            btn.style.opacity = '1';
            switchShader(btn.dataset.shader);
            playClickSound();
        });
    });
}

// ===== Mode Selector =====
function initModeSelector() {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            playClickSound();
        });
    });
}

// ===== Principles =====
async function loadPrinciples() {
    try {
        const response = await fetch('/api/principles');
        const data = await response.json();
        if (data.success) {
            const text = data.data.content;
            const display = text.split('\n')
                .filter(l => l.includes('**') || l.startsWith('##'))
                .slice(0, 10)
                .join('\n');
            document.getElementById('principles-text').textContent = display || text.slice(0, 500);
        }
    } catch (e) {
        document.getElementById('principles-text').textContent = 'Never finished. Always evolving.';
    }
}

// ===== Projects =====
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        if (data.success && data.data.projects.length > 1) {
            const grid = document.getElementById('project-grid');
            grid.innerHTML = data.data.projects.map(p => `
                <div class="project-card" onclick="location.href='/api/project/${p.name}'">
                    <h3>${p.name}</h3>
                    <p>${p.has_readme ? 'Has documentation' : 'Explore this project'}</p>
                </div>
            `).join('');
        }
    } catch (e) {
        console.log('Projects not loaded');
    }
}

// ===== History =====
async function loadHistory() {
    try {
        const response = await fetch('/api/spinner/history');
        const data = await response.json();
        if (data.success && data.data.length > 0) {
            console.log('Recent spins:', data.data);
        }
    } catch (e) {
        // History not critical
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initWebGL();
    initModeSelector();
    loadPrinciples();
    loadProjects();
    loadShaderGallery();
    initWebSocket();
    loadHistory();
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (gl) {
            gl.canvas.width = window.innerWidth;
            gl.canvas.height = window.innerHeight;
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            spin();
        }
        if (e.code === 'KeyA') {
            toggleAudio();
        }
    });
});
