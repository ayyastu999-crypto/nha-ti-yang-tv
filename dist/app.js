import {solarToLunar, vietnamDateParts, lunarYearName} from './lunar.mjs';

// tv-fit.js runs this app inside a scaled frame on small TV viewports; the outer page then stays idle.
if(!window.__tvFit){

const $ = id => document.getElementById(id);
const pad = value => String(value).padStart(2,'0');
const monthNames = ['Giêng','Hai','Ba','Tư','Năm','Sáu','Bảy','Tám','Chín','Mười','Mười một','Chạp'];
let preferences = {theme:'warm',speed:3000,showLunar:true};
try { preferences = {...preferences, ...JSON.parse(localStorage.getItem('nha-minh-preferences') || '{}')}; } catch {}
if (!['warm','sage','night'].includes(preferences.theme)) preferences.theme='warm';
if (![3000,8000,15000,30000].includes(Number(preferences.speed))) preferences.speed=3000;

const demoPhotos = [
  {src:'assets/photo-1.jpg',caption:'Một chiều về miền xanh',alt:'Ruộng bậc thang và mái nhà giữa núi xa',author:'Peter Hammer',source:'https://unsplash.com/photos/scenery-of-rice-fields-ggQy5lGtwb0'},
  {src:'assets/lakeside-trail.jpg',caption:'Những ngày cùng nhau đi xa',alt:'Lối mòn qua đồng cỏ vàng cạnh hồ và núi',author:'Sylvain Cleymans',source:'https://unsplash.com/photos/a-trail-winds-through-a-grassy-field-with-mountains-in-the-background-kSqE3Hnphuw'},
  {src:'assets/photo-3.jpg',caption:'Bình yên ở thật gần',alt:'Dòng nước phản chiếu núi xa giữa đồng xanh',author:'seb.',source:'https://unsplash.com/photos/green-grass-field-near-lake-during-daytime-MOsRi5Ou_mU'},
  {src:'assets/photo-2.jpg',caption:'Một góc nắng của riêng mình',alt:'Hoa cúc trắng nhỏ trong đồng cỏ ngập nắng',author:'Damian',source:'https://unsplash.com/photos/wildflowers-bloom-in-a-sunny-green-meadow-wpofCJ9fCCc'},
  {src:'assets/sea-sunset.jpg',caption:'Hẹn nhau một chiều ở biển',alt:'Bờ biển lặng trong ánh hoàng hôn',author:'marina negrete',source:'https://unsplash.com/photos/calm-sea-during-sunset-6cVfi9tHyOA'},
  {src:'assets/golden-sea.jpg',caption:'Giữ lại một chút nắng',alt:'Ánh nắng vàng in trên mặt nước lúc hoàng hôn',author:'Giorgio Trovato',source:'https://unsplash.com/photos/calm-sea-under-orange-sky-during-sunset-cIcfyNgrVE0'}
];
const demoSpreads = [
  {photos:[0,3,2],title:'Một ngày, chẳng cần vội.',subtitle:'Chỉ cần đi cùng nhau là đủ.',kicker:'NHỮNG NGÀY ĐI XA',collection:'Những ngày đi xa',captions:['mình cứ thong thả thôi...','...và giữ lại những điều bé xíu.']},
  {photos:[4,5,3],title:'Hẹn nhau một chiều ở biển.',subtitle:'Để nắng hong khô những bận lòng.',kicker:'MANG NẮNG VỀ NHÀ',collection:'Mang nắng về nhà',captions:['gom một chút nắng vàng','để dành cho những ngày mưa.']},
  {photos:[1,2,0],title:'Bình yên ở thật gần.',subtitle:'Một chuyến đi, thêm nhiều điều thương.',kicker:'ĐI VỀ PHÍA BÌNH YÊN',collection:'Đi về phía bình yên',captions:['những ngày thật xanh','nhớ cả những điều nhỏ nhất.']}
];
// The album shown when nothing was added on this device: the demo photos, or the family album inside the TV app.
let basePhotos=demoPhotos, baseSpreads=demoSpreads, familyAlbum=false;
let photos = [...demoPhotos], customPhotos=false, spreadIndex=0, lightboxIndex=0;
let autoplay=true, toastTimeout=null, calendarYear, calendarMonth, chosenDay;
let timerMinutes=15, timerRemaining=900000, timerDeadline=null, timerFinished=false;

function toast(message, duration=4300) {
  $('toast').textContent=message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>$('toast').classList.remove('visible'),duration);
}
function savePreferences() {
  try {localStorage.setItem('nha-minh-preferences',JSON.stringify(preferences));} catch {}
}
function applyPreferences() {
  document.body.dataset.theme=preferences.theme;
  $('show-lunar').checked=preferences.showLunar;
  $('lunar-card').hidden=!preferences.showLunar;
  $('autoplay-speed').value=String(preferences.speed);
  document.querySelectorAll('[data-theme-choice]').forEach(b=>{
    const selected=b.dataset.themeChoice===preferences.theme;
    b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
  });
}
applyPreferences();

