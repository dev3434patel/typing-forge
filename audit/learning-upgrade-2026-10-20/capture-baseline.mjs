import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();
const rows=[];
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}});
  await context.addInitScript(()=>localStorage.setItem('sparowtype.opening-animation.enabled','false'));
  const page=await context.newPage();
  for(const path of ['/','/learn']){
   await page.goto('http://127.0.0.1:4173'+path);
   await page.getByRole('textbox',{name:path==='/learn'?'Type the practice text':'Typing input',exact:true}).waitFor();
   await page.screenshot({path:`audit/learning-upgrade-2026-10-20/before-${path==='/learn'?'learn':'test'}-${width}.png`,fullPage:true});
   rows.push({path,width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)});
  }
  await context.close();
 }
 await writeFile('audit/learning-upgrade-2026-10-20/baseline.json',JSON.stringify(rows,null,2));
 console.log(JSON.stringify(rows));
}finally{await browser.close();}

