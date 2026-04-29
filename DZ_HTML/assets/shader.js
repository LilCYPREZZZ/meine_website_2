/* Warm ambient background shader (WebGL).
   Self-contained. Mounts into any element with id="bg-shader". */
(function () {
    function mount() {
        var host = document.getElementById('bg-shader');
        if (!host) return;

        var canvas = document.createElement('canvas');
        host.appendChild(canvas);

        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) { host.style.background = 'radial-gradient(1200px 800px at 30% 20%, rgba(255,122,69,0.08), transparent 60%)'; return; }

        var VS = 'attribute vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0.0,1.0); }';
        var FS = [
            'precision mediump float;',
            'uniform float u_time;',
            'uniform vec2 u_res;',
            'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
            'float noise(vec2 p){',
            '  vec2 i=floor(p); vec2 f=fract(p);',
            '  float a=hash(i); float b=hash(i+vec2(1.0,0.0));',
            '  float c=hash(i+vec2(0.0,1.0)); float d=hash(i+vec2(1.0,1.0));',
            '  vec2 u=f*f*(3.0-2.0*f);',
            '  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;',
            '}',
            'float fbm(vec2 p){',
            '  float v=0.0; float a=0.5;',
            '  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }',
            '  return v;',
            '}',
            'void main(){',
            '  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;',
            '  float t = u_time * 0.08;',
            '  vec2 q = uv * 1.4 + vec2(t, t*0.7);',
            '  float n1 = fbm(q);',
            '  float n2 = fbm(q + vec2(3.2, 1.7) + n1);',
            '  float n3 = fbm(uv*2.5 + vec2(-t*0.5, t*0.3) + n2*0.5);',
            /* warm amber/orange palette, low luminance to stay subtle */
            '  vec3 col1 = vec3(0.12, 0.05, 0.02);',   // deep warm
            '  vec3 col2 = vec3(1.00, 0.48, 0.26);',   // accent orange
            '  vec3 col3 = vec3(0.85, 0.18, 0.10);',   // deep red
            '  vec3 col  = mix(col1, col2, smoothstep(0.35, 0.9, n2));',
            '  col = mix(col, col3, smoothstep(0.55, 1.0, n3) * 0.55);',
            /* vignette */
            '  float d = length(uv);',
            '  col *= smoothstep(1.4, 0.2, d);',
            /* desaturate & darken for subtlety */
            '  float lum = dot(col, vec3(0.299, 0.587, 0.114));',
            '  col = mix(vec3(lum), col, 0.6) * 0.55;',
            '  gl_FragColor = vec4(col, 1.0);',
            '}'
        ].join('\n');

        function compile(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.warn(gl.getShaderInfoLog(s));
                return null;
            }
            return s;
        }

        var vs = compile(gl.VERTEX_SHADER, VS);
        var fs = compile(gl.FRAGMENT_SHADER, FS);
        if (!vs || !fs) return;

        var prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.useProgram(prog);

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
        var posLoc = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        var uT = gl.getUniformLocation(prog, 'u_time');
        var uR = gl.getUniformLocation(prog, 'u_res');

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width  = Math.floor(host.clientWidth  * dpr);
            canvas.height = Math.floor(host.clientHeight * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        resize();
        window.addEventListener('resize', resize);

        var start = performance.now();
        function loop() {
            gl.uniform1f(uT, (performance.now() - start) / 1000);
            gl.uniform2f(uR, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(loop);
        }
        loop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
