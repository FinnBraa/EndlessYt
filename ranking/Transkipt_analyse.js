const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');


const { io } = require("socket.io-client");
const socket = io("http://localhost:4000");

var symentricSentences = [
    "Hello",
    "Like and Subscribe",
    "See You",
    "bye",
    "next Video",
    "see in the next one",
    "peace",
    "next one",
    "thank you",
    "playlist",
    "notifications",
    "welcome",
    "whats up",
    "like Button"
];

function analsyseCore(data, socketid) {
    console.log(2.1);
    if (data[0].transkript.toString().includes("NO Transcript available")) {
        data.startVidAt = 0;
        data.endVidAt = null;
        console.log(data);
        socket.emit("DATA_READY", data, socketid);
    } else {
        ConvertData(data[0].transkript, data, socketid);
    }
};

async function ConvertData(Condat, fulldata, socketid) {
    console.log(2.2);
    var EndDat;
    try {
        console.log("HAOOL");
        var readyDat = await ConvertInValidJson(Condat);
        console.log(1);
        var parseData = await JSON.parse(readyDat);
        console.log(2);
        EndDat = await checkMoreMusic(parseData);
        console.log(3);
        await checkSymentricSentences(EndDat, async(val) => {
            console.log(4);
            await CheckEqualnes(val, (dat) => {
                console.log(5);
                console.log(dat);
                var start = Math.floor(dat[0].start);
                var end = Math.floor(dat[dat.length - 1].start);
                fulldata[0].startVidAt = start;
                fulldata[0].endVidAt = end;
                console.log("transcript sucessfull analysed");
                console.log(fulldata);
                socket.emit("DATA_READY", fulldata, socketid);
            })
        });
    } catch (e) {
        fulldata.startVidAt = 0;
        fulldata.endVidAt = null;
        socket.emit("DATA_READY", fulldata);
    }
}


async function ConvertInValidJson(data) {
    console.log("CONVERT START");
    var repData1 = data.replace(/{'/g, `{"`);
    var repData2 = repData1.replace(/: '/g, `: "`)
    var readyDat3 = repData2.replace(/',/g, `",`)
    var readyDat4 = readyDat3.replace(/':/g, `":`)
    var readyDat5 = readyDat4.replace(/, '/g, `, "`);
    var readyDat6 = readyDat5.replace(/\n/, "");
    console.log("CONVERT READY");
    return readyDat6;
}


async function CheckOutMusic(data) {
    var i = 0;
    var newDat;
    data.forEach(async(script) => {
        if (script.text.includes("Music") || script.text.includes("Applause")) {
            if (i == 0 || i == data.length) {
                data.splice(i, 1);
                newDat = await checkMoreMusic(data);
            }
        }
        i++;
    });
    return newDat;
}

async function checkMoreMusic(data) {
    var newDat;
    for (let MusicIndex = 0; MusicIndex < data.length; MusicIndex++) {
        if (data[MusicIndex].text.includes("Music") || data[MusicIndex].text.includes("Applause")) {
            data.splice(MusicIndex, 1);
        } else {
            newDat = data;
            break
        }
    }
    return newDat;
}


async function checkSymentricSentences(data, callback) {
    var scores = [];
    var titleArr = [];
    var newDat;
    var index_vorne = 0;
    var index_hinten = data.length - 1;
    for (let datIndex = 0; datIndex < data.length; datIndex++) {
        titleArr.push(data[datIndex].text);
    }

    use.loadQnA().then(model => {
        const input = {
            queries: symentricSentences,
            responses: titleArr,
        };
        const embeddings = model.embed(input);
        scores = tf.matMul(embeddings['queryEmbedding'],
            embeddings['responseEmbedding'], false, true).dataSync();
        for (let SocresIndex = 0; SocresIndex < scores.length; SocresIndex++) {
            if (scores[SocresIndex] >= 16) {
                if (SocresIndex < 5) {
                    index_vorne = SocresIndex;
                } else if (SocresIndex > scores.length - 10) {
                    index_hinten = SocresIndex;
                }
            }
        }
        newDat = data.slice(index_vorne, index_hinten);
        callback(newDat);
    });
}



async function CheckEqualnes(data, callback) {
    var newDat;
    var index_vorne = 0;
    var index_hinten = data.length - 1;
    for (let index = 0; index < data.length; index++) {
        for (let Index2 = 0; Index2 < symentricSentences.length; Index2++) {
            if (data[index].text.toUpperCase().includes(symentricSentences[Index2].toUpperCase())) {
                if (index < 10) {
                    index_vorne = index;
                } else if (index > data.length - 10) {
                    index_hinten = index;
                }
            }

        }

    }
    newDat = data.slice(index_vorne, index_hinten - 1);
    callback(newDat);
}

module.exports = {
    analsyseCore
}