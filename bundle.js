(function (React$1, ReactDOM$1) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React$1);
  var ReactDOM__default = /*#__PURE__*/_interopDefaultLegacy(ReactDOM$1);

  var jsonURL =
    "https://gist.githubusercontent.com/aulichney/d4589c85658f1a2248b143dfd62005b4/raw/3b10ecd311754f3c2234d6c880622d33ad7d176f/undercustodymod.json";

  // helper function; clean the data
  function cleanData(row) {
    return {
      sex: row.sex,
      age: Number(row.age),
      raceEthnicity: row.raceEthnicity,
      timeServed: row.timeServed
    };
  }

  // Given the JSON data and a specified column name,
  // group by the column, compute the value counts and the average age
  function transformData(data, col) {
    var transformed = d3
      .nest()
      .key(function (d) { return d[col]; })
      .rollup(function (d) {
        return {
          amount: d.length,
          ageAvg: d3.mean(d.map(function (correspondent) { return correspondent.age; })),
          avgTimeServed: d3.mean(d.map(function (correspondent) {return correspondent.timeServed; }))
        };
      })
      .entries(data);
    return transformed;
  }

  // main function; retrieve the data from the JSON file
  var useJSON = function () {
    var ref = React$1.useState(null);
    var data = ref[0];
    var setData = ref[1];
    React$1.useEffect(function () {
      d3.json(jsonURL) // retrieve data from the given URL
        .then(function (data) {
          //when data is retrieved, do the following
          data = data.map(cleanData); // map each row to the cleanData function to retrieve the desired columns
          setData(data);
          // use the react hook to set the data
        });
    }, []);
    return data;
  };

  var Dropdown = function (ref) {
    var options = ref.options;
    var id = ref.id;
    var selectedValue = ref.selectedValue;
    var onSelectedValueChange = ref.onSelectedValueChange;

    return (
    React.createElement( 'select', { id: id, onChange: function (event) { return onSelectedValueChange(event.target.value); } },
      options.map(function (ref) {
        var value = ref.value;
        var label = ref.label;

        return (
        React.createElement( 'option', { value: value, selected: value === selectedValue },
          label
        )
      );
    })
    )
  );
  };

  // bar constants
  var WIDTH = 500;
  var HEIGHT= 300;
  var margin={top: 25, right: 25, bottom: 75, left: 75};
  var innerWidth = WIDTH - margin.left - margin.right;
  var innerHeight = HEIGHT - margin.top - margin.bottom;


  //sort constant, 'none'; 'height': sort by height descendant; 'x': sort by x value
  var sorted = 'none';
  var SORT_DURATION = 500;

  //Title case function for axis title formatting
  function toTitle(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  var Svg = function (ref) {
    // the temporary solution is this, prevent react from appending svgs indefinitely
    	if (d3.selectAll("svg").empty()) {
        d3.select(ref)
          .append("svg")
          .attr("width", WIDTH)
          .attr("height", HEIGHT);
      }
  };


  var Bar = function (ref_radio, barData, yAttribute, xAttribute) {
    	console.log(barData.length);
  		var barAdjust = 5 / barData.length; // for adjusting the width of bars

      var svg = d3.select("svg");

      // remove everything from svg and rerender objects
      svg.selectAll("*").remove();

      // draw axes
      var xScale = d3.scaleBand()
                     .domain(barData.map(function (d) { return d.key; }))
                     .range([0, innerWidth])
                     .paddingInner([.2]);
      var yScale = d3.scaleLinear()
                     .domain([0, d3.max( barData.map(function (d) { return d.value[yAttribute]; }) )] )
                     .range([innerHeight, 0]);

      var xAxis = d3.axisBottom().scale(xScale);
      var yAxis = d3.axisLeft().scale(yScale);

      svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", ("translate (" + (margin.left) + ", " + (HEIGHT - margin.bottom) + ")"))
        .call(xAxis);
      svg.append("g")
        .attr("class", "yAxis")
        .attr("transform", ("translate (" + (margin.left) + ", " + (margin.top) + ")"))
        .call(yAxis);

      // draw initial bars
      var bars = svg.append('g')
                        .attr("transform", ("translate (" + (margin.left) + ", " + (margin.top) + ")"))
                        .selectAll("rect")
                        .data(barData, function (d) { return d.key; });
      bars.enter().append("rect")
        .attr("x", function (d, i) { return xScale(d.key)+barAdjust; })
        .attr("y", function (d) { return yScale(d.value[yAttribute]); })
        .attr("width", xScale.bandwidth()-barAdjust*2)
        .attr("height", function (d) { return innerHeight - yScale(d.value[yAttribute]); })
        .style('opacity', 0.7)
    		.on("mouseover", function(d){
  				d3.select(this)
    				.style("opacity", 1);
  			}).on("mouseout", function(d){
  				d3.select(this)
    				.style("opacity", 0.7);
  			});

      //Axis labels
    	svg
      	.append("text")
      	.attr("transform", "rotate(-90)")
      	.attr('class', 'ylabel')
      	.attr("y", 0)
      	.attr("x", 0 - HEIGHT/2)
      	.attr("dy", "0.75em")
      	.style("text-anchor", "middle")
      	.text(toTitle(yAttribute));
    svg
      	.append("text")
      	.attr('class', 'xlabel')
      	.attr("y", HEIGHT - margin.bottom)
      	.attr("x", 0 + WIDTH/2)
      	.attr("dy", "2em")
      	.style("text-anchor", "middle")
      	.text(toTitle(xAttribute));

    	// radio button calls sort function on click
    	d3.select(ref_radio)
      .selectAll("input")
      .on("click", sort);

      //if sorted=='height'
      if (sorted == 'height') {
      var new_data = barData.slice()
                    .sort(function (a,b) { return d3.ascending(b.value[yAttribute], a.value[yAttribute]); });
      change_data(new_data, 0);
      } else if (sorted == 'x') { //if sorted=='x'
      var new_data$1 = barData.slice().sort(function (a,b) { return d3.ascending(a.key, b.key); });
      change_data(new_data$1, 0);
      }


    function change_data(new_data, duration, delay) {
      if ( delay === void 0 ) delay=0;

      //change the axis generator
      xScale.domain(new_data.map(function (d) { return d.key; }));
      svg.select(".xAxis")
      .transition().duration(duration).ease(d3.easeLinear)
      .call(xAxis);

      // change bars
      var bars = svg.selectAll("rect").data(new_data, function (d) { return d.key; });
      bars.transition().delay(delay).duration(duration).ease(d3.easeLinear)
            .attr("x", function (d, i) { return xScale(d.key)+barAdjust; })
            .attr("y", function (d) { return yScale(d.value[yAttribute]); })
            .attr("width", xScale.bandwidth()-barAdjust*2)
            .attr("height", function (d) { return innerHeight - yScale(d.value[yAttribute]); });
  	}
    function sort() {
      var action = d3.select(this).node().value;

      if (action == "height"){
        var new_data = barData.slice().sort(function (a,b) { return d3.ascending(b.value[yAttribute], a.value[yAttribute]); });
        change_data(new_data, SORT_DURATION);
        sorted = 'height';
      } else {
        var new_data$1 = barData.slice().sort(function (a,b) { return d3.ascending(a.key, b.key); });
        change_data(new_data$1, SORT_DURATION);
        sorted = 'x';
      }
    }};

  //Table
  var Table = function (ref) {
    var barData = ref.barData;
    var yAttribute = ref.yAttribute;
    var xAttribute = ref.xAttribute;

    var xScale = d3
      .scaleBand()
      .domain(barData.map(function (d) { return d.key; }))
      .range([0, innerWidth])
      .paddingInner([0.2]);

    d3
      .scaleLinear()
      .domain([0, d3.max(barData.map(function (d) { return d.value[yAttribute]; }))])
      .range([innerHeight, 0]);

    //create arrays of values that will fill table
    var count = barData.map(function (d) { return d.value[yAttribute]; }); //count for each category
    var yTotal = d3.sum(count); //total number individuals
    var xLength = xScale.domain().length; //number of categories for the givenn x attribute
    var pct = barData.map(function (d) { return d.value[yAttribute]/yTotal * 100; }); //percent of total for each category


    var rows = [];

    //Fill first row with table headings
    for (var i = 0; i < 1; i++){
        var rowID = "row" + i;
        var cell = [];
        for (var idx = 0; idx < 1; idx++){
          var cellID = "cell" + i + "-" + idx;
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, toTitle(xAttribute)));
        }
     	 for (var idx = 1; idx < 2; idx++){
          var cellID$1 = "cell" + i + "-" + idx;
          cell.push(React.createElement( 'td', { key: cellID$1, id: cellID$1 }, "Count"));
        }
      	for (var idx = 2; idx < 3; idx++){
          var cellID$2 = "cell" + i + "-" + idx;
          cell.push(React.createElement( 'td', { key: cellID$2, id: cellID$2 }, "Percent"));
        }
        rows.push(React.createElement( 'tr', { key: i, id: rowID }, cell));
      }
    //Fill table by column. Col 1 is each category for the given xattribute. Col 2 is the value for each category.
    //Col 3 is percent of total population for each category
    for (var i = 1; i < xLength + 1; i++){
        var rowID$1 = "row" + i;
        var cell$1 = [];
        for (var idx = 0; idx < 1; idx++){
          var cellID$3 = "cell" + i + "-" + idx;
          var entry = xScale.domain()[i-1];
          cell$1.push(React.createElement( 'td', { key: cellID$3, id: cellID$3 }, entry));
        }
      	for (var idx = 1; idx < 2; idx++){
          var cellID$4 = "cell" + i + "-" + idx;
          var entry$1 = count[i-1].toFixed(0);
          cell$1.push(React.createElement( 'td', { key: cellID$4, id: cellID$4 }, entry$1));
        }
      	for (var idx = 2; idx < 3; idx++){
          var cellID$5 = "cell" + i + "-" + idx;
          var entry$2 = pct[i-1].toFixed(2);
          cell$1.push(React.createElement( 'td', { key: cellID$5, id: cellID$5 }, entry$2, "%"));
        }
        rows.push(React.createElement( 'tr', { key: i, id: rowID$1 }, cell$1));
      }


    //create table element with rows
    var tableElement = (
              React.createElement( 'table', { id: "dynamic-table" },
                 React.createElement( 'tbody', null,
                   rows
                 )
               )
        );


  //render table
    ReactDOM.render(tableElement, document.getElementById('table'));
    ReactDOM.render(React.createElement( 'p', null, "Total Number of People Under Custody: 36072" ), document.getElementById('summary'));



    return React.createElement( React.Fragment, null );
  };

  var Chart = function ( ref ) {
    var rawData = ref.rawData;


    // create React hooks for controlling the grouped data we want to generate; also, setup the initial value
    var ref$1 = React$1.useState('sex');
    var xAttribute = ref$1[0];
    var setXAttribute = ref$1[1];
    var ref$2 = React$1.useState('amount');
    var yAttribute = ref$2[0];
    var setYAttribute = ref$2[1];

    // according to the current xAttr ibute, group by that attribute and compute the number of observations and the average age
    var barData = transformData(rawData, xAttribute);

    // console.log(barData)

    // map each column to { value: col, label: col } to feed into react Dropdown menu
    var xFields = Object.keys(rawData[0]).map(function (d) { return ({"value":d, "label":d}); });

    var yFields = Object.keys(barData[0].value).map(function (d) { return ({"value":d, "label":d}); });

    // return the title, the dropdown menus, and the barplot with axes
  	return(
      React.createElement( React.Fragment, null,
        React.createElement( 'h1', { ref: function (d) { return Svg(d); } }, " Under Custody Data Visualization with Filters"),

        React.createElement( 'label', { for: "x-select" }, "X:"),
        React.createElement( Dropdown, {
          options: xFields, id: "x-select", selectedValue: xAttribute, onSelectedValueChange: setXAttribute }),
        React.createElement( 'label', { for: "y-select" }, "Y:"),
        React.createElement( Dropdown, {
          options: yFields, id: "y-select", selectedValue: yAttribute, onSelectedValueChange: setYAttribute }),


        React.createElement( 'div', { id: 'radio_sort', ref: function (d) { return Bar(d, barData, yAttribute, xAttribute); } },
          React.createElement( 'input', { type: "radio", value: "height", name: "sort" }), " Sort by Height ", React.createElement( 'input', { type: "radio", value: "other", name: "sort" }), " Sort by X Value"),

        React.createElement( Table, { barData: barData, yAttribute: yAttribute, xAttribute: xAttribute })


  		)
  	);
  };

  var App = function () {
    var rawData = useJSON();

    if (!rawData) {
      return React__default['default'].createElement( 'h2', null, "Loading..." );
    }

    // console.log(rawData);

    return (
      React__default['default'].createElement( React__default['default'].Fragment, null,
        React__default['default'].createElement( Chart, { rawData: rawData })
      )
    );
  };

  var rootElement = document.getElementById("root");
  ReactDOM__default['default'].render(React__default['default'].createElement( App, null ), rootElement);

}(React, ReactDOM));
//# sourceMappingURL=bundle.js.map
