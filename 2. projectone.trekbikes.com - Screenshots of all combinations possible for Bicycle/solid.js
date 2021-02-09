const puppeteer = require('puppeteer-core'); 
const fs = require('fs');

let dir = './Solid-Images';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}


const url = "https://projectone.trekbikes.com/us/en//#model/emondaslr7";

async function waitForLoader(page){
    await page.waitForSelector("#loading[style='display: block;']")
    await page.waitForSelector("#loading[style='display: none;']")
}

async function run() {     
    // Browser Location since we are using smaller version of puppeteer
  let browser = await puppeteer.launch({headless:true, executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" });
  let page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await page.setViewport({ width: 1920, height: 1080 });
  await page.waitForSelector("#container");


  // Remove error box and Select Variant Solid
  await page.evaluate(()=>{
    document.getElementById("dialog-shade").remove()
    document.getElementById("dialog-container").remove()
    // Click on Solid Logo
    document.querySelectorAll("#footer .swatch")[4].click()
  })
  await waitForLoader(page)


  // Find lengths of Colors available
  let colorLengths = await page.evaluate(()=>{
    let color1Length = document.querySelectorAll("#debug-188 .swatch").length;
    let color2Length = document.querySelectorAll("#debug-189 .swatch").length;
    return {color1Length, color2Length}
  })
  console.log(colorLengths)


  // Take screenshots of all possible combinations
  for(let i=0;i<colorLengths.color1Length;i++)
  {
    // Select Color 1
    await page.evaluate(({i})=>{
      // Click on Color 1
      document.querySelectorAll("#content .swatch")[1].click()
      // Select ith color in list
      document.querySelectorAll("#debug-188 .swatch")[i].click()
    }, {i})
    await waitForLoader(page)



    for(let j=0; j<colorLengths.color2Length; j++)
    {
      // Select Color 2    
      await page.evaluate(({j})=>{
        // Click on Color 1
        document.querySelectorAll("#content .swatch")[2].click()
        // Select jth color in list
        document.querySelectorAll("#debug-189 .swatch")[j].click()
      },{j})
      await waitForLoader(page)


      // Close menu
      await page.evaluate(()=>{
        document.querySelectorAll("#content .side-swatch-picker")[2].querySelector(".close").click()
      })
      

      // Take Screenshot
      await page.screenshot({
        path: `./Solid-Images/solid-${i+1}-${j+1}.jpg`,
        type: "jpeg",
        fullPage: true
      });

      console.log(`solid-${i+1}-${j+1}.jpg`)
    }
  }

  await page.close();
  await browser.close();
} 

run();

