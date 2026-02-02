// Glitch Waves - Digital distortion effect
// Simulates CRT interference and data corruption

precision mediump float;
uniform float time;
uniform vec2 resolution;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Scanline offset
    float scanline = sin(uv.y * 800.0 + time * 2.0) * 0.02;
    
    // Glitch blocks
    float glitch = step(0.98, random(vec2(floor(uv.y * 20.0), floor(time * 10.0))));
    float blockOffset = (random(vec2(floor(uv.y * 10.0))) - 0.5) * 0.1 * glitch;
    
    // RGB shift
    float r = random(vec2(uv.x + 0.01 + blockOffset, uv.y + time * 0.1));
    float g = random(vec2(uv.x, uv.y + time * 0.15));
    float b = random(vec2(uv.x - 0.01 - blockOffset, uv.y + time * 0.2));
    
    // Digital grid
    float grid = step(0.98, fract(uv.x * 50.0)) + step(0.98, fract(uv.y * 50.0));
    
    // Combine
    vec3 color = vec3(r, g, b) * 0.15;
    color += vec3(grid * 0.3, grid * 0.1, grid * 0.4);
    color += vec3(scanline * 0.1);
    
    // Cyan/magenta accent
    color += vec3(0.0, 0.2, 0.3) * glitch;
    
    gl_FragColor = vec4(color, 1.0);
}
