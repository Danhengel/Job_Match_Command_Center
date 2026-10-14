const modal=document.getElementById('modal');
const openModal=()=>{modal.hidden=false};
const closeModal=()=>{modal.hidden=true};
document.getElementById('connectBtn').addEventListener('click',openModal);
document.getElementById('closeModal').addEventListener('click',closeModal);
document.getElementById('modalOk').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});

const input=document.getElementById('assistantInput');
const reply=document.getElementById('assistantReply');
const ask=()=>{
  const text=input.value.trim();
  reply.textContent=text?`You asked: “${text}” — ChatGPT is the next connection we’ll add to this dashboard.`:'Type a question first.';
};
document.getElementById('askBtn').addEventListener('click',ask);
input.addEventListener('keydown',e=>{if(e.key==='Enter')ask()});

document.querySelectorAll('.suggestions button').forEach(btn=>btn.addEventListener('click',()=>{input.value=btn.textContent;ask()}));
document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  reply.textContent=`${btn.textContent} workspace is ready for the next setup step.`;
}));
