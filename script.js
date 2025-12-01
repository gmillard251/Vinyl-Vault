/* Vinyl Vault v2
   - Responsive auto-fill shelves
   - NEW tag persists until shelf opened
   - Display boxes, reset, collection view
   - Custom order (move up/down) and alphabetical view
   - Spines drawn in CSS, no images required
*/

// storage keys
const K_VINYLS = 'vv_vinyls_v2';
const K_DISPLAYS = 'vv_displays_v2';
const K_ORDER = 'vv_order_v2';

let shelves = 6; // number of shelves (you can change)
let vinyls = JSON.parse(localStorage.getItem(K_VINYLS) || '[]');
let displays = JSON.parse(localStorage.getItem(K_DISPLAYS) || '["Display Box 1","Display Box 2"]');
let customOrder = JSON.parse(localStorage.getItem(K_ORDER) || '{}');

// DOM refs
const mainContainer = document.getElementById('mainContainer');
const shelfSelect = document.getElementById('shelfSelect');
const addBtn = document.getElementById('addBtn');
const artistInput = document.getElementById('artist');
const albumInput = document.getElementById('album');
const categorySelect = document.getElementById('categorySelect');
const columnsSelect = document.getElementById('columnsSelect');

document.getElementById('shelvesBtn').addEventListener('click', showShelves);
document.getElementById('fullCollectionBtn').addEventListener('click', showCollection);
document.getElementById('collectionBtn').addEventListener('click', showCollection);
document.getElementById('resetDisplaysBtn').addEventListener('click', resetDisplays);
addBtn.addEventListener('click', addRecord);
columnsSelect.addEventListener('change', ()=> { document.querySelector('.shelvesGrid').style.gridTemplateColumns = `repeat(${columnsSelect.value}, 1fr)`; });

window.addEventListener('load', ()=> {
  populateShelfSelect();
  renderDisplays();
  showShelves();
  // apply grid columns default from control
  document.querySelector('.shelvesGrid').style.gridTemplateColumns = `repeat(${columnsSelect.value}, 1fr)`;
});

// util: save
function saveAll(){
  localStorage.setItem(K_VINYLS, JSON.stringify(vinyls));
  localStorage.setItem(K_DISPLAYS, JSON.stringify(displays));
  localStorage.setItem(K_ORDER, JSON.stringify(customOrder));
}

// uid
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

// Render display boxes
function renderDisplays(){
  document.getElementById('displayBox0').textContent = displays[0] || 'Display Box 1';
  document.getElementById('displayBox1').textContent = displays[1] || 'Display Box 2';
}

// reset displays
function resetDisplays(){
  displays = ['Display Box 1','Display Box 2'];
  saveAll();
  renderDisplays();
}

// populate shelf select
function populateShelfSelect(){
  shelfSelect.innerHTML = '';
  for(let i=1;i<=shelves;i++){
    const opt = document.createElement('option'); opt.value = i; opt.textContent = `Shelf ${i}`;
    shelfSelect.appendChild(opt);
  }
}

// show shelves grid (auto-fill responsive)
function showShelves(){
  mainContainer.innerHTML = '';
  // create shelf tiles
  for(let i=1;i<=shelves;i++){
    const tile = document.createElement('div');
    tile.className = 'shelfSquare';
    tile.onclick = ()=> openShelf(i);

    // spines container
    const spines = document.createElement('div');
    spines.className = 'spines';
    // create three spine bars with slight variability
    const s1 = document.createElement('div'); s1.className = 'spine h1';
    const s2 = document.createElement('div'); s2.className = 'spine h2';
    const s3 = document.createElement('div'); s3.className = 'spine h3';
    spines.appendChild(s1); spines.appendChild(s2); spines.appendChild(s3);

    const label = document.createElement('div'); label.className = 'shelfLabel'; label.textContent = `Shelf ${i}`;

    tile.appendChild(spines);
    tile.appendChild(label);
    mainContainer.appendChild(tile);
  }
}

// open shelf (clears NEW flags in that shelf)
function openShelf(shelfNum){
  // clear NEW flags for shelf items
  let changed = false;
  vinyls.forEach(v => { if(String(v.shelf) === String(shelfNum) && v.isNew){ v.isNew = false; changed = true; } });
  if(changed) saveAll();

  // render header & controls
  mainContainer.innerHTML = `<h2>Shelf ${shelfNum}</h2>`;
  const ctrl = document.createElement('div');
  ctrl.innerHTML = `
    <button id="alphaBtn">Alphabetical</button>
    <button id="customBtn">Custom order</button>
    <button id="backBtn">Back</button>
  `;
  mainContainer.appendChild(ctrl);

  document.getElementById('alphaBtn').addEventListener('click', ()=> renderShelfList(shelfNum,'alpha'));
  document.getElementById('customBtn').addEventListener('click', ()=> {
    // build custom order array if missing
    if(!customOrder[shelfNum]) customOrder[shelfNum] = vinyls.filter(v=>String(v.shelf)===String(shelfNum)).map(v=>v.id);
    renderShelfList(shelfNum,'custom');
  });
  document.getElementById('backBtn').addEventListener('click', showShelves);

  renderShelfList(shelfNum,'alpha');
}

