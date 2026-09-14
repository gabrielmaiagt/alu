/* ===== Shared Utilities for M·A·C Multi-Page Funnel ===== */
(function(){
'use strict';

/* --- UTM Tracking --- */
var STORAGE_KEY='funil_utms';
var UTM_PARAMS=['utm_id','utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck'];
function getCookie(n){var m=document.cookie.match('(?:^|; )'+n.replace(/([.$?*|{}()\[\]\\/+^])/g,'\\$1')+'=([^;]*)');return m?decodeURIComponent(m[1]):'';}
function getUrlParams(){var p={};try{new URLSearchParams(location.search).forEach(function(v,k){if(v)p[k]=v;});}catch(e){}return p;}
function captureUtms(){var stored={};try{stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){stored={};}var u=getUrlParams(),changed=false;
for(var i=0;i<UTM_PARAMS.length;i++){var k=UTM_PARAMS[i];if(u[k]){stored[k]=u[k];changed=true;}}
if(u['fbclid']){stored['fbc']='fb.1.'+Date.now()+'.'+u['fbclid'];changed=true;}
var fc=getCookie('_fbc');if(fc){stored['fbc']=fc;changed=true;}
var fp=getCookie('_fbp');if(fp){stored['fbp']=fp;changed=true;}
if(u['gclid'])stored['gclid']=u['gclid'];
if(changed)localStorage.setItem(STORAGE_KEY,JSON.stringify(stored));return stored;}
captureUtms();

window.__getTrackProps=function(isUpsell){var s={};try{s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){s={};}var p={isUpsell:!!isUpsell};
if(s.fbc)p.fbc=s.fbc;if(s.fbp)p.fbp=s.fbp;
var utm=['utm_id','utm_source','utm_campaign','utm_medium','utm_content','utm_term'];
for(var i=0;i<utm.length;i++){if(s[utm[i]])p[utm[i]]=s[utm[i]];}p.user_agent=navigator.userAgent;return p;};

/* Navigation: preserves UTMs between pages */
window.__funilNav=function(url){var s={};try{s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){s={};}var params=[],keys=['utm_id','utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck'];
for(var i=0;i<keys.length;i++){if(s[keys[i]])params.push(encodeURIComponent(keys[i])+'='+encodeURIComponent(s[keys[i]]));}
if(params.length>0)url+=(url.indexOf('?')===-1?'?':'&')+params.join('&');window.location.href=url;};

/* --- localStorage helpers --- */
window.LS={get:function(k){return localStorage.getItem(k)||'';},set:function(k,v){localStorage.setItem(k,v);},getJSON:function(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}},setJSON:function(k,v){localStorage.setItem(k,JSON.stringify(v));}};

/* --- Formatting --- */
window.formatBRL=function(v){return 'R$ '+v.toFixed(2).replace('.',',');};
window.padZero=function(n){return n<10?'0'+n:''+n;};
window.escHtml=function(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;};

/* --- Date helpers --- */
var DIAS=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
window.getTodayPT=function(){var h=new Date();return DIAS[h.getDay()]+', '+h.getDate()+' de '+MESES[h.getMonth()]+' de '+h.getFullYear();};
window.getRaffleDate=function(){var d=new Date();d.setDate(d.getDate()+2);return{dia:padZero(d.getDate()),diaSemana:DIAS[d.getDay()],mes:MESES[d.getMonth()],ano:d.getFullYear(),full:padZero(d.getDate())+' de '+MESES[d.getMonth()]+', às 19h'};};

/* --- Timer --- */
window.startTimer=function(el,seconds,onEnd){var t=seconds;function up(){if(t<=0){if(onEnd)onEnd();return;}var m=Math.floor(t/60),s=t%60;el.textContent=padZero(m)+':'+padZero(s);t--;}up();return setInterval(up,1000);};

/* --- Confetti --- */
window.fireConfetti=function(count){count=count||40;var colors=['#C8102E','#000000','#9B0000','#C0A062','#ffffff','#7a7a7a'];for(var i=0;i<count;i++){var c=document.createElement('div');c.className='confetti';c.style.left=Math.random()*100+'vw';c.style.background=colors[Math.floor(Math.random()*colors.length)];c.style.animationDuration=(2+Math.random()*2)+'s';c.style.animationDelay=(Math.random()*1.5)+'s';c.style.width=(6+Math.random()*6)+'px';c.style.height=(6+Math.random()*4)+'px';document.body.appendChild(c);setTimeout(function(el){el.remove();},(5000),c);}};

/* --- Step manager (mini-SPA within a page) --- */
window.StepManager=function(containerId){
  var container=document.getElementById(containerId);
  var steps={};
  return {
    add:function(name,renderFn,initFn){steps[name]={render:renderFn,init:initFn||null};},
    go:function(name,data){
      container.style.opacity='0';
      setTimeout(function(){
        container.innerHTML=steps[name].render(data||{});
        container.style.opacity='1';
        if(steps[name].init) setTimeout(function(){steps[name].init(data||{});},60);
      },150);
    }
  };
};

/* --- Header + progress rendering (beautiful app chrome) --- */
window.renderHeader=function(progress){
  progress=progress||0;
  var prog = progress>0
    ? '<div class="app-progress-wrap"><div class="app-progress-track"><div class="app-progress-fill" style="width:'+progress+'%"></div></div><span class="app-progress-pct">'+Math.round(progress)+'%</span></div>'
    : '';
  return '<div class="bar">'
      +'<div class="app-brand"><span class="app-logo">M·A·C</span><span class="app-badge">BEAUTY INSIDER</span></div>'
      +'<div class="app-status"><span class="app-status-txt">Programa de Cortesia</span><span class="app-dot"></span></div>'
    +'</div>'+prog;
};
window.renderFooter=function(){
  var y=new Date().getFullYear();
  return '© '+y+' M·A·C Cosmetics Brasil — Programa Beauty Insider de Cortesia.';
};
window.mountChrome=function(progress){
  var h=document.getElementById('app-header');
  if(h){h.className='app-header';h.innerHTML=window.renderHeader(progress);}
  var f=document.getElementById('app-footer');
  if(f){f.className='app-footer';f.innerHTML=window.renderFooter();}
};
window.setProgress=function(progress){
  var fill=document.querySelector('.app-progress-fill');
  var pct=document.querySelector('.app-progress-pct');
  var wrap=document.querySelector('.app-progress-wrap');
  if(!wrap){
    var h=document.getElementById('app-header');
    if(h){h.innerHTML=window.renderHeader(progress);}
    return;
  }
  if(fill) fill.style.width=progress+'%';
  if(pct) pct.textContent=Math.round(progress)+'%';
};

/* --- CPF generator (valid check digits) --- */
window.genCPF=function(){var n=[];for(var i=0;i<9;i++)n.push(Math.floor(Math.random()*9));for(var j=0;j<2;j++){var s=0,w=n.length+1;for(var k=0;k<n.length;k++)s+=n[k]*(w-k);var r=11-(s%11);n.push(r>=10?0:r);}return n.join('');};

})();


