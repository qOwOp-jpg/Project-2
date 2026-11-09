'use strict';
const $=id=>document.getElementById(id);
const audio=$('audio');audio.volume=.8;
let tracks=[],current=-1,shuffle=false,repeat=0,dragIndex=null;
let ctx=null,analyser=null,source=null,frequency=null;
const metrics={bass:0,mid:0,treble:0};
let lunar={phase:.5,illumination:100,name:'Full Moon',live:false};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const fmt=t=>Number.isFinite(t)?`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`:'0:00';
function initAudio(){if(ctx)return;ctx=new (window.AudioContext||window.webkitAudioContext)();source=ctx.createMediaElementSource(audio);analyser=ctx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.78;frequency=new Uint8Array(analyser.frequencyBinCount);source.connect(analyser);analyser.connect(ctx.destination)}
function addTrack(item){tracks.push(item);renderList();if(current<0)selectTrack(0,false)}
function addFiles(files){for(const f of files){if(!f.type.startsWith('audio/')&&!/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name))continue;addTrack({name:f.name.replace(/\.[^.]+$/,''),url:URL.createObjectURL(f),local:true})}}
function selectTrack(i,autoplay=true){if(i<0||i>=tracks.length)return;current=i;audio.pause();audio.removeAttribute('src');audio.load();audio.src=tracks[i].url;audio.load();$('trackTitle').textContent=tracks[i].name;$('trackArtist').textContent=tracks[i].local?'LOCAL AUDIO':'DIRECT AUDIO URL';renderList();if(autoplay)playAudio();else updatePlayButton()}
async function playAudio(){if(current<0){$('fileInput').click();return}try{initAudio();await ctx.resume();await audio.play();updatePlayButton()}catch(e){$('apiStatus').textContent='PLAYBACK ERROR: '+e.message.slice(0,65);updatePlayButton()}}
function updatePlayButton(){$('play').textContent=audio.paused?'▶':'❚❚';$('play').setAttribute('aria-label',audio.paused?'Play':'Pause')}
function nextIndex(direction=1){if(!tracks.length)return -1;if(shuffle&&tracks.length>1){let i;do{i=Math.floor(Math.random()*tracks.length)}while(i===current);return i}return (current+direction+tracks.length)%tracks.length}
function renderList(){$('count').textContent=String(tracks.length).padStart(2,'0');const ol=$('playlist');ol.replaceChildren();tracks.forEach((t,i)=>{const li=document.createElement('li');li.draggable=true;li.dataset.index=i;if(i===current)li.classList.add('current');const handle=document.createElement('span');handle.className='handle';handle.textContent='⠿';const title=document.createElement('div');title.className='track-name';const strong=document.createElement('strong');strong.textContent=`${String(i+1).padStart(2,'0')}  ${t.name}`;const small=document.createElement('small');small.textContent=t.local?'LOCAL FILE':'AUDIO URL';title.append(strong,small);const play=document.createElement('button');play.textContent='▶';play.title='Play this track';play.onclick=()=>selectTrack(i,true);const remove=document.createElement('button');remove.textContent='×';remove.title='Remove';remove.onclick=()=>removeTrack(i);li.append(handle,title,play,remove);li.ondragstart=e=>{dragIndex=i;li.classList.add('dragging');e.dataTransfer.effectAllowed='move'};li.ondragover=e=>e.preventDefault();li.ondrop=e=>{e.preventDefault();e.stopPropagation();if(dragIndex===null||dragIndex===i)return;const playing=tracks[current];const [moved]=tracks.splice(dragIndex,1);tracks.splice(i,0,moved);current=tracks.indexOf(playing);dragIndex=null;renderList()};li.ondragend=()=>{dragIndex=null;li.classList.remove('dragging')};ol.append(li)})}
function removeTrack(i){const removed=tracks[i];const wasCurrent=i===current;tracks.splice(i,1);if(removed.local)URL.revokeObjectURL(removed.url);if(!tracks.length){audio.pause();audio.removeAttribute('src');audio.load();current=-1;$('trackTitle').textContent='No track selected';$('trackArtist').textContent='Drop audio files to begin'}else if(wasCurrent){current=-1;selectTrack(Math.min(i,tracks.length-1),false)}else if(i<current)current--;renderList();updatePlayButton()}
$('addFiles').onclick=()=>$('fileInput').click();$('fileInput').onchange=e=>{addFiles(e.target.files);e.target.value=''};
$('addUrl').onclick=()=>{const raw=prompt('Enter a direct HTTPS audio file URL (not a YouTube or Spotify page):');if(!raw)return;let u;try{u=new URL(raw);if(u.protocol!=='https:'&&u.protocol!=='http:')throw Error()}catch{alert('Invalid HTTP(S) URL');return}if(/youtube\.com|youtu\.be|spotify\.com/i.test(u.hostname)){alert('This is a web page, not a direct audio file.');return}const name=prompt('Track title:',decodeURIComponent(u.pathname.split('/').pop()||'Online track'))||'Online track';addTrack({name,url:u.href,local:false})};
$('clear').onclick=()=>{if(!tracks.length||!confirm('Clear the playlist?'))return;audio.pause();audio.removeAttribute('src');audio.load();tracks.forEach(t=>{if(t.local)URL.revokeObjectURL(t.url)});tracks=[];current=-1;$('trackTitle').textContent='No track selected';$('trackArtist').textContent='Drop audio files to begin';renderList();updatePlayButton()};
$('play').onclick=()=>audio.paused?playAudio():audio.pause();$('next').onclick=()=>selectTrack(nextIndex(1));$('prev').onclick=()=>{if(audio.currentTime>3){audio.currentTime=0;return}selectTrack(nextIndex(-1))};
$('shuffle').onclick=()=>{shuffle=!shuffle;$('shuffle').classList.toggle('active',shuffle);$('shuffle').title=shuffle?'Shuffle on':'Shuffle off'};
$('repeat').onclick=()=>{repeat=(repeat+1)%3;$('repeat').classList.toggle('active',repeat!==0);$('repeat').textContent=['↻','↻','↻¹'][repeat];$('repeat').title=['Repeat off','Repeat all','Repeat one'][repeat]};
audio.onended=()=>{if(repeat===2){audio.currentTime=0;playAudio()}else if(shuffle||repeat===1||current<tracks.length-1)selectTrack(nextIndex(1));else updatePlayButton()};audio.onplay=updatePlayButton;audio.onpause=updatePlayButton;audio.ontimeupdate=()=>{$('currentTime').textContent=fmt(audio.currentTime);$('seek').value=audio.duration?Math.round(audio.currentTime/audio.duration*1000):0};audio.onloadedmetadata=()=>{$('duration').textContent=fmt(audio.duration)};audio.onerror=()=>{if(current>=0)$('trackArtist').textContent='Unable to load audio (URL, format or CORS).'};
$('seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=audio.duration*e.target.value/1000};$('volume').oninput=e=>audio.volume=+e.target.value;
const drop=$('dropZone');document.addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();drop.classList.add('dragover')}});document.addEventListener('drop',e=>{if(e.dataTransfer?.files?.length){e.preventDefault();drop.classList.remove('dragover');addFiles(e.dataTransfer.files)}});document.addEventListener('dragleave',e=>{if(!e.relatedTarget)drop.classList.remove('dragover')});
// Lunar API. Defaults to Mississauga; optional browser geolocation requested only on user action is not needed here.
const coords={lat:43.589,lng:-79.644};
function localISODate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
$('moonDate').value=localISODate();
async function loadMoon(){const date=$('moonDate').value||localISODate();$('apiStatus').textContent='MOON DATA: FETCHING';try{const url=`https://api.sunrisesunset.io/json?lat=${coords.lat}&lng=${coords.lng}&date=${encodeURIComponent(date)}`;const response=await fetch(url);if(!response.ok)throw Error('HTTP '+response.status);const json=await response.json();if(!json.results||!['OK','INVALID_TZID'].includes(json.status))throw Error(json.status||'Bad response');const d=json.results;lunar={phase:clamp(Number(d.moon_phase_value)),illumination:clamp(Number(d.moon_illumination),0,100),name:d.moon_phase||'Unknown',live:true};$('phaseName').textContent=lunar.name;$('illumination').textContent=lunar.illumination.toFixed(1)+'%';$('moonrise').textContent=d.moonrise||'Not available';$('apiStatus').textContent='MOON DATA: LIVE JSON';drawMoon()}catch(e){lunar.live=false;$('apiStatus').textContent='MOON DATA: OFFLINE';$('phaseName').textContent='Demo: Full Moon';$('illumination').textContent='100% (demo)';$('moonrise').textContent='—';drawMoon();console.warn('Moon API unavailable:',e)}}
$('moonDate').onchange=loadMoon;$('refreshMoon').onclick=loadMoon;
// Render the supplied PNG and its illumination into ONE canvas. This avoids
// mismatched silhouettes caused by stacking a circular shadow over a textured PNG.
let moonTexture=null;
const moonImage=document.querySelector('#moon img');
function prepareMoonTexture(){
  if(!moonImage.complete || !moonImage.naturalWidth)return;
  const sourceCanvas=document.createElement('canvas');
  sourceCanvas.width=sourceCanvas.height=768;
  const sourceCtx=sourceCanvas.getContext('2d',{willReadFrequently:true});
  sourceCtx.clearRect(0,0,768,768);
  sourceCtx.drawImage(moonImage,0,0,768,768);
  moonTexture=sourceCtx.getImageData(0,0,768,768);
  drawMoon();
  // Only hide the image after the replacement canvas is ready.
  moonImage.style.visibility='hidden';
}
moonImage.addEventListener('load',prepareMoonTexture);
if(moonImage.complete && moonImage.naturalWidth)prepareMoonTexture();

