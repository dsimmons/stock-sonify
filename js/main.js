function getYahooTimeSeriesData(symbol, days, fn) {
    var now = new Date();
    var before = new Date();
    var years = Math.floor(days/365);
    //var months = Math.floor((days%365)/30);
    before.setFullYear(now.getFullYear() - (Math.floor(days/365)));

    var url = "http://ichart.finance.yahoo.com/table.csv?s=" + symbol + "&a=" +
    (before.getMonth()+1) + "&b=" + before.getDate() + "&c="+before.getFullYear() +
        "&d=" + (now.getMonth()+1) + "&e=" + now.getDate() + "&f=" + now.getFullYear() + "&g=d&ignore=.csv";

    $.get(url, function(data) {
        var rawData = getBetween(data.responseText, "<p>", "</p>", 0);
        var rows = rawData.split(" ");
        rows.shift(); // Remove header row
        rows.shift(); // Remove the rest from Adj Close
        rows = rows.map(function(element) {
            var s = element.split(",");
            return {
                "date": s[0],
                "open": parseFloat(s[1]),
                "high": parseFloat(s[2]),
                "low": parseFloat(s[3]),
                "close": parseFloat(s[4]),
                "volume": parseInt(s[5], 10),
                "adjclose": parseFloat(s[6])
            };
        });
        calcDailyReturn(rows);
        fn(rows.reverse()); // Return to calling function in order of least-most recent (opposite of default)
    });
}

function getBetween(source, start, finish, from) {
    if (from === null) from = 0;
    var startPosition = source.indexOf(start, from) + start.length;
    var endPosition = source.indexOf(finish, startPosition);
    return source.substr(startPosition, (endPosition-startPosition));
}

// OHLC data passed in in order of most-least recent
// ((Today's close - Yesterday's close) / Yesterday's Close) x 100 to convert to percentage.
function calcDailyReturn(timeSeries) {
    for (var i = 0; i < timeSeries.length-1; i++) {
        timeSeries[i].dailyReturn = (timeSeries[i].close - timeSeries[i+1].close) / timeSeries[i+1].close;
        timeSeries[i].dailyReturn *= 100;
    }
}

function calcLowestField(timeSeries, field) {
    var lowest = 1000000000000000000000;
    for(var i = 0; i < timeSeries.length; i++) {
        if(timeSeries[i][field] < lowest) {
            lowest = timeSeries[i][field];
        }
    }
    return lowest;
}

function calcHighestField(timeSeries, field) {
    var highest = -100000000000000000000;
    for(var i = 0; i < timeSeries.length; i++) {
        if(timeSeries[i][field] > highest) {
            highest = timeSeries[i][field];
        }
    }
    return highest;
}

function calcAverageField(timeSeries, field) {
    var average = 0.0;
    var minus = 0;
    for(var i = 0; i < timeSeries.length; i++) {
        if(timeSeries[i][field]) {
            average += timeSeries[i][field];
        } else {
            minus++;
        }
    }
    return average / (timeSeries.length-minus);
}

function calcStdDev(timeSeries) {
    var average = calcAverageField(timeSeries, "dailyReturn");
    var stddev = 0.0;
    var sum = 0;
    for(var i = 0; i < timeSeries.length; i++) {
        if(timeSeries[i]["dailyReturn"]) {
            sum += Math.pow(timeSeries[i]["dailyReturn"] - average, 2);
        }
    }
    return Math.sqrt((1/timeSeries.length)*sum);
}

/* Sonification */
function playReturnSeriesSonification(timeOfOneBar) {
    if(window.chart_data === null) return false;

    var wave = new RIFFWAVE();
    wave.header.sampleRate = 44100;
    wave.header.numChannels = 1;
    var sound = [];
    var dataLength = window.chart_data.length;
    var timeSeriesData = window.chart_data;
    var averageVolume = calcAverageField(timeSeriesData, "volume");
    var stdDev = calcStdDev(timeSeriesData);
    var lowestReturn = calcLowestField(timeSeriesData, "dailyReturn");
    var highestReturn = calcHighestField(timeSeriesData, "dailyReturn");
    var lowestVolume = calcLowestField(timeSeriesData, "volume");
    var highestVolume = calcHighestField(timeSeriesData, "volume");
    var lengthOfDataPoint = timeOfOneBar;
    var toleranceOfPhase = 0.05;
    var outlier = 0.0;
    var waveDivider = 0;
    var previousWaveDivider = 0;
    var x = 0;

    for(var i=1; i < dataLength; i++) {
        var stoppingPoint = lengthOfDataPoint * 44100 * i;
        var currentReturn = timeSeriesData[i].dailyReturn;
        waveDivider = map(currentReturn, lowestReturn, highestReturn, 10, 50);

        //Phase Mapping - Hardly Works
        var tryingToMatch = Math.sin(x/previousWaveDivider);
        var c = Math.sin(x/waveDivider);
        while(true) {
            if(!tryingToMatch || !c) break;
            c = Math.sin(x/waveDivider);
            if( Math.abs(tryingToMatch - c) > toleranceOfPhase) {
                sound[x++] = 128+Math.round(127*Math.sin(x/waveDivider));
            } else {
                break;
            }
        }

        while(x < stoppingPoint) { //The sound for each data point should be this long... 44100 = 1 Second
            if((currentReturn/stdDev) > 1.0) {
                sound[x++] = 128+Math.round(127*Math.sin(x/8*currentReturn/stdDev));
            } else {
                sound[x++] = 128+Math.round(127*Math.sin(x/waveDivider));
            }
        }

        previousWaveDivider = waveDivider;
    }

    wave.Make(sound);

    audio = new Audio(wave.dataURI);

    $(audio).on('timeupdate', function(e) {
        var dataPointOn = Math.round(map(audio.currentTime, 0, audio.duration, 0, dataLength));
        if(!timeSeriesData[dataPointOn] || !timeSeriesData[dataPointOn].volume) return;
        audio.volume = map(timeSeriesData[dataPointOn].volume, lowestVolume, highestVolume, 0.1, 0.9);
    });

    audio.play();
}

function map(value, istart, istop, ostart, ostop) {
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}
