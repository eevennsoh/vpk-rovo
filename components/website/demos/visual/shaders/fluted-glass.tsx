"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 v_uv;
void main() {
	v_uv = a_position * 0.5 + 0.5;
	gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform sampler2D u_texture;
uniform float u_fluteCount;
uniform float u_fluteShape;
uniform float u_shapeFrequency;
uniform float u_lensMode;
uniform float u_flutePower;
uniform float u_distortion;
uniform float u_dispersion;
uniform float u_blurSize;
uniform float u_frostAmount;

float random(vec2 st) {
	return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float seigaiha(vec2 uv, float scale) {
	vec2 uvGrid = floor(uv * scale);
	float uvYOffset = mod(uvGrid.x, 2.0) <= 0.0 ? 0.0 : 0.5;
	vec2 uvLocal = fract(uv * scale + vec2(0.0, uvYOffset)) - vec2(0.0, 0.5);
	float dist = 1e5;
	for (float x = -1.0; x < 2.0; x += 2.0)
		dist = min(dist, distance(vec2(x, -1.0), uvLocal));
	if (1.0 < dist)
		dist = min(dist, distance(vec2(0.0, -0.5), uvLocal));
	if (1.0 < dist)
		for (float x = -1.0; x < 2.0; x += 2.0)
			dist = min(dist, distance(vec2(x, 0.0), uvLocal));
	return dist;
}

void main() {
	vec2 res = u_resolution;
	vec2 fragCoord = v_uv * res;

	vec2 screenUV = v_uv;

	vec2 texRes = vec2(textureSize(u_texture, 0));
	vec2 ratio = res / texRes;
	float maxRatio = max(ratio.x, ratio.y);
	vec2 baseUV = (screenUV - 0.5) * (ratio / maxRatio) + 0.5;

	float fluteCount = u_fluteCount;
	float aspect = res.x / res.y;
	float adjustedCount = fluteCount * min(aspect, 1.0);

	float modX = screenUV.x;
	float aspectScale = 1.0 / max(aspect, 1.0);
	vec2 squareUV = (screenUV - 0.5) * vec2(aspect, 1.0);

	if (u_fluteShape > 0.5 && u_fluteShape < 1.5) {
		modX += sin(screenUV.y * u_shapeFrequency * 3.14159265 * 2.0) * 0.1 * aspectScale;
	} else if (u_fluteShape > 1.5 && u_fluteShape < 2.5) {
		float t = fract(screenUV.y * u_shapeFrequency);
		float zigzag = abs(t - 0.5) * 4.0 - 1.0;
		modX += zigzag * 0.1 * aspectScale;
	} else if (u_fluteShape > 2.5) {
		float dist = seigaiha(vec2(squareUV.x, -squareUV.y), u_shapeFrequency);
		modX = dist;
	}

	float fluteCoord = modX * adjustedCount + 0.5;
	float flutePos = fract(fluteCoord);
	float fluteX = (flutePos - 0.5) * 2.0;

	float fw = fwidth(fluteCoord) * 2.;
	float edgeDist = min(flutePos, 1.0 - flutePos);
	float aa = smoothstep(0.0, fw, edgeDist);

	float nx;
	if (u_lensMode < 0.5) {
		float curvature = pow(abs(fluteX), u_flutePower) * sign(fluteX);
		nx = curvature;
	} else {
		nx = cos(flutePos * 3.14159265 * 2.0) * 3.14159265 * 0.15;
	}
	nx *= aa;

	float nz = sqrt(1.0 - clamp(nx * nx, 0.0, 1.0));
	vec3 normal = normalize(vec3(nx, 0.0, nz));

	float distortR = u_distortion * (1.0 - u_dispersion);
	float distortG = u_distortion;
	float distortB = u_distortion * (1.0 + u_dispersion);

	vec2 uvR = baseUV + normal.xy * distortR;
	vec2 uvG = baseUV + normal.xy * distortG;
	vec2 uvB = baseUV + normal.xy * distortB;

	float blurSize = u_blurSize * 0.0001;
	float frostAmount = u_frostAmount * 0.0001;

	float noise = random(floor(fragCoord / u_pixelRatio)) * 2.0 - 1.0;

	float colorR = 0.0;
	float colorG = 0.0;
	float colorB = 0.0;

	for (float i = -2.0; i <= 2.0; i++) {
		for (float j = -2.0; j <= 2.0; j++) {
			vec2 frostOffset = noise * frostAmount + vec2(i, j) * blurSize;
			colorR += texture(u_texture, uvR + frostOffset).r;
			colorG += texture(u_texture, uvG + frostOffset).g;
			colorB += texture(u_texture, uvB + frostOffset).b;
		}
	}

	vec3 col = vec3(colorR, colorG, colorB) / 25.0;

	vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
	float diffuse = max(dot(normal, lightDir), 0.0);
	float specular = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
	col *= (0.85 + diffuse * 0.15);
	col += specular * 0.08;

	fragColor = vec4(col, 1.0);
}
`;

function createDefaultTexture(): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = 512;
	c.height = 512;
	const ctx = c.getContext("2d")!;
	const grad = ctx.createLinearGradient(0, 0, 512, 512);
	grad.addColorStop(0, "#FF6B6B");
	grad.addColorStop(0.25, "#4ECDC4");
	grad.addColorStop(0.5, "#FFE66D");
	grad.addColorStop(0.75, "#A06CD5");
	grad.addColorStop(1, "#2962FF");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, 512, 512);
	const colors = ["#FF5024", "#00C9A7", "#FFD93D", "#6C5CE7"];
	for (let i = 0; i < 10; i++) {
		ctx.beginPath();
		ctx.arc(Math.sin(i * 1.9) * 160 + 256, Math.cos(i * 2.7) * 160 + 256, 25 + i * 10, 0, Math.PI * 2);
		ctx.fillStyle = colors[i % colors.length];
		ctx.globalAlpha = 0.65;
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	return c;
}

interface FlutedGlassProps {
	className?: string;
	imageSrc?: string;
	lensMode?: number;
	fluteShape?: number;
	shapeFrequency?: number;
	fluteCount?: number;
	flutePower?: number;
	distortion?: number;
	dispersion?: number;
	blurSize?: number;
	frostAmount?: number;
}

export default function FlutedGlass({
	className,
	imageSrc,
	lensMode = 0,
	fluteShape = 0,
	shapeFrequency = 1,
	fluteCount = 16,
	flutePower = 1.4,
	distortion = 0.11,
	dispersion = 1.54,
	blurSize = 0,
	frostAmount = 0,
}: FlutedGlassProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
		if (!gl) return;

		const compile = (type: number, src: string) => {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(s));
			}
			return s;
		};

		const prog = gl.createProgram()!;
		gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
		gl.linkProgram(prog);
		gl.useProgram(prog);

		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(prog, "a_position");
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		const uRes = gl.getUniformLocation(prog, "u_resolution");

		gl.uniform1f(gl.getUniformLocation(prog, "u_lensMode"), lensMode);
		gl.uniform1f(gl.getUniformLocation(prog, "u_fluteShape"), fluteShape);
		gl.uniform1f(gl.getUniformLocation(prog, "u_shapeFrequency"), shapeFrequency);
		gl.uniform1f(gl.getUniformLocation(prog, "u_fluteCount"), fluteCount);
		gl.uniform1f(gl.getUniformLocation(prog, "u_flutePower"), flutePower);
		gl.uniform1f(gl.getUniformLocation(prog, "u_distortion"), distortion);
		gl.uniform1f(gl.getUniformLocation(prog, "u_dispersion"), dispersion);
		gl.uniform1f(gl.getUniformLocation(prog, "u_blurSize"), blurSize);
		gl.uniform1f(gl.getUniformLocation(prog, "u_frostAmount"), frostAmount);

		const tex = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.uniform1i(gl.getUniformLocation(prog, "u_texture"), 0);

		const defaultTex = createDefaultTexture();
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, defaultTex);

		if (imageSrc) {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, tex);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			};
			img.src = imageSrc;
		}

		const render = () => {
			const dpr = window.devicePixelRatio || 1;
			const w = canvas.clientWidth * dpr;
			const h = canvas.clientHeight * dpr;
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
				gl.viewport(0, 0, w, h);
			}
			gl.uniform2f(uRes, w, h);
			gl.uniform1f(gl.getUniformLocation(prog, "u_pixelRatio"), dpr);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};
		animRef.current = requestAnimationFrame(render);

		return () => cancelAnimationFrame(animRef.current);
	}, [imageSrc, lensMode, fluteShape, shapeFrequency, fluteCount, flutePower, distortion, dispersion, blurSize, frostAmount]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
