 (function(){
  /*----
  Config
  ----*/
  //Original code

  /*var config = {
    circleCenter: {x: 500, y: 250},
    majorRadius: 150,
    pointRadius: 5,
    cityViewPointRadius: 7,
    spreadDistance: 15,  // distance between spread points
    labelPositions: [{x: 670, y: 50}, {x: 670, y: 400}, {x: 330, y: 400}, {x: 330, y: 50}],
    quadrantLabelPositions: [{x: 520, y: 165}, {x: 520, y: 285}, {x: 390, y: 285}, {x: 390, y: 165}],
    quadrangLabelWidths: [80, 95, 90, 90],
    labelSides: ['left', 'left', 'right', 'right'],
    selectedQuarter: null, // which quarter to display
    labelFontSize: 14,
    historyColors: ['#BC141A', '#D05A5F', '#DA8689', '#E6B4B5', '#F5DCDC', '#F5DCDC', '#F5DCDC', '#F5DCDC', '#F5DCDC']
  }	*/

  var config = {
    circleCenter: {x: 350, y: 330},
    majorRadius: 150,
    pointRadius: 5,
    cityViewPointRadius: 7,
    spreadDistance: 15,  // distance between spread points
    labelPositions: [{x: 520, y: 100}, {x: 520, y: 450}, {x: 180, y: 450}, {x: 180, y: 100}],
  
    quadrantLabelPositions: [{x: 370, y: 245}, {x: 370, y: 365}, {x: 240, y: 365}, {x: 240, y: 245}],
    quadrangLabelWidths: [80, 95, 90, 90],
    labelSides: ['left', 'left', 'right', 'right'],
    selectedQuarter: null, // which quarter to display
    labelFontSize: 14,
    historyColors: ['#BC141A', '#D05A5F', '#DA8689', '#E6B4B5', '#F5DCDC', '#F5DCDC', '#F5DCDC', '#F5DCDC', '#F5DCDC']
  }	

  /*----
  Globals
  -----*/
  
  var d3elements = {
    chart: null, // container
    clock: null, // clock group
    points: null, // points
    submenu: null,
  }

  var data = [];
  var quadrantData = [];
  var regionData = [];
  var quarters = [];
  var regions = [];
  var cityData = {};

  var pointData = []; // An array of the current points (overview or city) including position data, city list (in case of overview) etc.
  var labelData = [];

  var connectedLabelsComponent = null;
  // var toolTipComponent = null;

  var uiState = {
    selectedRegion: 'emea',
    selectedQuadrant: null,
    hoveredCity: null,
    selectedCity: null,
    selectedQuarter: 0,
    hoveredQuadrant: null,
    hoveredPoint: null
  }


  /*-----
  Helpers
  -----*/
  function degToRad(d) {
    return d * Math.PI / 180;
  }

  function timeToAngle(t) {
    // Converts time string hh:mm to angle
    var hr = +t.split(':')[0];
    hr === 12 ? hr = 0 : null;
    var min = +t.split(':')[1];

    var a = hr * 30;
    a += 0.5 * min;

    return a;
  }

  function angleToPosition(a, r) {
    // Converts angle to position
    return {
      x: r * Math.sin(degToRad(a)),
      y: - r * Math.cos(degToRad(a))
      }
  }

  function angleToQuadrant(a) {
    // Converts angle to quadrant 0, 1, 2 or 3
    return Math.floor(a/90);
  }

  function nameToId(c) {
    // Maps city/region name to unique name
    return c.replace(/ /g, '').toLowerCase();
  }

  function getCityGroupSelector(id) {
    if(id === undefined)
      id = '';
    else
      id = '.' + id;
  
    var selector = [
        '.label-group span.label' + id,
        'svg g.connectors path' + id,
        '.clock .points .overview circle' + id
      ].join(', ');
    return selector;
  }

  function groupHistoricPoints(quarters, angles, positions) {
    // Group quarters by position
    var groups = {};
    _.each(angles, function(a, i) {
      if(_.has(groups, a)) {
        groups[a].quarters.push(quarters[i]);
      } else {
        groups[a] = {
          angle: a,
          position: positions[i],
          quarters: [quarters[i]]
        };
      }
    });

    groups = _.map(groups, function(g) {
      return {
        quarters: g.quarters,
        position: g.position
      }
    });
    // console.log(groups);
    return groups;
  }

  function spreadHistoricPoints(quarters, angles) {
    // Spread points with same angle radially

    var angleRadii = {};
    for(var i=0; i<48; i++)
      angleRadii[i * 7.5] = config.majorRadius;

    // console.log(angleRadii);

    var spread = _.map(angles, function(a) {
      var ret = angleToPosition(a, angleRadii[a]);
      angleRadii[a] += config.spreadDistance;
      // console.log(a, angleRadii[a], ret);
      return ret;
    });

    return spread;
  }


  /*------------
  Initialisation
  ------------*/
  function init() {
						
    quarters = _.keys(data[0]).filter(function(v) {return v.indexOf('Q') >= 0;}).reverse();
			//console.log(data[0])
    uiState.selectedQuarter = 0; //quarters.length-1;
    // // uiState.selectedQuarter = 2; // Just for testing

    createCityData();
    getRegions();

    d3elements.chart = d3.select('#office-clock .chart-container');
    d3elements.clock = d3elements.chart.select('svg g.clock');
    d3elements.points = d3elements.clock.select('.points');
    d3elements.submenu = d3.select('#office-clock .submenus div.submenu');
    d3elements.historyKey = d3.select('#office-clock .submenus div.history-key svg');
    d3elements.exitCityView = d3.select('#office-clock .exit-city-view');

    connectedLabelsComponent = animdata.d3.connectedLabels()
      .connectorContainer('g.connectors')
      .fontSize(config.labelFontSize);

    var regionLU = {};
    _.each(regionData, function(r) {
      regionLU[r.Region] = r;
    });
    regionData = regionLU;
  }

  function getRegions() {
    regions = ['All', 'Americas', 'EMEA', 'Asia Pacific'];
  }

  function createCityData() {
    _.each(data, function(c) {
      var city = {};
      city.times = _.map(quarters, function(q) {
        return {quarter: q, t: c[q]};
      });
      city.angles = _.map(city.times, function(q) {
        return timeToAngle(q.t);
      });
      city.positions = _.map(city.angles, function(a) {
        return angleToPosition(a, config.majorRadius);
      });
      city.groupedPositions = groupHistoricPoints(quarters, city.angles, city.positions);
      city.spreadPositions = spreadHistoricPoints(quarters, city.angles);
      city.region = c.Region;
	  city.primerent=c.PrimeRent;

      var quadrant = angleToQuadrant(city.angles[uiState.selectedQuarter]);
      city.classes = [nameToId(c.City), nameToId(c.Region), 'quadrant-' + quadrant];
      cityData[c.City] = city;
    });
    // console.log(cityData);
  }



  /*----------
  Construction
  ----------*/
  function construct() {
    constructBackground();
    // constructOverview();
    constructMenu();
    constructSubmenu();
    constructHistoryKey();
    // constructCityview();
  }

  function constructBackground() {
    d3elements.clock
      .attr('transform', animdata.svg.translate(config.circleCenter.x, config.circleCenter.y));

    var r = config.majorRadius;

    d3elements.clock
      .insert('circle', '.points')
      .classed('shadow', true)
      .attr('r', r);

    function arcPath(p1, p2) {
      return 'M0,0 L'+p1[0]+','+p1[1] +' A'+r+','+r+' 0 0,1 '+p2[0]+','+p2[1] +' Z';
    }
    var backgroundArcs = [[0, -r], [r,0], [0, r], [-r, 0], [0, -r]];
    for(var i=0; i<4; i++) {
      d3elements.clock
        .insert('path', '.points')
        .classed('quadrant-background', true)
        .attr('d', arcPath(backgroundArcs[i], backgroundArcs[i+1]));
    }

    d3elements.clock
      .insert('line', '.points')
      .attr('y1', -config.majorRadius)
      .attr('y2', config.majorRadius);

    d3elements.clock
      .insert('line', '.points')
      .attr('x1', -config.majorRadius)
      .attr('x2', config.majorRadius);

    d3elements.clock
      .insert('circle', '.points')
      .attr('r', config.majorRadius);

    d3elements.chart
      .selectAll('div.quadrant-label')
      .data(quadrantData)
      .enter()
      .append('div')
      .attr('class', function(d, i) {return 'quadrant-' + i;})
      .classed('quadrant-label', true)
      .classed('no-select', true)
      .style('left', function(d, i) {return config.quadrantLabelPositions[i].x + 'px';})
      .style('top', function(d, i) {return config.quadrantLabelPositions[i].y + 'px';})
      .style('width', function(d, i) {return config.quadrangLabelWidths[i] + 'px';})
      .style('text-align', 'center')
      .text(function(d) {return d.Title;});
  }

  function constructMenu() {
    d3.select('#office-clock .menu')
      .selectAll('.item')
      .data(regions)
      .enter()
      .append('div')
      .attr('class', function(d) {return nameToId(d);})
      .classed('item group', true)
      .text(function(d) {return d === 'All' ? 'Global' : d;})
      .on('click', function(d) {
        uiState.selectedCity = uiState.selectedQuadrant = null;
        uiState.selectedRegion = d === 'All' ? 'all' : nameToId(d);
        // console.log(uiState.selectedRegion)
        update();
        // updateHighlights();
        d3.event.stopPropagation();
      });
  }

  function constructSubmenu() {
    // reverse quarters
    var i = 0;
    var q = _.map(quarters, function(q) {return {name: q, index: i++};}).reverse();

    d3elements.submenu
      .selectAll('.item')
      .data(q)
      .enter()
      .append('div')
      // .attr('class', function(d) {return nameToId(d);})
      .classed('item group', true)
      .text(function(d) {return d.name;})
      .on('click', function(d) {
        // console.log(d.index);
		//console.log("hi");
        //GA Code
        var trackEvent = d.name;
        //ga('send', 'event', 'propertyclockquarters', 'click', trackEvent);
        //console.log("GA - "+trackEvent);
        //dataLayer.push(['_trackEvent', 'propertyclockquarters', 'click', trackEvent, 1, true]);
        uiState.selectedQuarter = d.index;
        uiState.selectedCity = null;
        update();
        d3.event.stopPropagation();
      });
  }

  function constructHistoryKey() {
    var i = 0;
    var q = _.map(quarters, function(q) {return {name: q, index: i++};}).reverse();
    var g = d3elements.historyKey
      .selectAll('g')
      .data(q)
      .enter()
      .append('g')
      .attr('transform', function(d, i) {return animdata.svg.translate(20 + 105 * i, 18);});

    g.append('rect')
      .attr('height', '34px')
      .attr('width', '85px')
      .attr('rx', '5px')
      .attr('ry', '5px')
      .attr('transform', 'translate(-12, -17)');

    g.append('circle')
      .attr('r', config.pointRadius)
      .style('fill', function(d, i) {return config.historyColors[(quarters.length - 1) - i];});

    g.append('text')
      .text(function(d, i) {return d.name;})
      .attr('x', 10)
      .attr('y', 4);
  }

  /*----
  Events
  ----*/
  function setUpEvents() {
    d3elements.chart
      .selectAll('.quadrant-background')
      .on('click', function(d, i) {
        uiState.selectedCity = null;
        // uiState.selectedRegion = 'all';
       // uiState.selectedQuadrant = uiState.selectedQuadrant === i ? null : i;
	   	    uiState.selectedQuadrant = i;
        //alert(uiState.selectedQuadrant);
        //GA Code
		//console.log(uiState.selectedQuadrant)
        var trackingEvent = $(".selected").text()+" "+quadrantData[uiState.selectedQuadrant].Title;
        //ga('send', 'event', 'propertyclockquarters', 'click', trackingEvent);
        //console.log("GA - "+trackingEvent);
        //dataLayer.push(['_trackEvent', 'propertyclockquarters', 'click', trackingEvent, 1, true]);
        update();
        d3.event.stopPropagation();
      })
      .on('mouseover', function(d, i) {
        uiState.hoveredQuadrant = i;
        updateQuadrantBackgrounds();
        updatePoints();
      })
      .on('mouseout', function(d, i) {
        uiState.hoveredQuadrant = null;
        updateQuadrantBackgrounds();
        updatePoints();
      });
     d3elements.chart.selectAll('div.quadrant-label')
		 .on('mouseover', function(d, i) {
        uiState.hoveredQuadrant = i;
        updateQuadrantBackgrounds();
        updatePoints();
      })
	   .on('mouseout', function(d, i) {
        uiState.hoveredQuadrant = null;
        updateQuadrantBackgrounds();
        updatePoints();
      })
		 .on("click",function(d,i){
		// alert("hi")
		uiState.selectedCity = null;
        // uiState.selectedRegion = 'all';
      //  uiState.selectedQuadrant = uiState.selectedQuadrant === i ? null : i;
	    uiState.selectedQuadrant = i;
        //alert(uiState.selectedQuadrant);
	//	console.log(uiState.selectedQuadrant)
        //GA Code
        var trackingEvent = $(".selected").text()+" "+quadrantData[uiState.selectedQuadrant].Title;
        //ga('send', 'event', 'propertyclockquarters', 'click', trackingEvent);
        //console.log("GA - "+trackingEvent);
        //dataLayer.push(['_trackEvent', 'propertyclockquarters', 'click', trackingEvent, 1, true]);
        update();
        d3.event.stopPropagation();
	 })
    d3elements.chart
      .on('click', function() {
        uiState.selectedCity = uiState.selectedQuadrant = null;
        // uiState.selectedRegion = 'all';
        update();
      });

    d3elements.exitCityView
      .on('click', function() {
        uiState.selectedCity = uiState.selectedQuadrant = null;
        // uiState.selectedRegion = 'all';
        update();
      });
  }



  /*----
  Update
  ----*/
  function updateCityPointData() {
    var c = uiState.selectedCity;
    pointData = [];
	 pointDatafix = [];
	////////////////////////////////////////////////
	/*  var groups = {};

    _.each(cityData, function(v, k) {
      // console.log(uiState.selectedRegion);
     

      var t = v.times[uiState.selectedQuarter].t;
      var angle = v.angles[uiState.selectedQuarter];
      var quadrant = angleToQuadrant(angle);
      var classes = v.classes;

    
	console.log(groups)
      if(_.has(groups, t)) {
        groups[t].cities.push(k);
        groups[t].classes = _.union(groups[t].classes, classes);
      } else {
        groups[t] = {
          angle: angle,
          position: v.positions[uiState.selectedQuarter],
          cities: [k],
          classes: classes,
          quadrant: angleToQuadrant(angle)
        }
      }
    });

    pointDatafix = _.map(groups, function(v, k) {
      v.t = k;
      return v;
    });

    // Add angles
    pointDatafix = _.sortBy(pointDatafix, function(v) {
      return v.angle;
    });

    // Add regions
    pointDatafix = _.map(pointDatafix, function(g) {
      var regions = _.map(g.cities, function(c) {
        return cityData[c].region;
      });
      g.regions = regions;
      return g;
    });*/
	//console.log(cityData[c].spreadPositions)
	//////////////////////////////////////////////
	
    _.each(cityData[c].spreadPositions, function(p, i) {
		
      pointData.push({
        position: p,
        classes: [],
			index:i,
        quarter: quarters[i]
      });
    });
  }

  function updateOverviewPointData() {
    var groups = {};

    _.each(cityData, function(v, k) {
      // console.log(uiState.selectedRegion);
      if(uiState.selectedRegion !== 'all' && uiState.selectedRegion !== nameToId(v.region))
        return;

      var t = v.times[uiState.selectedQuarter].t;
      var angle = v.angles[uiState.selectedQuarter];
      var quadrant = angleToQuadrant(angle);
      var classes = v.classes;

      if(uiState.selectedQuadrant !== null && quadrant !== uiState.selectedQuadrant)
        return;

      if(_.has(groups, t)) {
        groups[t].cities.push(k);
        groups[t].classes = _.union(groups[t].classes, classes);
      } else {
        groups[t] = {
          angle: angle,
          position: v.positions[uiState.selectedQuarter],
          cities: [k],
          classes: classes,
          quadrant: angleToQuadrant(angle)
        }
      }
    });

    pointData = _.map(groups, function(v, k) {
      v.t = k;
      return v;
    });

    // Add angles
    pointData = _.sortBy(pointData, function(v) {
      return v.angle;
    });

    // Add regions
    pointData = _.map(pointData, function(g) {
      var regions = _.map(g.cities, function(c) {
        return cityData[c].region;
      });
      g.regions = regions;
      return g;
    });

   // console.log(pointData);
  }

  function updatePointData() {
    if(uiState.selectedCity !== null) {
      updateCityPointData();
    } else {
      updateOverviewPointData();
    }
    // console.log(pointData);
  }


  function updateCityLabelData() {
    var city = cityData[uiState.selectedCity];
    // console.log(city);

    var quadrant = angleToQuadrant(city.angles[0]);

    var lp = config.labelPositions[quadrant];
    var cc = config.circleCenter;
		//var cc =city.spreadPositions[0];
    var cp = city.spreadPositions[0];


var temp=0;

	if(  cp.y > 60)
	  {
		temp=80;
	
	  }
	 
	

    labelData = [
      {
        labelPosition: {x: lp.x, y: lp.y+temp},
        labels: [uiState.selectedCity],
        position: {x: cp.x + cc.x, y: cp.y + cc.y},
        connectorSide: quadrant < 2 ? 'left' : 'right'
      }
    ];
  }

  function updateOverviewLabelData() {
    var labelPos = _.map(config.labelPositions, function(p) {
      return {x: p.x, y: p.y};
    });

    var ySpacing = config.labelFontSize * 2.2;
	//console.log(ySpacing)
    var yOffset = [ySpacing, ySpacing, -ySpacing, -ySpacing];

    // Reverse and offset quadrants 2 & 3
    var numGroups2 = _.where(pointData, {quadrant: 2}).length;
    labelPos[2].y += (numGroups2 - 1) * ySpacing;
    var numGroups3 = _.where(pointData, {quadrant: 3}).length;
    labelPos[3].y += (numGroups3 - 1) * ySpacing;


    labelData = _.map(pointData, function(g) {
    // console.log(g);
      var labelGroup = {}
      labelGroup.labels = g.cities;

      var lp = labelPos[g.quadrant];
      labelGroup.labelPosition = lp;
	  		// console.log(g.cities.join("-")+"_"+g.quadrant)
				 $("#testdiv").text(g.cities.join(", "));
				 //console.log($("#testdiv").height())
			 var height=$("#testdiv").height();

	 if(height > config.labelFontSize)
		{
		// alert("hi")
		
			if(yOffset[g.quadrant] < 0)
			{
					labelPos[g.quadrant] = {x: lp.x, y: lp.y + yOffset[g.quadrant]-(height/2)};
			}
			else
			{
					labelPos[g.quadrant] = {x: lp.x, y: lp.y + yOffset[g.quadrant]+(height/2)};
			}
	}
	else
		{
			 labelPos[g.quadrant] = {x: lp.x, y: lp.y + yOffset[g.quadrant]};
		}
		// labelPos[g.quadrant] = {x: lp.x, y: lp.y + yOffset[g.quadrant]};
	 // console.log( labelPos[g.quadrant])
      labelGroup.connectorSide = g.quadrant > 1 ? 'right' : 'left';
		labelGroup.rel='good';
      labelGroup.position = {x: g.position.x + config.circleCenter.x, y: g.position.y + config.circleCenter.y};
      labelGroup.classes = _.map(g.cities, function(c) {
        return cityData[c].classes.join(' ');
	   /*console.log(c)
	   console.log(cityData[c])
	   return cityData[c].index;*/
	   // return 'test';
      });
	  //labelGroup.attr={'rel':'1224234'};
		//console.log(labelGroup)
      return labelGroup;
    });
    // console.log(labelData);
  }

  function updateLabelData() {

    if(uiState.selectedCity !== null) {
      updateCityLabelData();
	 // console.log("1")
    } else {
      updateOverviewLabelData();
	  //	  console.log("2")
    }
  }

  function updatePoints() {
    var u = d3elements.points
      .selectAll('circle')
      .data(pointData);

    u.enter()
      .append('circle');
u.style('stroke-width','0px');
    // If city has been selected, set up events to highlight the hovered quarter in the history key
    if(uiState.selectedCity !== null) {
      u.on('mouseover', function(d, i) {
		 // console.log("hello")
        uiState.hoveredPoint = i;
        updateHistoryKey();
      })
      .on('mouseout', function() {
        uiState.hoveredPoint = null;
        updateHistoryKey();
      })
      .on('click', function(d, i) {
        if(uiState.selectedCity === null)
          return;
        uiState.selectedQuarter = i;
        uiState.selectedCity = null;
        update();
        d3.event.stopPropagation();
      });
    }

    u.exit()
      .remove();

    u.attr('class', function(d) {return d.classes.join(' ');})
      .attr('cx', function(d) {return d.position.x;})
      .attr('cy', function(d) {return d.position.y;})
      .attr('r', uiState.selectedCity === null ? config.pointRadius : config.cityViewPointRadius)
      .style('fill', function(d, i) {
        if(uiState.selectedQuadrant !== null)
          return 'white';
        if(uiState.selectedCity === null)
          return '#2E75C1';
        return config.historyColors[i];
      })
      .style('stroke-width', uiState.selectedQuadrant !== null ? '2px' : '1px')
      .style('stroke', uiState.selectedQuadrant !== null ? '#2E75C1' : 'white');
  }

  function updateLabels() {
    d3elements.chart
      .datum(labelData)
      .call(connectedLabelsComponent);

    // Color
    d3elements.chart.selectAll('.label-group span.label')
      .style('color', uiState.selectedCity !== null ? '#BC141A' : '#2E75C1')
//		.attr('rel','good')
	  .attr('rel',function(d){
		var currentCity=d3.select(this).text();
		//console.log(cityData['London West End'])
		var perimeter=cityData[currentCity].primerent;
		 /*var data=_.map(pointData, function(g) {
			//var prime={};
			var perimeter= _.map(g.cities, function(c) {
				console.log("current city"+currentCity+"------"+c)
					if(currentCity == c)
				 return cityData[c].primerent;
	   
				 });

	return perimeter;
		})*/
		
			return perimeter;
	});

    // Events
    if(uiState.selectedCity === null) {
		//alert("hello")
		/*sliderValues('','',1);
			setValues('','',1);*/
			
      d3elements.chart
        .selectAll('.label-group span.label')
        .on('click', function(d) {
          var trackEvent = $(".selected").text()+" "+d;
          //ga('send', 'event', 'propertyclockquarters', 'click', trackEvent);
          uiState.selectedCity = d;
          uiState.selectedQuadrant = null;
          // uiState.selectedRegion = null;

          update();
          d3.event.stopPropagation();
        });
    } else {
				 
      // Deselect city
	  //alert("hi")
      d3elements.chart
        .selectAll('.label-group span.label')
        .on('click', function(d) {
          uiState.selectedCity = null;
          // uiState.selectedRegion = 'all';
          // uiState.selectedQuadrant = uiState.selectedQuadrant === i ? null : i;
		  //alert("hi");
          update();
          d3.event.stopPropagation();
      });
    }

  //////////////////////////////////////////////////////////////senthamizh///////////////////////////////////////////////////
	 d3elements.chart
        .selectAll('.label-group span.label')
        .on('mouseover', function(d) {
		/* var test=d3.select(this).attr("class").split(" ")[0];
		   _.each(cityData, function(v, k) {
			   console.log(k)
			   if(k==test)
			   {
			   console.log(v)
			   }

		   })*/

		 //console.log(d3.select(this).attr("class").split(" ")[0])
		 if($(".submenu .group:last").hasClass("selected") ==true)
		 {
			
			 $(".Headertxt").empty().text(d3.select(this).text()+" "+$('.submenu .selected').text())
			var rel =  (d3.select(this).attr("rel")).split(",");
			sliderValues(rel[0],rel[1],1);
			setValues(rel[0],rel[1],1);
		 }

          //uiState.selectedCity = null;
          // uiState.selectedRegion = 'all';
          // uiState.selectedQuadrant = uiState.selectedQuadrant === i ? null : i;
          //update();
         // d3.event.stopPropagation();
      });
  }

  

  function updateHistoryKey() {
    d3elements.historyKey
      .selectAll('rect')
      .style('display', function(d, i) {
        var i = quarters.length - 1 - i;
        return i === uiState.hoveredPoint ? 'block' : 'none';
      });
  }
  	var select = $( "#test" );

  var slider = $( "div#slider" ).slider(
		{
			min:204,
			max:1850,
			animate:true,
			disabled:true,
			range: "min",
			value: select[ 0 ].selectedIndex + 1,
			slide: function( event, ui )
			{
				select[ 0 ].selectedIndex = ui.value - 1;
			}
		});
		var slider1 = $( 'div#slider1').slider(
		{
			min:-16.1,
			max:37.5,
			animate:true,
			disabled:true,
			range: "min",
			value: select[ 0 ].selectedIndex - 25,
			slide: function( event, ui )
			{
				select[ 0 ].selectedIndex = ui.value - 25;
			}
		});
		var slider2 = $('div#slider2').slider(
		{
			min:4.1,
			max:20.8,
			animate:true,
			disabled:true,
			range: "min",
			value: select[ 0 ].selectedIndex + 1,
			slide: function( event, ui ) 
			{
				select[ 0 ].selectedIndex = ui.value - 1;
			}
		});
		$(".ui-slider-handle").each(function()
		{
			$(this).append("<div class='slider_values' style='margin-top:7px; color:#ffffff; overflow:hidden; font-weight:bold; position:relative; font-size:10px; font-family:verdana; padding-top:1px;'></div>"); 
		});

  	function setValues(a,b,c)
		{
			
			slider.slider( "value", a );
			slider1.slider( "value", b );
			slider2.slider( "value", c);
		}
		function sliderValues(x,y,z)
		{
			
			$('.slider_values').eq(0).html(x);
			$('.slider_values').eq(2).html(y);
			//$('.slider_values').eq(2).html(z);
		}
///////////////////////////////////////////////////////////////////////////////////END///////////////////////////////////////////////////////////////////////////////
  function update() {

    updatePointData();

    updateLabelData();

    updatePoints();

    updateLabels();

    updateAbout();
    updateQuadrantBackgrounds();
    updateMenu();
    updateSubmenus();
  }

  function updateQuadrantBackgrounds() {
    d3.selectAll('#office-clock .quadrant-background')
      .style('fill', function(d, i) {
        if(i === uiState.selectedQuadrant)
          return '#4175B6';
        if(i === uiState.hoveredQuadrant)
          return '#A6A6A6';
        return '#f8f8f8';
      });

    d3.selectAll('#office-clock .quadrant-label')
      .style('color', function(d, i) {
        if(i === uiState.selectedQuadrant)
          return 'white';
        if(i === uiState.hoveredQuadrant)
          return 'white';
        return '#2E75C1';
      });
  }

  function updateAbout() {
   /* var quadrant = uiState.selectedQuadrant;
    var region = uiState.selectedRegion;

    var d;
    if(quadrant !== null)
      d = quadrantData[quadrant];
    else
      d = regionData[region];

    var html = '';
   // html += '<h1>' + (d.Title ? d.Title : '') + '</h1>';


    if(uiState.selectedQuarter === 0)
     // html += '<p>' + (d.Copy ? d.Copy : '') + '</p>';
	//html += '<p>Click on a city to track rental position</p>';

    if(uiState.selectedCity !== null)
      html = '';

    d3.select('#office-clock .about')
      .html(html);*/
  }

  function updateMenu() {
    d3.selectAll('#office-clock .menu .item')
      .classed('selected', false);

    var r = uiState.selectedRegion; // ? nameToId(uiState.selectedRegion) : 'all';
    if(r === null)
      return;

    d3.select('#office-clock .menu .item.' + r)
      .classed('selected', true);
  }
d3.selection.prototype.size=function(){
	var count=0;
	this.each(function(){
		++count;
	})
		return count;
}
  function updateSubmenus() {
	  		var length=d3elements.submenu.selectAll('.item').size();
    if(uiState.selectedCity !== null) {
      d3elements.submenu.style('display', 'none');
      d3elements.historyKey.style('display', 'block');
      d3elements.exitCityView.style('display', 'block');
      return;
    }
    d3elements.submenu.style('display', 'block');
    d3elements.historyKey.style('display', 'none');
    d3elements.exitCityView.style('display', 'none');
    d3elements.submenu
      .selectAll('.item')
      .classed('selected', function(d) {

		//console.log(length)
	if(d.index === uiState.selectedQuarter == true && d.index ==0 )
		{
		
			//console.log("reset")
			setValues(204,-16.1,0);
			sliderValues(204,-16.1,0);
			$(".clk_stat").show();
			
			
		}else	{
					 $(".Headertxt").empty();
					$(".clk_stat").hide();
		}
		
        return d.index === uiState.selectedQuarter;
      });
  }

  /*-----
  Loading
  -----*/
  d3.csv('data/clock-data-q4.csv?10', function(err, csv0) {
    d3.csv('data/quadrant-data.csv?1', function(err, csv1) {
      d3.csv('data/region-data.csv?1', function(err, csv2) {
        data = csv0;
        quadrantData = csv1;
        regionData = csv2;

        init();

        construct();
        setUpEvents();
        update();
      });
    });
  });


})();