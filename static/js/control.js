$(document).ready(function() {
    initControls();
    initUserGrid();
});

controls = [
    {
    'name': 'userSort',
    'text': 'Constant Ordering',
    'state': 'constant',
    'x': 1100,
    'y': 0,
    'dx': 100,
    'dy': 24,
    'width': 200,
    'height': 35,
    'rectFill': '#ff8c00',
    'textFill': 'black'
    }
];

function initControls() {
    var enterControls = svg.selectAll('.control')
        .data(controls).enter().append('g')
        .attr('class', 'control')
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
        .attr('state', function(d) { return d.state; })
        .style('cursor', 'pointer')
        .on('click', cycleSortMethod);

    enterControls.append('rect')
        .attr('width', function(d) { return d.width; })
        .attr('height', function(d) { return d.height; })
        .style('fill', function(d) { return d.rectFill; });

    enterControls.append('text')
        .attr('x', function(d) { return d.dx; })
        .attr('y', function(d) { return d.dy; })
        .attr('font-size', 24)
        .attr('text-anchor', 'middle')
        .text(function(d) { return d.text; })
        .style('fill', function(d) { return d.textFill; });
}

function updateControls() {

    var updateControls = svg.selectAll('.control')
        .transition();

    updateControls.select('text')
        .text(function(d) { return d.text; });

}

function cycleSortMethod(d) {

    if (d.name === 'userSort') {
        if (d.state === 'constant') {
            d.text = 'Ranked Ordering';
            d.state = 'ranked';
        } else if (d.state === 'ranked') {
            d.text = 'Constant Ordering';
            d.state = 'constant';
        }
    }

    changeUserSortMethod(d.state);
    updateControls();
}
