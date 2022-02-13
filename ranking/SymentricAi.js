const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');
const fss = require('fs').promises
const transAnalyse = require("./Transkipt_analyse.js");


var titles = [];
var keywords = [];
var shortDescribtion = [];
var duration = [];
var genre = [];
var rating = [];
var channel = [];
var views = [];

var data = [];
var settings;


async function symentric(Ytdata, searchDATA, socketid) {

    console.log(Ytdata);
    const systemstring = await fss.readFile("./ranking/settings-ranking.json");
    settings = JSON.parse(systemstring);

    console.log("fifkf");
    data = Ytdata;

    for (let index = 0; index < Ytdata.length; index++) {
        titles.push(Ytdata[index].title);
        keywords.push(Ytdata[index].keywords);
        shortDescribtion.push(Ytdata[index].shortDescribtion);
        duration.push(Ytdata[index].duration);
        genre.push(Ytdata[index].genre);
        rating.push(Ytdata[index].rating);
        channel.push(Ytdata[index].kanal);
        views.push(Ytdata[index].aufrufe);

    }
    //TODO: VIEW Comparision neu Implementieren (Berechnungsalgorythmus ändern)

    await compareTitles(titles, searchDATA, getMutiplier(settings[0].title), () => {
        comparedesc(shortDescribtion, searchDATA, getMutiplier(settings[0].shortDescribtion), () => {
            compareKeywords(keywords, searchDATA, getMutiplier(settings[0].keywords), () => {
                compareGenre(genre, searchDATA, getMutiplier(settings[0].genre), () => {
                    compareChannel(channel, searchDATA, getMutiplier(settings[0].channel), () => {
                        compareRating(rating, getMutiplier(settings[0].rating), () => {
                            var readyDat = Sort(data).splice(data.length - 1);
                            console.log(readyDat);
                            transAnalyse.analsyseCore(readyDat, socketid);
                            data = [];
                            titles = [];
                            keywords = [];
                            shortDescribtion = [];
                            duration = [];
                            genre = [];
                            rating = [];
                            channel = [];
                            views = [];
                            console.log("VIDEO Sucessfull Ranked");
                        })
                    });
                });
            });
        })
    });
}

function getMutiplier(setting) {
    if (setting == 1) {
        return 10
    } else if (setting < 1 && setting > 0) {
        return (1 - setting) * 10
    } else if (setting > 1) {
        return 1
    } else if (setting == 0 || setting < 0) {
        return 0
    }
};

async function compareTitles(titlearr, search, multi, callback) {
    var scores = [];
    use.loadQnA().then(model => {
        const input = {
            queries: [search],
            responses: titlearr,
        };
        const embeddings = model.embed(input);
        scores = tf.matMul(embeddings['queryEmbedding'],
            embeddings['responseEmbedding'], false, true).dataSync();

        for (let index = 0; index < scores.length; index++) {
            if (scores[index]) {
                data[index].score = scores[index] / multi;
            }
        }
        callback();
    });
}

async function compareChannel(channelarr, search, multi, callback) {
    var scores = [];
    use.loadQnA().then(model => {
        const input = {
            queries: [search],
            responses: channelarr,
        };
        const embeddings = model.embed(input);
        scores = tf.matMul(embeddings['queryEmbedding'],
            embeddings['responseEmbedding'], false, true).dataSync();

        for (let index = 0; index < scores.length; index++) {
            var cc = data[index].score;
            data[index].score = cc + scores[index] / multi;
        }
        callback();

    });
}

async function compareView(viewarr, multi, callback) {

    viewarr.forEach(element => {
        var newelem = element.slice(0, element.indexOf("v"));
        var view = Number(newelem.replace(/,/gi, "."));
        if (view >= settings[0]["max-view"]) {
            element = 10 / multi;
        } else if (view < settings[0]["max-view"]) {
            var zz = (view / settings[0]["max-view"]) / 10;
            element = zz / multi;
        } else if (view > settings[0]["max-view"]) {
            element = 10 / multi;
        }
    });

    callback();

}

