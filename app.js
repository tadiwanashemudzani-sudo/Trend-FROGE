const panels=['dashboard','trends','script','storyboard','export'];
function show(id){panels.forEach(p=>document.getElementById(p).classList.toggle('active',p===id));document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.panel===id))}
document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>show(n.dataset.panel)));
function useIdea(text){document.getElementById('idea').value=text;show('script')}
function generateScript(){
 const idea=document.getElementById('idea').value.trim()||'an interesting topic';
 const len=document.getElementById('length').value;
 const out=`HOOK\nStop scrolling — here is something you should know about ${idea}.\n\nSCENE 1\nShow a strong visual related to the topic.\nVoice-over: “Here is the key idea in one simple explanation.”\n\nSCENE 2\nShow the main example or demonstration.\nVoice-over: “Here is why this matters.”\n\nSCENE 3\nGive the viewer one practical takeaway.\nVoice-over: “Try this and see what happens.”\n\nCTA\nFollow for more quick videos.\n\nTarget length: ${len}`;
 document.getElementById('scriptOut').textContent=out;
}
let count=0;
function addScene(){
 count++;
 const div=document.createElement('div'); div.className='scene';
 div.innerHTML=`<input value="Scene ${count}: describe the visual..."><input value="Voice-over..."><button onclick="this.parentElement.remove()">Remove</button>`;
 document.getElementById('scenes').appendChild(div);
}
addScene(); addScene(); addScene();