function spreads() {
  if (!customPhotos) return baseSpreads;
  return Array.from({length:Math.ceil(photos.length/3)},(_,i)=>({
    photos:[i*3,i*3+1,i*3+2].filter(n=>n<photos.length),
    title:'Những điều mình muốn giữ.',subtitle:'Một khoảnh khắc, một niềm thương.',
    kicker:'ALBUM CỦA NHÀ TÍ YANG',collection:'Ảnh của nhà',
    captions:['cất ở đây một chút thương','những ngày mình có nhau.']
  }));
}
// Photo reel: one card per photo at its own aspect ratio, repeated enough times to loop without a gap, drifting
// left by exactly one set per cycle. Speed follows the "seconds per photo" setting.
let reelToken=0;
function renderReel(){
  const token=++reelToken, track=$('reel-track');
  const cards=photos.map((photo,index)=>{
    const card=document.createElement('span');card.className='reel-card';card.dataset.index=String(index);
    const img=document.createElement('img');img.src=photo.src;img.alt=photo.alt||'';img.decoding='async';
    const caption=document.createElement('span');caption.className='reel-caption';caption.textContent=photo.caption||'';
    card.append(img,caption);return card;
  });
  track.classList.remove('reel-ready');track.replaceChildren(...cards);
  // Only the size matters for measuring, so wait for load (decode() can stall until the next painted frame).
  const loaded=img=>img.complete?Promise.resolve():new Promise(done=>{img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});});
  Promise.all(cards.map(card=>loaded(card.querySelector('img')))).then(()=>{
    if(token!==reelToken||!cards.length)return;
    const gap=parseFloat(getComputedStyle(track).columnGap)||0, setWidth=track.scrollWidth+gap;
    const copies=Math.ceil($('photo-reel').clientWidth/setWidth)+1;
    for(let i=1;i<copies;i++)track.append(...cards.map(card=>card.cloneNode(true)));
    track.style.setProperty('--reel-shift',`${-setWidth}px`);
    updateReelSpeed();track.classList.add('reel-ready');
  });
}
function updateReelSpeed(){$('reel-track').style.setProperty('--reel-duration',`${Math.max(1,photos.length)*Number(preferences.speed)/1000}s`);}
let reelResizeTimer=null;
addEventListener('resize',()=>{clearTimeout(reelResizeTimer);reelResizeTimer=setTimeout(renderReel,300);});
// OK on the reel opens the photo nearest the middle in the full-size viewer.
$('photo-reel').onclick=()=>{
  const box=$('photo-reel').getBoundingClientRect(),middle=box.left+box.width/2;let nearest=0,distance=Infinity;
  for(const card of $('reel-track').children){const r=card.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-middle);if(d<distance){distance=d;nearest=Number(card.dataset.index);}}
  openPhoto(nearest);
};
function rebuildDots() {
  renderReel();
  $('spread-dots').replaceChildren();
  spreads().forEach((_,i)=>{
    const dot=document.createElement('button');dot.className='spread-dot';
    dot.setAttribute('aria-label',`Mở trang ${i+1} của album`);
    dot.addEventListener('click',()=>goToSpread(i));$('spread-dots').append(dot);
  });
}
function renderSpread() {
  const list=spreads();spreadIndex=(spreadIndex+list.length)%list.length;
  const spread=list[spreadIndex];
  ['main','top','bottom'].forEach((slot,i)=>{
    const photoIndex=spread.photos[i], button=$(`photo-${slot}`);
    button.hidden=photoIndex===undefined;
    if (photoIndex===undefined) return;
    const photo=photos[photoIndex];$(`${slot}-image`).src=photo.src;$(`${slot}-image`).alt=photo.alt;$(`${slot}-image`).style.objectPosition=photo.focus||'';
    button.setAttribute('aria-label',`Xem ảnh: ${photo.caption}`);button.onclick=()=>openPhoto(photoIndex);
  });
  $('spread-title').textContent=spread.title;$('spread-subtitle').textContent=spread.subtitle;
  $('spread-kicker').textContent=spread.kicker;$('collection-label').textContent='Xem tất cả ảnh';
  $('top-caption').textContent=spread.captions[0];$('bottom-caption').textContent=spread.captions[1];
  $('sample-tag').textContent=customPhotos||familyAlbum?'Ảnh của nhà':'Ảnh minh họa';
  $('left-page-number').textContent=pad(spreadIndex*2+1);$('right-page-number').textContent=pad(spreadIndex*2+2);
  Array.from($('spread-dots').children).forEach((b,i)=>{b.classList.toggle('selected',i===spreadIndex);b.setAttribute('aria-pressed',String(i===spreadIndex));});
  $('prev-spread').disabled=$('next-spread').disabled=list.length<2;
}
// The new spread slides in from the side it comes from: forward from the right, back from the left.
function goToSpread(index) {
  const back=index<spreadIndex;spreadIndex=index;renderSpread();
  $('book').classList.remove('turning','turning-back');void $('book').offsetWidth;$('book').classList.add(back?'turning-back':'turning');
}
$('book').addEventListener('animationend',()=>$('book').classList.remove('turning','turning-back'));
$('prev-spread').onclick=()=>goToSpread(spreadIndex-1);
$('next-spread').onclick=()=>goToSpread(spreadIndex+1);
function scheduleAutoplay() {
  document.body.classList.toggle('reel-paused',!autoplay);
  updateReelSpeed();
}
function showAutoplayState() {
  $('autoplay').setAttribute('aria-pressed',String(autoplay));
  $('autoplay').setAttribute('aria-label',autoplay?'Dừng ảnh trôi':'Cho ảnh trôi tiếp');
  $('autoplay').querySelector('use').setAttribute('href',autoplay?'#i-pause':'#i-play');
}
$('autoplay').onclick=()=>{
  autoplay=!autoplay;showAutoplayState();
  scheduleAutoplay();toast(autoplay?`Ảnh trôi chậm, khoảng ${preferences.speed/1000} giây mỗi ảnh.`:'Đã dừng ảnh trôi.');
};
showAutoplayState();scheduleAutoplay();

