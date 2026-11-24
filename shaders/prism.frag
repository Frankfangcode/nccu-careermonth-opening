precision highp float;
uniform vec2 uRes;
uniform float uT,uFlow,uSpin,uSat,uEnergy,uConv,uBurst,uCalm;
float hash(float n){return fract(sin(n)*43758.5453);}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 pal(float t,float s){
  t=fract(t)*8.;
  vec3 c=mix(vec3(1.,.60,.50),vec3(1.,.79,.52),smoothstep(0.,1.,t));
  c=mix(c,vec3(1.,.94,.68),smoothstep(1.,2.,t));
  c=mix(c,vec3(.68,.93,.84),smoothstep(2.,3.,t));
  c=mix(c,vec3(.58,.83,.98),smoothstep(3.,4.,t));
  c=mix(c,vec3(.56,.62,.95),smoothstep(4.,5.,t));
  c=mix(c,vec3(.80,.66,.96),smoothstep(5.,6.,t));
  c=mix(c,vec3(1.,.70,.82),smoothstep(6.,7.,t));
  c=mix(c,vec3(1.,.60,.50),smoothstep(7.,8.,t));
  return mix(mix(c,vec3(1.),.28),pow(c,vec3(1.8)),s);
}
vec3 field(vec2 p,float s){
  float t=.5*sin(p.x*1.3+uFlow*1.1)+.5*sin(p.y*1.7-uFlow*.8+p.x*.6)+.35*sin((p.x+p.y)*2.3+uFlow*.6);
  return pal(t*.42+uFlow*.12,s);
}
void main(){
  vec2 p0=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec2 p=p0;
  float r0=length(p0);
  float ring=0.;
  if(uBurst>=0.){float R=uBurst*1.5;ring=exp(-pow((r0-R)*5.,2.))*exp(-uBurst*1.1);p+=normalize(p0+1e-4)*ring*.16;}
  float ca=uConv*uConv*2.6,cs=cos(ca),sn=sin(ca);
  p=mat2(cs,-sn,sn,cs)*p*(1.+uConv*2.6);
  float id=0.,edge=1e3;vec2 nrm=vec2(0.);
  for(int i=0;i<9;i++){
    float fi=float(i);
    float ang=hash(fi*7.13+1.)*6.2832+sin(uT*.05+fi)*.22+uSpin*(hash(fi*3.7)-.5);
    vec2 n=vec2(cos(ang),sin(ang));
    vec2 c=(vec2(hash(fi*1.7+.3),hash(fi*9.1+.7))-.5)*vec2(1.5,.9)+.07*vec2(sin(uT*.07+fi*2.),cos(uT*.06+fi));
    float d=dot(p-c,n);
    float s=step(0.,d);
    id+=s*pow(2.,fi);
    edge=min(edge,abs(d));
    nrm+=n*(s*2.-1.)*(.35+hash(fi*5.3));
  }
  nrm*=.4;
  float h=hash(id*.731+3.1),h2=hash(id*1.913+7.7);
  float sat=uSat;
  float disp=.015+.04*uEnergy+.05*uConv;
  vec2 q=p+nrm*.22;
  vec3 col=vec3(field(q+nrm*disp,sat).r,field(q,sat).g,field(q-nrm*disp,sat).b);
  vec2 gd=normalize(nrm+vec2(.001,.002));
  vec3 tint=pal(h+dot(p,gd)*.42+uFlow*.2,sat);
  col=mix(col,tint,.68);
  col=mix(col,vec3(1.),.2*h2+.2*smoothstep(-.5,.5,dot(p,gd)));
  if(h>.62){col=mix(col,mix(field(p*.5,sat*.5),vec3(1.),.35),.55);}
  if(h<.28){vec2 g=fract(gl_FragCoord.xy/(uRes.y/120.))-.5;col+=smoothstep(.3,.18,length(g))*.07;}
  float calm=uCalm*(1.-smoothstep(.12,.8,length(p0*vec2(.7,1.2))));
  col=mix(col,pow(col,vec3(1.7))*vec3(.9,.93,1.),calm*.75);
  float px=(1.+uConv*2.6)*2./uRes.y;
  float line=1.-smoothstep(px*.3,px*1.1,edge);
  col+=exp(-edge*40./(1.+uConv*2.6))*.07;
  col=mix(col,vec3(1.),line*(.8-calm*.3));
  col+=exp(-pow((p0.x*.8+p0.y*.5-mod(uT*.16,3.2)+1.6)*3.2,2.))*.09;
  col=mix(col,vec3(1.),clamp(uConv*exp(-r0*3.2)*1.3,0.,1.));
  col+=ring*.45;
  col+=(hash2(gl_FragCoord.xy+fract(uT)*91.7)-.5)*.035;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
