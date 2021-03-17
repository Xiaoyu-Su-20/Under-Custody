(function (React$1, ReactDOM, d3$1) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React$1);
  var ReactDOM__default = /*#__PURE__*/_interopDefaultLegacy(ReactDOM);

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
  // group by the column, compute the value counts and the average age and average time served
  function transformData(data, col) {
    var transformed = d3
      .nest()
      .key(function (d) { return d[col]; })
      .rollup(function (d) {
        return {
          amount: d.length,
          ageAvg: d3.mean(d.map(function (correspondent) { return correspondent.age; })),
          avgTimeServed: d3.mean(d.map(function (correspondent) { return correspondent.timeServed; }))
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

  //Title case function for axis title formatting
  function toTitle(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // bar constant
  var WIDTH = 600;
  var HEIGHT = 400;
  var margin = { top: 25, right: 25, bottom: 75, left: 75 };
  var innerWidth = WIDTH - margin.left - margin.right;
  var innerHeight = HEIGHT - margin.top - margin.bottom;
  var barAdjust = 5; // for adjusting the width of bars

  var Bar = function (ref) {
    var barData = ref.barData;
    var yAttribute = ref.yAttribute;
    var xAttribute = ref.xAttribute;

    var svg = d3$1.select("svg");

    // remove everything from svg and rerender objects
    svg.selectAll("*").remove();

    // draw axes
    var xScale = d3
      .scaleBand()
      .domain(barData.map(function (d) { return d.key; }))
      .range([0, innerWidth])
      .paddingInner([0.2]);
    var yScale = d3
      .scaleLinear()
      .domain([0, d3.max(barData.map(function (d) { return d.value[yAttribute]; }))])
      .range([innerHeight, 0]);

    var xAxis = d3$1.axisBottom().scale(xScale);
    var yAxis = d3$1.axisLeft().scale(yScale);

    svg
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", ("translate (" + (margin.left) + ", " + (HEIGHT - margin.bottom) + ")"))
      .call(xAxis);
    svg
      .append("g")
      .attr("class", "yAxis")
      .attr("transform", ("translate (" + (margin.left) + ", " + (margin.top) + ")"))
      .call(yAxis);

    // draw bars
    var bars = svg
      .append("g")
      .attr("transform", ("translate (" + (margin.left) + ", " + (margin.top) + ")"))
      .selectAll("rect")
      .data(barData, function (d) { return d.key; });
    bars
      .enter()
      .append("rect")
      .attr("x", function (d, i) { return xScale(d.key) + barAdjust; })
      .attr("y", function (d) { return yScale(d.value[yAttribute]); })
      .attr("width", xScale.bandwidth() - barAdjust * 2)
      .attr("height", function (d) { return innerHeight - yScale(d.value[yAttribute]); })
      .style("opacity", 0.7)
      .on("mouseover", function (d) {
        // add mouseover event
        d3$1.select(this).style("opacity", 1);
      })
      .on("mouseout", function (d) {
        d3$1.select(this).style("opacity", 0.7);
      });

  //Axis labels
  	svg
    	.append("text")
    	.attr("transform", "rotate(-90)")
    	.attr('class', 'ylabel')
    	.attr("y", 0)
    	.attr("x", 0 - HEIGHT/2)
    	.attr("dy", "1em")
    	.style("text-anchor", "middle")
    	.text(toTitle(yAttribute));
  svg
    	.append("text")
    	.attr('class', 'xlabel')
    	.attr("y", HEIGHT - margin.bottom)
    	.attr("x", 0 + WIDTH/2)
    	.attr("dy", "3em")
    	.style("text-anchor", "middle")
    	.text(toTitle(xAttribute)); //Need to restructure to pass xAttribute to this function as well

    return React.createElement( React.Fragment, null ); //d3 draws the graph, thus return nothing
  };

  var Chart = function (ref) {
    var rawData = ref.rawData;

    // create React hooks for controlling the grouped data we want to generate; also, setup the initial value
    var ref$1 = React$1.useState("sex");
    var xAttribute = ref$1[0];
    var setXAttribute = ref$1[1];
    var ref$2 = React$1.useState("amount");
    var yAttribute = ref$2[0];
    var setYAttribute = ref$2[1];

    // according to the current xAttr ibute, group by that attribute and compute the number of observations and the average age
    var barData = transformData(rawData, xAttribute);

    // map each column to { value: col, label: col } to feed into react Dropdown menu
    var xFields = Object.keys(rawData[0]).map(function (d) { return ({ value: d, label: d }); });
    var yFields = Object.keys(barData[0].value).map(function (d) { return ({
      value: d,
      label: d,
    }); });

    // return the title, the dropdown menus, and the barplot with axes
    return (
      React.createElement( React.Fragment, null,
        React.createElement( 'h1', null, " Under Custody Data Visualization with Filters" ),

        React.createElement( 'label', { for: "x-select" }, "X:"),
        React.createElement( Dropdown, {
          options: xFields, id: "x-select", selectedValue: xAttribute, onSelectedValueChange: setXAttribute }),
        React.createElement( 'label', { for: "y-select" }, "Y:"),
        React.createElement( Dropdown, {
          options: yFields, id: "y-select", selectedValue: yAttribute, onSelectedValueChange: setYAttribute }),

        React.createElement( Bar, { barData: barData, yAttribute: yAttribute, xAttribute: xAttribute })
      )
    );
  };

  var App = function () {
    var rawData = useJSON();

    if (!rawData) {
      return React__default['default'].createElement( 'h2', null, "Loading..." );
    }

    console.log(rawData);

    return (
      React__default['default'].createElement( React__default['default'].Fragment, null,
        React__default['default'].createElement( Chart, { rawData: rawData })
      )
    );
  };

  var rootElement = document.getElementById("root");
  ReactDOM__default['default'].render(React__default['default'].createElement( App, null ), rootElement);

}(React, ReactDOM, d3));
//# sourceMappingURL=bundle.js.map
