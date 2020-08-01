(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.bar = function() {
        var config = {
            datumAccessor: function(d) {
                return d;
            },
            accessor: function(d) {
                return d;
            },
            barWidth: 10,
            transform: {
                x: 11,
                y: 0
            },
            orientation: "vertical",
            domain: null,
            domains: null,
            range: [ -50, 50 ],
            showValues: false,
            valueSide: "right",
            valueLabelSize: 10,
            signColors: null,
            color: null
        };
        var data = null;
        var constructed = false;
        var scale = null;
        var scales = null;
        var d3elements = {
            container: null,
            bars: null
        };
        function constructChart() {}
        function updateScales() {}
        function barGeometry(d, i) {
            d = config.accessor(d);
            var x, y, width, height;
            var myScale = scale ? scale : scales[i];
            if (config.orientation === "horizontal") {
                x = i * config.transform.x;
                y = i * config.transform.y;
                width = 0;
                if (!isNaN(d)) {
                    width = Math.abs(myScale(d));
                }
                if (d < 0) x -= width;
                height = config.barWidth;
            } else {
                x = i * config.transform.x;
                height = Math.abs(myScale(0) - myScale(d));
                width = config.barWidth;
                y = myScale(0);
                if (d > 0) y -= height;
                y += i * config.transform.y;
            }
            d3.select(this).attr("x", x).attr("y", y).attr("width", width).attr("height", height);
        }
        function valueLabelGeometry(d, i) {
            var x, y, anchor;
            if (config.orientation === "horizontal") {
                x = i * config.transform.x + (config.valueSide === "right" ? 3 : -3);
                y = i * config.transform.y + .5 * (config.barWidth + .8 * config.valueLabelSize);
                anchor = config.valueSize === "right" ? "start" : "end";
            } else {}
            d3.select(this).attr("x", x).attr("y", y).style("text-anchor", anchor);
        }
        function update() {
            if (config.domain) scale = d3.scale.linear().domain(config.domain).range(config.range); else if (config.domains) scales = _.map(config.domains, function(d) {
                return d3.scale.linear().domain(d).range(config.range);
            });
            var u = d3elements.container.selectAll("rect").data(data);
            u.enter().append("rect");
            u.exit().remove();
            u.each(barGeometry).style("fill", function(d) {
                if (config.signColors) return d > 0 ? config.signColors[1] : config.signColors[0];
                if (config.color) return config.color;
                return "";
            });
            if (config.showValues) updateValueLabels();
        }
        function updateValueLabels() {
            var u = d3elements.container.selectAll("text.value-label").data(data);
            u.enter().append("text").classed("value-label", true).style("font-size", config.valueLabelSize + "px").text(function(d) {
                return d;
            });
            u.exit().remove();
            u.each(valueLabelGeometry);
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            data = config.datumAccessor(d3elements.container.datum());
            if (!constructed) {
                constructChart();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.connectedLabels = function() {
        var config = {
            fontSize: 12,
            position: {
                x: 0,
                y: 0
            },
            connectorContainer: null
        };
        var constructed = false;
        var data = null;
        var d3elements = {
            container: null,
            groups: null,
            svg: null,
            divLayer: null,
            labelContainer: null
        };
        function labelList(d) {
            var wrapper = d3.select(this).selectAll("span.label").data(function(d) {
				//console.log("tesrt"+d.labels)
                return d.labels;
            }).enter().append("span");
            wrapper.append("span").attr("class", function(dd, i) {
                if (d.classes) return d.classes[i];
                return "";
            }).classed("label", true).text(function(d) {
                return d;
            });
            wrapper.append("span").text(", ");
        }
        function init(selection) {
            d3elements.container = d3.select(selection[0][0]);
            d3elements.svg = d3elements.container.select(config.connectorContainer);
            data = d3elements.container.datum();
        }
        function connectorPath(d, i) {
			//console.log(d.labelPosition.x, d.labelPosition.y)
			/*if(d.position.y > 450)
			{
            var p = animdata.svg.pathAbsMove(d.labelPosition.x, d.labelPosition.y+100);
            p += animdata.svg.pathAbsLine(d.position.x, d.labelPosition.y+100);
            p += animdata.svg.pathAbsLine(d.position.x, d.position.y);
			}
			else
			{*/
				var p = animdata.svg.pathAbsMove(d.labelPosition.x, d.labelPosition.y);
            p += animdata.svg.pathAbsLine(d.position.x, d.labelPosition.y);
            p += animdata.svg.pathAbsLine(d.position.x, d.position.y);
			//}

			//console.log(p)
            return p;
        }
        function update() {
            d3elements.container.selectAll("div.label-group").remove();
            d3elements.svg.selectAll("path.connector").remove();
            var containerWidth = +d3elements.container.style("width").replace("px", "");
            var labelGroups = d3elements.container.selectAll("div.label-group").data(data).enter().append("div").style("position", "absolute").style("left", function(d) {
                return d.connectorSide === "left" ? d.labelPosition.x + "px" : null;
            }).style("right", function(d) {
                return d.connectorSide === "right" ? containerWidth - d.labelPosition.x + "px" : null;
            }).style("top", function(d) {
				
				var labelfx="";
				 $("#testdiv").text(d.labels.join(", "));
				// console.log(config.labelFontSize)
			 var height=$("#testdiv").height();
			 if(height > config.fontSize)
				{

						labelfx=d.labelPosition.y - .7 * ((height/2)+config.fontSize) + "px";
										
				}
				else
				{
					labelfx=d.labelPosition.y - .7* config.fontSize + "px";
					
				}
                return labelfx;
            }).style("font-size", config.fontSize + "px").attr("class", function(d, i) {
                return "label-group fxwidth group-" + i + " " + d.connectorSide;
            });
            labelGroups.each(labelList);
            labelGroups.selectAll("span:last-child span:last-child").remove();
            d3elements.svg.selectAll("path.connector").data(function(d) {
                return d;
            }).enter().append("path").attr("class", function(d, i) {
                var classes = [];
                classes.push("label-group");
                classes.push("group-" + i);
                if (d.classes) classes = _.union(classes, d.classes);
                return classes.join(" ");
            }).classed("connector", true).style("fill", "none").attr("d", connectorPath).moveToFront();
			//d3elements.svg.selectAll("path.connector").moveToFront();
        }
		d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
        function chart(selection) {
            init(selection);
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.groupedBar = function() {
        var config = {
            accessor: function(d) {
                return d;
            },
            datumAccessor: function(d) {
                return d;
            },
            groupWidth: 10,
            transform: {
                x: 11,
                y: 0
            },
            domain: null,
            range: [ -50, 50 ],
            colors: [ "steelblue", "indianred" ],
            seriesVisible: null,
            transitionDuration: 500
        };
        var data = null;
        var barWidths = [];
        var offsets = [];
        var constructed = false;
        var scale = null;
        var d3elements = {
            container: null,
            bars: null
        };
        function constructChart() {}
        function updateScale() {
            scale = d3.scale.linear().domain(config.domain).range([ config.range[1], config.range[0] ]);
        }
        function barGeometry(d, i, j) {
            d = config.accessor(d);
            var x = i * config.transform.x + offsets[j];
            var y = i * config.transform.y;
            var width = 0, height = 0;
            width = barWidths[j];
            height = Math.abs(scale(0) - scale(d));
            if (d > 0) {
                y = scale(d);
            } else {
                y = scale(0);
            }
            d3.select(this).transition().duration(constructed ? config.transitionDuration : 0).attr("x", x).attr("y", y).attr("width", width).attr("height", height);
        }
        function update() {
            updateScale();
            var layerUpdate = d3elements.container.selectAll("g.layer").data(data);
            layerUpdate.enter().append("g").classed("layer", true);
            layerUpdate.exit().remove();
            var barUpdate = layerUpdate.selectAll("rect").data(function(d) {
                return d;
            });
            barUpdate.enter().append("rect").style("fill", function(d, i, j) {
                var numColors = config.colors.length;
                return config.colors[j % numColors];
            });
            barUpdate.exit().remove();
            barUpdate.each(barGeometry);
        }
        function updateWidths() {
            if (!config.seriesVisible) config.seriesVisible = _.map(data, function() {
                return true;
            });
            var numVisible = _.filter(config.seriesVisible, function(d) {
                return d;
            }).length;
            var barWidth = config.groupWidth / numVisible;
            barWidths = [];
            offsets = [];
            var leftOffset = 0;
            _.each(data, function(d, i) {
                var width = config.seriesVisible[i] ? barWidth : 0;
                barWidths.push(width);
                offsets.push(leftOffset);
                leftOffset += width;
            });
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            data = config.datumAccessor(d3elements.container.datum());
            updateWidths();
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

"use strict";

(function() {
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.layerMenu = function() {
        var config = {
            items: [],
            transitionDuration: 500,
            initialSelection: 0,
            clickHandler: null
        };
        var d3elements = {
            container: null
        };
        var uiState = {
            selectedLayer: 0
        };
        function init(s) {
            d3elements.container = d3.select(s[0][0]);
            uiState.selectedLayer = config.items[config.initialSelection].layerSelector;
        }
        function constructMenu() {
            d3elements.container.selectAll("div.item").data(config.items).enter().append("div").classed("item", true).style("cursor", "pointer").append("div").style("display", "table").append("p").style("display", "table-cell").style("text-align", "center").style("vertical-align", "middle").text(function(d) {
                return d.label;
            });
        }
        function construct() {
            constructMenu();
        }
        function addEvents() {
            d3elements.container.selectAll("div.item").on("click", function(d) {
                uiState.selectedLayer = d.layerSelector;
                update();
                if (config.clickHandler !== null) config.clickHandler(d);
            });
        }
        function update() {
            config.items.forEach(function(item) {
                var layer = item.layerSelector;
                var selected = layer === uiState.selectedLayer;
                if (selected) {
                    d3.select(layer).style("display", "block").transition().duration(config.transitionDuration).style("opacity", 1);
                } else {
                    d3.select(layer).transition().duration(config.transitionDuration).style("opacity", 0).each("end", function() {
                        d3.select(this).style("display", "none");
                    });
                }
            });
            d3elements.container.selectAll("div.item").classed("selected", function(d) {
                return d.layerSelector === uiState.selectedLayer;
            });
        }
        function chart(s) {
            init(s);
            construct();
            addEvents();
            update();
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.legend = function() {
        var config = {
            size: 14,
            dispatch: null,
            clickEvent: "",
            changeEvent: "",
            status: null
        };
        var constructed = false;
        var data = null;
        var d3elements = {
            container: null
        };
        var status = [];
        function init() {
            if (!config.status) {
                config.status = _.map(data, function(d) {
                    return true;
                });
            }
            status = config.status;
        }
        function update() {
            var u = d3elements.container.selectAll("div.item").data(data);
            u.enter().append("div").classed("item", true).classed("selected", function(d, i) {
                return status[i];
            }).style("float", "left").style("border-left", function(d, i) {
                var ret = config.size + "px ";
                ret += "solid ";
                return ret;
            }).style("font-size", config.size + "px").style("padding-left", "5px").style("margin-right", "15px").style("cursor", "pointer").on("click", function(d, i) {
                var e = d3.select(this);
                var selected = e.classed("selected");
                e.classed("selected", !selected);
                status[i] = !selected;
                updateColors();
                if (config.clickEvent) config.dispatch[config.clickEvent](d.id);
                if (config.changeEvent) config.dispatch[config.changeEvent](status);
            }).each(noSelectCSS);
            u.text(function(d) {
                return d.label;
            });
            updateColors();
        }
        function noSelectCSS() {
            d3.select(this).style({
                "-webkit-touch-callout": "none",
                "-webkit-user-select": "none",
                "-khtml-user-select": "none",
                "-moz-user-select": "none",
                "-ms-user-select": "none",
                "user-select": "none"
            });
        }
        function updateColors() {
            d3elements.container.selectAll("div.item").style("border-left-color", function(d, i) {
                var color = status[i] ? d.color : "#ddd";
                return color;
            });
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            data = d3elements.container.datum();
            if (!constructed) {
                init();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.line = function() {
        var config = {
            datumAccessor: function(d) {
                return d;
            },
            xStep: 10,
            domain: [ -10, 10 ],
            range: [ -50, 50 ],
            colors: [ "steelblue", "indianred" ],
            seriesVisible: null,
            transitionDuration: 500
        };
        var data = null;
        var layerData = null;
        var constructed = false;
        var scale = null;
        var d3elements = {
            container: null,
            bars: null
        };
        function constructChart() {}
        function updateScale() {
            scale = d3.scale.linear().domain(config.domain).range([ config.range[1], config.range[0] ]);
        }
        function update() {
            updateScale();
            var svgLine = d3.svg.line().x(function(d, i) {
                return i * config.xStep;
            }).y(function(d) {
                return scale(d);
            });
            var seriesUpdate = d3elements.container.selectAll("path.series").data(data);
            seriesUpdate.enter().append("path").classed("series", true).style("fill", "none").style("stroke", function(d, i) {
                var numColors = config.colors.length;
                return config.colors[i % numColors];
            }).style("opacity", function(d, i) {
                if (!config.seriesVisible) return 1;
                return config.seriesVisible[i] ? 1 : 0;
            });
            seriesUpdate.exit().remove();
            seriesUpdate.attr("d", svgLine).transition().style("opacity", function(d, i) {
                if (!config.seriesVisible) return 1;
                return config.seriesVisible[i] ? 1 : 0;
            });
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            data = config.datumAccessor(d3elements.container.datum());
            if (!constructed) {
                constructChart();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.lineTooltip = function() {
        var config = {
            svgOffset: {
                x: 0,
                y: 0
            },
            offset: {
                x: 10,
                y: 10
            },
            width: 200,
            xStep: 150,
            domain: [ -10, 10 ],
            range: [ 0, 400 ],
            colors: null,
            seriesNames: [],
            seriesVisible: null,
            unit: ""
        };
        var d3elements = {
            container: null,
            tooltip: null,
            marker: null
        };
        var uiState = {
            i: null
        };
        var template = null;
        var constructed = false;
        var data = null;
        var xScale = null;
        var yScale = null;
        function init(s) {
            d3elements.container = d3.select(s[0][0]);
            data = d3elements.container.datum();
            d3elements.tooltip = d3elements.container.select("div.tooltip");
            xScale = d3.scale.linear().domain([ 0, data[0].length - 1 ]).range([ 0, (data[0].length - 1) * config.xStep ]);
            yScale = d3.scale.linear().domain(config.domain).range([ config.range[1], config.range[0] ]);
            constructTooltip();
            constructMarkers();
        }
        function constructTooltip() {
            d3elements.tooltip = d3elements.container.append("div").classed("tooltip", true).style("position", "absolute").style("opacity", 0).style("width", config.width + "px");
            d3elements.tooltip.selectAll("div").data(data).enter().append("div").style("color", function(d, i) {
                return config.colors ? config.colors[i] : "black";
            });
        }
        function constructMarkers() {
            d3elements.markers = d3elements.container.select("svg").append("g").classed("markers", true);
            d3elements.markers.selectAll("circle").data(data).enter().append("circle").attr("r", 3).style("fill", "none").style("stroke", function(d, i) {
                return config.colors[i];
            }).style("stroke-width", "1px");
            d3elements.markers.append("line").attr("y1", yScale.range()[0]).attr("y2", yScale.range()[1]);
        }
        function addEvents() {
            d3elements.container.on("mousemove.tooltipComponent", function(d) {
                updatePosition();
                updateMarkers();
                updateContent();
                updateVisibility();
            });
            d3elements.container.on("mouseover.tooltipComponent", function(d) {
                updatePosition();
                updateContent();
                updateVisibility();
            }).on("mouseout.tooltipComponent", function() {
                uiState.i = null;
                updateVisibility();
            });
        }
        function updateVisibility() {
            d3elements.tooltip.transition().style("opacity", uiState.i === null ? 0 : 1);
            d3elements.markers.transition().style("opacity", uiState.i === null ? 0 : 1);
        }
        function updatePosition() {
            var container = d3elements.container[0][0];
            var pos = d3.mouse(container);
            uiState.i = Math.round(xScale.invert(pos[0] - config.svgOffset.x));
            if (uiState.i < 0 || uiState.i >= data[0].length) {
                uiState.i = null;
                updateVisibility();
                return;
            }
            var x = xScale(uiState.i) + config.offset.x + config.svgOffset.x;
            var containerWidth = container.clientWidth;
            if (x > .5 * containerWidth) {
                var tooltipWidth = d3elements.tooltip[0][0].clientWidth;
                x -= tooltipWidth + 2 * config.offset.x;
            }
            d3elements.tooltip.style("left", x + "px").style("top", config.offset.y + "px");
        }
        function updateMarkers() {
            if (uiState.i === null) return;
            d3elements.markers.selectAll("circle").attr("cx", xScale(uiState.i) + config.svgOffset.x).attr("cy", function(d, series) {
                return yScale(data[series][uiState.i]);
            }).style("opacity", function(d, i) {
                if (config.seriesVisible === null) return 1;
                return config.seriesVisible[i] ? 1 : 0;
            });
            d3elements.markers.select("line").attr("x1", xScale(uiState.i) + config.svgOffset.x).attr("x2", xScale(uiState.i) + config.svgOffset.x);
        }
        function updateContent() {
            if (uiState.i === null) return;
            d3elements.tooltip.selectAll("div").style("display", function(d, i) {
                if (config.seriesVisible === null) return "block";
                return config.seriesVisible[i] ? "block" : "none";
            }).html(function(d, i) {
                var ret = config.seriesNames[i] + ": ";
                ret += d[uiState.i];
                ret += config.unit;
                return ret;
            });
        }
        function chart(s) {
            if (!constructed) init(s);
            addEvents();
            updateMarkers();
            updateContent();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.multiLine = function() {
        var config = {
            datumAccessor: function(d) {
                return d;
            },
            xStep: 10,
            domains: null,
            range: [ -50, 50 ],
            colors: [ "steelblue", "indianred" ],
            seriesVisible: null,
            transitionDuration: 500
        };
        var data = null;
        var layerData = null;
        var constructed = false;
        var scales = [];
        var d3elements = {
            container: null,
            bars: null
        };
        function constructChart() {}
        function updateScales() {
            _.each(config.domains, function(d) {
                var scale = d3.scale.linear().domain(d).range([ config.range[1], config.range[0] ]);
                scales.push(scale);
            });
        }
        function update() {
            updateScales();
            var svgLines = [];
            _.each(scales, function(s, j) {
                var svgLine = d3.svg.line().x(function(d, i) {
                    return i * config.xStep;
                }).y(function(d) {
                    return scales[j](d);
                });
                svgLines.push(svgLine);
            });
            var seriesUpdate = d3elements.container.selectAll("path.series").data(data);
            seriesUpdate.enter().append("path").classed("series", true).style("fill", "none").style("stroke", function(d, i) {
                var numColors = config.colors.length;
                return config.colors[i % numColors];
            }).style("opacity", function(d, i) {
                if (!config.seriesVisible) return 1;
                return config.seriesVisible[i] ? 1 : 0;
            });
            seriesUpdate.exit().remove();
            seriesUpdate.attr("d", function(d, i) {
                return svgLines[i](d);
            }).transition().style("opacity", function(d, i) {
                if (!config.seriesVisible) return 1;
                return config.seriesVisible[i] ? 1 : 0;
            });
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            data = config.datumAccessor(d3elements.container.datum());
            if (!constructed) {
                constructChart();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.multiLineTooltip = function() {
        var config = {
            svgOffset: {
                x: 0,
                y: 0
            },
            offset: {
                x: 10,
                y: 10
            },
            width: 200,
            xStep: 150,
            domains: null,
            range: [ 0, 400 ],
            colors: null,
            seriesNames: [],
            seriesVisible: null,
            units: ""
        };
        var d3elements = {
            container: null,
            tooltip: null,
            marker: null
        };
        var uiState = {
            i: null
        };
        var template = null;
        var constructed = false;
        var data = null;
        var xScale = null;
        var yScales = null;
        function init(s) {
            d3elements.container = d3.select(s[0][0]);
            data = d3elements.container.datum();
            d3elements.tooltip = d3elements.container.select("div.tooltip");
            xScale = d3.scale.linear().domain([ 0, data[0].length - 1 ]).range([ 0, (data[0].length - 1) * config.xStep ]);
            yScales = [];
            _.each(config.domains, function(d) {
                var yScale = d3.scale.linear().domain(d).range([ config.range[1], config.range[0] ]);
                yScales.push(yScale);
            });
            constructTooltip();
            constructMarkers();
        }
        function constructTooltip() {
            d3elements.tooltip = d3elements.container.append("div").classed("tooltip", true).style("position", "absolute").style("opacity", 0).style("width", config.width + "px");
            d3elements.tooltip.selectAll("div").data(data).enter().append("div").style("color", function(d, i) {
                return config.colors ? config.colors[i] : "black";
            });
        }
        function constructMarkers() {
            d3elements.markers = d3elements.container.select("svg").append("g").classed("markers", true);
            d3elements.markers.selectAll("circle").data(data).enter().append("circle").attr("r", 3).style("fill", "none").style("stroke", function(d, i) {
                return config.colors[i];
            }).style("stroke-width", "1px");
            d3elements.markers.append("line").attr("y1", config.range[0]).attr("y2", config.range[1]);
        }
        function addEvents() {
            d3elements.container.on("mousemove.tooltipComponent", function(d) {
                updatePosition();
                updateMarkers();
                updateContent();
                updateVisibility();
            });
            d3elements.container.on("mouseover.tooltipComponent", function(d) {
                updatePosition();
                updateContent();
                updateVisibility();
            }).on("mouseout.tooltipComponent", function() {
                uiState.i = null;
                updateVisibility();
            });
        }
        function updateVisibility() {
            d3elements.tooltip.transition().style("opacity", uiState.i === null ? 0 : 1);
            d3elements.markers.transition().style("opacity", uiState.i === null ? 0 : 1);
        }
        function updatePosition() {
            var container = d3elements.container[0][0];
            var pos = d3.mouse(container);
            uiState.i = Math.round(xScale.invert(pos[0] - config.svgOffset.x));
            if (uiState.i < 0 || uiState.i >= data[0].length) {
                uiState.i = null;
                updateVisibility();
                return;
            }
            var x = xScale(uiState.i) + config.offset.x + config.svgOffset.x;
            var containerWidth = container.clientWidth;
            if (x > .5 * containerWidth) {
                var tooltipWidth = d3elements.tooltip[0][0].clientWidth;
                x -= tooltipWidth + 2 * config.offset.x;
            }
            d3elements.tooltip.style("left", x + "px").style("top", config.offset.y + "px");
        }
        function updateMarkers() {
            if (uiState.i === null) return;
            d3elements.markers.selectAll("circle").attr("cx", xScale(uiState.i) + config.svgOffset.x).attr("cy", function(d, series) {
                return yScales[series](data[series][uiState.i]) + config.svgOffset.y;
            }).style("opacity", function(d, i) {
                if (config.seriesVisible === null) return 1;
                return config.seriesVisible[i] ? 1 : 0;
            });
            d3elements.markers.select("line").attr("transform", animdata.svg.translate(config.svgOffset.x + xScale(uiState.i), config.svgOffset.y));
        }
        function updateContent() {
            if (uiState.i === null) return;
            d3elements.tooltip.selectAll("div").style("display", function(d, i) {
                if (config.seriesVisible === null) return "block";
                return config.seriesVisible[i] ? "block" : "none";
            }).html(function(d, i) {
                var ret = '<span class="key">' + config.seriesNames[i] + ':</span> <span class="value">';
                ret += d[uiState.i];
                ret += config.units[i];
                ret += "</span>";
                return ret;
            });
        }
        function chart(s) {
            if (!constructed) init(s);
            addEvents();
            updateMarkers();
            updateContent();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.quartersAxis = function() {
        var config = {
            axisLength: 500,
            numQuarters: 6,
            startQuarter: null,
            startYear: null,
            label: "Label",
            labelColor: "#666",
            lineColor: "#aaa",
            fontSize: 11,
            centerLabels: true,
            justYears: false
        };
        var constructed = false;
        var d3elements = {
            container: null
        };
        var axisComponent = null;
        var quarterFormat = null;
        function construct() {
            quarterFormat = function(d) {
                var q = +((d - 1) % 4 + 1);
                if (config.justYears && q !== 1) return "";
                return "Q" + q;
            };
        }
        function update() {
            var domainEnd = config.startQuarter + config.numQuarters;
            if (!config.centerLabels) domainEnd--;
            var scale = d3.scale.linear().domain([ config.startQuarter, domainEnd ]).range([ 0, config.axisLength ]);
            var tickValues = [];
            for (var i = 0; i < config.numQuarters; i++) tickValues.push(config.startQuarter + i);
            var xStep = config.axisLength / config.numQuarters;
            var axisComponent = d3.svg.axis().scale(scale).orient("bottom").tickValues(tickValues).tickFormat(quarterFormat);
            d3elements.container.call(axisComponent);
            if (config.centerLabels) {
                d3elements.container.selectAll(".tick text").attr("x", xStep * .5);
            }
            var years = [];
            var year = config.startYear;
            var quarter = config.startQuarter;
            for (var i = 0; i < config.numQuarters; i++) {
                years.push(quarter === 1 ? year : "");
                quarter++;
                if (quarter === 5) {
                    quarter = 1;
                    year++;
                }
            }
            d3elements.container.selectAll(".tick").append("text").classed("year", true).attr("x", function(d, i) {
                return config.centerLabels ? .5 * xStep : 0;
            }).attr("y", 32).style("text-anchor", "middle").text(function(d, i) {
                return years[i];
            });
            d3elements.container.selectAll("line").style("stroke-width", 1).style("shape-rendering", "crispEdges").style("stroke", config.lineColor);
            d3elements.container.selectAll("path").style("stroke-width", 1).style("stroke", config.lineColor).style("shape-rendering", "crispEdges").style("fill", "none");
            d3elements.container.selectAll("text").style("font-size", config.fontSize + "px").style("fill", config.labelColor);
            d3elements.container.selectAll(".tick line").style("stroke-width", function(d, i) {
                return (d - 1) % 4 === 0 ? 3 : 1;
            });
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            if (!constructed) {
                construct();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.splitBar = function() {
        var config = {
            datumAccessor: function(d) {
                return d;
            },
            accessor: function(d) {
                return d;
            },
            barWidth: 10,
            transform: {
                x: 11,
                y: 0
            },
            orientation: "vertical",
            domain: null,
            domains: null,
            range: [ -50, 50 ],
            showValues: false,
            valueSide: "right",
            valueLabelSize: 10,
            signColors: null,
            color: null,
            splitThresholds: null,
            splitFactors: null
        };
        var data = null;
        var constructed = false;
        var scale = null;
        var scales = null;
        var d3elements = {
            container: null,
            bars: null
        };
        function constructChart() {}
        function updateScales() {}
        function barGeometry(d, i) {
            d = config.accessor(d);
            var x, y, width, height;
            var myScale = scale ? scale : scales[i];
            var threshold = config.splitThresholds !== null ? config.splitThresholds[i] : null;
            var split = threshold !== null && d > threshold[1];
            var splitWidth = 0;
            if (config.orientation === "horizontal") {
                x = i * config.transform.x;
                y = i * config.transform.y;
                width = 0;
                if (!isNaN(d)) {
                    width = Math.abs(myScale(d));
                }
                if (split) {
                    width = Math.abs(myScale(threshold[1]));
                    splitWidth = Math.abs(myScale((d - threshold[1]) / config.splitFactors[i]));
                }
                if (d < 0) x -= width;
                height = config.barWidth;
            } else {
                x = i * config.transform.x;
                height = Math.abs(myScale(0) - myScale(d));
                width = config.barWidth;
                y = myScale(0);
                if (d > 0) y -= height;
                y += i * config.transform.y;
            }
            d3.select(this).select("rect.lower").attr("x", x).attr("y", y).attr("width", width).attr("height", height);
            d3.select(this).select("line.lower.break").attr("x1", x + width).attr("y1", -1).attr("x2", x + width).attr("y2", height + 1).style("display", split ? "block" : "none");
            var gapWidth = 4;
            d3.select(this).select("line.upper.break").attr("x1", x + width + gapWidth).attr("y1", -1).attr("x2", x + width + gapWidth).attr("y2", height + 1).style("display", split ? "block" : "none");
            d3.select(this).select("rect.upper").attr("x", x + width + gapWidth).attr("y", y).attr("width", splitWidth).attr("height", height).style("display", split ? "block" : "none");
        }
        function valueLabelGeometry(d, i) {
            var x, y, anchor;
            if (config.orientation === "horizontal") {
                x = i * config.transform.x + (config.valueSide === "right" ? 3 : -3);
                y = i * config.transform.y + .5 * (config.barWidth + .8 * config.valueLabelSize);
                anchor = config.valueSize === "right" ? "start" : "end";
            } else {}
            d3.select(this).attr("x", x).attr("y", y).style("text-anchor", anchor);
        }
        function update() {
            if (config.domain) scale = d3.scale.linear().domain(config.domain).range(config.range); else if (config.domains) scales = _.map(config.domains, function(d) {
                return d3.scale.linear().domain(d).range(config.range);
            });
            var u = d3elements.container.selectAll("g").data(data);
            var groups = u.enter().append("g");
            u.exit().remove();
            groups.append("rect").classed("lower", true);
            groups.append("line").classed("lower break", true);
            groups.append("rect").classed("upper", true);
            groups.append("line").classed("upper break", true);
            groups.each(barGeometry).selectAll("rect").style("fill", function(d) {
                if (config.signColors) return d > 0 ? config.signColors[1] : config.signColors[0];
                if (config.color) return config.color;
                return "";
            });
            if (config.showValues) updateValueLabels();
        }
        function updateValueLabels() {
            var u = d3elements.container.selectAll("text.value-label").data(data);
            u.enter().append("text").classed("value-label", true).style("font-size", config.valueLabelSize + "px").text(function(d) {
                return d;
            });
            u.exit().remove();
            u.each(valueLabelGeometry);
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            data = config.datumAccessor(d3elements.container.datum());
            if (!constructed) {
                constructChart();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.stackedBar = function() {
        var config = {
            accessor: function(d) {
                return d;
            },
            datumAccessor: function(d) {
                return d;
            },
            barWidth: 10,
            transform: {
                x: 11,
                y: 0
            },
            domain: null,
            range: [ -50, 50 ],
            colors: [ "steelblue", "indianred" ],
            seriesVisible: null,
            transitionDuration: 500
        };
        var data = null;
        var layerData = null;
        var constructed = false;
        var scale = null;
        var d3elements = {
            container: null,
            bars: null
        };
        function constructChart() {}
        function updateScale() {
            scale = d3.scale.linear().domain(config.domain).range([ config.range[1], config.range[0] ]);
        }
        function barGeometry(d, i) {
            var x = i * config.transform.x;
            var y = i * config.transform.y;
            var width = 0, height = 0;
            width = config.barWidth;
            height = Math.abs(scale(d.y0) - scale(d.y + d.y0));
            if (d.y > 0) {
                y = scale(d.y0 + d.y);
            } else {
                y = scale(d.y0);
            }
            d3.select(this).transition().duration(constructed ? config.transitionDuration : 0).attr("x", x).attr("y", y).attr("width", width).attr("height", height);
        }
        function updateData() {
            var numValues = data[0].length;
            var basePositive = animdata.util.initArray(0, numValues);
            var baseNegative = animdata.util.initArray(0, numValues);
            layerData = _.map(data, function(layer, i) {
                layer = _.map(layer, function(d, j) {
                    var value = config.accessor(d);
                    var ret = {
                        y: value
                    };
                    _.extend(ret, d);
                    if (config.seriesVisible && !config.seriesVisible[i]) {
                        ret.y0 = value > 0 ? basePositive[j] : baseNegative[j];
                        ret.y = 0;
                        return ret;
                    }
                    if (value > 0) {
                        ret.y0 = basePositive[j];
                        basePositive[j] += value;
                    } else {
                        ret.y0 = baseNegative[j];
                        baseNegative[j] += value;
                    }
                    return ret;
                });
                return layer;
            });
        }
        function update() {
            updateData();
            updateScale();
            var layerUpdate = d3elements.container.selectAll("g.layer").data(layerData);
            layerUpdate.enter().append("g").classed("layer", true);
            layerUpdate.exit().remove();
            var barUpdate = layerUpdate.selectAll("rect").data(function(d) {
                return d;
            });
            barUpdate.enter().append("rect").style("fill", function(d, i, j) {
                var numColors = config.colors.length;
                return config.colors[j % numColors];
            });
            barUpdate.exit().remove();
            barUpdate.each(barGeometry);
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            data = config.datumAccessor(d3elements.container.datum());
            if (!constructed) {
                constructChart();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.toolTip = function() {
        var config = {
            element: null,
            elements: null,
            offset: {
                x: 10,
                y: 10
            },
            template: null,
            templates: null,
            templateFunc: null,
            title: null,
            fields: null,
            freezeOnClick: false,
            templateVariableScope: false,
            width: 200
        };
        var d3elements = {
            container: null,
            elements: null,
            tooltip: null
        };
        var uiState = {
            position: {
                x: 0,
                y: 0
            },
            hoverElement: null,
            frozen: false
        };
        var templates = null;
        function init(s) {
            d3elements.container = d3.select(s[0][0]);
            if (config.elements) d3elements.elements = d3elements.container.selectAll(config.elements.join(", ")); else d3elements.elements = d3elements.container.selectAll(config.element);
            d3elements.elements.style("cursor", "pointer");
            d3elements.tooltip = d3elements.container.select("div.tooltip");
            if (d3elements.tooltip[0][0] === null) constructTooltip();
            if (config.template) {
                if (config.templateVariableScope) templates = [ _.template(config.template, null, {
                    variable: "data"
                }) ]; else templates = [ _.template(config.template) ];
            }
            if (config.templates) {
                if (config.templateVariableScope) {
                    templates = _.map(config.templates, function(t) {
                        return _.template(t, null, {
                            variable: "data"
                        });
                    });
                } else {
                    templates = _.map(config.templates, function(t) {
                        return _.template(t);
                    });
                }
            }
            if (config.elements) {
                _.each(config.elements, function(e, i) {
                    d3elements.container.selectAll(e).attr("data-tooltip-template", i);
                });
            } else {
                d3elements.elements.attr("data-tooltip-template", 0);
            }
        }
        function constructTooltip() {
            d3elements.tooltip = d3elements.container.append("div").classed("tooltip", true).style("position", "absolute").style("opacity", 0).style("width", config.width + "px");
        }
        function addEvents() {
            d3elements.container.on("mousemove.tooltipComponent", function(d) {
                if (uiState.frozen) return;
                updatePosition();
            }).on("click.tooltipComponent", function() {
                if (!uiState.frozen) return;
                uiState.frozen = false;
                uiState.hoverElement = null;
                d3elements.tooltip.transition().style("opacity", "0");
                d3.event.stopPropagation();
            });
            d3elements.elements.on("mouseover.tooltipComponent", function(d) {
                if (uiState.frozen) return;
                uiState.hoverElement = d3.select(this);
                d3elements.tooltip.transition().style("opacity", "1");
                updateContent();
                d3.event.stopPropagation();
            }).on("mouseout.tooltipComponent", function() {
                if (uiState.frozen) return;
                d3elements.tooltip.transition().style("opacity", "0");
                uiState.hoverElement = null;
                d3.event.stopPropagation();
            }).on("click.tooltipComponent", function(d) {
                if (!config.freezeOnClick) return;
                if (uiState.frozen && d3.select(this).classed("tooltip-selected")) {
                    uiState.hoverElement.classed("tooltip-selected", false);
                    uiState.frozen = false;
                    return;
                }
                uiState.frozen = true;
                if (uiState.hoverElement !== null) uiState.hoverElement.classed("tooltip-selected", false);
                uiState.hoverElement = d3.select(this);
                uiState.hoverElement.classed("tooltip-selected", true);
                updatePosition();
                updateContent();
                d3.event.stopPropagation();
            });
        }
        function updatePosition() {
            var container = d3elements.container[0][0];
            var pos = d3.mouse(container);
            var containerWidth = container.clientWidth;
            var containerHeight = container.clientHeight;
            uiState.position.x = pos[0] + config.offset.x;
            uiState.position.y = pos[1] + config.offset.y;
            if (pos[0] > .5 * containerWidth) {
                var tooltipWidth = d3elements.tooltip[0][0].clientWidth;
                uiState.position.x -= tooltipWidth + 2 * config.offset.x;
            }
            if (pos[1] > .5 * containerHeight) {
                var tooltipHeight = d3elements.tooltip[0][0].clientHeight;
                uiState.position.y -= tooltipHeight + 2 * config.offset.y;
            }
            d3elements.tooltip.style("left", uiState.position.x + "px").style("top", uiState.position.y + "px");
        }
        function updateContent() {
            var datum = uiState.hoverElement.datum();
            d3elements.tooltip.html("");
            if (config.templateFunc) {
                d3elements.tooltip.html(config.templateFunc(datum));
            } else if (templates) {
                var i = uiState.hoverElement.attr("data-tooltip-template");
                d3elements.tooltip.html(templates[i](datum));
            } else {
                var dMap = d3.map(datum);
                var title = config.title;
                if (dMap.has(config.title)) title = datum[config.title];
                d3elements.tooltip.append("h1").text(title);
                if (config.fields) {
                    var rows = d3elements.tooltip.append("table").selectAll("tr").data(config.fields).enter().append("tr");
                    rows.append("td").text(function(d) {
                        return d;
                    });
                    rows.append("td").text(function(d) {
                        return datum[d];
                    });
                }
            }
        }
        function chart(s) {
            init(s);
            addEvents();
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.treeMap = function() {
        var config = {
            color: function(d, i) {
                return [ "indianred", "steelblue" ][i % 2];
            },
            width: 200,
            height: 200,
            labels: true,
            labelSize: 10,
            labelPadding: 10,
            labelData: function(d) {
                return d.name;
            },
            padding: 0,
            value: function(d) {
                return d.size;
            },
            sticky: false
        };
        var constructed = false;
        var data = null;
        var colorScale = null;
        var treeMaps = null;
        var d3elements = {
            container: null,
            treeMaps: null
        };
        function constructChart() {
            d3elements.treeMaps = d3elements.container.selectAll("div.treemap").data(data).enter().append("div").classed("treemap", true).style("position", "absolute");
        }
        function position(d, i) {
            var totalLabelPadding = 2 * config.labelPadding;
            var doLabelPadding = d.dx > totalLabelPadding && d.dy > totalLabelPadding + config.labelSize;
            var width = d.dx - config.padding;
            var height = d.dy - config.padding;
            var labelPadding = 0;
            if (doLabelPadding) {
                width -= totalLabelPadding;
                height -= totalLabelPadding;
                labelPadding = config.labelPadding;
            }
            d3.select(this).style("left", d.x + "px").style("top", d.y + "px").style("width", width + "px").style("height", height + "px").style("padding", labelPadding + "px");
        }
        function updateTreeMap(d, i) {
            var u = d3.select(this).selectAll("div.node").data(treeMaps[i].nodes, function(d) {
                return d.name;
            });
            var nodes = u.enter().append("div").classed("node", true);
            nodes.on("mouseover", function(d, i) {
                var fill = d3.select(this).style("background-color");
                var e = d3.select(this);
                this.__data__.originalColor = fill;
                var brighter = d3.rgb(fill).brighter(.4).toString();
                e.style("background-color", brighter);
            }).on("mouseout", function(d, i) {
                var e = d3.select(this);
                var fill = this.__data__.originalColor;
                d3.select(this).style("background-color", fill);
            });
            nodes.append("p").style("display", "table-cell").style("vertical-align", "middle").style("text-align", "center").style("font-size", config.labelSize + "px");
            u.exit().remove();
            u.style("display", function(d, i) {
                return i === 0 ? "none" : "table";
            }).style("background-color", function(d, i) {
                return config.color(d, i);
            }).style("position", "absolute").each(position);
            u.select("p").html(function(d) {
                return config.labels ? config.labelData(d) : "";
            });
            u.select("p").html(function(d) {
                var height = this.clientHeight + 2 * config.labelPadding + config.padding;
                var width = this.clientWidth + 2 * config.labelPadding + config.padding;
                if (height > d.dy || width > d.dx) return "";
                return config.labels ? config.labelData(d) : "";
            });
        }
        function update() {
            treeMaps = _.map(data, function(d, i) {
                return d3.layout.treemap().size([ config.width.length === undefined ? config.width : config.width[i], config.height.length === undefined ? config.height : config.height[i] ]).padding(config.padding).value(config.value);
            });
            d3elements.treeMaps.each(updateTreeMap);
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            data = d3elements.container.datum();
            if (!constructed) {
                constructChart();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();

(function() {
    "use strict";
    var animdata = window.animdata || {};
    window.animdata = animdata;
    animdata.d3 = animdata.d3 || {};
    animdata.d3.yearsAxis = function() {
        var config = {
            axisLength: 500,
            numYears: 10,
            startYear: null,
            label: "Label",
            labelColor: "#666",
            lineColor: "#aaa",
            fontSize: 11,
            centerLabels: false
        };
        var constructed = false;
        var d3elements = {
            container: null
        };
        var axisComponent = null;
        var yearFormat = null;
        function construct() {
            yearFormat = function(d) {
                return d;
            };
        }
        function update() {
            var domainEnd = config.startYear + config.numYears;
            if (!config.centerLabels) domainEnd--;
            var scale = d3.scale.linear().domain([ config.startYear, domainEnd ]).range([ 0, config.axisLength ]);
            var tickValues = [];
            for (var i = 0; i < config.numYears; i++) tickValues.push(config.startYear + i);
            var xStep = config.axisLength / config.numYears;
            var axisComponent = d3.svg.axis().scale(scale).orient("bottom").tickValues(tickValues).tickFormat(yearFormat);
            d3elements.container.call(axisComponent);
            if (config.centerLabels) {
                d3elements.container.selectAll(".tick text").attr("x", xStep * .5);
            }
            d3elements.container.selectAll("line").style("stroke-width", 1).style("shape-rendering", "crispEdges").style("stroke", config.lineColor);
            d3elements.container.selectAll("path").style("stroke-width", 1).style("stroke", config.lineColor).style("shape-rendering", "crispEdges").style("fill", "none");
            d3elements.container.selectAll("text").style("font-size", config.fontSize + "px").style("fill", config.labelColor);
        }
        function chart(selection) {
            d3elements.container = d3.select(selection[0][0]);
            if (!constructed) {
                construct();
            }
            update();
            constructed = true;
        }
        d3.keys(config).forEach(function(a) {
            chart[a] = function(_) {
                if (!arguments.length) return config[a];
                config[a] = _;
                return chart;
            };
        });
        return chart;
    };
})();