$(function() {

    var w = 800;
    var h = 400;

    // Select 1Y resolution by default
    $(document).ready( function() {
        $('#default_resolution').button('toggle');
    });

    // Map 'space' to hitting "play"
    $(document).keypress( function(e) {
        if (e.keyCode == 32) $('#play').trigger('click');
    });

    // Reset buttons if changing ticker symbol.
    $('#ticker').focus( function() {
        $('#download').button('reset');
        $('#play').addClass('disabled').removeClass('btn-success');
    });

    // Allow enter key to simulate clicking "download data" button
    $('#ticker').keypress( function(e) {
        if (e.keyCode == 13) $('#download').trigger('click');
    });

    // Grab ticker data from Yahoo. Do nothing if no symbol is present.
    // Enable green "play" button on success.
    $('#download').click( function() {
        var ticker = $('#ticker').val();
        if (ticker.length === 0) return;

        //TODO: allow the changing of resolution
        $('#download').button('loading');
        getYahooTimeSeriesData(ticker, 1, function(data) {
            if (data) {
                $('#download').button('reset');
                $('#play').removeClass('disabled').addClass('btn-success');
                window.chart_data = data;
                $('#plot').remove();

                var chart = d3.select('#chart').append('svg:svg')
                .attr('width', w)
                .attr('height', h)
                .attr('id', 'plot');

                var x = d3.scale.linear()
                .domain([0, window.chart_data.length])
                .range([0, w]);
                var y = d3.scale.linear()
                .domain([0, d3.max(window.chart_data, function(d) { return d.close; } ) ])
                .rangeRound([0, h]);
                var barWidth = w / window.chart_data.length;


                chart.selectAll("rect")
                .data(window.chart_data)
                .enter().append("svg:rect")
                .attr("x", function(d, i) { return x(i); })
                .attr("y", function(d) { return h - y(d.close) + 15; })
                .attr("height", function(d) { return y(d.close); })
                .attr("width", barWidth)
                .attr("fill", "#ccc");
            }
        });
    })

    // Start sonification
    $('#play').click( function() {
        // If the play button is green and ready to be pressed...
        if ( ! ($('#play').hasClass('disabled')) ) {
            playReturnSeriesSonification(0.1);
        }
    });
});
