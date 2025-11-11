console.log("SCRIPT.JS VERSION 5.0 --- LEFT/RIGHT PANEL LOGIC ---");

// ==== CONFIG ====
const rows = 20, cols = 30;
const grid = document.getElementById("grid");
let cells = [];
const start = [0, 0];
const end = [rows - 1, cols - 1];

// ==== PRIORITY QUEUE (MIN-HEAP) ====
class PriorityQueue {
  constructor() {
    this.values = [];
  }

  push(element, priority) {
    this.values.push({ element, priority });
    this.bubbleUp();
  }

  bubbleUp() {
    let idx = this.values.length - 1;
    const element = this.values[idx];
    while (idx > 0) {
      let parentIdx = Math.floor((idx - 1) / 2);
      let parent = this.values[parentIdx];
      if (element.priority >= parent.priority) break;
      this.values[parentIdx] = element;
      this.values[idx] = parent;
      idx = parentIdx;
    }
  }

  pop() {
    const min = this.values[0];
    const end = this.values.pop();
    if (this.values.length > 0) {
      this.values[0] = end;
      this.sinkDown();
    }
    return min.element;
  }

  sinkDown() {
    let idx = 0;
    const length = this.values.length;
    const element = this.values[0];
    while (true) {
      let leftChildIdx = 2 * idx + 1;
      let rightChildIdx = 2 * idx + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.values[leftChildIdx];
        if (leftChild.priority < element.priority) {
          swap = leftChildIdx;
        }
      }
      if (rightChildIdx < length) {
        rightChild = this.values[rightChildIdx];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIdx;
        }
      }
      if (swap === null) break;
      this.values[idx] = this.values[swap];
      this.values[swap] = element;
      idx = swap;
    }
  }

  isEmpty() {
    return this.values.length === 0;
  }
}

// ==== BUILD GRID ====
grid.style.gridTemplateColumns = `repeat(${cols}, 20px)`;
for (let r = 0; r < rows; r++) {
  cells[r] = [];
  for (let c = 0; c < cols; c++) {
    const div = document.createElement("div");
    div.classList.add("cell");
    grid.appendChild(div);
    cells[r][c] = { el: div, r, c, wall: false };
  }
}
cells[start[0]][start[1]].el.classList.add("start");
cells[start[0]][start[1]].el.textContent = 'S';
cells[end[0]][end[1]].el.classList.add("end");
cells[end[0]][end[1]].el.textContent = 'E';


// ==== UTILITIES ====
function clearAround(r, c) {
  for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) { 
    const nr = r + dr, nc = c + dc;
    if (nr>=0 && nr<rows && nc>=0 && nc<cols) {
      cells[nr][nc].wall = false;
      cells[nr][nc].el.className = "cell";
    }
  }
}
function resetVisuals() {
  for (let r=0;r<rows;r++)
    for (let c=0;c<cols;c++) {
      cells[r][c].el.className = cells[r][c].wall ? "cell wall" : "cell";
      cells[r][c].el.textContent = ''; 
    }
  cells[start[0]][start[1]].el.classList.add("start");
  cells[start[0]][start[1]].el.textContent = 'S';
  cells[end[0]][end[1]].el.classList.add("end");
  cells[end[0]][end[1]].el.textContent = 'E';

  document.getElementById("visited-count").textContent = '0';
  document.getElementById("path-count").textContent = '0';
}

// ==== MAZE GENERATION ====
function generateMaze() {
  for (let r=0;r<rows;r++) {
    for (let c=0;c<cols;c++) {
      const cell = cells[r][c];
      cell.el.textContent = ''; 
      if ((r===start[0]&&c===start[1])||(r===end[0]&&c===end[1])) {
        cell.wall=false; cell.el.className="cell"; continue;
      }
      // Set wall probability to a reasonable 0.3
      if (Math.random() < 0.45) {
        cell.wall=true; cell.el.className="cell wall";
      } else {
        cell.wall=false; cell.el.className="cell";
      }
    }
  }
  clearAround(...start);
  clearAround(...end);
  cells[start[0]][start[1]].el.classList.add("start");
  cells[start[0]][start[1]].el.textContent = 'S';
  cells[end[0]][end[1]].el.classList.add("end");
  cells[end[0]][end[1]].el.textContent = 'E';
}

