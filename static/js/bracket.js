var bMargin = {top: 120, right: 0, bottom: 10, left: 10},
	bWidth = width - bMargin.left - bMargin.right,
	bhWidth = width / 2,
	bHeight = height - bMargin.top - bMargin.bottom,
	i = 0,
	duration = 500,
	root;

var tree = d3.layout.tree().size([bHeight, bWidth]);

var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });

var connector = elbow;

var vis = svg.append('g')
	.attr('transform', 'translate(' + bMargin.left + ',' + bMargin.top + ')')
	.attr('class', 'bracket');

function removeBracket() {
	update({});
}

function drawBracket() {

	var user_name = $('[focused=true]').attr('name');

	d3.json('/bracket/' + user_name, function(json) {

		root = json.bracket;
		root.x0 = bHeight / 2;
		root.y0 = bWidth / 2;

		var t1 = d3.layout.tree().size([bHeight, bhWidth]).children(function(d) { return d.left; }),
			t2 = d3.layout.tree().size([bHeight, bhWidth]).children(function(d) { return d.right; });
		t1.nodes(root);
		t2.nodes(root);

		var rebuildChildren = function(node) {
			node.children = getChildren(node);
			if (node.children) node.children.forEach(rebuildChildren);
		};

		rebuildChildren(root);
		root.isRight = false;
		update(root);

	});

}

function update(source) {

	var nodes = toArray(source);

	nodes.forEach(function(d) { d.y = d.depth * 90 + bhWidth; });

	var node = vis.selectAll('g.node')
		.data(nodes, function(d) { return d.id || (d.id = ++i); });

	var nodeEnter = node.enter().append('g')
		.attr('class', 'node')
		.attr('transform', function(d) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
		.attr('opacity', function(d) { return d.name ? 1 : 0; })
		.on('click', click);

	nodeEnter.append('circle')
	    .attr('r', 1e-6)
        .style('fill', function(d) { return d._children ? 'lightsteelblue' : '#fff'; });

	nodeEnter.append('text')
		.attr('dy', function(d) { return d.seed ? 3 : 14; })
		.attr('dx', function(d) { return d.seed ? 15 * (d.isRight ? 1 : -1) : 0; })
		.attr('text-anchor', function(d) { return d.seed ? (d.isRight ? 'start' : 'end') : 'middle'; })
		.attr('text-decoration', function(d) { return d.eliminated ? 'line-through' : 'normal'; })
		.style('font-weight', function(d) { return d.winner ? 'bold' : 'normal'; })
		.style('fill', function(d) { return d.winner ? '#090' : (d.eliminated ? '#900' : 'black'); })
		.text(function(d) { return d.name; })
		.style('fill-opacity', 1e-6);

	var nodeUpdate = node.transition()
		.duration(duration)
		.attr('transform', function(d) { p = calcLeft(d); return 'translate(' + p.y + ',' + p.x + ')'; });

	nodeUpdate.select('circle')
		.attr('r', 4.5)
		.style('fill', function(d) { return d._children ? 'lightsteelblue' : '#fff'; });

	nodeUpdate.select('text')
		.style('fill-opacity', 1);

    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { p = calcLeft(d.parent||source); return "translate(" + p.y + "," + p.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6)
		.remove();

    nodeExit.select("text")
        .style("fill-opacity", 1e-6)
		.remove();

    // Update the links...
    var link = vis.selectAll("path.link")
        .data(tree.links(nodes), function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return connector({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", connector);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = calcLeft(d.source||source);
          if (d.source.isRight) {
  			o.y -= bhWidth - (d.target.y - d.source.y);
  		} else {
  			o.y += bhWidth - (d.target.y - d.source.y);
  		}
          return connector({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        var p = calcLeft(d);
        d.x0 = p.x;
        d.y0 = p.y;
    });

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(source);
    }

}

function toArray(item, arr) {
  arr = arr || [];
  var i = 0, l = item.children?item.children.length:0;
  arr.push(item);
  for(; i < l; i++){
    toArray(item.children[i], arr);
  }
  return arr;
}

function calcLeft(d) {
	var l = d.y;
	if (!d.isRight) {
		l = d.y - bhWidth;
		l = bhWidth - l;
	}
	return {x: d.x, y: l};
}

function elbow(d, i) {
	var source = calcLeft(d.source);
	var target = calcLeft(d.target);
	var hy = (target.y - source.y) / 2;
	if (d.isRight) hy = -hy;
	return "M" + source.y + "," + source.x + "H" + (source.y + hy) + "V" + target.x + "H" + target.y;
}

function getChildren(d) {
	var a = [];
	if (d.left) for (var i = 0; i < d.left.length; i++) {
		d.left[i].isRight = false;
		d.left[i].parent = d;
		a.push(d.left[i]);
	}
	if (d.right) for (var i =0; i < d.right.length; i++) {
		d.right[i].isRight = true;
		d.right[i].parent = d;
		a.push(d.right[i]);
	}
	return a.length ? a : null;
}
