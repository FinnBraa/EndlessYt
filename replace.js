const fs = require("fs");

function core() {
    var fileData = fs.readFileSync("./HowToOpenAi.json", "utf8");
    var stringData = JSON.stringify(fileData);
    var newData = fileData.replace(/</gi, "");
    var newData2 = newData.replace(/>/gi, "");
    fs.writeFileSync("./HowToWithout.json", newData2);
}

core();