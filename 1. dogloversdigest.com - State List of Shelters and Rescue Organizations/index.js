const puppeteer = require("puppeteer-core")
const fs = require('fs');
const xlsx = require("xlsx")

const scrapURL = "https://www.dogloversdigest.com/adoption/state-list-of-shelters-and-rescue-organizations/";


let dir = './Result';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

(async()=>{
	// Browser Location since we are using smaller version of puppeteer
	let browser = await puppeteer.launch({headless:false, executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" });
	
	// Go to the webpage that needs to be scraped
	let page = await browser.newPage();
	await page.goto(scrapURL)


	// Find Links using xpath
	let urlArray = await page.evaluate(()=>
	{
		function getElementByXpath(path) {
		  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		}

		let xpath = "/html/body/div[1]/div/div[1]/main/article/div/div[2]/ul[1]"
		let aTags = getElementByXpath(xpath).querySelectorAll("li a")
		let urlArray = Array.from(aTags).map((a)=>{
			return {title:a.title, link:a.href}
		});
		
		return urlArray 
	})

	console.log("Number of links: ", urlArray.length)
	console.log(urlArray)


	// Scrap each link 1 by 1
	for(let i=0; i<urlArray.length; i++){
		// Goto link
		let url = urlArray[i]
		await page.goto(url.link);	

		// Scrap Data
		let scrapedData = await page.evaluate(scrapIndividualPage)

		// Save to file
		const wb = xlsx.utils.book_new()
		const ws = xlsx.utils.json_to_sheet(scrapedData)
		xlsx.utils.book_append_sheet(wb,ws)
		xlsx.writeFile(wb, `./Result/${url.title}.xlsx`)

	}

	await page.close()
	await browser.close()
	
})()


function scrapIndividualPage()
{
	let paragraphs = document.querySelectorAll(".entry-content p")
	paragraphs = Array.from(paragraphs)
	paragraphs.splice(0,1) // Remove 1st p which is not part of data

	
	// Scrap individual item and append to array
	let scrapedData = []
	paragraphs.forEach((paragraph) =>
	{
		// Initial values to be scrapped
		let title="", titleLink="", addr1="", addr2="",POBox="", phone="", email="";
	
		// Scrap each value
		title = paragraph.querySelector("a").innerText
		titleLink = paragraph.querySelector("a").href

		// General text which needs detection on what type of data it is
		let text = paragraph.innerText.split("\n")
		text.splice(0,1) // remove title
		
		text.forEach((item)=>{
			let itemLC = item.toLowerCase()

			if(item.includes("Phone")){
				phone = item
			}
			else if(item.includes("Email")){
				email = item
			}
			else if(itemLC.includes("p") && itemLC.includes("o") && itemLC.includes("box")){
				POBox = item
			}
			else if(addr1 == ""){
				addr1 = item
			}
			else if(addr1 != ""){
				addr2 = item
			}
		})

		scrapedData.push({title, titleLink, addr1, addr2, POBox, phone, email})
	})

	return scrapedData
}