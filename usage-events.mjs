// Fixed event identifiers only; do not collect user inputs, links or document text.
const tabs={match:'schools_open',resources:'datasets_open',methods:'methods_open',writing:'journals_open',conferences:'conferences_open',newsletter:'newsletter_open',usage:'stats_open'};
document.addEventListener('click',event=>{
 const path=event.composedPath().filter(x=>x instanceof Element);if(path.some(x=>x.hasAttribute('data-puxian-event')||x.hasAttribute('data-puxian-skill')))return;
 const tab=path.find(x=>x.hasAttribute('data-tab'));if(tab&&tabs[tab.getAttribute('data-tab')])window.puxianTrack?.(tabs[tab.getAttribute('data-tab')]);
 const school=path.find(x=>x.hasAttribute('data-school'));if(school)window.puxianTrack?.('schools_open');
 if(path.some(x=>x.id==='newsletterEntry'))window.puxianTrack?.('newsletter_open');
},{capture:true});
