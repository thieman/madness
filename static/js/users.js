var userState = 'grid';
var userSort = 'constant';

function initUserGrid() {
    d3.json('/users', function(json) {

        var users = json.users;
        users.forEach(function(d) {
            d.gridX = ( (d.order % userGridRowSize) * (userGridSpacing + userImageSize) );
            d.gridY = Math.floor(d.order / userGridRowSize) * (userGridSpacing + userImageSize);
            d.rankedX = ( (d.rank % userGridRowSize) * (userGridSpacing + userImageSize) );
            d.rankedY = Math.floor(d.rank / userGridRowSize) * (userGridSpacing + userImageSize);
        });

        var userJoin = svg.selectAll('.user')
            .data(users)
            .enter().append('g')
            .attr('class', 'user')
            .attr('name', function(d) { return d.name; })
            .attr('transform', function(d) { return 'translate(' + d.gridX + ',' + d.gridY + ')'; })
            .style('cursor', 'pointer')
            .on('click', userClickHandler);

        userJoin.append('image')
            .attr('xlink:href', function(d) {
                if ('img' in d) {
                    return '/static/img/' + d.img;
                } else {
                    return 'http://www.gravatar.com/avatar/' + d.gravatar_hash + '?s=80&d=wavatar';
                }
            })
            .attr('class', 'user-image')
            .attr('width', userImageSize)
            .attr('height', userImageSize)
            .attr('rx', 5).attr('ry', 5);

        userJoin.append('text')
            .attr('dx', userImageSize - 35)
            .attr('dy', userImageSize - 5)
            .text(function(d) { return d.score; })
            .attr('font-size', 32)
            .attr('class', 'user-score')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .style('stroke', 'black')
            .style('stroke-width', 0.5)
            .style('fill-opacity', 1);

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
            .attr('transform', 'translate(0,0)')
            .each('end', function(datum) { showUserCaption(datum); drawBracket(); });

        svg.selectAll('.user[focused=false]')
            .transition()
            .duration(500)
            .attr('transform', 'translate(' + -1 * userImageSize + ',' + -1 * userImageSize + ')');

    } else if (userState == 'collapsed') {

        userState = 'grid';
        refreshUserGrid();
        removeUserCaption();
        removeBracket();

    }

}

function refreshUserGrid() {

    if (userSort === 'constant') {
        svg.selectAll('.user')
            .transition()
            .duration(500)
            .attr('transform', function(d) { return 'translate(' + d.gridX + ',' + d.gridY + ')'; });
    } else if (userSort === 'ranked') {
        svg.selectAll('.user')
            .transition()
            .duration(500)
            .attr('transform', function(d) { return 'translate(' + d.rankedX + ',' + d.rankedY + ')'; });
    }

}

function changeUserSortMethod(newState) {
    userSort = newState;
    if (userState === 'grid') {
        refreshUserGrid();
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
        .text(function(d) { return d.name; });

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
