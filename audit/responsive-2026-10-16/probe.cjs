const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();
 const context=await browser.newContext();
 const page=await context.newPage();
 const results=[];
 for(const width of [320,375,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/settings','/stats','/profile','/ranked','/leaderboard','/keyboard-lab','/about','/auth']){
   await page.goto('http://127.0.0.1:4173'+path);
   await page.locator('h1').waitFor();
   await page.evaluate(()=>document.fonts.ready);
   const result=await page.evaluate(()=>{
    const viewport=document.documentElement.clientWidth;
    return {viewport,scroll:document.documentElement.scrollWidth,offenders:Array.from(document.querySelectorAll('body *')).filter(el=>{
     const r=el.getBoundingClientRect();if(r.width<1||r.height<1)return false;
     if(el.closest('.overflow-x-auto,.overflow-auto,[role="menu"]'))return false;
     const c=getComputedStyle(el);return c.position!=='fixed'&&(r.right>viewport+1||r.left<-1);
    }).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,100),right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left)})).slice(-12)};
   });
   results.push({width,path,...result});
   if(result.scroll>width+1)await page.screenshot({path:`audit/responsive-2026-10-16/before-${path.slice(1)}-${width}.png`,fullPage:true});
  }
 }
 console.log(JSON.stringify(results,null,2));
 await browser.close();
})();
