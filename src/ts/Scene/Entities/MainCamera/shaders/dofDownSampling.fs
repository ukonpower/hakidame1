#include <common>

uniform sampler2D sampler0;
uniform sampler2D sampler1;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

void main( void ) {

	vec4 color = texelFetch( sampler0, ivec2(gl_FragCoord.xy * 2.0 ), 0 );
	vec4 coc = texelFetch( sampler1, ivec2(gl_FragCoord.xy * 2.0 ), 0 );

    outColor = vec4( color.xyz, coc * 2.0 - 1.0 );

}