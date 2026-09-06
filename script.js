const DEFAULT_KILLERS = [
"Trapper","Wraith","Hillbilly","Nurse","Huntress","Pig","Spirit","Ghost Face",
"Demogorgon","Deathslinger","Nemesis","Dredge","Mastermind / Wesker","Knight",
"Singularity","Xenomorph","Judgement"
];

const DEFAULT_PRESETS = [
  {name:"NO THOUGHTS, HEAD EMPTY", perks:["Corrupt Intervention","Discordance","Pop Goes the Weasel","Nowhere to Hide"]},
  {name:"THE GENERATOR POLICE", perks:["Deadlock","Call of Brine","Surveillance","Overcharge"]},
  {name:"UH OH! ALL HEXES", perks:["Hex: Ruin","Hex: Undying","Hex: Haunted Ground","Hex: Pentimento"]},
  {name:"I SAW YOU", perks:["Lethal Pursuer","Nowhere to Hide","A Nurse's Calling","I'm All Ears"]},
  {name:"BONK", perks:["Brutal Strength","Enduring","Spirit Fury","Hubris"]},
  {name:"THE HOOK IS RIGHT THERE", perks:["Scourge Hook: Pain Resonance","Scourge Hook: Gift of Pain","Agitation","Iron Grasp"]},
  {name:"SUSPICIOUSLY NORMAL", perks:["Whispers","Sloppy Butcher","Bitter Murmur","Deerstalker"]},
  {name:"RUN, LITTLE GUY", perks:["Bamboozle","Superior Anatomy","Bloodhound","Mindbreaker"]}
];

const messages = {
  win:["HOLY CRAP. YOU WON.","THE MACHINE IS PROUD OF YOU. PROBABLY.","INCREDIBLE. A FUNCTIONAL HUMAN.","+1 KILLER WIN. WE ARE SO BACK.","YOU DID IT!!! THE PIXELS ARE CHEERING."],
  loss:["LMAOOOOOOOOO.","THAT WAS EMBARRASSING. :(","THE MACHINE SAW THAT.","YOU HAVE BEEN PROMOTED TO LOSER.","WOW. VERY IMPRESSIVE. (NEGATIVE)","THE SURVIVORS HAVE FILED A COMPLAINT."],
  random:["THE MACHINE HAS CHOSEN. DO NOT QUESTION IT.","GOOD LUCK LOL.","YOUR FATE HAS BEEN RANDOMIZED.","YOU ASKED FOR THIS."]
};

let data = JSON.parse(localStorage.getItem("killerWinMachine") || "null") || {
  killers: DEFAULT_KILLERS.map(name=>({name,wins:0,losses:0,custom:false})),
  presets: DEFAULT_PRESETS,
  lastBuild:null
};
let selectedIndex = null;