async function compareRating(ratinarr, multi, callback) {
    for (let ratin = 0; ratin < ratinarr.length; ratin++) {
        var z = ratinarr[ratin]
        ratinarr[ratin] = z / multi;
        var old = data[ratin].score;
        data[ratin].score = old + z;
    }
    callback();
}

async function comparedesc(descearr, search, multi, callback) {
    var scores = [];
    use.loadQnA().then(model => {
        const input = {
            queries: [search],
            responses: descearr,
        };
        const embeddings = model.embed(input);
        scores = tf.matMul(embeddings['queryEmbedding'],
            embeddings['responseEmbedding'], false, true).dataSync();

        for (let index = 0; index < scores.length; index++) {
            var cc = data[index].score;
            data[index].score = cc + scores[index] / multi;
        }
        callback();
    });
}

async function compareKeywords(keywordsarr, search, multi, callback) {
    var scores = [];
    use.loadQnA().then(model => {
        const input = {
            queries: [search],
            responses: keywordsarr,
        };
        const embeddings = model.embed(input);
        scores = tf.matMul(embeddings['queryEmbedding'],
            embeddings['responseEmbedding'], false, true).dataSync();

        for (let index = 0; index < scores.length; index++) {
            var cc = data[index].score;
            data[index].score = cc + scores[index] / multi;
        }
        callback();
    });
}


async function compareGenre(genresarr, search, multi, callback) {
    console.log("go");
    var scores = [];
    use.loadQnA().then(model => {
        const input = {
            queries: [search],
            responses: genresarr,
        };
        const embeddings = model.embed(input);
        scores = tf.matMul(embeddings['queryEmbedding'],
            embeddings['responseEmbedding'], false, true).dataSync();

        for (let index = 0; index < scores.length; index++) {
            var cc = data[index].score;
            data[index].score = cc + scores[index] / multi;
        }
        callback();
    });
}

async function compareduration(durationsarr, multi, callback) {
    for (let index2 = 0; index2 < durationsarr.length; index2++) {
        if (convertDuration(durationsarr[index2]) <= 300) {
            data[index2].score += 100;
        }
        var z = durationsarr[index2].slice(2);
        z = z.slice(0, z.indexOf("M")) + "." + z.slice(z.indexOf("M") + 1);
        var nnew = z.replace(/[A-Z]/g, "");
        if (Number(nnew) < settings[0]["best-duration"]) {
            var zz = (view / settings[0]["max-view"]) / 10;
            durationsarr[index2] = zz / multi;
        } else if (Number(nnew) == settings[0]["best-duration"]) {
            durationsarr[index2] = (Number(nnew) * 12) / multi
        } else if (Number(nnew) > settings[0]["best-duration"]) {
            durationsarr[index2] = 10 / multi;
        }
        var old = data[index2].score;
        data[index2].score = old + durationsarr[index2];
    }
    callback();
}

function convertDuration(dur) {
    var durArray = [];
    var dur1 = dur.replace(/PT/, ""); //4M56S
    durArray[0] = dur1.slice(0, dur1.indexOf("M"));
    durArray[1] = dur1.slice(dur1.indexOf("M") + 1, dur1.indexOf("S"));
    var minutes = Number(durArray[0]) * 60;
    var sec = Number(durArray[1]);
    return minutes + sec;
}


function Sort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {

            if (arr[j + 1].score < arr[j].score) {

                [arr[j + 1], arr[j]] = [arr[j], arr[j + 1]]
            }
        }
        var old = arr[i].score
        arr[i].score = old / 2.2;
    };
    return arr;
};

//socket.on("API-DATA-RAKING-START", (arg1, arg2) => {
//   symentric(arg1, arg2);
//})

module.exports = {
    symentric
}