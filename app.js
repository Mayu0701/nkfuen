(() => {
  'use strict';
  const data = window.JAPAN_DATA;
  const {trip, shop, meta} = data;
  const $ = s => document.querySelector(s);
  const {KEY, clean, merge} = window.TravelState;
  const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titles = ['出发 · 一路向东','东京 · 新宿与涉谷','池袋 · 浦安巡礼','横滨 · 非逻辑巡礼','东京 · 秋叶原与六本木','东京 · 自由时光','大阪 · 大津与京都','京都 · 鞍马与贵船','大阪 · 日本桥漫步','归途 · 把回忆带回家'];
  const weekdays = ['日','一','二','三','四','五','六'];
  const week = d => weekdays[new Date(d+'T12:00:00+09:00').getUTCDay()];
  const pin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const viewer = $('#viewer'), settings = $('#settings');
  let storageOK = true, toastTimer, state, category = '全部', query = '', unboughtOnly = false, offlineBusy = false;
  function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  const stored = readJSON(KEY);
  state = clean(stored, data);
  if (!stored) {
    const oldTrip = readJSON('tripDone'), oldShop = readJSON('shopDone');
    const migration = window.LEGACY_PROGRESS || {};
    for (const [kind, values] of [['trip',oldTrip], ['shop',oldShop]]) {
      if (!Array.isArray(values)) continue;
      for (const oldID of values) {
        const id = migration[kind]?.[oldID];
        if (id) state[kind][id] = {checked:true,at:1};
      }
    }
    const oldDay = readJSON('activeDay');
    if (meta.dates.includes(oldDay)) state.day = oldDay;
    else {
      const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      if (meta.dates.includes(today)) state.day = today;
    }
    for (const kind of ['trip','shop']) for (const item of data[kind]) {
      if (/^(已完成|已购买|已买|完成)$/.test(item.status)) state[kind][item.id] = {checked:true,at:1};
    }
  }
  const checked = (kind,id) => state[kind][id]?.checked === true;
  const count = kind => data[kind].filter(x => checked(kind,x.id)).length;
  function toast(message, long = false) {
    clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, long ? 8000 : 3500);
  }
  function storageUI() {
    $('#storageStatus').textContent = storageOK ? '当前进度已保存到此浏览器。' : '浏览器未能保存进度。请先导出备份，关闭页面后可能丢失。';
    $('#connectionStatus').textContent = !storageOK ? '请导出进度备份' : navigator.onLine ? '进度自动保存' : '离线中 · 进度已保存';
  }
  function save() {
    try {
      const concurrent = readJSON(KEY);
      if (concurrent) state = merge(state, clean(concurrent,data));
      localStorage.setItem(KEY,JSON.stringify(state)); storageOK = true;
    } catch { storageOK = false; }
    storageUI();
  }
  function renderDates() {
    $('#dates').innerHTML = meta.dates.map((d,i) => {
      const items = trip.filter(x => x.date === d), n = items.filter(x => checked('trip',x.id)).length;
      return `<button class="date ${d === state.day?'active':''} ${n===items.length?'complete':''}" data-day="${d}" aria-pressed="${d===state.day}" aria-label="11月${+d.slice(-2)}日，星期${week(d)}，${titles[i]}，已完成${n}/${items.length}"><small>DAY ${String(i+1).padStart(2,'0')}</small><strong>${d.slice(-2)}</strong><span class="day-week">周${week(d)}</span></button>`;
    }).join('');
  }
  function centerDate() { const strip=$('#dates'), active=strip.querySelector('.active');if(active)strip.scrollTo({left:active.offsetLeft-strip.offsetLeft-(strip.clientWidth-active.clientWidth)/2,behavior:'smooth'}); }
  function summary() {
    const n = count('trip'); $('#totalProgress').textContent = `${n} / ${trip.length}`;
    $('#totalProgressBar').style.width = `${n/trip.length*100}%`;
    $('#shopProgress').textContent = `${count('shop')} / ${shop.length}`;
    $('#shopNavCount').textContent = shop.length-count('shop');
    const items = trip.filter(x=>x.date===state.day), dayCount = items.filter(x=>checked('trip',x.id)).length;
    const dp = $('#dayProgress'); if (dp) dp.innerHTML=`<strong>${dayCount}<span aria-hidden="true"> / </span>${items.length}</strong>今日已完成`;
    storageUI();
  }
  function mapLink(value) {
    if (!value) return '';
    let href;
    try { const u = new URL(value); if (!['https:','http:'].includes(u.protocol)) return ''; href = u.href; }
    catch { href = 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(value); }
    return `<a class="map-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="在 Google 地图打开：${esc(value)}">${pin}Google 地图 ↗</a>`;
  }
  function priority(p) { return p ? `<span class="priority ${['A','B','S'].includes(p)?p:''}" title="优先级 ${esc(p)}">${esc(p)}</span>` : ''; }
  function checkButton(kind,item) { return `<button class="check" role="checkbox" aria-checked="${checked(kind,item.id)}" aria-label="${kind==='trip'?'完成':'已买'}：${esc(item.title)}" data-check="${kind}" data-id="${item.id}"><span aria-hidden="true">${checked(kind,item.id)?'✓':''}</span></button>`; }
  function gallery(item,kind) {
    if (!item.images.length) return '';
    return `<div class="gallery ${item.images.length===1?'one':item.images.length===2?'two':''}">${item.images.map((im,i)=>`<button class="image-button" data-image-kind="${kind}" data-image-id="${item.id}" data-index="${i}" aria-label="放大：${esc(item.title)}，第${i+1}张，共${item.images.length}张"><img src="${im.src}" width="${im.width}" height="${im.height}" loading="lazy" decoding="async" alt="${esc(item.title)} · 参考图 ${i+1}"></button>`).join('')}</div>`;
  }
  function tripCard(item) {
    return `<article class="trip-row ${checked('trip',item.id)?'done':''}" data-item-id="${item.id}"><div class="time-col">${esc(item.start||'顺路安排')}${item.end?`<small>— ${esc(item.end)}</small>`:''}</div><div class="trip-card"><div class="card-heading">${checkButton('trip',item)}<div class="card-text">${item.type||item.priority?`<div class="card-meta">${priority(item.priority)}${esc(item.type)}</div>`:''}<h3>${esc(item.title||'参考图片')}</h3></div></div>${item.condition?`<p class="details">${esc(item.condition)}</p>`:''}${item.route?`<p class="details">路线：${esc(item.route)}</p>`:''}${item.note?`<p class="details note">${esc(item.note)}</p>`:''}${item.map||item.images.length?`<div class="card-actions">${mapLink(item.map)}${item.images.length?`<span class="image-count">${item.images.length} 张参考图 · 点图放大</span>`:''}</div>`:''}${gallery(item,'trip')}</div></article>`;
  }
  function renderTrip() {
    const index = meta.dates.indexOf(state.day), items = trip.filter(x=>x.date===state.day);
    $('#dayContent').innerHTML = `<div class="day-head"><div><p class="day-label">DAY ${String(index+1).padStart(2,'0')} / NOVEMBER ${state.day.slice(-2)}</p><h2>${titles[index]}</h2><p class="day-subtitle">11 月 ${+state.day.slice(-2)} 日 · 星期${week(state.day)} · 时间按原表显示</p></div><div><div class="day-progress" id="dayProgress"></div><div class="day-steps"><button data-step="-1" ${index===0?'disabled':''} aria-label="前一天">←</button><button data-step="1" ${index===meta.dates.length-1?'disabled':''} aria-label="后一天">→</button></div></div></div><div class="timeline">${items.map(tripCard).join('')}</div><p class="end-of-day">${index===9?'旅途到这里，回忆会继续。':'今天也要，留一点时间给惊喜。'}</p>`;
    summary();
  }
  function changeDay(day,scroll = false) {
    if (!meta.dates.includes(day)) return;
    state.day=day; save(); renderDates(); renderTrip();
    centerDate();
    if(scroll) $('.day-planner').scrollIntoView({block:'start',behavior:'smooth'});
  }
  function shopCard(item) {
    const im = item.images[0];
    return `<article class="shop-card ${checked('shop',item.id)?'done':''}" data-item-id="${item.id}">${im?`<button class="image-button product-image" data-image-kind="shop" data-image-id="${item.id}" data-index="0" aria-label="放大商品图片：${esc(item.title)}"><img src="${im.src}" width="${im.width}" height="${im.height}" loading="lazy" decoding="async" alt="${esc(item.title)}"></button>`:`<div class="product-empty" aria-label="此商品未附图片"><div>${esc(item.store==='公式书'?'書':item.store==='化妆品'?'美':'遊')}<small>未附图片</small></div></div>`}<div class="shop-card-body"><div class="card-meta">${priority(item.priority)}<span>${esc(item.store)}</span>${item.qty?`<span>× ${esc(item.qty)}</span>`:''}</div><h3>${esc(item.title)}</h3>${item.budget?`<p class="budget">预算 · ${esc(item.budget)}</p>`:''}${item.area?`<p class="details">${esc(item.area)}</p>`:''}${item.note?`<p class="details">${esc(item.note)}</p>`:''}<div class="buy-row"><span class="buy-label">${checked('shop',item.id)?'已放进行李箱':'等待一个好价格'}</span>${checkButton('shop',item)}</div></div></article>`;
  }
  function renderShop() {
    const categories = ['全部',...new Set(shop.map(x=>x.store).filter(Boolean))];
    $('#shopFilters').innerHTML=categories.map(c=>`<button class="filter ${category===c?'active':''}" data-category="${esc(c)}" aria-pressed="${category===c}">${esc(c)}</button>`).join('');
    const items = shop.filter(x=>(category==='全部'||x.store===category)&&(!unboughtOnly||!checked('shop',x.id))&&[x.title,x.store,x.area,x.note,x.budget].join(' ').toLowerCase().includes(query.toLowerCase()));
    $('#shopList').innerHTML=items.length?items.map(shopCard).join(''):'<p class="empty">没有符合条件的商品。<br>试试其他关键词，或切换分类。</p>';
    summary();
  }
  function setView(view,scroll=true) {
    state.view=view; save(); $('#tripView').hidden=view!=='trip'; $('#shopView').hidden=view!=='shop';
    document.querySelectorAll('.nav-button').forEach(b=> { b.classList.toggle('active',b.dataset.view===view); if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current'); });
    if(view==='shop') renderShop();
    if(scroll)window.scrollTo({top:0,behavior:'smooth'});
  }
  function toggle(kind,id,button) {
    if(!data[kind].some(x=>x.id===id)) return;
    state[kind][id]={checked:!checked(kind,id),at:Math.max(Date.now(),(state[kind][id]?.at||0)+1)}; save();
    const on=checked(kind,id); button.setAttribute('aria-checked',String(on));button.firstElementChild.textContent=on?'✓':'';
    button.closest('[data-item-id]').classList.toggle('done',on);
    if(kind==='shop') { const label=button.closest('.shop-card').querySelector('.buy-label');label.textContent=on?'已放进行李箱':'等待一个好价格';if(unboughtOnly)renderShop(); }
    renderDates(); summary();
    if(!storageOK) toast('本次勾选暂未写入浏览器，请在旅行工具中导出备份。',true);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.day)changeDay(b.dataset.day);
    else if(b.dataset.step)changeDay(meta.dates[meta.dates.indexOf(state.day)+Number(b.dataset.step)],true);
    else if(b.dataset.view)setView(b.dataset.view);
    else if(b.dataset.check)toggle(b.dataset.check,b.dataset.id,b);
    else if(b.dataset.category){category=b.dataset.category;renderShop();}
    else if(b.dataset.imageId){const item=data[b.dataset.imageKind].find(x=>x.id===b.dataset.imageId);if(item)openViewer(item,Number(b.dataset.index));}
  });
  $('#shopSearch').addEventListener('input',e=>{query=e.target.value;renderShop();});
  $('#unboughtOnly').addEventListener('change',e=>{unboughtOnly=e.target.checked;renderShop();});
  document.addEventListener('keydown',e=>{if(e.key===' '&&e.target.matches('[role=checkbox]')){e.preventDefault();e.target.click();}});
  $('#settingsButton').onclick=()=>{storageUI();settings.showModal();};$('#closeSettings').onclick=()=>settings.close();
  settings.addEventListener('click',e=>{if(e.target===settings){const r=settings.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settings.close();}});
  function download(blob,name) { const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000); }
  $('#exportState').onclick=()=>{const backup={app:'nkfuen-japan-travel',schema:2,datasetVersion:meta.version,exportedAt:new Date().toISOString(),state};download(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),'日本旅记-进度备份-'+new Date().toISOString().slice(0,10)+'.json');toast('已导出进度备份，请保管下载文件。');};
  $('#importState').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{
      if(file.size>1024*1024)throw new Error('备份文件过大，请选择本站导出的 JSON。');
      const backup=JSON.parse(await file.text());
      if(backup.app!=='nkfuen-japan-travel'||backup.schema!==2||backup.state?.schema!==2||!backup.state.trip||!backup.state.shop)throw new Error('文件格式不正确，请选择本站导出的进度备份。');
      const imported=clean(backup.state,data);let n=0;const now=Date.now();
      for(const kind of ['trip','shop'])for(const [id,v]of Object.entries(imported[kind])){state[kind][id]={checked:v.checked,at:now};n++;}
      save();renderDates();renderTrip();renderShop();toast(n?`已恢复 ${n} 项勾选记录。`:'备份内没有可恢复的当前行程记录。',true);
    }catch(err){toast(err instanceof SyntaxError?'备份不是有效的 JSON 文件。':err.message,true);}finally{e.target.value='';}
  };
  window.addEventListener('storage',e=>{
    if(e.key!==KEY||!e.newValue)return;
    try{state=merge(state,clean(JSON.parse(e.newValue),data));renderDates();renderTrip();if(state.view==='shop')renderShop();}catch{}
  });
  window.addEventListener('online',storageUI);window.addEventListener('offline',storageUI);

  let currentItem, imageIndex=0, zoom=1, panX=0,panY=0,imageToken=0,currentFile=null,originator=null;
  const points=new Map();let gesture=null;
  function transform(){ $('#viewerImg').style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;$('#zoomReset').textContent=`${Math.round(zoom*100)}%`; }
  function resetZoom(){zoom=1;panX=panY=0;points.clear();gesture=null;transform();}
  async function showImage(){
    const token=++imageToken;const im=currentItem.images[imageIndex];currentFile=null;resetZoom();
    $('#viewerTitle').textContent=currentItem.title;$('#viewerCount').textContent=`${imageIndex+1} / ${currentItem.images.length} · 点下方按钮可保存图片`;
    $('#viewerImg').src=im.src;$('#viewerImg').alt=currentItem.title+' · 第'+(imageIndex+1)+'张参考图';$('#viewerError').textContent='';
    $('#prevImage').disabled=imageIndex===0;$('#nextImage').disabled=imageIndex===currentItem.images.length-1;
    const link=$('#downloadImage');link.href=im.original;link.download='日本旅记-'+currentItem.id+'-'+(imageIndex+1)+'.'+im.original.split('.').pop();link.textContent='下载原图';
    $('#shareImage').hidden=true;
    try{
      const response=await fetch(im.original);if(!response.ok)throw new Error('unavailable');const blob=await response.blob();
      if(token!==imageToken||!viewer.open)return;
      if(imageObjectURL)URL.revokeObjectURL(imageObjectURL);imageObjectURL=URL.createObjectURL(blob);$('#viewerImg').src=imageObjectURL;
      link.href=imageObjectURL;
      currentFile=new File([blob],link.download,{type:blob.type||'image/'+im.original.split('.').pop()});
      $('#shareImage').hidden=!(navigator.canShare&&navigator.canShare({files:[currentFile]}));
    }catch{
      if(token!==imageToken)return;
      $('#viewerError').textContent='原图暂时无法加载，当前显示预览图。可先保存预览图，联网后再试原图。';link.href=im.src;link.download='日本旅记-'+currentItem.id+'-预览.webp';link.textContent='下载预览图';
    }
  }
  let imageObjectURL=null;
  function openViewer(item,index){currentItem=item;imageIndex=index;originator=document.activeElement;viewer.showModal();document.body.style.overflow='hidden';showImage();}
  $('.viewer-close').onclick=()=>viewer.close();
  viewer.addEventListener('close',()=>{imageToken++;document.body.style.overflow='';points.clear();if(imageObjectURL){URL.revokeObjectURL(imageObjectURL);imageObjectURL=null;}originator?.focus({preventScroll:true});});
  $('#prevImage').onclick=()=>{if(imageIndex>0){imageIndex--;showImage();}};
  $('#nextImage').onclick=()=>{if(imageIndex<currentItem.images.length-1){imageIndex++;showImage();}};
  $('#zoomIn').onclick=()=>{zoom=Math.min(6,zoom+.5);transform();};$('#zoomOut').onclick=()=>{zoom=Math.max(1,zoom-.5);if(zoom===1)panX=panY=0;transform();};$('#zoomReset').onclick=resetZoom;
  viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight')$('#nextImage').click();if(e.key==='ArrowLeft')$('#prevImage').click();});
  $('#shareImage').onclick=async()=>{if(!currentFile)return;try{await navigator.share({files:[currentFile]});}catch(err){if(err.name!=='AbortError')toast('系统分享暂不可用，可点“下载原图”或长按图片保存。',true);}};
  $('#viewerStage').addEventListener('dblclick',()=>{zoom=zoom===1?2:1;panX=panY=0;transform();});
  const stage=$('#viewerStage');
  function startGesture(){const p=[...points.values()];gesture=p.length>=2?{distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom}:p.length===1?{x:p[0].x,y:p[0].y,panX,panY}:null;}
  stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);startGesture();});
  stage.addEventListener('pointermove',e=>{if(!points.has(e.pointerId)||!gesture)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...points.values()];if(p.length>=2&&gesture.distance){zoom=Math.max(1,Math.min(6,gesture.zoom*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/gesture.distance));if(zoom===1)panX=panY=0;}else if(p.length===1&&zoom>1&&gesture.x!==undefined){const r=stage.getBoundingClientRect();panX=Math.max(-r.width*zoom/2,Math.min(r.width*zoom/2,gesture.panX+p[0].x-gesture.x));panY=Math.max(-r.height*zoom/2,Math.min(r.height*zoom/2,gesture.panY+p[0].y-gesture.y));}transform();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,e=>{points.delete(e.pointerId);startGesture();});
  document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement){e.target.alt='图片暂未加载，请联网重试';e.target.closest('button')?.classList.add('image-failed');}},true);

  async function prepareOffline(){
    if(offlineBusy)return;offlineBusy=true;const button=$('#offlineButton');button.disabled=true;
    try{
      if(!('serviceWorker'in navigator)||!('caches'in window))throw new Error('此浏览器不支持离线缓存。请使用 Safari 或 Chrome 打开。');
      const registration=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('离线功能尚未启动，请联网刷新页面后重试。')),12000))]);
      const cache=await caches.open('nkfuen-final-media-'+meta.version);
      const urls=[...new Set([...trip,...shop].flatMap(x=>x.images.map(im=>im.src)))];let complete=0;
      for(const url of urls){const key=new URL(url,location.href).href;if(!await cache.match(key)){const response=await fetch(key);if(!response.ok)throw new Error('部分图片下载失败，请联网后重试，已完成的图片会保留。');await cache.put(key,response);}complete++;$('#offlineStatus').textContent=`正在准备 ${complete} / ${urls.length} 张预览图…`;}
      if(!registration.active)throw new Error('离线功能正在启动，请稍后重试。');
      $('#offlineStatus').textContent=`离线准备完成：${urls.length} 张预览图和全部行程可随时查看。`;toast('离线行程与图片准备完成。');
    }catch(err){$('#offlineStatus').textContent=err.name==='QuotaExceededError'?'设备可用空间不足，离线图片未全部准备好。已缓存的内容仍可使用。':err.message;}finally{offlineBusy=false;button.disabled=false;}
  }
  $('#offlineButton').onclick=prepareOffline;
  if('serviceWorker'in navigator){
    let controlled=Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled){toast('新版本已准备好，重新打开页面即可使用。',true);}controlled=true;});
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{$('#offlineStatus').textContent='离线功能暂未启动，可联网使用并导出进度备份。';}));
  }
  save();renderDates();renderTrip();setView(state.view,false);
  requestAnimationFrame(centerDate);
})();