function save(){ localStorage.setItem("killerWinMachine", JSON.stringify(data)); render(); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function rate(k){ const n=k.wins+k.losses; return n ? Math.round(k.wins/n*100) : 0; }
function setMessage(type){ document.getElementById("message").textContent = pick(messages[type]); }

function render(){
  const list=document.getElementById("killerList");
  list.innerHTML="";
  data.killers.forEach((k,i)=>{
    const el=document.createElement("div");
    el.className="killer-card"+(selectedIndex===i?" selected":"")+(k.wins>0?" cleared":"");
    el.innerHTML=`<span class="killer-name">${escapeHTML(k.name)} ${k.custom?'<span class="custom">★</span>':''}</span>
      <span class="killer-record">${k.wins}W / ${k.losses}L · ${rate(k)}%</span>
      <span class="check">${k.wins>0?"✓":""}</span>`;
    el.onclick=()=>selectKiller(i);
    list.appendChild(el);
  });
  const wins=data.killers.reduce((a,k)=>a+k.wins,0), losses=data.killers.reduce((a,k)=>a+k.losses,0);
  const cleared=data.killers.filter(k=>k.wins>0).length;
  document.getElementById("completed").textContent=`${cleared} / ${data.killers.length}`;
  document.getElementById("totalWins").textContent=wins;
  document.getElementById("totalLosses").textContent=losses;
  document.getElementById("overallRate").textContent=(wins+losses?Math.round(wins/(wins+losses)*100):0)+"%";
  renderPresets();
  if(selectedIndex!==null && data.killers[selectedIndex]) updateRecord();
}
function selectKiller(i){
  selectedIndex=i; document.getElementById("detailsPanel").classList.remove("hidden");
  document.getElementById("buildBox").classList.add("hidden"); render();
  document.getElementById("detailsPanel").scrollIntoView({behavior:"smooth",block:"center"});
}
function updateRecord(){
  const k=data.killers[selectedIndex], r=rate(k);
  document.getElementById("selectedKiller").textContent=k.name.toUpperCase();
  document.getElementById("selectedRecord").textContent=`${k.wins} WINS / ${k.losses} LOSSES`;
  document.getElementById("selectedRate").textContent=r+"%";
  document.getElementById("progressBar").style.width=r+"%";
}
function record(type){
  if(selectedIndex===null) return;
  data.killers[selectedIndex][type]++;
  save(); setMessage(type==="wins"?"win":"loss");
}
function randomBuild(){
  if(!data.presets.length){alert("There are no presets! Make one first.");return;}
  const b=pick(data.presets); data.lastBuild=b;
  document.getElementById("buildBox").classList.remove("hidden");
  document.getElementById("buildName").textContent=b.name;
  document.getElementById("buildPerks").innerHTML=b.perks.map(p=>`<li>${escapeHTML(p)}</li>`).join("");
  setMessage("random");
}
function renderPresets(){
  const box=document.getElementById("presetList"); box.innerHTML="";
  data.presets.forEach((p,i)=>{
    const el=document.createElement("div"); el.className="preset";
    el.innerHTML=`<h3>${escapeHTML(p.name)}</h3><ol>${p.perks.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ol>
      <div class="preset-actions"><button class="mini-btn" onclick="editPreset(${i})">EDIT</button>
      <button class="mini-btn" onclick="deletePreset(${i})">DELETE</button></div>`;
    box.appendChild(el);
  });
}
function openModal(title,body){
  document.getElementById("modalTitle").textContent=title; document.getElementById("modalBody").innerHTML=body;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function addKiller(){
  openModal("ADD A KILLER",`<label>Killer name</label><input id="newKiller" placeholder="The Cool Guy"><button class="save" id="saveKiller">ADD IT</button>`);
  document.getElementById("saveKiller").onclick=()=>{
    const n=document.getElementById("newKiller").value.trim(); if(!n)return;
    data.killers.push({name:n,wins:0,losses:0,custom:true}); closeModal(); save(); setMessage("win");
  };
}
function addPreset(){
  openModal("MAKE A PRESET",`<label>Preset name</label><input id="pName" placeholder="THE TERRIBLE IDEA">
  <label>Four perks — one per line</label><textarea id="pPerks" placeholder="Perk 1&#10;Perk 2&#10;Perk 3&#10;Perk 4"></textarea>
  <button class="save" id="savePreset">ADD PRESET</button>`);
  document.getElementById("savePreset").onclick=()=>{
    const name=document.getElementById("pName").value.trim(), perks=document.getElementById("pPerks").value.split("\n").map(x=>x.trim()).filter(Boolean);
    if(!name||!perks.length)return;
    data.presets.push({name,perks}); closeModal(); save();
  };
}
function editPreset(i){
  const p=data.presets[i];
  openModal("EDIT PRESET",`<label>Preset name</label><input id="pName" value="${escapeAttr(p.name)}">
  <label>Perks — one per line</label><textarea id="pPerks">${escapeHTML(p.perks.join("\n"))}</textarea>
  <button class="save" id="savePreset">SAVE CHANGES</button>`);
  document.getElementById("savePreset").onclick=()=>{
    const name=document.getElementById("pName").value.trim(), perks=document.getElementById("pPerks").value.split("\n").map(x=>x.trim()).filter(Boolean);
    if(!name||!perks.length)return;
    data.presets[i]={name,perks}; closeModal(); save();
  };
}
function deletePreset(i){ if(confirm(`Delete "${data.presets[i].name}"?`)){data.presets.splice(i,1);save();} }
function escapeHTML(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function escapeAttr(s){return escapeHTML(s).replace(/`/g,"&#096;");}

document.getElementById("winBtn").onclick=()=>record("wins");
document.getElementById("lossBtn").onclick=()=>record("losses");
document.getElementById("randomBuild").onclick=randomBuild;
document.getElementById("addKiller").onclick=addKiller;
document.getElementById("addPreset").onclick=addPreset;
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
document.getElementById("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="killer-win-machine-backup.json";a.click();URL.revokeObjectURL(a.href);
};
document.getElementById("importInput").onchange=e=>{
  const file=e.target.files[0]; if(!file)return;
  const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.killers&&x.presets){data=x;selectedIndex=null;save();alert("Backup imported!")}else throw 0}catch{alert("That doesn't look like a valid backup.")}};r.readAsText(file);
};
document.getElementById("resetBtn").onclick=()=>{
  if(confirm("THIS WILL DELETE ALL WINS, LOSSES, CUSTOM KILLERS, AND PRESETS. REALLY?")){
    localStorage.removeItem("killerWinMachine");location.reload();
  }
};
render();
