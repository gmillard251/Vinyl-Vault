// ===== Data & storage keys =====
const STORAGE_VINYLS = 'vinyls_v1';
const STORAGE_DISPLAYS = 'displayBoxes_v1';
const STORAGE_ORDER = 'customOrder_v1';

let shelves = 4;

// Load state or initialise
let vinyls = JSON.parse(localStorage.getItem(STORAGE_VINYLS) || '[]');
let displayBoxes = JSON.parse(localStorage.getItem(STORAGE_DISPLAYS) || '["Display Box 1","Display Box 2"]');
let customOrder = JSON.parse(localStorage.getItem(STORAGE_ORDER) || '{}');

// DOM refs
const mainContainer = document.getElementById('mainContainer');
const shelfSelect = document.getElementById('shelfSelect');
const addBtn = document.getElementById('addBtn');
const artistInput = document.getElementById('artist');
const albumInput = document.getElementById('album');
const categorySelect = document.getElementById('categorySelect');

const shelvesBtn = document.getElementById('shelvesBtn');
const collectionBtn = document.getElementById('collectionBtn');
const resetDisplaysBtn = document.getElementById('resetDisplaysBtn');

// wire buttons
shelvesBtn.addEventListener('click', showShelves);
collectionBtn.addEventListener('click', showCollection);
resetDisplaysBtn.addEventListener('click', resetDisplayBoxes);
addBtn.addEventListener('click', addRecord);

// startup
populateShelfSelect();
showShelves();
renderDisplayBoxes();

// ===== Helpers =====
function saveAll(){
  localStorage.setItem(STORAGE_VINYLS, JSON.stringify(vinyls));
  localStorage.setItem(STORAGE_DISPLAYS, JSON.stringify(displayBoxes));
  localStorage.setItem(STORAGE_ORDER, JSON.stringify(customOrder));
}

