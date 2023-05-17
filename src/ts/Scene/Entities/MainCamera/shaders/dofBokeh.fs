#include <common>
#include <random>

uniform float uTime;
uniform sampler2D sampler0;
uniform sampler2D sampler1;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

// #define BOKEH_SAMPLE 16
// vec2 poissonDisk[ BOKEH_SAMPLE ];

#define BOKEH_SAMPLE 22
vec2 poissonDisk[ BOKEH_SAMPLE ] = vec2[](
	vec2(0, 0),
	vec2(0.53333336, 0),
	vec2(0.3325279, 0.4169768),
	vec2(-0.11867785, 0.5199616),
	vec2(-0.48051673, 0.2314047),
	vec2(-0.48051673, -0.23140468),
	vec2(-0.11867763, -0.51996166),
	vec2(0.33252785, -0.4169769),
	vec2(1, 0),
	vec2(0.90096885, 0.43388376),
	vec2(0.6234898, 0.7818315),
	vec2(0.22252098, 0.9749279),
	vec2(-0.22252095, 0.9749279),
	vec2(-0.62349, 0.7818314),
	vec2(-0.90096885, 0.43388382),
	vec2(-1, 0),
	vec2(-0.90096885, -0.43388376),
	vec2(-0.6234896, -0.7818316),
	vec2(-0.22252055, -0.974928),
	vec2(0.2225215, -0.9749278),
	vec2(0.6234897, -0.7818316),
	vec2(0.90096885, -0.43388376)
);

void initPoissonDisk( float seed ) {

	float r = 0.5;
	float rStep = (r) / float( BOKEH_SAMPLE );

	float ang = 0.0;//random( gl_FragCoord.xy * 0.01 + sin( seed ) ) * TPI * 1.0;
	float angStep = ( ( TPI * 17.0 ) / float( BOKEH_SAMPLE ) );
	
	for( int i = 0; i < BOKEH_SAMPLE; i++ ) {

		poissonDisk[ i ] = vec2(
			sin( ang ),
			cos( ang )
		) * pow( r, 0.5 );

		r += rStep;
		ang += angStep;
	}
	
}

const float bokehMaxSize = 0.006;

void main( void ) {


	vec3 col = texture( sampler0, vUv ).xyz;
	vec4 coc = texture( sampler1, vUv );

	vec4 bgColor = vec4( 0.0 );
	vec4 fgColor = vec4( 0.0 );

	// initPoissonDisk(uTime);

	for( int i = 0; i < BOKEH_SAMPLE; i ++  ) {
			
		vec2 offset = poissonDisk[ i ] * bokehMaxSize;
		float radius = length( offset );
		vec4 offCoc = texture( sampler1, vUv + offset );

		if( abs( offCoc.w ) * 0.03 >= radius ) {

			bgColor.xyz += offCoc.xyz;
			bgColor.w++;

		}
		
	}
	bgColor /= bgColor.w;
	fgColor /= fgColor.w;

	col = mix( col, bgColor.xyz, 1.0);

	outColor = vec4( col, 1.0 );

}