function openDialog(id) {const dialog=$(id);if(!dialog.open) dialog.showModal();}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
}));
function renderGallery() {
  $('gallery').replaceChildren();
  $('gallery-summary').textContent=customPhotos?`${photos.length} ảnh của nhà Tí Yang.`:`${photos.length} ảnh minh họa · Hãy thêm ảnh của gia đình chị.`;
  photos.forEach((photo,i)=>{
    const button=document.createElement('button');button.className='gallery-item';
    const img=document.createElement('img');img.src=photo.src;img.alt=photo.alt;img.loading='lazy';
    const label=document.createElement('span');label.textContent=photo.caption;
    button.append(img,label);button.onclick=()=>openPhoto(i);$('gallery').append(button);
  });
}
function openAlbum(){renderGallery();openDialog('album-dialog');}
function openPhoto(index){lightboxIndex=(index+photos.length)%photos.length;renderLightbox();openDialog('photo-dialog');}
function renderLightbox(){const photo=photos[lightboxIndex];$('lightbox-image').src=photo.src;$('lightbox-image').alt=photo.alt;$('lightbox-caption').textContent=`${photo.caption}  ·  ${lightboxIndex+1}/${photos.length}`;}
$('lightbox-prev').onclick=()=>openPhoto(lightboxIndex-1);$('lightbox-next').onclick=()=>openPhoto(lightboxIndex+1);
['nav-albums','app-album','open-collection'].forEach(id=>$(id).onclick=openAlbum);
['brand','nav-home'].forEach(id=>$(id).onclick=()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());window.scrollTo({top:0,behavior:'smooth'});});

