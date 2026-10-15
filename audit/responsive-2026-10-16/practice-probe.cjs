const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:320,height:700}});
 const probe=async(label)=>{
   console.log(JSON.stringify({label,...await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,overflow:[...document.querySelectorAll('main *')].map(el=>({tag:el.tagName,cl:el.className,text:el.innerText?.slice(0,85),r:el.getBoundingClientRect()})).filter(x=>x.r.width>0&&(x.r.right>innerWidth+1||x.r.left< -1)).map(x=>({...x,r:{x:x.r.x,w:x.r.width,right:x.r.right}})).slice(0,25)}))}));
 };
 await page.goto('http://127.0.0.1:4173/learn');await page.getByRole('combobox',{name:'Correction policy',exact:true}).waitFor();await probe('learn320');
 
 await page.goto('http://127.0.0.1:4173/race');await page.getByRole('button',{name:'Start bot practice',exact:true}).waitFor();await probe('raceLobby320');
 await page.getByRole('combobox',{name:'Difficulty',exact:true}).selectOption('intermediate');await page.getByRole('button',{name:'Start bot practice',exact:true}).click();await page.getByTestId('typing-target').waitFor();await probe('raceActive320');
 const input=page.getByRole('textbox',{name:'Typing input',exact:true});await input.focus();await input.pressSequentially('hello');await input.press('ControlOrMeta+Enter');await page.getByRole('region',{name:'Session results',exact:true}).waitFor();await probe('result320');
 await page.getByText('Final-text keyboard map',{exact:false}).click();await page.getByText('Calculation & replay',{exact:false}).count().then(console.log);await probe('resultKeyboard320');
 await browser.close();
})();