// ==== SIMPLE BFS CHECK (for solvability) ====
function solvable() {
  const q=[[...start]];
  const visited=Array.from({length:rows},()=>Array(cols).fill(false));
  visited[start[0]][start[1]]=true;
  while(q.length){
    const [r,c]=q.shift();
    if(r===end[0]&&c===end[1]) return true;
    
    for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){ // Corrected
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited[nr][nc]&&!cells[nr][nc].wall){
        visited[nr][nc]=true; q.push([nr,nc]);
      }
    }
  }
  return false;
}

// ==== A* ALGORITHM (visual) ====
function heuristic(a,b){return Math.abs(a.r-b.r)+Math.abs(a.c-b.c);}
function neighbors(n){
  const out=[];
  
  for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){ // Corrected
    const nr=n.r+dr,nc=n.c+dc;
    if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!cells[nr][nc].wall)
      out.push(cells[nr][nc]);
  }
  return out;
}

async function aStarVisual(){
  const speedSlider = document.getElementById("speed-slider");
  const delay = 101 - parseInt(speedSlider.value);
  
  const s=cells[start[0]][start[1]], e=cells[end[0]][end[1]];
  
  const open = new PriorityQueue(); 
  const openSet = new Set([s]);     
  const came=new Map();
  const g=new Map([[s,0]]);
  const f=new Map([[s,heuristic(s,e)]]);

  open.push(s, f.get(s)); 
  const visited=new Set();
  
  let visitedCounter = 0; 

  while(!open.isEmpty()){
    const cur = open.pop();   
    openSet.delete(cur);      

    if(cur===e){
      await drawPath(came,cur);
      return true;
    }

    visited.add(cur);
    if(!cur.el.classList.contains("start")&&!cur.el.classList.contains("end")){
      cur.el.classList.add("visited");
      
      visitedCounter++;
      document.getElementById("visited-count").textContent = visitedCounter;
      
      await new Promise(r=>setTimeout(r, delay)); 
    }

    for(const nb of neighbors(cur)){
      const tg = g.get(cur) + 1;
      
      if(tg < (g.get(nb) || Infinity)){
        came.set(nb,cur);
        g.set(nb,tg);
        f.set(nb,tg+heuristic(nb,e));
        
        if(!openSet.has(nb)){ 
          open.push(nb, f.get(nb)); 
          openSet.add(nb);          
        }
      }
    }
  }
  alert("No path found!");
  return false;
}

// ==== DRAW PATH ====
async function drawPath(came,cur){
  const speedSlider = document.getElementById("speed-slider");
  const delay = (101 - parseInt(speedSlider.value)) + 10; 

  const path=[];
  while(came.has(cur)){
    cur=came.get(cur);
    if(cur===cells[start[0]][start[1]]) break;
    path.push(cur);
  }

  document.getElementById("path-count").textContent = path.length;

  for(let i=path.length-1;i>=0;i--){
    const n=path[i];
    if(!n.el.classList.contains("start")&&!n.el.classList.contains("end")){
      n.el.classList.remove("visited");
      n.el.classList.add("path");
      await new Promise(r=>setTimeout(r, delay)); 
    }
  }
}

// ==== BUTTONS ====
async function generateSolvableMaze(){
  document.getElementById("generate").disabled = true;
  document.getElementById("solve").disabled = true;
  document.getElementById("speed-slider").disabled = true; 

  let tries=0;
  do{generateMaze(); tries++;}while(!solvable()&&tries<200);
  console.log(`✅ Solvable maze generated in ${tries} tries`);
  resetVisuals(); 

  document.getElementById("generate").disabled = false;
  document.getElementById("solve").disabled = false;
  document.getElementById("speed-slider").disabled = false; 
}
document.getElementById("generate").onclick=generateSolvableMaze;

document.getElementById("solve").onclick=async()=>{
  document.getElementById("generate").disabled = true;
  document.getElementById("solve").disabled = true;
  document.getElementById("speed-slider").disabled = true; 

  resetVisuals(); 
  await aStarVisual();

  document.getElementById("generate").disabled = false;
  document.getElementById("solve").disabled = false;
  document.getElementById("speed-slider").disabled = false; 
};

