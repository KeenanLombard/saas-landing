'use strict';
const $ = id => document.getElementById(id);
const workflows = {
  leads: {
    instruction: '“Give every new lead a thoughtful first hello.”',
    trigger: 'A lead arrives', triggerDetail: 'New form submission',
    think: 'Find the context', thinkDetail: 'Research, qualify, draft',
    action: 'Make the first move', actionDetail: 'CRM updated · draft ready',
    progress: ['A new enquiry from Northstar Studio…', 'Finding context and drafting a hello…', 'Preparing the CRM update and your draft…'],
    resultTitle: 'A warmer first hello, ready to review.',
    result: 'Sample lead: Alex at Northstar Studio · interested in team automation.\n\n“Hi Alex, thanks for reaching out. It sounds like your team is looking to spend less time moving work between tools. I’d love to hear which handoffs slow you down. Would a quick conversation next week help?”\n\nSuggested CRM update: New enquiry → Qualified · owner: Sales.',
    approved: 'Sample approved. The welcome draft and CRM update are marked ready. No email was sent and no CRM was changed.'
  },
  meetings: {
    instruction: '“Turn a good conversation into clear next steps.”',
    trigger: 'A meeting wraps up', triggerDetail: 'New sample transcript',
    think: 'Find what matters', thinkDetail: 'Summarize, extract, assign',
    action: 'Keep things moving', actionDetail: 'Notes ready · tasks drafted',
    progress: ['Reading the sample product sync…', 'Finding decisions, owners, and next steps…', 'Preparing your recap and task list…'],
    resultTitle: 'The conversation has a next chapter.',
    result: 'Sample meeting: Product sync · Monday, 09:30.\n\nDecision: Start the onboarding pilot with three teams next week.\nMaya → Share the revised onboarding flow by Thursday.\nSam → Prepare the pilot workspace by Friday.\nAlex → Send invitations once the workspace is reviewed.\n\nA meeting recap and three task drafts are ready for your approval.',
    approved: 'Sample approved. The recap and three tasks are marked ready. No document or task was created in your apps.'
  },
  support: {
    instruction: '“Help every customer get to a helpful answer.”',
    trigger: 'A question comes in', triggerDetail: 'New support request',
    think: 'Understand the ask', thinkDetail: 'Classify, look up, draft',
    action: 'Offer a way forward', actionDetail: 'Reply drafted · team notified',
    progress: ['Reading a sample customer question…', 'Matching the question to the sample guide…', 'Preparing a helpful reply for review…'],
    resultTitle: 'A helpful answer, with a human touch.',
    result: 'Sample request: “How do I invite a teammate?”\nCategory: Workspace setup · priority: Normal.\n\n“Hi Taylor, happy to help. Open Workspace settings, choose Members, and select Invite teammate. Enter their work email, choose their role, and review the invitation before sending. If you can’t see Members, your workspace owner can help with access.”\n\nSource: Example workspace guide · Adding teammates.',
    approved: 'Sample approved. The reply is marked ready for the support queue. No customer was contacted.'
  }
};
let activeWorkflow = 'leads';
let running = false;
let runToken = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const workflowTabs = [...document.querySelectorAll('[data-workflow]')];
const workflowNodes = [...document.querySelectorAll('[data-node]')];
const canvas = document.querySelector('.workflow-canvas');

