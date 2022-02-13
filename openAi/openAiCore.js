const { Configuration, OpenAIApi } = require("openai");
const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');


const configuration = new Configuration({
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);

async function openAI(val) {
    var dataOpenAi = [];
    try {
        for (let CompletionIndex = 0; CompletionIndex < 5; CompletionIndex++) {
            var completion = await openai.createCompletionFromModel({
                model: "davinci:ft-universit-t-der-k-nste-berlin-2022-02-12-18-36-05",
                prompt: val + "\n",
            });
            console.log(completion.data.choices[0].text);
            if (completion.data.choices[0].text.includes("How to") && !dataOpenAi.includes(completion.data.choices[0].text) && !completion.data.choices[0].text == "") {
                var repData = completion.data.choices[0].text.slice(completion.data.choices[0].text.indexOf("H"), completion.data.choices[0].text.indexOf("?") + 1);
                var repData2 = repData.replace(/\n/, "");
                var repData3 = repData2.replace(/->/, "");
                dataOpenAi.push(repData3);
            }
        }
        console.log(dataOpenAi);
        if (dataOpenAi.includes(val)) {
            var indexVal = dataOpenAi.indexOf(val);
            dataOpenAi.splice(indexVal, 1);
            console.log(dataOpenAi);
            var readyData = await SymentricCheckOpenAi(val, dataOpenAi)
        } else {
            await checkifEmpty(dataOpenAi, val);
            console.log(dataOpenAi);
            var readyData = await SymentricCheckOpenAi(val, dataOpenAi)
        }
        return readyData;
    } catch (error) {
        return undefined
    }
};

async function checkifEmpty(data, val) {
    if (data.length == 0) {
        return true;
    } else {
        return false
    }
}
async function SymentricCheckOpenAi(val, choices) {
    var compare = [];
    var dataSysmentricOpenAI = await use.loadQnA().then(model => {
        const input = {
            queries: [val],
            responses: choices,
        };
        const embeddings = model.embed(input);
        scores = tf.matMul(embeddings['queryEmbedding'],
            embeddings['responseEmbedding'], false, true).dataSync();
        for (let index = 0; index < choices.length; index++) {
            compare.push({
                "choice": choices[index],
                "score": scores[index]
            })
        }
        var sortdata = Sort(compare);
        return sortdata[Math.floor(sortdata.length / 2)].choice;
    });

    console.log(dataSysmentricOpenAI);
    return dataSysmentricOpenAI;
}

function Sort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {

            if (arr[j + 1].score < arr[j].score) {

                [arr[j + 1], arr[j]] = [arr[j], arr[j + 1]]
            }
        }
    };
    return arr;
};


module.exports = {
    openAI
}