// render shelf list in chosen mode
function renderShelfList(shelfNum, mode){
  // remove previously rendered list nodes (keep first two children header & controls)
  while(mainContainer.childNodes.length > 2) mainContainer.removeChild(mainContainer.lastChild);

  const list = vinyls.filter(v => String(v.shelf) === String(shelfNum));
  let toShow = [];

  if(mode === 'alpha'){
    toShow = [...list].sort((a,b)=> a.album.localeCompare(b.album));
  } else {
    const order = customOrder[shelfNum] || list.map(x=>x.id);
    toShow = order.map(id => list.find(x=>x.id===id)).filter(Boolean);
  }

  const container = document.createElement('div'); container.className = 'vinylList';
  if(toShow.length === 0){
    const p = document.createElement('p'); p.textContent = 'No vinyls in this shelf.';
    container.appendChild(p);
  } else {
    toShow.forEach((v, idx) => {
      const item = document.createElement('div'); item.className = 'vinylItem';
      item.innerHTML = `<div class="meta">${escapeHtml(v.album)} ${v.isNew ? '<span class="newBadge">NEW</span>' : ''}</div>
                        <div>${escapeHtml(v.artist)}</div>`;
      // set display buttons
      const btn1 = document.createElement('button'); btn1.textContent = 'Set Display 1';
      btn1.addEventListener('click', ()=> setDisplayById(0, v.id));
      const btn2 = document.createElement('button'); btn2.textContent = 'Set Display 2';
      btn2.addEventListener('click', ()=> setDisplayById(1, v.id));
      item.appendChild(btn1); item.appendChild(btn2);

      if(mode === 'custom'){
        const up = document.createElement('button'); up.textContent = '↑';
        up.addEventListener('click', ()=> moveCustom(shelfNum, v.id, -1));
        const down = document.createElement('button'); down.textContent = '↓';
        down.addEventListener('click', ()=> moveCustom(shelfNum, v.id, +1));
        item.appendChild(up); item.appendChild(down);
      }

      container.appendChild(item);
    });
  }

  mainContainer.appendChild(container);
}

// set display by vinyl id
function setDisplayById(boxIndex, vId){
  const v = vinyls.find(x=>x.id === vId);
  if(!v) return;
  displays[boxIndex] = `${v.album} — ${v.artist}`;
  saveAll();
  renderDisplays();
}

// move in custom order array
function moveCustom(shelfNum, vId, delta){
  if(!customOrder[shelfNum]) customOrder[shelfNum] = vinyls.filter(v=>String(v.shelf)===String(shelfNum)).map(v=>v.id);
  const arr = customOrder[shelfNum];
  const i = arr.indexOf(vId);
  if(i === -1) return;
  const t = i + delta;
  if(t < 0 || t >= arr.length) return;
  [arr[i], arr[t]] = [arr[t], arr[i]];
  customOrder[shelfNum] = arr;
  saveAll();
  renderShelfList(shelfNum,'custom');
}

// show full collection
function showCollection(){
  mainContainer.innerHTML = '<h2>Full Collection</h2>';
  if(vinyls.length === 0){
    mainContainer.innerHTML += '<p>No vinyls yet.</p>'; return;
  }
  const container = document.createElement('div'); container.className = 'vinylList';
  vinyls.forEach(v=>{
    const item = document.createElement('div'); item.className = 'vinylItem';
    item.innerHTML = `<div class="meta">${escapeHtml(v.album)} ${v.isNew ? '<span class="newBadge">NEW</span>' : ''}</div>
                      <div>${escapeHtml(v.artist)}</div><div>Shelf ${v.shelf}</div>`;
    container.appendChild(item);
  });
  mainContainer.appendChild(container);
}

// add a record (mark as new)
function addRecord(){
  const artist = (artistInput.value || '').trim();
  const album = (albumInput.value || '').trim();
  const shelf = (shelfSelect.value || '1');
  const category = (categorySelect.value || 'other');
  if(!artist || !album){ alert('Enter artist and album'); return; }

  const v = { id: uid(), artist, album, shelf, personalCategory: category, isNew: true };
  vinyls.push(v);
  // append to custom order if exists
  if(customOrder[shelf]) customOrder[shelf].push(v.id);
  saveAll();

  artistInput.value = ''; albumInput.value = '';
  // highlight behavior: NEW badge stays until shelf opened (we set isNew=true)
  showShelves();
}

// helpers
function escapeHtml(s){ return String(s).replace(/[&<>"'`]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[ch])); }

// save
function saveAll(){ localStorage.setItem(K_VINYLS, JSON.stringify(vinyls)); localStorage.setItem(K_DISPLAYS, JSON.stringify(displays)); localStorage.setItem(K_ORDER, JSON.stringify(customOrder)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
