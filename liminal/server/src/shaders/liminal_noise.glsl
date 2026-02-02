// Liminal Noise - Default ambient background
// Fractal noise with purple cyberpunk palette

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
