// Threshold Ripple - Binary aesthetic with expanding waves
// Sharp contrasts, digital emergence

precision mediump float;
uniform float time;
uniform vec2 resolution;

float f(vec2 p) {
    return sin(p.x * 10.0 + time) + sin(p.y * 10.0 + time * 0.7) * 0.5;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    uv = (uv - 0.5) * 2.0;
    uv.x *= resolution.x / resolution.y;
    
    // Ripple from center
    float dist = length(uv);
    float ripple = sin(dist * 20.0 - time * 3.0) * exp(-dist * 2.0);
    
    // Secondary ripples
    float ripple2 = sin(dist * 15.0 + time * 2.0) * exp(-dist * 1.5);
    
    // Noise texture
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    
    // Combine and threshold
    float value = ripple + ripple2 * 0.5 + noise * 0.1;
    float threshold = step(0.0, value);
    
    // Color based on threshold and distance
    vec3 colorA = vec3(0.05, 0.05, 0.08);
    vec3 colorB = vec3(0.9, 0.3, 0.5);
    vec3 colorC = vec3(0.2, 0.9, 0.8);
    
    vec3 color = mix(colorA, colorB, threshold);
    color = mix(color, colorC, step(0.5, value + dist * 0.5) * 0.5);
    
    // Scanline
    float scanline = step(0.95, fract(gl_FragCoord.y * 0.5));
    color += vec3(scanline * 0.1);
    
    gl_FragColor = vec4(color, 1.0);
}
