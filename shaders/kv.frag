precision highp float;
uniform sampler2D uTex,uBlur;
uniform vec2 uRes;
uniform float uT,uSpin,uEnergy,uConv,uBurst,uMix,uVeil,uSatF,uAmp;
const float PA=0.8;
float hash(float n){return fract(sin(n)*43758.5453);}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 topUV(vec2 s,float A){
  vec2 rs=vec2(1.,.43);float Ar=rs.x/rs.y*PA;s-=.5;
  if(A>Ar)s.y*=Ar/A;else s.x*=A/Ar;
  s=s*.93+.5+vec2(sin(uT*.05),cos(uT*.04))*.025;
  return clamp(s,0.,1.)*rs;
}
vec2 posterUV(vec2 s,float A){return vec2((s.x-.5)*(A/PA)+.5,s.y);}
void main(){
  vec2 uv=vec2(gl_FragCoord.x/uRes.x,1.-gl_FragCoord.y/uRes.y);
  float A=uRes.x/uRes.y;
  vec2 p0=(uv-.5)*vec2(A,1.);
  vec2 p=p0;float r0=length(p0),ring=0.;
  if(uBurst>=0.){float R=uBurst*1.5;ring=exp(-pow((r0-R)*5.,2.))*exp(-uBurst*1.1);p+=normalize(p0+1e-4)*ring*.12;}
  float ca=uConv*uConv*2.4,cs=cos(ca),sn=sin(ca);
  p=mat2(cs,-sn,sn,cs)*p*(1.+uConv*2.2);
  float id=0.,edge=1e3;vec2 nrm=vec2(0.);
  for(int i=0;i<8;i++){
    float fi=float(i);
    float ang=hash(fi*7.13+1.)*6.2832+sin(uT*.05+fi)*.22+uSpin*(hash(fi*3.7)-.5);
    vec2 n=vec2(cos(ang),sin(ang));
    vec2 c=(vec2(hash(fi*1.7+.3),hash(fi*9.1+.7))-.5)*vec2(1.5,.9)+.08*vec2(sin(uT*.07+fi*2.),cos(uT*.06+fi));
    float d=dot(p-c,n);float s=step(0.,d);
    id+=s*pow(2.,fi);edge=min(edge,abs(d));
    nrm+=n*(s*2.-1.)*(.35+hash(fi*5.3));
  }
  nrm*=.4;
  float h=hash(id*.731+3.1),h2=hash(id*1.913+7.7);
  vec2 su=p/vec2(A,1.)+.5;
  vec2 d=nrm*uAmp*vec2(1./A,1.);
  float k=.35+.5*uEnergy;
  vec3 a=vec3(texture2D(uTex,topUV(su+d*(1.+k),A)).r,texture2D(uTex,topUV(su+d,A)).g,texture2D(uTex,topUV(su+d*(1.-k),A)).b);
  vec2 pu=posterUV(su,A);
  float tm=smoothstep(.36,.45,pu.y);
  vec2 dp=d*mix(1.,.08,tm)*vec2(A/PA,1.);
  vec3 fg=vec3(texture2D(uTex,pu+dp*(1.+k)).r,texture2D(uTex,pu+dp).g,texture2D(uTex,pu+dp*(1.-k)).b);
  vec2 bs=su-.5;if(A>PA)bs.y*=PA/A;else bs.x*=A/PA;
  vec3 bg=texture2D(uBlur,bs+.5+d*2.5).rgb;
  float ed=max(-pu.x,pu.x-1.);
  bg*=1.-.3*exp(-max(ed,0.)*14.);
  float inside=smoothstep(0.,.006,pu.x)*smoothstep(1.,.994,pu.x);
  float quiet=mix(0.,tm*inside,uMix);
  vec3 col=mix(a,mix(bg,fg,inside),uMix);
  col*=1.+(h2-.5)*.07*(1.-quiet);
  vec3 tint=.5+.5*cos(6.2832*(h+vec3(0.,.33,.64)));
  col=mix(col,tint,(.03+.07*uEnergy)*(1.-quiet));
  float l=dot(col,vec3(.299,.587,.114));
  col=mix(vec3(l),col,uSatF);
  col=mix(col,vec3(.94,.955,.97),uVeil);
  float px=(1.+uConv*2.2)*2./uRes.y;
  float line=1.-smoothstep(px*.3,px*1.1,edge);
  col+=exp(-edge*46./(1.+uConv*2.2))*.05*(1.-quiet);
  col=mix(col,vec3(1.),line*.6*(1.-quiet*.8));
  col+=exp(-pow((p0.x*.8+p0.y*.5-mod(uT*.16,3.4)+1.7)*3.4,2.))*.07;
  col=mix(col,vec3(1.),clamp(uConv*exp(-r0*3.2)*1.3,0.,1.));
  col+=ring*.4;
  col+=(hash2(gl_FragCoord.xy+fract(uT)*91.7)-.5)*.025;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