function database(){return new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(new Error('Trình duyệt chưa hỗ trợ lưu ảnh.'));
  const request=indexedDB.open('nha-minh-album',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('album');
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});}
async function readStoredPhotos(){const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('album').objectStore('album').get('photos');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
async function storePhotos(value){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('album','readwrite');if(value)tx.objectStore('album').put(value,'photos');else tx.objectStore('album').delete('photos');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
function fileAsPhoto(file){return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{try{
    const scale=Math.min(1,1920/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
    canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
    const ctx=canvas.getContext('2d');ctx.fillStyle='#faf7ef';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const name=file.name.replace(/\.[^/.]+$/,'').replace(/[_-]/g,' ').slice(0,80)||'Khoảnh khắc của nhà';
    resolve({src:canvas.toDataURL('image/jpeg',.88),caption:name,alt:name});
  }catch(error){reject(error);}finally{URL.revokeObjectURL(url);}};
  img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Không đọc được định dạng ảnh này.'));};img.src=url;
});}
['add-photos','gallery-add'].forEach(id=>$(id).onclick=()=>$('file-input').click());
$('file-input').onchange=async event=>{
  const selected=Array.from(event.target.files||[]);if(!selected.length)return;
  const max=24-(customPhotos?photos.length:0);
  if(max<=0){toast('Album đang có 24 ảnh. Dùng lại ảnh minh họa trong Tùy chỉnh để bắt đầu album mới.');event.target.value='';return;}
  const eligible=selected.filter(f=>f.type.startsWith('image/')&&f.size<=25*1024*1024).slice(0,max);
  if(!eligible.length){toast('Chị chọn ảnh JPG, PNG, WebP hoặc AVIF dưới 25 MB nhé.');return;}
  $('add-photos').disabled=true;$('gallery-add').disabled=true;toast('Đang sắp ảnh vào album…',30000);
  const results=await Promise.allSettled(eligible.map(fileAsPhoto));const added=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(added.length){
    photos=customPhotos?[...photos,...added]:added;customPhotos=true;spreadIndex=0;rebuildDots();renderSpread();renderGallery();
    let message=`Đã thêm ${added.length} ảnh vào album của nhà.`;
    try{await storePhotos(photos);}catch{message+=' Ảnh chỉ được giữ cho lần xem này vì trình duyệt chưa lưu được.';}
    if(added.length<selected.length)message+=' Một số ảnh chưa được thêm (tối đa 24 ảnh, mỗi ảnh dưới 25 MB).';toast(message,6500);
  }else toast('Chưa đọc được ảnh. Chị thử chọn ảnh JPG hoặc PNG nhé.');
  $('add-photos').disabled=false;$('gallery-add').disabled=false;event.target.value='';
};
$('restore-demo').onclick=async()=>{
  if(!customPhotos){toast('Album đang dùng ảnh minh họa.');return;}
  photos=[...basePhotos];customPhotos=false;spreadIndex=0;rebuildDots();renderSpread();renderGallery();
  try{await storePhotos(null);toast('Đã trở về album minh họa. Ảnh gốc của chị vẫn ở thiết bị.');}
  catch{toast('Đã trở về ảnh minh họa cho lần xem này.');}
};

function displayLunar(lunar){return `${lunar.day} tháng ${monthNames[lunar.month-1]}${lunar.leap?' nhuận':''} · ${lunarYearName(lunar.year)}`;}
let lastDate='';
function updateClock(){
  const today=vietnamDateParts(), key=`${today.year}-${today.month}-${today.day}`;
  $('clock-hours').textContent=pad(today.hour);$('clock-minutes').textContent=pad(today.minute);
  $('clock').setAttribute('aria-label',`${today.hour} giờ ${today.minute} phút tại Việt Nam`);
  $('day-greeting').textContent=today.hour<5?'ĐÊM ÊM, NHÀ TÍ YANG NHÉ':today.hour<11?'CHÀO BUỔI SÁNG':today.hour<14?'MỘT CHÚT BÌNH YÊN':today.hour<18?'CHÀO BUỔI CHIỀU':'CHÀO BUỔI TỐI';
  if(key===lastDate)return;lastDate=key;
  const date=new Date(Date.UTC(today.year,today.month-1,today.day));
  const weekday=new Intl.DateTimeFormat('vi-VN',{weekday:'long',timeZone:'UTC'}).format(date);
  $('solar-date').textContent=`${weekday.charAt(0).toUpperCase()+weekday.slice(1)}, ${today.day} tháng ${today.month}`;
  const lunar=solarToLunar(today.day,today.month,today.year);
  $('lunar-day').textContent=pad(lunar.day);$('lunar-month').textContent=`Tháng ${monthNames[lunar.month-1]}${lunar.leap?' nhuận':''}`;$('lunar-year').textContent=`Năm ${lunarYearName(lunar.year)}`;
  $('lunar-note').textContent=lunar.day===15?`Hôm nay là Rằm tháng ${lunar.month}${lunar.leap?' nhuận':''}`:lunar.day===1?'Mùng Một · Một khởi đầu mới':'Một ngày để giữ điều thương';
  $('lunar-card').setAttribute('aria-label',`Âm lịch hôm nay: ${displayLunar(lunar)}. Mở lịch tháng.`);
  if($('calendar-dialog').open)renderCalendar();
}
function openCalendar(){
  const today=vietnamDateParts();calendarYear=today.year;calendarMonth=today.month;chosenDay=today.day;
  renderCalendar();openDialog('calendar-dialog');
}
['nav-calendar','app-calendar','lunar-card'].forEach(id=>$(id).onclick=openCalendar);
function renderCalendar(){
  const today=vietnamDateParts();$('calendar-month-title').textContent=`Tháng ${calendarMonth}, ${calendarYear}`;
  const start=(new Date(Date.UTC(calendarYear,calendarMonth-1,1)).getUTCDay()+6)%7;
  const total=new Date(Date.UTC(calendarYear,calendarMonth,0)).getUTCDate();
  chosenDay=Math.min(chosenDay,total);$('calendar-grid').replaceChildren();
  for(let i=0;i<start;i++){const space=document.createElement('span');space.setAttribute('aria-hidden','true');$('calendar-grid').append(space);}
  for(let day=1;day<=total;day++){
    const lunar=solarToLunar(day,calendarMonth,calendarYear), button=document.createElement('button');button.className='calendar-day';button.dataset.day=day;
    if(day===today.day&&calendarMonth===today.month&&calendarYear===today.year)button.classList.add('today');
    if(day===chosenDay)button.classList.add('chosen');if(lunar.day===1||lunar.day===15)button.classList.add('important');
    button.setAttribute('aria-pressed',String(day===chosenDay));button.setAttribute('aria-label',`${day} tháng ${calendarMonth} dương lịch, âm lịch ${displayLunar(lunar)}`);
    const large=document.createElement('span');large.textContent=day;
    const small=document.createElement('small');small.textContent=lunar.day===1?`1/${lunar.month}${lunar.leap?'n':''}`:String(lunar.day);
    button.append(large,small);button.onclick=()=>{chosenDay=day;renderCalendar();$('calendar-grid').querySelector(`[data-day="${day}"]`).focus();};$('calendar-grid').append(button);
  }
  const selected=solarToLunar(chosenDay,calendarMonth,calendarYear);
  $('selected-day').replaceChildren();const line=document.createElement('div');line.textContent=`Ngày ${chosenDay}/${calendarMonth}/${calendarYear}`;
  const lunarLabel=document.createElement('strong');lunarLabel.textContent=`Âm lịch: ${displayLunar(selected)}`;$('selected-day').append(line,lunarLabel);
  $('calendar-prev').disabled=calendarYear===1900&&calendarMonth===1;$('calendar-next').disabled=calendarYear===2100&&calendarMonth===12;
}
function changeMonth(step){
  const next=new Date(Date.UTC(calendarYear,calendarMonth-1+step,1));if(next.getUTCFullYear()<1900||next.getUTCFullYear()>2100)return;
  calendarYear=next.getUTCFullYear();calendarMonth=next.getUTCMonth()+1;chosenDay=1;renderCalendar();
}
$('calendar-prev').onclick=()=>changeMonth(-1);$('calendar-next').onclick=()=>changeMonth(1);$('calendar-today').onclick=openCalendar;

['settings','app-settings'].forEach(id=>$(id).onclick=()=>openDialog('settings-dialog'));
document.querySelectorAll('[data-theme-choice]').forEach(button=>button.onclick=()=>{preferences.theme=button.dataset.themeChoice;applyPreferences();savePreferences();});
$('autoplay-speed').onchange=event=>{preferences.speed=Number(event.target.value);savePreferences();scheduleAutoplay();};
$('show-lunar').onchange=event=>{preferences.showLunar=event.target.checked;applyPreferences();savePreferences();};
$('fullscreen').onclick=async()=>{
  const doc=window.top===window?document:window.top.document;
  try{if(doc.fullscreenElement)await doc.exitFullscreen();else if(doc.documentElement.requestFullscreen)await doc.documentElement.requestFullscreen();else toast('Trình duyệt này chưa hỗ trợ nút toàn màn hình.');}
  catch{toast('Chưa bật được toàn màn hình trong cửa sổ này. Chị thử mở trực tiếp bản mẫu nhé.');}
};

function renderTimer(){
  const remaining=timerDeadline?Math.max(0,timerDeadline-Date.now()):timerRemaining;
  const seconds=Math.ceil(remaining/1000);$('timer-readout').textContent=`${pad(Math.floor(seconds/60))}:${pad(seconds%60)}`;
  $('timer-indicator').hidden=!timerDeadline;$('timer-start').textContent=timerDeadline?'Tạm dừng':timerFinished?'Hẹn lại':timerRemaining<timerMinutes*60000?'Tiếp tục':'Bắt đầu';
  document.querySelectorAll('[data-minutes]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.minutes)===timerMinutes);b.setAttribute('aria-pressed',String(Number(b.dataset.minutes)===timerMinutes));});
}
function updateTimer(){
  if(timerDeadline&&Date.now()>=timerDeadline){timerDeadline=null;timerRemaining=0;timerFinished=true;toast('Đã hết giờ hẹn. Dành một phút nghỉ ngơi, nhà Tí Yang nhé.',10000);$('timer-note').textContent='Đã hết giờ hẹn. Dành một phút nghỉ ngơi, nhà Tí Yang nhé.';}
  if(timerDeadline||$('timer-dialog').open||timerFinished)renderTimer();
}
$('app-timer').onclick=()=>{renderTimer();openDialog('timer-dialog');};
document.querySelectorAll('[data-minutes]').forEach(button=>button.onclick=()=>{timerMinutes=Number(button.dataset.minutes);timerRemaining=timerMinutes*60000;timerDeadline=null;timerFinished=false;$('timer-note').textContent='Thông báo sẽ hiện khi hết giờ, trong lúc trang đang mở.';renderTimer();});
$('timer-start').onclick=()=>{
  if(timerDeadline){timerRemaining=Math.max(0,timerDeadline-Date.now());timerDeadline=null;}
  else{if(timerFinished){timerRemaining=timerMinutes*60000;timerFinished=false;}timerDeadline=Date.now()+timerRemaining;$('timer-note').textContent='Đồng hồ vẫn đếm khi chị đóng khung hẹn giờ này.';}
  renderTimer();
};
$('timer-reset').onclick=()=>{timerDeadline=null;timerRemaining=timerMinutes*60000;timerFinished=false;$('timer-note').textContent='Thông báo sẽ hiện khi hết giờ, trong lúc trang đang mở.';renderTimer();};

// Remember the last focused control (by id, app package or TV action) so focus returns to it after the TV
// reloads the page, e.g. when it closed the launcher to free memory while another app was open.
const focusKey=element=>element.id?`#${element.id}`:element.dataset.package?`[data-package="${element.dataset.package}"]`:element.dataset.tvAction?`[data-tv-action="${element.dataset.tvAction}"]`:'';
document.addEventListener('focusin',event=>{const key=focusKey(event.target);if(key&&!event.target.closest('dialog'))try{localStorage.setItem('nha-minh-last-focus',key);}catch{}});
function rememberedFocus(candidates){
  try{const element=document.querySelector(localStorage.getItem('nha-minh-last-focus')||'');return element&&(!candidates||candidates.includes(element))&&element.getClientRects().length&&!element.closest('[hidden]')?element:null;}catch{return null;}
}
// Spatial navigation for remotes, keyboards and other D-pad input devices.
document.addEventListener('keydown',event=>{
  const focused=document.activeElement;
  if(focused.matches('input[type="checkbox"]')&&event.key==='Enter'){event.preventDefault();focused.click();return;}
  if(focused.tagName==='TEXTAREA'||(focused.tagName==='INPUT'&&!['checkbox','range'].includes(focused.type)))return;
  if(focused.matches('input[type="range"]')&&!['ArrowUp','ArrowDown'].includes(event.key))return;
  if(focused.tagName==='SELECT'&&!['ArrowLeft','ArrowRight'].includes(event.key))return;
  const dialogs=Array.from(document.querySelectorAll('dialog[open]'));
  const activeDialog=dialogs.at(-1);
  // Remote Back (GoBack/BrowserBack on Android TV browsers) closes the open dialog; with none open it is left to the browser.
  if(['Backspace','GoBack','BrowserBack'].includes(event.key)&&activeDialog){event.preventDefault();activeDialog.close();return;}
  // Remote media buttons drive the YouTube music bar.
  const mediaButton={MediaPlayPause:'music-play',MediaPlay:'music-play',MediaPause:'music-play',MediaTrackNext:'music-next',MediaTrackPrevious:'music-prev'}[event.key];
  if(mediaButton){event.preventDefault();const playing=document.body.classList.contains('music-playing');
    if((event.key==='MediaPlay'&&playing)||(event.key==='MediaPause'&&!playing))return;$(mediaButton).click();return;}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  if(activeDialog===$('photo-dialog')&&['ArrowLeft','ArrowRight'].includes(event.key)){
    event.preventDefault();openPhoto(lightboxIndex+(event.key==='ArrowRight'?1:-1));return;
  }
  if(focused.classList.contains('calendar-day')){
    event.preventDefault();const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
    const next=new Date(Date.UTC(calendarYear,calendarMonth-1,Number(focused.dataset.day)+delta));
    if(next.getUTCFullYear()<1900||next.getUTCFullYear()>2100)return;
    calendarYear=next.getUTCFullYear();calendarMonth=next.getUTCMonth()+1;chosenDay=next.getUTCDate();renderCalendar();$('calendar-grid').querySelector(`[data-day="${chosenDay}"]`).focus();return;
  }
  const scope=activeDialog||document;
  const candidates=Array.from(scope.querySelectorAll('button,a[href],input:not([type="file"]),select,summary')).filter(element=>
    !element.disabled&&element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden'&&!element.closest('[hidden]')&&(!element.closest('dialog')||element.closest('dialog')===activeDialog));
  if(!candidates.length)return;event.preventDefault();
  if(!candidates.includes(focused)){(activeDialog?candidates[0]:(rememberedFocus(candidates)||$('photo-reel'))).focus();return;}
  const r=focused.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
  const horizontal=event.key==='ArrowLeft'||event.key==='ArrowRight', positive=event.key==='ArrowRight'||event.key==='ArrowDown';
  let best=null,bestScore=Infinity;
  // Android TV's FocusFinder weighting: the edge gap along the pressed direction counts 13× (squared) against the
  // centre offset across it, so the nearest row wins over a farther element that merely shares the centre line.
  // A candidate must lie wholly past the focused element's edge; only if none does (overlapping layouts) fall back
  // to comparing centres.
  for(const strict of [true,false]){
    for(const element of candidates){if(element===focused)continue;const c=element.getBoundingClientRect(),dx=c.x+c.width/2-x,dy=c.y+c.height/2-y;
      const edge=horizontal?(positive?c.left-r.right:r.left-c.right):(positive?c.top-r.bottom:r.top-c.bottom);
      if(strict?edge<-2:(positive?(horizontal?dx:dy)<8:(horizontal?dx:dy)>-8))continue;
      // Left/Right only move along the same row; at the end of a row focus stays put, as on a TV remote.
      if(horizontal&&Math.min(r.bottom,c.bottom)-Math.max(r.top,c.top)<=0)continue;
      const gap=Math.max(0,edge),minor=horizontal?dy:dx,score=13*gap*gap+minor*minor;if(score<bestScore){bestScore=score;best=element;}}
    if(best)break;
  }
  if(best){best.focus();best.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});}
});

const creditParagraph=document.createElement('p');creditParagraph.append('Ảnh minh họa: ');
demoPhotos.forEach((photo,i)=>{const link=document.createElement('a');link.href=photo.source;link.textContent=photo.author;link.target='_blank';link.rel='noopener noreferrer';creditParagraph.append(link, i===demoPhotos.length-1?' / Unsplash.':', ');});$('photo-credits').append(creditParagraph);
rebuildDots();renderSpread();updateClock();renderTimer();
setInterval(()=>{updateClock();updateTimer();},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateClock();updateTimer();}});

