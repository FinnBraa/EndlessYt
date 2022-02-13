const puppeteer = require('puppeteer-extra')
const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')()
const fsp = require('fs').promises;
const fs = require('fs');
var logger = fs.createWriteStream('HowToOpenAi.txt', {
    flags: 'a'
})


async function Howto() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const cookiesString = await fsp.readFile('./cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto(`https://www.youtube.com/c/wikihow/videos`);

    page.waitForSelector("#video-title").then(() => createTabs());


    async function createTabs() {
        var oldvalue = 0;
        var ll = 0;

        var newvalue = 870;
        while (newvalue > ll) {
            ll++;
            console.log("scroll");
            page.waitForTimeout(2000)
            await autoScroll(page);
            console.log(ll);
        }
        for (let index = 0; index < await LazyLoadingBefore(); index++) {
            console.log("write");
            var x = await gettitle(index)
            console.log(x);
            if (JSON.stringify(x).includes("How") && !JSON.stringify(x).includes("Ask")) {
                logger.write(JSON.stringify(x) + "," + "\n");
            }
        }
        console.log("SCRIPT ready");
        logger.end()
    }

    async function gettitle(index) {
        const titles = await page.evaluate((index) => {
            return {
                "prompt": document.querySelectorAll("#video-title")[index].getAttribute("title"),
                "completion": "<ideal generated text>"
            }
        }, index);
        return titles
    }

    async function LazyLoadingBefore() {
        const ll = await page.evaluate(() => {
            return document.querySelectorAll("#video-title").length
        })
        return ll
    }


    async function autoScroll(page) {
        await page.evaluate(async() => {
            await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 10000000;
                var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 1);
            });
        });
    }

}

Howto();