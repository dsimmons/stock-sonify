function getYahooTimeSeriesData(symbol, years, fn) {
    var now = new Date();
    var before = new Date();
    before.setFullYear(now.getFullYear() - years);

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
                "open": s[1],
                "high": s[2], 
                "low": s[3], 
                "close": s[4], 
                "volume": s[5], 
                "adjclose": s[6]
            };
        });
        calcDailyReturn(rows);
        fn(rows);
    });
}

function getBetween(source, start, finish, from) {
    if (from === null) from = 0;
    var startPosition = source.indexOf(start, from) + start.length;
    var endPosition = source.indexOf(finish, startPosition);
    return source.substr(startPosition, (endPosition-startPosition));
}

function calcDailyReturn(timeSeries) {
    for(var i = 1; i < timeSeries.length; i++) {
        timeSeries[i].dailyReturn = (timeSeries[i].close / timeSeries[i-1].close) - 1;
    }
}
