#include <common>

uniform sampler2D sampler0;
uniform sampler2D sampler1;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

void main( void ) {

	ivec2 uv = ivec2(gl_FragCoord.xy * 2.0 );

	vec4 color = vec4( 0.0 );
	vec4 col1 = texelFetch( sampler0, uv + ivec2( 1, 1 ), 0 );
	vec4 col2 = texelFetch( sampler0, uv + ivec2( -1, 1 ), 0 );
	vec4 col3 = texelFetch( sampler0, uv + ivec2( 1, -1 ), 0 );
	vec4 col4 = texelFetch( sampler0, uv + ivec2( -1, -1 ), 0 );

	vec4 coc = texelFetch( sampler1, uv, 0 );

	color.xyz = ( col1.xyz + col2.xyz + col3.xyz + col4.xyz ) / 4.0;

    outColor = vec4( color.xyz, coc.x );

}