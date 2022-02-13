const googleTrends = require('google-trends-api');
var alltimeresults = 0;
var AVERAGESEARCH = 1
var delay = 1000;
var test = 1000;

var x = setInterval(() => {
    test += 1000;
    if (test > delay) {
        alltimeresults += 1;
        googleTrends.interestOverTime({ keyword: 'Crab', startTime: new Date("2022-01-10"), endTime: new Date(Date.now()) })
            .then(function(results) {
                var realResults = JSON.parse(results);
                var ll = realResults.default.timelineData.length
                if ((realResults.default.timelineData[ll - 1].value[0] / 100) == 1) {
                    delay = 0;
                } else if (realResults.default.timelineData[ll - 1].value[0] / 100 < 1) {
                    delay = (1 / (realResults.default.timelineData[ll - 1].value[0] / 100)) * 1000;
                }
                console.log(alltimeresults);
            })
            .catch(function(err) {
                console.error('Oh no there was an error', err);
            });
        test = 1000;
    }
}, 1000)