/* =============================================================================
 * UNLOCK DE VIDEO (robusto) — libera o botao da pagina depois de N segundos
 * REAIS, mesmo que o video entre em tela cheia ou a aba perca o foco.
 * Usa relogio real (Date.now) em vez de contador, entao NAO trava quando o
 * navegador do celular congela os timers durante o fullscreen do player.
 * Assim o lead nunca fica preso com o botao "Aguarde o video..." travado.
 *   unlockVideoBtn({ barId, ctaId, seconds, label }) 
 * ========================================================================== */
function unlockVideoBtn(o) {
  o = o || {};
  var bar = document.getElementById(o.barId);
  var cta = document.getElementById(o.ctaId);
  if (!cta) return;
  var total = (o.seconds || 15) * 1000;
  var start = Date.now();
  var label = o.label || 'Continuar \u2192';
  var baseCls = 'btn-primary w-full rounded-xl py-4 text-base' + (o.extraCls ? ' ' + o.extraCls : '');
  function unlock() {
    cta.disabled = false;
    cta.className = baseCls;
    cta.textContent = label;
  }
  function tick() {
    var elapsed = Date.now() - start;
    var pct = Math.min(100, (elapsed / total) * 100);
    if (bar) bar.style.width = pct + '%';
    if (elapsed >= total) { unlock(); return; }
    requestAnimationFrame(tick);
  }
  // Garante desbloqueio mesmo se a aba ficar em background o tempo todo.
  setTimeout(unlock, total + 200);
  requestAnimationFrame(tick);
  // Ao voltar o foco, recalcula a barra imediatamente.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      var elapsed = Date.now() - start;
      if (bar) bar.style.width = Math.min(100, (elapsed / total) * 100) + '%';
      if (elapsed >= total) unlock();
    }
  });
}
window.unlockVideoBtn = unlockVideoBtn;
