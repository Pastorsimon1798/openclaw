// Void Particles - Drifting particles in dark space
// Ethereal, meditative effect

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
    
    // Particle field
    for(float i = 0.0; i < 20.0; i++) {
        float fi = i / 20.0;
        
        // Orbiting particles
        float angle = time * (0.1 + fi * 0.2) + fi * 6.28;
        float radius = 0.2 + fi * 0.5;
        
        vec2 center = vec2(
            0.5 * resolution.x / resolution.y + cos(angle) * radius,
            0.5 + sin(angle * 1.3) * radius * 0.5
        );
        
        float size = 0.005 + fi * 0.01;
        float intensity = 0.3 + fi * 0.4;
        
        // Color gradient from center
        vec3 particleColor = mix(
            vec3(0.8, 0.4, 0.9),
            vec3(0.2, 0.8, 0.9),
            fi
        );
        
        float c = circle(uv, center, size);
        color += particleColor * c * intensity;
    }
    
    // Subtle glow center
    float centerGlow = 1.0 - length(uv - vec2(0.5 * resolution.x / resolution.y, 0.5)) * 0.5;
    color += vec3(0.1, 0.05, 0.15) * centerGlow * 0.3;
    
    gl_FragColor = vec4(color, 1.0);
}
