const puppeteer = require('puppeteer-extra')
const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')()
const fs = require('fs').promises;
const PythonShell = require('python-shell').PythonShell;
var timerTest = 0;

setInterval(() => {
    timerTest++;
}, 1000);

const options = {
    headless: true,
}

async function searchYtDATA(value) {

    const systemstring = await fs.readFile("./settings.json");
    const settings = JSON.parse(systemstring);
    puppeteer.use(blockResourcesPlugin)
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    blockResourcesPlugin.blockedTypes.add('image')
    blockResourcesPlugin.blockedTypes.add('stylesheet')
    blockResourcesPlugin.blockedTypes.add('other')
    blockResourcesPlugin.blockedTypes.add('media')
    const cookiesString = await fs.readFile('./cookies.json');

    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    await page.goto(`https://www.youtube.com/results?search_query=${value}`);
    page.waitForSelector("#video-title").then(() => createTabs());

    const cookies2 = await page.cookies();
    await fs.writeFile('./cookies.json', JSON.stringify(cookies2, null, 2));

    async function GetDataCore(i) {
        var dataArr = [];
        var data = "";
        var oldvalue = 0;
        for (let index = 0; index < settings[0].vidAnl / 10; index++) {
            await page.waitForFunction(`document.querySelectorAll("#video-title").length > ${oldvalue}`);
            oldvalue = await LazyLoadingBefore();
            await autoScroll(page);
        }
        for (let index = 0; index < i; index++) {
            data = await GetData(index);
            dataArr.push(data);
        }

        return dataArr;
    }

    async function LazyLoadingBefore() {
        const ll = await page.evaluate(() => {
            return document.querySelectorAll("#video-title").length
        })
        return ll
    }

    //TODO: AVOID Channels

    async function GetData(i) {
        const titles = await page.evaluate((i) => {
            if (!document.querySelectorAll("#video-title")[i].nodeName.toLowerCase().includes("span") && !document.querySelectorAll("#video-title")[i].nodeName.includes('YT-FORMATTED-STRING')) {
                return {
                    "title": document.querySelectorAll("#video-title")[i].getAttribute("title"),
                    "link": document.querySelectorAll("#video-title")[i].href,
                    "kanal": "",
                    "aufrufe": "",
                    "transkript": ["NO Transcript available"],
                    "shortDescribtion": "",
                    "keywords": "",
                    "duration": "",
                    "genre": "",
                    "published": "",
                    "uploaded": "",
                    "isfamilyFriendly": false,
                    "unlisted": true,
                };
            } else {
                return
            }
        }, i);

        return titles;
    }



    async function createTabs() {
        var data = await GetDataCore(settings[0].vidAnl);
        var modulovalue = await modulo(data.length);
        modulovalue.forEach(async(ele) => {

            for (let index = (ele - 1) * 10; index < ele * 10; index++) {
                var option = {
                    args: [data[index].link.slice(data[index].link.lastIndexOf("=") + 1)]
                }
                var py = PythonShell.run('transcriptyt.py', option, function(err) {});

                py.on('message', function(message) {
                    data[index].transkript = message;
                });

                const page2 = await browser.newPage(); // open new tab
                await page2.goto(data[index].link);
                await page2.bringToFront();
                page2.waitForSelector(".view-count").then(async() => {
                    var zz = await getPageData(page2);
                    data[index].shortDescribtion = zz.shortDescribtion;
                    data[index].keywords = zz.keywords;
                    data[index].duration = zz.duration;
                    data[index].genre = zz.genre;
                    data[index].isfamilyFriendly = zz.isfamilyFriendly;
                    data[index].unlisted = zz.unlisted;
                    data[index].aufrufe = zz.aufrufe;
                    data[index].kanal = zz.knal;
                    data[index].published = zz.published;
                    data[index].uploaded = zz.uploaded;
                    page2.close();
                })
            }
        });

        var inn = setInterval(async() => {
            if ((await browser.pages()).length == 2) {
                console.log(await data);
                console.log("Das script hat insgesamt" + " " + timerTest + "sec gebraucht");
                browser.close();
                clearInterval(inn);
                process.exit();
            }
        }, 1000)
    }

    async function modulo(ll) {
        if (ll % 2 == 0) {
            var a = ll / 2
            var arr2 = [];
            if (a % 10 == 0) {
                for (let index2 = 0; index2 < 2 * (a / 10); index2++) {
                    arr2.push(index2 + 1);
                }
                return arr2;
            } else {
                for (let index3 = 0; index3 < 1 * (a / 5); index3++) {
                    arr2.push(index3 + 1);
                }
                return arr2;
            }
        } else if (ll % 2 != 0) {
            var d = Math.floor(ll);
            var a = d / 2
            var arr2 = [];
            if (a % 10 == 0) {
                for (let index2 = 0; index2 < 2 * (a / 10); index2++) {
                    arr2.push(index2 + 1);
                }
                return arr2;
            } else {
                for (let index3 = 0; index3 < 1 * (a / 5); index3++) {
                    arr2.push(index3 + 1);
                }
                return arr2;
            }
        }
    }

    async function getPageData(pageass) {
        var z = await pageass.evaluate(() => {
            return {
                "knal": document.querySelectorAll("#channel-name")[0].getElementsByClassName("yt-simple-endpoint")[0].innerText,
                "aufrufe": document.getElementsByClassName("view-count")[0].innerText,
                "shortDescribtion": document.querySelectorAll("meta[name]")[2].getAttribute("content"),
                "keywords": document.querySelectorAll("meta[name]")[3].getAttribute("content"),
                "duration": document.querySelectorAll(`meta[itemprop="duration"]`)[0].getAttribute("content"),
                "genre": document.querySelectorAll(`meta[itemprop="genre"]`)[0].getAttribute("content"),
                "isfamilyFriendly": document.querySelectorAll(`meta[itemprop="isFamilyFriendly"]`)[0].getAttribute("content"),
                "unlisted": document.querySelectorAll(`meta[itemprop="unlisted"]`)[0].getAttribute("content"),
                "published": document.querySelectorAll(`meta[itemprop="datePublished"]`)[0].getAttribute("content"),
                "uploaded": document.querySelectorAll(`meta[itemprop="uploadDate"]`)[0].getAttribute("content"),
            }
        });
        return z;
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
};

searchYtDATA("How to cut a potato");