// The official YouTube player remains visible whenever music is playing.
const topPlaylist='PL4fGSI1pDJn4bRKr6tjRWaGlqRg_zY_is';
let musicSelection={kind:'playlist',id:topPlaylist,title:'Top nhạc trẻ thịnh hành'};
let youtubePlayer=null,youtubeReady=false,youtubeApiPromise=null,musicLoading=false;
let loadedMusicKey='',shouldPlayWhenReady=false,musicError=false,skippedInRow=0;
const musicKey=()=>`${musicSelection.kind}:${musicSelection.id}`;
function musicUrl(){return musicSelection.kind==='playlist'?`https://www.youtube.com/playlist?list=${encodeURIComponent(musicSelection.id)}`:`https://www.youtube.com/watch?v=${encodeURIComponent(musicSelection.id)}`;}
function updateMusicState(playing=false){
  document.body.classList.toggle('music-playing',playing);
  $('music-play').setAttribute('aria-pressed',String(playing));
  $('music-play').setAttribute('aria-label',playing?'Tạm dừng nhạc YouTube':'Phát nhạc YouTube');
  $('music-play').querySelector('use').setAttribute('href',playing?'#i-pause':'#i-play');
  $('music-prev').disabled=$('music-next').disabled=!youtubeReady||musicSelection.kind!=='playlist';
}
function youtubeApi(){
  if(window.YT?.Player)return Promise.resolve();
  if(youtubeApiPromise)return youtubeApiPromise;
  youtubeApiPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
    const timeout=setTimeout(()=>{youtubeApiPromise=null;reject(new Error('Chưa kết nối được YouTube. Chị có thể mở danh sách trên YouTube.'));},15000);
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);resolve();};
    script.onerror=()=>{clearTimeout(timeout);youtubeApiPromise=null;reject(new Error('Chưa tải được YouTube. Chị mở bằng nút Top nhạc YouTube nhé.'));};
    document.head.append(script);
  });return youtubeApiPromise;
}
function readVideoInfo(){
  if(!youtubeReady)return;
  try{const data=youtubePlayer.getVideoData();
    if(data?.title){$('music-title').textContent=data.title;$('music-title').title=data.title;}
    if(data?.author)$('music-subtitle').textContent=data.author;
  }catch{}
}
// IFrame API error codes: 2 bad id, 5 HTML5 player, 100 removed/private, 101/150 owner disallows embedding.
function youtubeErrorText(code){
  if(code===101||code===150)return 'Chủ video không cho phát nhúng ngoài YouTube. ';
  if(code===100)return 'Video đã bị xóa hoặc để riêng tư. ';
  if(code===2)return 'Link video chưa đúng. ';
  return 'Video chưa phát được tại đây. ';
}
// Live streams report a duration that keeps growing with the stream, so show TRỰC TIẾP instead of a time.
function isLiveVideo(){try{return Boolean(youtubePlayer.getVideoData()?.isLive);}catch{return false;}}
function loadMusicSelection(){
  if(!youtubeReady)return;
  loadedMusicKey=musicKey();musicError=false;
  if(musicSelection.kind==='playlist')youtubePlayer.loadPlaylist({list:musicSelection.id,listType:'playlist',index:0});
  else youtubePlayer.loadVideoById(musicSelection.id);
  $('youtube-status').textContent='Nhấn Play trên video nếu trình duyệt chưa tự phát.';
}
async function playMusic(){
  if(musicLoading)return;
  $('youtube-widget').hidden=false;document.body.classList.add('music-active');
  if(youtubePlayer&&youtubeReady){
    if(loadedMusicKey!==musicKey())loadMusicSelection();
    else if(youtubePlayer.getPlayerState()===1)youtubePlayer.pauseVideo();
    else youtubePlayer.playVideo();return;
  }
  musicLoading=true;shouldPlayWhenReady=true;$('youtube-status').textContent='Đang kết nối YouTube…';
  try{
    await youtubeApi();
    const initialMusicKey=musicKey();
    const options={width:'100%',height:200,host:'https://www.youtube-nocookie.com',playerVars:{playsinline:1,controls:1,origin:window.location.origin,rel:0},events:{
      onReady:()=>{youtubeReady=true;musicLoading=false;loadedMusicKey=initialMusicKey;updateMusicState(false);if(shouldPlayWhenReady){if(loadedMusicKey!==musicKey())loadMusicSelection();else youtubePlayer.playVideo();}$('youtube-status').textContent='Nhấn Play trên video nếu trình duyệt chưa tự phát.';},
      onStateChange:event=>{const playing=event.data===1;if(playing){musicError=false;skippedInRow=0;}updateMusicState(playing);readVideoInfo();if(playing)$('youtube-status').textContent='Đang phát trên YouTube';else if(event.data===2)$('youtube-status').textContent='Đã tạm dừng';else if(event.data===3)$('youtube-status').textContent='Đang tải nhạc…';},
      onError:event=>{musicLoading=false;if(musicSelection.kind==='playlist'&&[100,101,150].includes(event.data)&&skippedInRow<5){skippedInRow++;$('youtube-status').textContent='Bài này không phát nhúng được, chuyển bài tiếp…';setTimeout(()=>youtubePlayer.nextVideo(),800);return;}musicError=true;updateMusicState(false);$('music-elapsed').textContent='0:00';$('music-duration').textContent='—';$('music-seek').value=0;$('youtube-status').replaceChildren();const label=document.createTextNode(youtubeErrorText(event.data)),link=document.createElement('a');link.href=musicUrl();link.target='_blank';link.rel='noopener noreferrer';link.textContent='Mở trên YouTube ↗';link.style.textDecoration='underline';$('youtube-status').append(label,link);},
      onAutoplayBlocked:()=>{$('youtube-status').textContent='Chị nhấn nút Play ngay trong video để bắt đầu nhé.';updateMusicState(false);}
    }};
    if(musicSelection.kind==='playlist'){options.playerVars.listType='playlist';options.playerVars.list=musicSelection.id;}else options.videoId=musicSelection.id;
    youtubePlayer=new window.YT.Player('youtube-player',options);
  }catch(error){musicLoading=false;updateMusicState(false);$('youtube-status').textContent=error.message;toast(error.message,6500);}
}
function chooseMusic(selection){
  musicSelection=selection;$('music-title').textContent=selection.title;$('music-title').title=selection.title;
  $('music-subtitle').textContent=selection.kind==='playlist'?'Danh sách phát YouTube':'Video trên YouTube';
  $('music-elapsed').textContent='0:00';$('music-duration').textContent='—';$('music-seek').value=0;$('music-dialog').close();
  if(youtubeReady){$('youtube-widget').hidden=false;document.body.classList.add('music-active');loadMusicSelection();}
  else playMusic();
}
['music-choose','music-library'].forEach(id=>$(id).onclick=()=>openDialog('music-dialog'));
$('music-play').onclick=playMusic;
$('music-prev').onclick=()=>{if(youtubeReady&&musicSelection.kind==='playlist')youtubePlayer.previousVideo();};
$('music-next').onclick=()=>{if(youtubeReady&&musicSelection.kind==='playlist')youtubePlayer.nextVideo();};
$('close-youtube').onclick=()=>{shouldPlayWhenReady=false;if(youtubeReady)youtubePlayer.pauseVideo();$('youtube-widget').hidden=true;document.body.classList.remove('music-active');updateMusicState(false);};
document.querySelectorAll('[data-music]').forEach(button=>button.onclick=()=>chooseMusic(button.dataset.music==='top'?{kind:'playlist',id:topPlaylist,title:'Top nhạc trẻ thịnh hành'}:{kind:'video',id:'7NOSDKb0HlU',title:'Chillhop Radio · Nhạc thư giãn'}));
$('youtube-link-form').onsubmit=event=>{
  event.preventDefault();let url;try{url=new URL($('youtube-link').value.trim());}catch{toast('Chị dán đường link YouTube đầy đủ nhé.');return;}
  const host=url.hostname.toLowerCase().replace(/^www\./,'');let id,kind;
  if(host==='youtu.be'){id=url.pathname.split('/').filter(Boolean)[0];kind='video';}
  else if(['youtube.com','m.youtube.com','music.youtube.com'].includes(host)){
    if(url.searchParams.get('list')){id=url.searchParams.get('list');kind='playlist';}
    else{id=url.searchParams.get('v')||url.pathname.match(/^\/(?:live|shorts|embed)\/([^/?]+)/)?.[1];kind='video';}
  }
  if(!id||!((kind==='video'&&/^[a-zA-Z0-9_-]{11}$/.test(id))||(kind==='playlist'&&/^[a-zA-Z0-9_-]{10,100}$/.test(id)))){toast('Link chưa đúng. Chị dùng link bài hát hoặc playlist trên YouTube nhé.');return;}
  chooseMusic({kind,id,title:kind==='playlist'?'Playlist của nhà Tí Yang':'Bài hát của nhà Tí Yang'});
};
const musicTime=seconds=>`${Math.floor(seconds/60)}:${pad(Math.floor(seconds%60))}`;
setInterval(()=>{
  if(!youtubeReady||musicError||$('youtube-widget').hidden)return;
  try{const duration=youtubePlayer.getDuration(),current=youtubePlayer.getCurrentTime();
    if(!Number.isFinite(current)||!Number.isFinite(duration))return;
    if(isLiveVideo()){$('music-elapsed').textContent='●';$('music-duration').textContent='TRỰC TIẾP';$('music-seek').disabled=true;$('music-seek').value=100;return;}
    $('music-elapsed').textContent=musicTime(current);$('music-duration').textContent=duration>0?musicTime(duration):'TRỰC TIẾP';
    $('music-seek').disabled=duration<=0;if(duration>0)$('music-seek').value=String(Math.min(100,current/duration*100));
  }catch{}
},1000);
$('music-seek').oninput=event=>{if(youtubeReady){const duration=youtubePlayer.getDuration();if(duration>0)youtubePlayer.seekTo(Number(event.target.value)*duration/100,true);}};
updateMusicState(false);
readStoredPhotos().then(stored=>{
  if(Array.isArray(stored)&&stored.length&&stored.every(p=>typeof p.src==='string'&&p.src.startsWith('data:image/')&&typeof p.caption==='string')){
    photos=stored.slice(0,24);customPhotos=true;spreadIndex=0;rebuildDots();renderSpread();
  }
}).catch(()=>{});

