#include <common>
#include <random>

uniform float uTime;
uniform sampler2D sampler0;
uniform sampler2D sampler1;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

#define BOKEH_SAMPLE 16

vec2 poissonDisk[ BOKEH_SAMPLE ];

void initPoissonDisk( float seed ) {

	float r = 0.5;
	float rStep = (r) / float( BOKEH_SAMPLE );

	float ang = 0.0;//random( gl_FragCoord.xy * 0.01 + sin( seed ) ) * TPI * 1.0;
	float angStep = ( ( TPI * 2.0 ) / float( BOKEH_SAMPLE ) );
	
	for( int i = 0; i < BOKEH_SAMPLE; i++ ) {

		poissonDisk[ i ] = vec2(
			sin( ang ),
			cos( ang )
		) * pow( r, 0.5 );

		r += rStep;
		ang += angStep;
	}
	
}

void main( void ) {


	float coc = texture( sampler0, vUv ).x * 2.0 - 1.0;
	vec3 col = texture( sampler1, vUv ).xyz;

	vec4 bgColor = vec4( 0.0 );
	vec4 fgColor = vec4( 0.0 );

	initPoissonDisk(uTime);


	for( int i = 0; i < BOKEH_SAMPLE; i ++  ) {
			
		vec2 offset = poissonDisk[ i ] * 0.01 * 0.0;
		float offCoc = texture( sampler0, vUv + offset ).x * 2.0 - 1.0;

		// if( coc > 0.0 && coc <= offCoc ) {
			
		bgColor.xyz += texture( sampler1, vUv + offset ).xyz;
		bgColor.w++;

		// }

		fgColor.xyz += texture( sampler1, vUv + offset ).xyz;
		fgColor.w++;
			
	}
	bgColor /= bgColor.w;
	fgColor /= fgColor.w;

	col = mix( col, bgColor.xyz, 1.0);

	outColor = vec4( col, 1.0 );

}