function uid() {
  // simple unique id
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

// ===== Display boxes =====
function renderDisplayBoxes(){
  document.getElementById('displayBox0').textContent = displayBoxes[0] || 'Display Box 1';
  document.getElementById('displayBox1').textContent = displayBoxes[1] || 'Display Box 2';
}

function setDisplayById(boxIndex, vinylId){
  const v = vinyls.find(x => x.id === vinylId);
  if (!v) return;
  displayBoxes[boxIndex] = `${v.album} — ${v.artist}`;
  saveAll();
  renderDisplayBoxes();
}

function resetDisplayBoxes(){
  displayBoxes = ['Display Box 1','Display Box 2'];
  saveAll();
  renderDisplayBoxes();
}

// ===== Shelves UI =====
function populateShelfSelect(){
  shelfSelect.innerHTML = '';
  for(let i=1;i<=shelves;i++){
    const opt = document.createElement('option'); opt.value = i; opt.textContent = `Shelf ${i}`;
    shelfSelect.appendChild(opt);
  }
}

function showShelves(){
  mainContainer.innerHTML = '';
  for(let i=1;i<=shelves;i++){
    const div = document.createElement('div');
    div.className = 'shelfSquare';
    div.textContent = `Shelf ${i}`;
    div.addEventListener('click', ()=> openShelf(i));
    mainContainer.appendChild(div);
  }
}

// ===== Open shelf (shows controls for alpha/custom) =====
function openShelf(shelfNum){
  mainContainer.innerHTML = `<h2>Shelf ${shelfNum}</h2>`;
  const controls = document.createElement('div');
  controls.innerHTML = `
    <button id="alphaBtn">Alphabetical</button>
    <button id="customBtn">Custom order</button>
    <button id="backBtn">Back</button>
  `;
  mainContainer.appendChild(controls);

  document.getElementById('alphaBtn').addEventListener('click', ()=> renderShelfList(shelfNum,'alpha'));
  document.getElementById('customBtn').addEventListener('click', ()=> {
    // ensure custom order exists
    if(!customOrder[shelfNum]){
      customOrder[shelfNum] = vinyls.filter(v=>v.shelf==shelfNum).map(v=>v.id);
      saveAll();
    }
    renderShelfList(shelfNum,'custom');
  });
  document.getElementById('backBtn').addEventListener('click', showShelves);

  renderShelfList(shelfNum,'alpha'); // default view
}

function renderShelfList(shelfNum, mode){
  // clear any previous list (but keep header/controls)
  // remove elements after the first child (h2 and controls)
  while(mainContainer.childNodes.length > 1){
    mainContainer.removeChild(mainContainer.lastChild);
  }

  const list = vinyls.filter(v => v.shelf == shelfNum);
  let toShow = [];

  if(mode === 'alpha'){
    toShow = [...list].sort((a,b)=> a.album.localeCompare(b.album));
  } else {
    const order = customOrder[shelfNum] || list.map(x=>x.id);
    toShow = order.map(id => list.find(x=>x.id===id)).filter(Boolean);
  }

  const container = document.createElement('div');
  container.className = 'vinylList';

  if(toShow.length === 0){
    const p = document.createElement('p'); p.textContent = 'No vinyls in this shelf.';
    container.appendChild(p);
  } else {
    toShow.forEach((v, idx) => {
      const item = document.createElement('div');
      item.className = `vinylItem category-${v.personalCategory || 'other'}`;
      // safe buttons: pass id (string) not text
      item.innerHTML = `
        <strong>${escapeHtml(v.album)}</strong><br>
        ${escapeHtml(v.artist)}<br>
      `;

      const btnSet1 = document.createElement('button'); btnSet1.textContent = 'Set Display 1';
      btnSet1.addEventListener('click', ()=> setDisplayById(0, v.id));
      const btnSet2 = document.createElement('button'); btnSet2.textContent = 'Set Display 2';
      btnSet2.addEventListener('click', ()=> setDisplayById(1, v.id));

      item.appendChild(btnSet1); item.appendChild(btnSet2);

      if(mode === 'custom'){
        // move up / down controls using customOrder array
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

// move an item inside customOrder by id
function moveCustom(shelfNum, vinylId, delta){
  if(!customOrder[shelfNum]){
    customOrder[shelfNum] = vinyls.filter(v=>v.shelf==shelfNum).map(v=>v.id);
  }
  const arr = customOrder[shelfNum];
  const i = arr.indexOf(vinylId);
  if(i === -1) return;
  const target = i + delta;
  if(target < 0 || target >= arr.length) return;
  [arr[i], arr[target]] = [arr[target], arr[i]];
  customOrder[shelfNum] = arr;
  saveAll();
  renderShelfList(shelfNum,'custom');
}

// ===== Full collection view =====
function showCollection(){
  mainContainer.innerHTML = '<h2>Full collection</h2>';
  if(vinyls.length === 0){
    mainContainer.innerHTML += '<p>No vinyls yet.</p>';
    return;
  }
  const container = document.createElement('div');
  container.className = 'vinylList';
  vinyls.forEach(v=>{
    const item = document.createElement('div');
    item.className = `vinylItem category-${v.personalCategory || 'other'}`;
    item.innerHTML = `<strong>${escapeHtml(v.album)}</strong><br>${escapeHtml(v.artist)}<br>Shelf ${v.shelf}`;
    container.appendChild(item);
  });
  mainContainer.appendChild(container);
}

// ===== Add & delete =====
function addRecord(){
  const artist = (artistInput.value || '').trim();
  const album = (albumInput.value || '').trim();
  const shelf = (shelfSelect.value || '1');
  const category = (categorySelect.value || 'other');

  if(!artist || !album) { alert('Please enter both artist and album'); return; }

  const newVinyl = { id: uid(), artist, album, shelf, personalCategory: category };
  vinyls.push(newVinyl);
  saveAll();

  // update possible customOrder arrays for the shelf (append to end)
  if(customOrder[shelf]) customOrder[shelf].push(newVinyl.id);

  artistInput.value = '';
  albumInput.value = '';

  showShelves();
}

// optional: delete by id (not exposed in UI now, but kept for future)
function deleteById(id){
  vinyls = vinyls.filter(v=>v.id !== id);
  // remove from any custom orders
  Object.keys(customOrder).forEach(key=>{
    customOrder[key] = customOrder[key].filter(x=>x !== id);
  });
  saveAll();
  showShelves();
}

// ===== Utilities =====
function escapeHtml(str){
  return String(str).replace(/[&<>"'`]/g, s=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;', '`':'&#96;'
  })[s]);
}