// Inside the Nhà Tí Yang TV app the window.TiYangTV bridge exists: tiles open the real apps on the TV.
// A tile whose app is missing hides itself, unless it has a Play Store query to install it from.
const tvBridge=window.TiYangTV;
if(tvBridge){
  document.body.classList.add('tv-launcher');
  const appTiles=Array.from(document.querySelectorAll('.app-dock [data-package],.app-dock [data-app-label]'));
  const tileName=tile=>tile.textContent.replace('↗','').trim();
  const refreshAppTiles=()=>appTiles.forEach(tile=>{
    const installed=tile.dataset.package?tvBridge.isInstalled(tile.dataset.package):tvBridge.hasAppLabeled(tile.dataset.appLabel);
    tile.hidden=!installed&&!tile.dataset.storeQuery;
  });
  appTiles.forEach(tile=>{
    tile.setAttribute('aria-label',`Mở ${tileName(tile)}`);
    tile.addEventListener('click',event=>{
      event.preventDefault();
      const opened=tile.dataset.package?tvBridge.launchApp(tile.dataset.package):tvBridge.launchByLabel(tile.dataset.appLabel);
      if(opened)return;
      if(tile.dataset.storeQuery){tvBridge.openStoreSearch(tile.dataset.storeQuery);toast(`TV chưa có ${tileName(tile)}, mở Play Store để cài.`);}
      else toast(`Chưa mở được ${tileName(tile)}.`);
    });
  });
  document.querySelectorAll('[data-tv-action]').forEach(tile=>{
    tile.hidden=false;
    tile.onclick=()=>{if(!(tile.dataset.tvAction==='inputs'?tvBridge.openInputs():tvBridge.openTvSettings()))toast('TV chưa mở được mục này.');};
  });
  refreshAppTiles();
  // The family album lives only inside the TV app (never on the public site): use it when this build has one.
  try{
    const album=JSON.parse(tvBridge.familyAlbum?.()||'null');
    if(album?.photos?.length&&album.spreads?.length){
      basePhotos=album.photos.map(photo=>({...photo,src:`https://appassets.androidplatform.net/family/${photo.file}`}));
      baseSpreads=album.spreads;familyAlbum=true;
      if(!customPhotos){photos=[...basePhotos];spreadIndex=0;rebuildDots();renderSpread();renderGallery();}
    }
  }catch{}
  // As the TV's home screen, start with focus on a control so the first remote press already moves it.
  (rememberedFocus()||appTiles.find(tile=>!tile.hidden))?.focus();
  // Coming back from Play Store or another app: an app may have been installed or removed meanwhile.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAppTiles();});
}
}
