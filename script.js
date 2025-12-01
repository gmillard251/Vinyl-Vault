// Splash Screen Logic
const splash = document.getElementById("splash");
const app = document.getElementById("app");

// Hide splash and show app on click
splash.addEventListener("click", () => {
  splash.style.display = "none";
  app.classList.remove("hidden");
});

// Data Storage and Vinyl Management
let shelves = 6;
const shelfGrid = document.getElementById("shelfGrid");
const shelfSelect = document.getElementById("shelfSelect");
let vinyls = JSON.parse(localStorage.getItem("vinyls") || "[]");

// Build Shelves
function buildShelves() {
  shelfGrid.innerHTML = "";
  shelfSelect.innerHTML = "";

  for (let i = 1; i <= shelves; i++) {
    const box = document.createElement("div");
    box.classList.add("shelf-box");

    box.innerHTML = `
      <div class="spines">
        <div class="spine"></div>
        <div class="spine"></div>
        <div class="spine"></div>
        <div class="spine"></div>
      </div>
    `;

    const hasNew = vinyls.some(v => v.shelf === i && v.new === true);
    if (hasNew) {
      const tag = document.createElement("div");
      tag.classList.add("new-tag");
      tag.textContent = "NEW";
      box.appendChild(tag);
    }

    box.addEventListener("click", () => openShelf(i));
    shelfGrid.appendChild(box);
    shelfSelect.innerHTML += `<option>Shelf ${i}</option>`;
  }
}

// Add Vinyl
document.getElementById("addBtn").addEventListener("click", () => {
  const artist = document.getElementById("artistInput").value.trim();
  const album = document.getElementById("albumInput").value.trim();
  const shelfNumber = parseInt(shelfSelect.value.replace("Shelf ", ""));
  const category = document.getElementById("categorySelect").value;

  if (!artist || !album) return;

  vinyls.push({
    artist,
    album,
    shelf: shelfNumber,
    category,
    new: true,
  });

  localStorage.setItem("vinyls", JSON.stringify(vinyls));
  buildShelves();
});

// Reset Displays
document.getElementById("resetDisplaysBtn").addEventListener("click", () => {
  document.getElementById("display1"

