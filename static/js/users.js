var userState = 'grid';

function initUserGrid() {
    d3.json('/users', function(json) {

        var users = json.users;

        svg.selectAll('.user')
            .data(users)
            .enter().append('image')
            .attr('xlink:href', function(d) { return 'http://www.gravatar.com/avatar/' + d.gravatar_hash + '?s=80&d=wavatar'; })
            .attr('class', 'user')
            .attr('name', function(d) { return d.name; })
            .attr('width', userImageSize)
            .attr('height', userImageSize)
            .attr('x', function(d) { return ( (d.order % userGridRowSize) * (userGridSpacing + userImageSize) ); })
            .attr('y', function(d) { return ( Math.floor(d.order / userGridRowSize) * (userGridSpacing + userImageSize)); })
            .attr('rx', 5).attr('ry', 5)
            .on('click', userClickHandler);

    });
}

function userClickHandler(datum) {

    $('.user').each(function() {
        if ($(this).attr('name') !== datum.name) {
            $(this).attr('focused', 'false');
        } else {
            $(this).attr('focused', 'true');
        }
    });

    if (userState == 'grid') {

        userState = 'collapsed';

        svg.selectAll('.user[focused=true]')
            .transition()
            .duration(500)
            .attr('x', 0)
            .attr('y', 0)
            .each('end', function(datum) { showUserCaption(datum); drawBracket(); });

        svg.selectAll('.user[focused=false]')
        .transition()
        .duration(500)
        .attr('x', -1 * userImageSize)
        .attr('y', -1 * userImageSize);

    } else if (userState == 'collapsed') {

        userState = 'grid';

        svg.selectAll('.user')
            .transition()
        .duration(500)
        .attr('x', function(d) { return ( (d.order % userGridRowSize) * (userGridSpacing + userImageSize) ); })
        .attr('y', function(d) { return ( Math.floor(d.order / userGridRowSize) * (userGridSpacing + userImageSize)); });

        removeUserCaption();
        removeBracket();

    }

}

function showUserCaption(datum) {

    svg.append('text')
        .datum(datum)
        .attr('x', userImageSize + userGridSpacing)
        .attr('y', Math.floor(userImageSize / 2) + 10)
        .attr('class', 'user-caption')
        .attr('text-anchor', 'left')
        .attr('font-size', 50)
        .attr('opacity', 0)
        .text(function(d) { return d.name + ' : ' + d.score + ' Points'; });

    svg.selectAll('.user-caption')
        .transition(250)
        .attr('opacity', 1);
}

function removeUserCaption(datum) {

    svg.selectAll('.user-caption')
        .transition(250)
        .attr('opacity', 0)
        .remove();

}