// ==== THEME TOGGLE LOGIC ====
(function () {
  const themeToggle = document.getElementById("theme-toggle");

  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
      themeToggle.checked = true;
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
      themeToggle.checked = false;
    }
  }

  themeToggle.addEventListener("change", () => {
    setTheme(themeToggle.checked);
  });

  // Check for saved theme on load
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme === "dark") {
    setTheme(true);
  } else if (savedTheme === "light") {
    setTheme(false);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    // If no theme saved, respect OS preference
    setTheme(true);
  } else {
    setTheme(false);
  }
})();


// ==== INFO PANEL LOGIC (Updated for Left/Right) ====
(function() {
  // 1. Define Content
  const infoContent = {
    whatIsAstar: `
      <h3>What is A* (A-Star)?</h3>
      <p>A* is one of the most popular and efficient pathfinding algorithms. Its goal is to find the <strong>shortest path</strong> between a start node and an end node.</p>
      <p>It's known as an "informed" search algorithm because it uses a <strong>heuristic</strong> (an educated guess) to guide its search in the right direction.</p>
      <h4>The A* Formula: <code>f(n) = g(n) + h(n)</code></h4>
      <p>At every step, A* prioritizes the node with the lowest "f-score":</p>
      <ul>
        <li><code><strong>g(n)</strong></code>: The <strong>actual cost</strong> of the path from the start node to the current node <code>n</code>. (In our maze, this is the "Path Length").</li>
        <li><code><strong>h(n)</strong></code>: The <strong>estimated (heuristic) cost</strong> from the current node <code>n</code> to the end node. A good heuristic is optimistic—it never overestimates the real cost. (We use the "Manhattan Distance").</li>
      </ul>
      <p>By combining these, A* avoids exploring paths that are already long (high <code>g(n)</code>) or are heading in the wrong direction (high <code>h(n)</code>).</p>
    `,
    astarVsDijkstra: `
      <h3>A* vs. Dijkstra's</h3>
      <p>Both A* and Dijkstra's Algorithm are famous for finding the shortest path. The main difference is how "smart" they are.</p>
      
      <h4>Dijkstra's Algorithm (The "Blind" Search)</h4>
      <p>Dijkstra's is an "uninformed" search. It only cares about one thing: the actual cost from the start (<code>g(n)</code>).</p>
      <ul>
        <li>It works by expanding outwards from the start like a ripple in a pond.</li>
        <li>It explores *every* node in order of its distance from the start, with no idea if it's moving toward or away from the goal.</li>
        <li>It's guaranteed to find the shortest path, but it wastes a lot of time exploring useless nodes.</li>
      </ul>
      
      <h4>A* Algorithm (The "Smart" Search)</h4>
      <p>A* is an "informed" search. It uses both the real cost (<code>g(n)</code>) and a "guess" (<code>h(n)</code>) to find the goal.</p>
      <ul>
        <li>It's like driving with a GPS or a compass. It prioritizes paths that are *both* efficient and moving in the general direction of the target.</li>
        <li>This allows it to find the same shortest path as Dijkstra's, but by exploring <strong>far fewer nodes</strong> (as you can see by the blue "Visited" squares).</li>
      </ul>

      <p><strong>The Punchline:</strong> Dijkstra's Algorithm is just A* with a heuristic of <code>h(n) = 0</code>. By having no "guess," it's forced to explore everything.</p>
    `
  };

  // 2. Get DOM Elements
  const astarBtn = document.getElementById("what-is-astar");
  const dijkstraBtn = document.getElementById("astar-vs-dijkstra");
  
  // --- UPDATED: Target new left/right panels ---
  const astarContent = document.getElementById("info-panel-left");
  const dijkstraContent = document.getElementById("info-panel-right");

  // 3. Inject Content
  astarContent.innerHTML = infoContent.whatIsAstar;
  dijkstraContent.innerHTML = infoContent.astarVsDijkstra;

  // 4. Add Event Listeners
  astarBtn.addEventListener('click', () => {
    // Toggle this panel
    const isHidden = astarContent.classList.toggle("hidden");
    astarBtn.classList.toggle("active", !isHidden);

    // Hide the other panel
    dijkstraContent.classList.add("hidden");
    dijkstraBtn.classList.remove("active");
  });
  
  dijkstraBtn.addEventListener('click', () => {
    // Toggle this panel
    const isHidden = dijkstraContent.classList.toggle("hidden");
    dijkstraBtn.classList.toggle("active", !isHidden);

    // Hide the other panel
    astarContent.classList.add("hidden");
    astarBtn.classList.remove("active");
  });

})();

