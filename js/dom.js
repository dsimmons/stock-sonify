$(function() {

    var w = 800;
    var h = 400;
    audio = null;

    // Select 1Y resolution by default
    $(document).ready( function() {
        $('#default_resolution').button('toggle');
        $('#ticker').focus();
    });

    // Map 'space' to hitting "play"
    $(document).keypress( function(e) {
        if (e.keyCode == 32) $('#play').trigger('click');
    });

    //TODO: fix resolution toggle
    $('#resolution > button').click( function(e) {
        console.log(e);
    });

    // Reset buttons if changing ticker symbol.
    $('#ticker').focus( function() {
        $('#download').button('reset');
        $('#play').addClass('disabled').removeClass('btn-success btn-warning');
        $('#play > i').attr('class', 'icon-play');
        if (audio) audio.pause();
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
        getYahooTimeSeriesData(ticker, 365, function(data) {
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
                //.attr("fill", "#ccc");
                .attr('fill', function(d) {
                    return d.dailyReturn > 0.0 ? 'green' : 'red';
                });
            }
        });
    })

    // Start sonification
    $('#play').click( function() {
        // If the play button is green and ready to be pressed...
        if ( ! ($('#play').hasClass('disabled')) ) {

            // Ready to go, change color and icon of button after press.
            if ($('#play').hasClass('btn-success')) {

                playReturnSeriesSonification(0.1);
                $('#play')
                    .removeClass('btn-success')
                    .addClass('btn-warning');
                $('#play > i').attr('class', 'icon-pause');

                var arr = [];
                $('#plot').children().each( function() {
                    arr.push(this);
                });
                for (var i = 0; i < arr.length; i++) {
                    setTimeout(function(element) {
                        console.log(element);
                        $(element).attr('fill', '#ccc');
                    }, 100*(i+1), arr[i]);
                }

            // Stop playback, change the button color and icon back.
            } else if ($('#play').hasClass('btn-warning')) {
                audio.pause();
                $('#play')
                    .removeClass('btn-warning')
                    .addClass('btn-success');
                $('#play > i').attr('class', 'icon-play');
            }
        }
    });
});
