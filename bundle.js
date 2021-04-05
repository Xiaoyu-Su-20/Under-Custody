(function (React$1, ReactDOM$1, d3, ReactDropdown) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React$1);
  var ReactDOM__default = /*#__PURE__*/_interopDefaultLegacy(ReactDOM$1);
  var ReactDropdown__default = /*#__PURE__*/_interopDefaultLegacy(ReactDropdown);

  var jsonURL =
    //  "https://gist.githubusercontent.com/aulichney/2bdf13ce07abcc3206c5735b4c395400/raw/5bed42ff8cd6d2ebb8c3020a038fb3b0c57b00a8/undercustodygeo.json";
    "https://gist.githubusercontent.com/EvanMisshula/019f1f9e4e52c632bf767bda18dd4f55/raw/79d7a6b2d415c5b7f32e7be4d09e97678007efa3/nest.json";

  // helper function; clean the data
  function cleanData(row) {
    return {
      sex: row.sex,
      age: Number(row.age),
      raceEthnicity: row.raceEthnicity,
      timeServed: row.timeServed,
      timeServedBinned: row.timeServedBinned,
      ageBinned: row.ageBinned,
      crimeCounty: row.crimeCounty,
      downstateResident: row.downstateResident,
      nycResident: row.nycResident,
    };
  }

  // Given the JSON data and a specified column name,
  // group by the column, compute the value counts and the average age
  function transformData(data, col) {
    var transformed = d3.nest()
      .key(function (d) { return d[col]; })
      .rollup(function (d) {
        return {
          amount: d.length,
          ageAvg: d3.mean(d.map(function (correspondent) { return correspondent.age; })),
          avgTimeServed: d3.mean(
            d.map(function (correspondent) {
              return correspondent.timeServed;
            })
          ),
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

  // bar constants
  var WIDTH = 700;
  var HEIGHT = 400;
  var margin = { top: 25, right: 25, bottom: 60, left: 190 };
  var innerWidth = WIDTH - margin.left - margin.right;
  var innerHeight = HEIGHT - margin.top - margin.bottom;

  //Styling and format functions:
  //Title case function for axis title formatting
  function toTitle(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  //Number formatting
  function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
  }

  // compute the max length for xAttribute
  function max_key_length(data) {
    var max = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i].key.length > max) {
        max = data[i].key.length;
      }
    }
    return max;
  }

  //sort constant, 'none'; 'height': sort by height descendant; 'x': sort by x value
  var sort_status = "none";
  var SORT_DURATION = 500;

  // create the svg object
  var SVG = function (ref) {
    // the temporary solution is this, prevent react from appending svgs indefinitely
    if (d3.selectAll("svg").empty()) {
      d3.select(ref).append("svg").attr("width", WIDTH).attr("height", HEIGHT);
    }
  };

  var Bar = function (ref_radio, barData, yAttribute, xAttribute, totalPopulation) {
    var barAdjust = 100 / Math.pow( barData.length, 1.5 ); // for adjusting the width of bars
    var rotate = 0; // for rotating x axis text when text is too long
    if ((max_key_length(barData) >= 10) & (barData.length >= 10)) {
      rotate = 90;
    }
    var svg = d3.select("svg");
    // remove everything from svg and rerender objects
    svg.selectAll("*").remove();

    var xScale = d3.scaleBand()
      .domain(barData.map(function (d) { return d.key; }))
      .range([0, innerWidth])
      .paddingInner([0.2]);
    var yScale = d3.scaleLinear()
      .domain([0, d3.max(barData.map(function (d) { return d.value[yAttribute]; }))])
      .range([innerHeight, 0])
      .nice();

    //--------------------------------------------------------------------------------
    // draw initial bars
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
      .style("opacity", 1)
      .on("mouseover", function (d, i) {
        if (yAttribute == "amount") {
          tooltip
            .html(
              ("<div>" + (toTitle(xAttribute)) + ": " + (d.key) + "</div>\n              <div>" + (toTitle(yAttribute)) + ": " + (formatNumber(
                d.value[yAttribute].toFixed(0)
              )) + "</div>\n              <div>" + ("Percent") + ": " + (formatNumber(
                ((d.value[yAttribute] / totalPopulation) * 100).toFixed(2)
              )) + "%</div>")
            )
            .style("visibility", "visible");

          d3.select(this).style("opacity", 0.7); //opacity of the bars
        } else {
          tooltip
            .html(
              ("<div>" + (toTitle(xAttribute)) + ": " + (d.key) + "</div>\n              <div>" + (toTitle(yAttribute)) + ": " + (formatNumber(
                d.value[yAttribute].toFixed(0)
              )) + "</div>\n              <div>" + (d.key) + (" Count") + ": " + (formatNumber(
                d.value.amount.toFixed(0)
              )) + "</div>")
            )
            .style("visibility", "visible");

          d3.select(this).style("opacity", 0.7);
        }
      })
      .on("mousemove", function () {
        tooltip
          .style("top", d3.event.pageY - 0 + "px")
          .style("left", d3.event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        tooltip.html("").style("visibility", "hidden");
        d3.select(this).style("opacity", 0.9);
      });

    //moueover tooltip
    var tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

    //--------------------------------------------------------------------------------
    // draw axes

    var xAxis = d3.axisBottom().scale(xScale);
    var yAxis = d3.axisLeft().scale(yScale);

    svg
      .append("g")
      .attr("class", "axis")
      .attr("id", "xAxis")
      .attr("transform", ("translate (" + (margin.left) + ", " + (HEIGHT - margin.bottom) + ")"))
      .call(xAxis);

    // if the xaxis label need a rotation, do this
    if (rotate == 90) {
      svg
        .select("#xAxis")
        .selectAll("text")
        .attr("dx", "0.6em")
        .attr("dy", "-0.6em")
        .attr("text-anchor", "start")
        .attr("transform", ("rotate(" + rotate + ")"));
    }

    svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", ("translate (" + (margin.left) + ", " + (margin.top) + ")"))
      .call(yAxis);

    //--------------------------------------------------------------------------------
    //Axis labels
    svg
      .append("text")
      .attr("class", "axis-label")
      .attr("y", 0 + HEIGHT / 2)
      .attr("x", 0 + margin.left / 2)
      .attr("dx", "-0.95em")
      .text(toTitle(yAttribute));

    if (rotate == 90) ; else {
      svg
        .append("text")
        .attr("class", "axis-label")
        .attr("y", HEIGHT - margin.bottom)
        .attr("x", 0 + WIDTH / 2 + margin.left / 2)
        .attr("dy", "1.5em")
        .text(toTitle(xAttribute));
    }
    //--------------------------------------------------------------------------------
    // sorting
    // radio button calls sort function on click
    d3.select(ref_radio).selectAll("input").on("click", sort);

    // sort when changing dropdown menu given the sorted button is already selected
    sort(sort_status);

    function change_data(new_data, duration, delay) {
      if ( delay === void 0 ) delay = 0;

      //change the axis generator
      xScale.domain(new_data.map(function (d) { return d.key; }));
      svg
        .select("#xAxis")
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .call(xAxis);

      // change bars
      var bars = svg.selectAll("rect").data(new_data, function (d) { return d.key; });
      bars
        .transition()
        .delay(delay)
        .duration(duration)
        .ease(d3.easeLinear)
        .attr("x", function (d, i) { return xScale(d.key) + barAdjust; })
        .attr("y", function (d) { return yScale(d.value[yAttribute]); })
        .attr("width", xScale.bandwidth() - barAdjust * 2)
        .attr("height", function (d) { return innerHeight - yScale(d.value[yAttribute]); });
    }

    // argument is optional, used when changing dropdown menu given the sorted button is already selected
    function sort(arg) {
      if (typeof arg == "string") {
        // when changing dropdown menu given the sorted button is already selected
        var action = arg;
        var duration = 0;
      } else {
        // when no argument is passed into sort, get value from the radio button
        var action = d3.select(this).node().value;
        var duration = SORT_DURATION;
      }
      // console.log(action)

      if (action == "height") {
        var new_data$1 = barData
          .slice()
          .sort(function (a, b) { return d3.ascending(b.value[yAttribute], a.value[yAttribute]); });
        change_data(new_data$1, duration);
        sort_status = "height";
      } else if (action == "x") {
        // if the str is a number, compare the number, not the strings. If we can process the
        // data so that the key remains numeric data type in the transform function, we don't need this step
        if (barData[0].key.match("\\d+")) {
          var new_data = barData
            .slice()
            .sort(function (a, b) { return d3.ascending(parseInt(a.key), parseInt(b.key)); });
        } else {
          var new_data = barData.slice().sort(function (a, b) { return d3.ascending(a.key, b.key); });
        }
        change_data(new_data, duration);
        sort_status = "x";
      }
    }
  };

  //Table
  var Table = function (ref) {
    var barData = ref.barData;
    var yAttribute = ref.yAttribute;
    var xAttribute = ref.xAttribute;
    var totalPopulation = ref.totalPopulation;

    var xScale = d3.scaleBand()
      .domain(barData.map(function (d) { return d.key; }))
      .range([0, innerWidth])
      .paddingInner([0.2]);

    d3.scaleLinear()
      .domain([0, d3.max(barData.map(function (d) { return d.value[yAttribute]; }))])
      .range([innerHeight, 0]);

    //create arrays of values that will fill table
    var count = barData.map(function (d) { return d.value[yAttribute]; }); //count for each category
    var yTotal = d3.sum(count); //total number individuals
    var xLength = xScale.domain().length; //number of categories for the givenn x attribute
    var pct = barData.map(function (d) { return (d.value[yAttribute] / yTotal) * 100; }); //percent of total for each category

    var row1 = [];
    var rows = [];

    //Fill first row with table headings
    for (var i = 0; i < 1; i++) {
      var rowID = "row" + i;
      var cell = [];
      for (var idx = 0; idx < 1; idx++) {
        var cellID = "cell" + i + "-" + idx;
        cell.push(
          React.createElement( 'td', { key: cellID, id: cellID },
            toTitle(xAttribute)
          )
        );
      }
      if (yAttribute == "amount") {
        for (var idx = 1; idx < 2; idx++) {
          var cellID$1 = "cell" + i + "-" + idx;
          cell.push(
            React.createElement( 'td', { key: cellID$1, id: cellID$1 }, "Percent")
          );
        }
      }
      if (yAttribute == "amount") {
        for (var idx = 2; idx < 3; idx++) {
          var cellID$2 = "cell" + i + "-" + idx;
          cell.push(
            React.createElement( 'td', { key: cellID$2, id: cellID$2 }, "Population")
          );
        }
      } else {
        for (var idx = 2; idx < 3; idx++) {
          var cellID$3 = "cell" + i + "-" + idx;
          cell.push(
            React.createElement( 'td', { key: cellID$3, id: cellID$3 }, "Years")
          );
        }
      }
      row1.push(
        React.createElement( 'tr', { key: i, id: rowID },
          cell
        )
      );
    }

    //Fill table by column. Col 1 is each category for the given xattribute. Col 2 is the value for each category.
    //Col 3 is percent of total population for each category
    for (var i = 1; i < xLength + 1; i++) {
      var rowID$1 = "row" + i;
      var cell$1 = [];
      for (var idx = 0; idx < 1; idx++) {
        var cellID$4 = "cell" + i + "-" + idx;
        var entry = xScale.domain()[i - 1];
        cell$1.push(
          React.createElement( 'td', { key: cellID$4, id: cellID$4 },
            entry
          )
        );
      }
      if (yAttribute == "amount") {
        for (var idx = 1; idx < 2; idx++) {
          var cellID$5 = "cell" + i + "-" + idx;
          var entry$1 = pct[i - 1].toFixed(2);
          cell$1.push(
            React.createElement( 'td', { key: cellID$5, id: cellID$5 },
              entry$1, "%")
          );
        }
      }
      if (yAttribute == "amount") {
        for (var idx = 2; idx < 3; idx++) {
          var cellID$6 = "cell" + i + "-" + idx;
          var entry$2 = count[i - 1].toFixed(0);
          cell$1.push(
            React.createElement( 'td', { key: cellID$6, id: cellID$6 },
              formatNumber(entry$2)
            )
          );
        }
      } else {
        for (var idx = 2; idx < 3; idx++) {
          var cellID$7 = "cell" + i + "-" + idx;
          var entry$3 = count[i - 1].toFixed(2);
          cell$1.push(
            React.createElement( 'td', { key: cellID$7, id: cellID$7 },
              formatNumber(entry$3)
            )
          );
        }
      }

      rows.push(
        React.createElement( 'tr', { key: i, id: rowID$1 },
          cell$1
        )
      );
    }

    //create table element with rows
    var tableElement = (
      React.createElement( 'table', { id: "summary-table" },
        React.createElement( 'thead', null, row1 ),
        React.createElement( 'tbody', null, rows ),
        React.createElement( 'caption', null, "Total Number Under Custody: ", formatNumber(totalPopulation)
        )
      )
    );

    //render table
    ReactDOM.render(tableElement, document.getElementById("table"));

    return React.createElement( React.Fragment, null );
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

    //count total entries
    var totalPopulation = rawData.length;

    console.log(barData);

    // map each column to { value: col, label: col } to feed into react Dropdown menu
    var xFields = Object.keys(rawData[0]).map(function (d) { return ({ value: d, label: d }); });

    console.log(xFields);

    var yFields = Object.keys(barData[0].value).map(function (d) { return ({
      value: d,
      label: d,
    }); });

    // return the title, the dropdown menus, and the barplot with axes
    return (
      React.createElement( React.Fragment, null,
        React.createElement( 'h1', { ref: function (d) { return SVG(d); } }, " "),

        React.createElement( 'div', { className: "menu-container" },
          React.createElement( 'span', { className: "dropdown-label" }, "X"),
          React.createElement( ReactDropdown__default['default'], {
            options: xFields, value: xAttribute, onChange: function (ref) {
              var value = ref.value;
              ref.label;

              return setXAttribute(value);
    } }),
          React.createElement( 'span', { className: "dropdown-label" }, "Y"),
          React.createElement( ReactDropdown__default['default'], {
            options: yFields, value: yAttribute, onChange: function (ref) {
              var value = ref.value;
              ref.label;

              return setYAttribute(value);
    } })
        ),

        React.createElement( 'div', {
          id: "radio_sort", ref: function (d) { return Bar(d, barData, yAttribute, xAttribute, totalPopulation); }, class: "control-group" },
          React.createElement( 'label', { class: "control control-radio" }, "Sort by Height ", React.createElement( 'input', { className: "radio", type: "radio", value: "height", name: "sort" }),
            React.createElement( 'div', { class: "control_indicator" })
          ),
          React.createElement( 'label', { class: "control control-radio" }, "Sort by X Value ", React.createElement( 'input', { className: "radio", type: "radio", value: "x", name: "sort" }),
            React.createElement( 'div', { class: "control_indicator" })
          )
        ),

        React.createElement( Table, {
          barData: barData, yAttribute: yAttribute, xAttribute: xAttribute, totalPopulation: totalPopulation })
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

}(React, ReactDOM, d3, ReactDropdown));
//# sourceMappingURL=bundle.js.map