function setStatus(message) {
  $('workflow-status').replaceChildren();
  const dot = document.createElement('span');
  dot.className = 'ready-dot';
  $('workflow-status').append(dot, document.createTextNode(message));
}
function resetRun() {
  runToken++;
  running = false;
  canvas.classList.remove('running');
  $('run-workflow').disabled = false;
  $('run-workflow').innerHTML = 'Run this relay <span class="run-play" aria-hidden="true">▷</span>';
  workflowNodes.forEach(node => node.classList.remove('is-running', 'is-complete'));
  $('run-result').hidden = true;
  $('approve-draft').disabled = false;
  $('approve-draft').hidden = false;
  setStatus('Ready when you are.');
}
function selectWorkflow(key, focus = false) {
  if (!workflows[key]) return;
  resetRun();
  activeWorkflow = key;
  workflowTabs.forEach(tab => {
    const selected = tab.dataset.workflow === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  $('workflow-panel').setAttribute('aria-labelledby', `tab-${key}`);
  const workflow = workflows[key];
  $('workflow-instruction').textContent = workflow.instruction;
  for (const field of ['trigger', 'think', 'action']) {
    $(`node-${field}`).textContent = workflow[field];
    $(`node-${field}-detail`).textContent = workflow[`${field}Detail`];
  }
  $('starter').value = key;
}
workflowTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectWorkflow(tab.dataset.workflow));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (index + 1) % workflowTabs.length;
    else if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (index - 1 + workflowTabs.length) % workflowTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = workflowTabs.length - 1;
    else return;
    event.preventDefault();
    selectWorkflow(workflowTabs[next].dataset.workflow, true);
  });
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function runWorkflow() {
  if (running) return;
  resetRun();
  running = true;
  const token = runToken;
  const workflow = workflows[activeWorkflow];
  $('run-workflow').disabled = true;
  $('run-workflow').textContent = 'A little momentum…';
  canvas.classList.add('running');
  for (let index = 0; index < workflowNodes.length; index++) {
    if (token !== runToken) return;
    workflowNodes[index].classList.add('is-running');
    setStatus(workflow.progress[index]);
    await delay(reducedMotion.matches ? 120 : 850);
    if (token !== runToken) return;
    workflowNodes[index].classList.remove('is-running');
    workflowNodes[index].classList.add('is-complete');
  }
  canvas.classList.remove('running');
  running = false;
  $('result-title').textContent = workflow.resultTitle;
  $('result-copy').textContent = workflow.result;
  document.querySelector('.approval-row>span').innerHTML = '<svg class="icon" aria-hidden="true"><use href="#shield"/></svg> Awaiting your approval. Nothing has been sent.';
  $('run-result').hidden = false;
  $('run-workflow').disabled = false;
  $('run-workflow').innerHTML = 'Run it again <span class="run-play" aria-hidden="true">↻</span>';
  setStatus('Sample ready. Your call.');
}
$('run-workflow').addEventListener('click', runWorkflow);
$('approve-draft').addEventListener('click', () => {
  $('result-copy').textContent += '\n\n' + workflows[activeWorkflow].approved;
  document.querySelector('.approval-row>span').innerHTML = '<svg class="icon" aria-hidden="true"><use href="#check"/></svg> Approved in this demo. Your apps are unchanged.';
  $('approve-draft').hidden = true;
  setStatus('Sample approved. Nicely done.');
});

function setBilling(period) {
  const annual = period === 'annual';
  document.querySelectorAll('[data-billing]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.billing === period)));
  $('momentum-price').textContent = annual ? '$19.20' : '$24';
  $('collective-price').textContent = annual ? '$63.20' : '$79';
  $('momentum-billing').textContent = annual ? '$230.40 billed yearly. Save $57.60.' : 'Billed monthly. Find your rhythm.';
  $('collective-billing').textContent = annual ? '$758.40 billed yearly. Up to 10 teammates.' : 'Billed monthly. Up to 10 teammates.';
  try { localStorage.setItem('relay-billing', period); } catch { /* The demo also works without storage. */ }
}
document.querySelectorAll('[data-billing]').forEach(button => button.addEventListener('click', () => setBilling(button.dataset.billing)));
try { if (localStorage.getItem('relay-billing') === 'annual') setBilling('annual'); } catch { /* Storage is optional. */ }

const menuToggle = document.querySelector('.menu-toggle');
function closeMenu() {
  $('mobile-nav').hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  $('mobile-nav').hidden = !open;
});
$('mobile-nav').querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const layoutMedia = window.matchMedia('(min-width: 621px)');
function syncLayout() {
  $('workflow-tabs').setAttribute('aria-orientation', layoutMedia.matches ? 'vertical' : 'horizontal');
  if (layoutMedia.matches) closeMenu();
}
layoutMedia.addEventListener('change', syncLayout);
syncLayout();

function openDialog(dialog) {
  closeMenu();
  dialog.showModal();
  document.body.classList.add('dialog-open');
}
function closeDialog(dialog) { dialog.close(); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
  });
});
document.querySelectorAll('[data-build]').forEach(button => button.addEventListener('click', () => {
  const plan = button.dataset.plan;
  $('selected-plan').hidden = !plan;
  $('selected-plan').textContent = plan ? `Exploring the ${plan} plan · concept preview only.` : '';
  $('starter').value = activeWorkflow;
  openDialog($('build-dialog'));
}));
$('builder-form').addEventListener('submit', event => {
  event.preventDefault();
  const key = $('starter').value;
  closeDialog($('build-dialog'));
  selectWorkflow(key);
  $('playground').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  $('workflow-panel').focus({ preventScroll: true });
  runWorkflow();
});
$('privacy-button').addEventListener('click', () => openDialog($('privacy-dialog')));
document.querySelector('.privacy-done').addEventListener('click', () => closeDialog($('privacy-dialog')));
$('year').textContent = new Date().getFullYear();