function drawMoon(){
  if(!moonTexture)return;
  const c=$('shadow'),size=768;
  if(c.width!==size||c.height!==size)c.width=c.height=size;
  const g=c.getContext('2d');
  const pixels=g.createImageData(size,size);
  const theta=2*Math.PI*lunar.phase;
  const sx=Math.sin(theta), sz=-Math.cos(theta);
  const earthshine=0.035;       // Dark-side visibility (0 = invisible)
  const terminatorSoftness=0.012; // Transition width at day/night boundary
  const sourcePixels=moonTexture.data;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4;
    const alpha=sourcePixels[i+3];
    if(alpha===0)continue;
    const nx=(x+.5-size/2)/(size/2),ny=(y+.5-size/2)/(size/2);
    const rr=nx*nx+ny*ny;
    if(rr>=1)continue;
    const nz=Math.sqrt(Math.max(0,1-rr));
    const sunlight=nx*sx+nz*sz;
    const lit=clamp((sunlight+terminatorSoftness)/(2*terminatorSoftness));
    const brightness=earthshine+(1-earthshine)*lit;
    pixels.data[i]=Math.round(sourcePixels[i]*brightness);
    pixels.data[i+1]=Math.round(sourcePixels[i+1]*brightness);
    pixels.data[i+2]=Math.round(sourcePixels[i+2]*brightness);
    pixels.data[i+3]=alpha;
  }
  g.putImageData(pixels,0,0);
}
// Full-screen fragment shader, derived from generic radial-coordinate swirl mathematics.
// Move the moon out of the scrolling hero so it remains centered in the viewport.
document.body.appendChild($('moonStage'));
const canvas=$('swirl');let gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});let shaderProgram=null,uniforms={};
if(gl){const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;const fragment=`precision highp float;
uniform vec2 resolution;
uniform float time,bass,mid,treble,illum,phase;
vec3 spectrum(float t){
  float x=fract(t);
  vec3 pink=vec3(1.,.065,.47), gold=vec3(1.,.66,.10);
  vec3 cyan=vec3(.02,.83,.83), blue=vec3(.025,.29,.69);
  if(x<.25)return mix(pink,gold,smoothstep(.02,.23,x));
  if(x<.50)return mix(gold,cyan,smoothstep(.27,.48,x));
  if(x<.75)return mix(cyan,blue,smoothstep(.52,.73,x));
  return mix(blue,pink,smoothstep(.77,.98,x));
}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*resolution)/min(resolution.x,resolution.y);
  float r=length(p);
  float angle=atan(p.y,p.x);
  // Slow independent motion, even when audio is stopped.
  float turn=angle+3.65*r-time*.105;
  // Multi-scale domain warping produces folds rather than flat concentric bands.
  vec2 warped=vec2(cos(turn),sin(turn))*r;
  float flow=time*.12;
  vec2 wave=vec2(sin(warped.y*7.5+flow+sin(warped.x*4.2)),
                 cos(warped.x*6.8-flow*.8+sin(warped.y*5.1)));
  warped+=wave*(.055+.08*bass);
  warped+=vec2(sin(warped.y*13.0+flow*.65),cos(warped.x*12.0-flow))*(.018+.035*mid);
  float bands=warped.x*1.38+warped.y*.24+.11*sin(warped.y*4.8+time*.08);
  float filament=sin(bands*34.0+sin(warped.y*12.0+flow)*2.0);
  float ridges=pow(max(0.0,filament),16.0);
  float micro=pow(max(0.0,sin(bands*72.0+warped.x*9.0)),26.0);
  vec3 col=spectrum(bands+.11*treble);
  // Specular-looking highlights are generated from the same moving flow field.
  float highlights=clamp(ridges*.60+micro*.20,0.0,1.0);
  col=mix(col,vec3(.95,.98,1.0),highlights*(.26+.48*treble));
  col*=.83+.17*sin(bands*15.0+warped.y*5.0);
  float energy=clamp(bass*.55+mid*.28+treble*.40,0.,1.);
  // In silence: dim, desaturated colors. Music restores saturation and light.
  float saturation=mix(.28,1.0,smoothstep(.015,.40,energy));
  float brightness=mix(.27,.98,smoothstep(.01,.50,energy));
  float gray=dot(col,vec3(.299,.587,.114));
  col=mix(vec3(gray),col,saturation)*brightness;
  // The actual moon illumination remains a data-driven influence.
  col*=.88+.12*illum;
  // Smooth elliptical radial vignette; edges always approach black.
  vec2 edge=(gl_FragCoord.xy/resolution-.5)*2.;
  float distanceFromCenter=length(edge*vec2(.92,1.05));
  float vignette=1.-smoothstep(.28,1.22,distanceFromCenter);
  vignette=pow(max(vignette,0.),1.35);
  col*=vignette;
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}try{shaderProgram=gl.createProgram();gl.attachShader(shaderProgram,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(shaderProgram,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(shaderProgram);if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS))throw Error('Shader linking failed');gl.useProgram(shaderProgram);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(shaderProgram,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);for(const name of ['resolution','time','bass','mid','treble','illum','phase'])uniforms[name]=gl.getUniformLocation(shaderProgram,name)}catch(e){console.error(e);gl=null;canvas.style.background='conic-gradient(#ff2388,#ffc24b,#00c6c8,#1254a8,#ff2388)'}}
function bandAverage(lo,hi){if(!frequency||!ctx)return 0;const hz=ctx.sampleRate/analyser.fftSize;const a=Math.max(0,Math.floor(lo/hz)),b=Math.min(frequency.length,Math.ceil(hi/hz));let sum=0;for(let i=a;i<b;i++)sum+=frequency[i];return b>a?sum/(b-a)/255:0}
let start=performance.now();function animate(now){if(analyser&&!audio.paused){analyser.getByteFrequencyData(frequency);metrics.bass+=(bandAverage(25,180)-metrics.bass)*.25;metrics.mid+=(bandAverage(180,2000)-metrics.mid)*.25;metrics.treble+=(bandAverage(2000,9000)-metrics.treble)*.25}else for(const k in metrics)metrics[k]*=.92;for(const k of ['bass','mid','treble'])$(k+'Bar').style.width=(metrics[k]*100).toFixed(1)+'%';if(gl){const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.floor(innerWidth*dpr),h=Math.floor(innerHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}gl.useProgram(shaderProgram);gl.uniform2f(uniforms.resolution,w,h);gl.uniform1f(uniforms.time,(now-start)/1000);gl.uniform1f(uniforms.bass,metrics.bass);gl.uniform1f(uniforms.mid,metrics.mid);gl.uniform1f(uniforms.treble,metrics.treble);gl.uniform1f(uniforms.illum,lunar.illumination/100);gl.uniform1f(uniforms.phase,lunar.phase);gl.drawArrays(gl.TRIANGLES,0,6)}requestAnimationFrame(animate)}
loadMoon();drawMoon();requestAnimationFrame(animate);
