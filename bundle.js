(function (React$1, ReactDOM, ReactDropdown, d3$1) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM = ReactDOM && ReactDOM.hasOwnProperty('default') ? ReactDOM['default'] : ReactDOM;
  ReactDropdown = ReactDropdown && ReactDropdown.hasOwnProperty('default') ? ReactDropdown['default'] : ReactDropdown;

  var jsonURL =
    //  "https://gist.githubusercontent.com/aulichney/2bdf13ce07abcc3206c5735b4c395400/raw/5bed42ff8cd6d2ebb8c3020a038fb3b0c57b00a8/undercustodygeo.json";
    "https://gist.githubusercontent.com/EvanMisshula/019f1f9e4e52c632bf767bda18dd4f55/raw/36223c79d83e8e6606f9df3941f92c6c282133c8/nest.json";

  // helper function; clean the data
  function cleanData(row) {
    return {
      sex: row.sex,
      age: Math.round(row.age),
      raceEthnicity: row.modEthRace,
      timeServed: Math.round(row.timeServed),
      timeServedBinned: row.timeServedBinned,
      ageBinned: row.ageBinned,
      crimeCounty: row.crimeCounty,
      downstateResident: row.downstateResident,
      nycResident: row.nycResident,
      prisonSecLevel: row.prisonSecLevel,
      prison: row.prison,
    };
  }

  // Given the JSON data and a specified column name,
  // group by the column, compute the value counts and the average age
  function transformData(data, col) {
    var transformed = d3$1.nest()
      .key(function (d) { return d[col]; })
      .rollup(function (d) {
        return {
          amount: d.length,
          ageAvg: d3$1.mean(d.map(function (correspondent) { return correspondent.age; })),
          avgTimeServed: d3$1.mean(
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
      d3$1.json(jsonURL) // retrieve data from the given URL
        .then(function (data) {
          //when data is retrieved, do the following
          data = data.map(cleanData); // map each row to the cleanData function to retrieve the desired columns
          setData(data);
          // use the react hook to set the data
        });
    }, []);
    return data;
  };

  //sort constant, 'none'; 'height': sort by height descendant; 'x': sort by x value
  var sort_status = 'none';
  var SORT_DURATION = 500;

  //Styling and format functions:
  //Title case function for axis title formatting
  function toTitle(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  //Number formatting
  function formatNumber(num) {
    return num
      .toString()
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
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

  // compute the sum of all bars with an x-value greater/smaller than certain bar
  function add_integral(barData) {
    for (var i = 0; i < barData.length; i++) {
      var less = [];
      var greater = [];
      for (var j = 0; j < barData.length; j++) {
        if (barData[j].key <= parseInt(barData[i].key)) {
          less.push(barData[j].value['amount']);
        } else {
          greater.push(barData[j].value['amount']);
        }
      }
      barData[i].value.younger = d3.sum(less);
      barData[i].value.older = d3.sum(greater);
    }
    return barData;
  }

  var Bar = function (
    ref_radio,
    barData,
    yAttribute,
    xAttribute,
    totalPopulation
  ) {
    var barAdjust = 100 / Math.pow( barData.length, 1.5 ); // for adjusting the width of bars

    // remove everything from svg and rerender all objects
    var svg = d3.select('svg#bar');
    svg.selectAll('*').remove();

    var HEIGHT = svg.attr('height');
    var WIDTH = svg.attr('width');
    var margin = { top: 25, right: 25, bottom: 60, left: 190};
    var innerWidth = WIDTH - margin.left - margin.right;
    var innerHeight = HEIGHT - margin.top - margin.bottom;

    //-------------------------------------------------------------------------------
    // xScale, yScale

    var xScale = d3
      .scaleBand()
      .domain(barData.map(function (d) { return d.key; }))
      .range([0, innerWidth])
      .paddingInner([0.2]);
    var yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(barData.map(function (d) { return d.value[yAttribute]; })) ])
      .range([innerHeight, 0])
      .nice();

    //--------------------------------------------------------------------------------
    // bars and tooltip

    // if age is selected as x-attributes, compute integral
    if (xAttribute == 'age') {
      barData = add_integral(barData);
    }

    // components of the bar: bar locations, mouseover opacity change, mouseover tooltip
    var bars = svg
      .append('g')
      .attr(
        'transform',
        ("translate (" + (margin.left) + ", " + (margin.top) + ")")
      )
      .selectAll('rect')
      .data(barData, function (d) { return d.key; });

    bars
      .enter()
      .append('rect')
      .attr('x', function (d, i) { return xScale(d.key) + barAdjust; })
      .attr('y', function (d) { return yScale(d.value[yAttribute]); })
      .attr('width', xScale.bandwidth() - barAdjust * 2)
      .attr(
        'height',
        function (d) { return innerHeight - yScale(d.value[yAttribute]); }
      )
      .style('opacity', 1)
      .on('mouseover', function (d, i) {
        if (
          (yAttribute == 'amount') &
          (xAttribute == 'age')
        ) {
          tooltip
            .html(
              ("<div>" + (toTitle(xAttribute)) + ": " + (d.key) + "</div>\n                  <div>" + (toTitle(
                      yAttribute
                    )) + ": " + (formatNumber(
                d.value[yAttribute].toFixed(0)
              )) + "</div>\n                  <div>" + ('Percent') + ": " + (formatNumber(
                (
                  (d.value[yAttribute] / totalPopulation) *
                  100
                ).toFixed(2)
              )) + "%</div>\n                  <div>There are " + (formatNumber(
                      d.value.younger
                    )) + " people " + (d.key) + " or younger under custody (" + (formatNumber(
                (
                  (d.value.younger / totalPopulation) *
                  100
                ).toFixed(1)
              )) + "%)</div>\n                  <div>There are " + (formatNumber(
                      d.value.older
                    )) + " people over " + (d.key) + " under custody (" + (formatNumber(
                (
                  (d.value.older / totalPopulation) *
                  100
                ).toFixed(1)
              )) + "%)</div>")
            )
            .style('visibility', 'visible');
          d3.select(this).style('opacity', 0.7);
        } else if (yAttribute == 'amount') {
          tooltip
            .html(
              ("<div>" + (toTitle(xAttribute)) + ": " + (d.key) + "</div>\n                  <div>" + (toTitle(
                      yAttribute
                    )) + ": " + (formatNumber(
                d.value[yAttribute].toFixed(0)
              )) + "</div>\n                  <div>" + ('Percent') + ": " + (formatNumber(
                (
                  (d.value[yAttribute] / totalPopulation) *
                  100
                ).toFixed(2)
              )) + "%</div>")
            )
            .style('visibility', 'visible');
          d3.select(this).style('opacity', 0.7);
        } else {
          tooltip
            .html(
              ("<div>" + (toTitle(xAttribute)) + ": " + (d.key) + "</div>\n                  <div>" + (toTitle(
                      yAttribute
                    )) + ": " + (formatNumber(
                d.value[yAttribute].toFixed(0)
              )) + "</div>\n                  <div>" + ('Count') + (d.key) + ": " + (formatNumber(
                d.value.amount.toFixed(0)
              )) + "</div>")
            )
            .style('visibility', 'visible');
          d3.select(this).style('opacity', 0.7);
        }
      })
      .on('mousemove', function () {
        tooltip
          .style('top', d3.event.pageY - 10 + 'px')
          .style('left', d3.event.pageX + 10 + 'px');
      })
      .on('mouseout', function () {
        tooltip.html("").style('visibility', 'hidden');
        d3.select(this).style('opacity', 1);
      });

    //moueover tooltip
    var tooltip = d3$1.select('body')
      .append('div')
      .attr('class', 'd3-tooltip');

    //--------------------------------------------------------------------------------
    // xAxis, yAxis

    // initialize axis
    var yAxis = d3.axisLeft().scale(yScale);
    var xAxis = d3.axisBottom().scale(xScale);
    // if xaxis contains too many numbers, consider show every other axis tick
    if ((barData.length > 40) & !isNaN(barData[0].key)) {
      xAxis = xAxis.tickFormat(function (interval,i) {
                      return i%2 !== 0 ? " ": interval;});
    }

    // show axis
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('id', 'xAxis')
      .attr(
        'transform',
        ("translate (" + (margin.left) + ", " + (HEIGHT - margin.bottom) + ")")
      )
      .call(xAxis);

    var rotate = 0; // for rotating x axis text when text is too long
    if (
      (max_key_length(barData) >= 10) &
      (barData.length >= 10)
    ) {
      rotate = 90;
    }

    // if the xaxis label need a rotation, do this
    if (rotate > 0) {
      svg
        .select('#xAxis')
        .selectAll('text')
        .attr('dx', '0.6em')
        .attr('dy', '-0.6em')
        .attr('text-anchor', 'start')
        .attr('transform', ("rotate(" + rotate + ")"));
    }
    svg
      .append('g')
      .attr('class', 'axis')
      .attr(
        'transform',
        ("translate (" + (margin.left) + ", " + (margin.top) + ")")
      )
      .call(yAxis);

    //--------------------------------------------------------------------------------
    //Axis labels
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('y', 0 + HEIGHT / 2)
      .attr('x', 0 + margin.left / 2)
      .attr('dx', '0em')
      .text(toTitle(yAttribute));

    if (rotate == 90) ; else {
      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('y', HEIGHT - margin.bottom / 2)
        .attr('x', 0 + WIDTH / 2 + margin.left / 2)
        .attr('dy', '1.5em')
        .text(toTitle(xAttribute));
    }
    //--------------------------------------------------------------------------------
    // sorting
    // radio button calls sort function on click
    d3.select(ref_radio).selectAll('input').on('click', sort);

    // sort when changing dropdown menu given the sorted button is already selected
    sort(sort_status);

    function change_data(new_data, duration, delay) {
      if ( delay === void 0 ) delay = 0;

      //change the axis generator
      xScale.domain(new_data.map(function (d) { return d.key; }));
      svg
        .select('#xAxis')
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .call(xAxis);

      // change bars
      var bars = svg
        .selectAll('rect')
        .data(new_data, function (d) { return d.key; });
      bars
        .transition()
        .delay(delay)
        .duration(duration)
        .ease(d3.easeLinear)
        .attr('x', function (d, i) { return xScale(d.key) + barAdjust; })
        .attr('y', function (d) { return yScale(d.value[yAttribute]); })
        .attr('width', xScale.bandwidth() - barAdjust * 2)
        .attr(
          'height',
          function (d) { return innerHeight - yScale(d.value[yAttribute]); }
        );
    }

    // argument is optional, used when changing dropdown menu given the sorted button is already selected
    function sort(arg) {
      if (typeof arg == 'string') {
        // when changing dropdown menu given the sorted button is already selected
        var action = arg;
        var duration = 0;
      } else {
        // when no argument is passed into sort, get value from the radio button
        var action = d3.select(this).node().value;
        var duration = SORT_DURATION;
      }

      if (action == 'height') {
        var new_data$1 = barData
          .slice()
          .sort(function (a, b) { return d3.ascending(
              b.value[yAttribute],
              a.value[yAttribute]
            ); }
          );
        change_data(new_data$1, duration);
        sort_status = 'height';
      } else if (action == 'x') {
        // if the str is a number, compare the number, not the strings. If we can process the
        // data so that the key remains numeric data type in the transform function, we don't need this step
        if (barData[0].key.match('\\d+')) {
          var new_data = barData
            .slice()
            .sort(function (a, b) { return d3.ascending(parseInt(a.key), parseInt(b.key)); }
            );
        } else {
          var new_data = barData
            .slice()
            .sort(function (a, b) { return d3.ascending(a.key, b.key); });
        }
        change_data(new_data, duration);
        sort_status = 'x';
      }
    }

  };

  var Chart = function (ref) {
    var barData = ref.barData;
    var xAttribute = ref.xAttribute;
    var yAttribute = ref.yAttribute;
    var xFields = ref.xFields;
    var totalPopulation = ref.totalPopulation;


    // return the title, the dropdown menus, the barplot with axes, and the table
    return (
      React.createElement( React.Fragment, null,
        React.createElement( 'svg', { id: 'bar', width: "900", height: "400" }),

        React.createElement( 'div', {
          id: "radio_sort", ref: function (d) { return Bar(d,barData,yAttribute,xAttribute,totalPopulation); }, class: "control-group" },

          React.createElement( 'label', { class: "control control-radio" }, "Sort by Height ", React.createElement( 'input', { className: "radio", type: "radio", value: "height", name: "sort" }),
            React.createElement( 'div', { class: "control_indicator" })
          ),

          React.createElement( 'label', { class: "control control-radio" }, "Sort by X Value ", React.createElement( 'input', { className: "radio", type: "radio", value: "x", name: "sort" }),
            React.createElement( 'div', { class: "control_indicator" })
          )

        )

      )
    );
  };

  var jsonURL$1 = "https://gist.githubusercontent.com/aulichney/e39466ea9781fb262b190fb943003738/raw/0d4fe8b4b2a5efe1784915b08eb53910f7fa9ee4/output.geojson";

  var useGeoJson = function () {
    var ref = React$1.useState(null);
    var data = ref[0];
    var setData = ref[1];
    React$1.useEffect(function () {
      d3$1.json(jsonURL$1) // retrieve data from the given URL
        .then(function (data) {
          //when data is retrieved, do the following
          setData(data);
          // use the react hook to set the data
        });
    }, []);

    return data;
  };

  //set color scale
  var color_scale= ["#008aa2","#018aa1","#0189a1","#0289a1","#0289a0","#0289a0","#0389a0","#03899f","#04889f","#04889f","#05889e","#05889e","#05889e","#06889d","#06879d","#07879d","#07879d","#07879c","#08879c","#08879c","#09869b","#09869b","#09869b","#0a869a","#0a869a","#0b859a","#0b8599","#0b8599","#0c8599","#0c8598","#0d8598","#0d8498","#0e8497","#0e8497","#0e8497","#0f8496","#0f8496","#108396","#108395","#108395","#118395","#118394","#128394","#128294","#128293","#138293","#138293","#148292","#148192","#148192","#158192","#158191","#168191","#168191","#178090","#178090","#178090","#18808f","#18808f","#19808f","#197f8e","#197f8e","#1a7f8e","#1a7f8d","#1b7f8d","#1b7f8d","#1b7e8c","#1c7e8c","#1c7e8c","#1d7e8b","#1d7e8b","#1d7d8b","#1e7d8a","#1e7d8a","#1f7d8a","#1f7d89","#207d89","#207c89","#207c88","#217c88","#217c88","#227c87","#227c87","#227b87","#237b87","#237b86","#247b86","#247b86","#247b85","#257a85","#257a85","#267a84","#267a84","#267a84","#277a83","#277983","#287983","#287982","#297982","#297982","#297881","#2a7881","#2a7881","#2b7880","#2b7880","#2b7880","#2c777f","#2c777f","#2d777f","#2d777e","#2d777e","#2e777e","#2e767d","#2f767d","#2f767d","#2f767c","#30767c","#30767c","#31757c","#31757b","#32757b","#32757b","#32757a","#33747a","#33747a","#347479","#347479","#347479","#357478","#357378","#367378","#367377","#367377","#377377","#377376","#387276","#387276","#387275","#397275","#397275","#3a7274","#3a7174","#3b7174","#3b7173","#3b7173","#3c7173","#3c7072","#3d7072","#3d7072","#3d7071","#3e7071","#3e7071","#3f6f71","#3f6f70","#3f6f70","#406f70","#406f6f","#416f6f","#416e6f","#416e6e","#426e6e","#426e6e","#436e6d","#436e6d","#446d6d","#446d6c","#446d6c","#456d6c","#456d6b","#466c6b","#466c6b","#466c6a","#476c6a","#476c6a","#486c69","#486b69","#486b69","#496b68","#496b68","#4a6b68","#4a6b67","#4a6a67","#4b6a67","#4b6a67","#4c6a66","#4c6a66","#4d6a66","#4d6965","#4d6965","#4e6965","#4e6964","#4f6964","#4f6864","#4f6863","#506863","#506863","#516862","#516862","#516762","#526761","#526761","#536761","#536760","#536760","#546660","#54665f","#55665f","#55665f","#56665e","#56665e","#56655e","#57655d","#57655d","#58655d","#58655c","#58645c","#59645c","#59645c","#5a645b","#5a645b","#5a645b","#5b635a","#5b635a","#5c635a","#5c6359","#5c6359","#5d6359","#5d6258","#5e6258","#5e6258","#5f6257","#5f6257","#5f6257","#606156","#606156","#616156","#616155","#616155","#626055","#626054","#636054","#636054","#636053","#646053","#645f53","#655f52","#655f52","#655f52","#665f51","#665f51","#675e51","#675e51","#685e50","#685e50","#685e50","#695e4f","#695d4f","#6a5d4f","#6a5d4e","#6a5d4e","#6b5d4e","#6b5d4d","#6c5c4d","#6c5c4d","#6c5c4c","#6d5c4c","#6d5c4c","#6e5b4b","#6e5b4b","#6e5b4b","#6f5b4a","#6f5b4a","#705b4a","#705a49","#715a49","#715a49","#715a48","#725a48","#725a48","#735947","#735947","#735947","#745946","#745946","#755946","#755846","#755845","#765845","#765845","#775844","#775744","#775744","#785743","#785743","#795743","#795742","#7a5642","#7a5642","#7a5641","#7b5641","#7b5641","#7c5640","#7c5540","#7c5540","#7d553f","#7d553f","#7e553f","#7e553e","#7e543e","#7f543e","#7f543d","#80543d","#80543d","#80533c","#81533c","#81533c","#82533b","#82533b","#83533b","#83523b","#83523a","#84523a","#84523a","#855239","#855239","#855139","#865138","#865138","#875138","#875137","#875137","#885037","#885036","#895036","#895036","#895035","#8a4f35","#8a4f35","#8b4f34","#8b4f34","#8c4f34","#8c4f33","#8c4e33","#8d4e33","#8d4e32","#8e4e32","#8e4e32","#8e4e31","#8f4d31","#8f4d31","#904d31","#904d30","#904d30","#914d30","#914c2f","#924c2f","#924c2f","#924c2e","#934c2e","#934b2e","#944b2d","#944b2d","#954b2d","#954b2c","#954b2c","#964a2c","#964a2b","#974a2b","#974a2b","#974a2a","#984a2a","#98492a","#994929","#994929","#994929","#9a4928","#9a4928","#9b4828","#9b4827","#9b4827","#9c4827","#9c4826","#9d4726","#9d4726","#9e4726","#9e4725","#9e4725","#9f4725","#9f4624","#a04624","#a04624","#a04623","#a14623","#a14623","#a24522","#a24522","#a24522","#a34521","#a34521","#a44521","#a44420","#a44420","#a54420","#a5441f","#a6441f","#a6431f","#a7431e","#a7431e","#a7431e","#a8431d","#a8431d","#a9421d","#a9421c","#a9421c","#aa421c","#aa421b","#ab421b","#ab411b","#ab411b","#ac411a","#ac411a","#ad411a","#ad4119","#ad4019","#ae4019","#ae4018","#af4018","#af4018","#b04017","#b03f17","#b03f17","#b13f16","#b13f16","#b23f16","#b23e15","#b23e15","#b33e15","#b33e14","#b43e14","#b43e14","#b43d13","#b53d13","#b53d13","#b63d12","#b63d12","#b63d12","#b73c11","#b73c11","#b83c11","#b83c10","#b93c10","#b93c10","#b93b10","#ba3b0f","#ba3b0f","#bb3b0f","#bb3b0e","#bb3a0e","#bc3a0e","#bc3a0d","#bd3a0d","#bd3a0d","#bd3a0c","#be390c","#be390c","#bf390b","#bf390b","#bf390b","#c0390a","#c0380a","#c1380a","#c13809","#c23809","#c23809","#c23808","#c33708","#c33708","#c43707","#c43707","#c43707","#c53606","#c53606","#c63606","#c63605","#c63605","#c73605","#c73505","#c83504","#c83504","#c83504","#c93503","#c93503","#ca3403","#ca3402","#cb3402","#cb3402","#cb3401","#cc3401","#cc3301","#cd3300"];

  var DrawMap = function ( ref, data, mapAttribute  ) {

  	var svg = d3.select("svg#map");
  	svg.selectAll('*').remove();

    var selected_dataset = mapAttribute;

    var projection = d3.geoMercator()
                       .center([-76.6180827, 39.323953])
                       .scale([4500])
                       .translate([400, 700]);

    var tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

    // first of two scales for linear fill; ref [1]
    var fill_gradient = d3.scaleLinear()
                         .domain(d3.range(0, 1, 1.0 / (color_scale.length - 1)))
                         .range(color_scale);

    // second of two scales for linear fill
    var norm_fill = d3.scaleLinear()
                      .range([0,1]);

    var path = d3.geoPath()
                 .projection(projection);


    var plot = svg.selectAll("path")
              .data(data)
              .enter()
              .append("path")
              .attr("d", path)
              .attr("stroke", "#808080")
              .attr("fill", "#b3b3b3")
    					.call(updateFill, selected_dataset)
              .on('mouseover', function (d, i) {
                tooltip
                .html(
                  ("<div> " + (d.properties.name) + " County </div>\n                <div> " + (d.properties[selected_dataset]) + "</div>")
              )
                .style('visibility', 'visible');
                d3.select(this).style("opacity", 0.7);

            })
            .on('mousemove', function () {
              tooltip
              .style('top', d3.event.pageY - 10 + 'px')
              .style('left', d3.event.pageX + 10 + 'px');
            })
            .on('mouseout', function () {
              tooltip.html("").style('visibility', 'hidden');
              d3.select(this).style("opacity", 1);
            });

    function updateFill(selection, selected_dataset) { //selected_dataset:variable name

        var d_extent = d3.extent(selection.data(), function(d) {
            return parseFloat(d.properties[selected_dataset]);
        });


        rescaleFill(selection, d_extent);
    }


    function rescaleFill(selection, d_extent) {

        norm_fill.domain(d_extent);

        selection.transition()
                 .duration(700)
                 .attr("fill", function(d) {
                      var countyVal = parseFloat(d.properties[selected_dataset]);
                      return fill_gradient(norm_fill(countyVal));
                 });
    }
    return(React.createElement( React.Fragment, null ))
  };

  var Map = function (ref) {
    var data = ref.data;
    var mapAttribute = ref.mapAttribute;

    return (
      React.createElement( React.Fragment, null,
      React.createElement( 'svg', { id: 'map', width: '1000', height: '800' }),
      React.createElement( 'div', {
        id: 'ref', ref: function (d) { return DrawMap(d, data, mapAttribute); } }
      )
      )
    );
  };

  var App = function () {
    var rawData = useJSON();
    var mapData = useGeoJson();

    // hooks
    var ref = React$1.useState("sex");
    var xAttribute = ref[0];
    var setXAttribute = ref[1]; // barchart x attribute
    var ref$1 = React$1.useState("amount");
    var yAttribute = ref$1[0];
    var setYAttribute = ref$1[1]; // barchart y attribute

    var ref$2 = React$1.useState("numIncarcerated");
    var mapAttribute = ref$2[0];
    var setMapAttribute = ref$2[1]; // map attribute

    if (!rawData || !mapData) {
      return React$1__default.createElement( 'h2', null, "Loading..." );
    }

    // the data comes in ----------------------------------------------------------------------------
    // deal with undercustody data ------------------------------------------------------------------
    var barData = transformData(rawData, xAttribute);
    // map each column to { value: col, label: col } to feed into react Dropdown menu
    var xFields = Object.keys(rawData[0]).map(function (d) { return ({
      value: d,
      label: d,
    }); });
    var yFields = Object.keys(barData[0].value).map(function (d) { return ({
      value: d,
      label: d,
    }); });

    // deal with new york state county data ---------------------------------------------------------
    var mapFields = [
      {
        value: "numIncarcerated",
        label: "Number Serving Sentence in Facility Within County",
      },
      {
        value: "numIncarceratedMale",
        label: "Number Males Serving Sentence in Facility Within County",
      },
      {
        value: "numIncarceratedFemale",
        label: "Number Femalese Serving Sentence in Facility Within County",
      },
      { value: "numCrimeCommitted", label: "Number Incarcerated" },
      { value: "numCrimeCommittedMale", label: "Number Males Incarcerated" },
      { value: "numCrimeCommittedFemale", label: "Number Females Incarcerated" },
      { value: "population", label: "County Population" },
      { value: "populationMale", label: "County Male Population" },
      { value: "populationFemale", label: "County Female Population" },
      { value: "incarcerationRate", label: "Incarceration Rate" },
      { value: "incarcerationRateMale", label: "Incarceration Rate Male" },
      { value: "incarcerationRateFemale", label: "Incarceration Rate Female" },
      { value: "countyHispanic", label: "County Hispanic Population" },
      { value: "countyHispanicPct", label: "County Hispanic Percent" },
      { value: "countyNHWhite", label: "County NH-White Population" },
      { value: "countyNYWhitePct", label: "County NH-White Percent" },
      { value: "countyNHBlackPct", label: "County NH-Black Percent" },
      { value: "countyNHOther", label: "County NH-Other Population" },
      { value: "countyNHOtherPct", label: "County NH-Other Percent" },
      { value: "prisonHispanic", label: "Prison Hispanic Population" },
      { value: "prisonHispanicPct", label: "Prison Hispanic Percent" },
      { value: "prisonNHWhite", label: "Prison NHWhite Population" },
      { value: "prisonNHWhitePct", label: "Prison NHWhite Percent" },
      { value: "prisonNHBlack", label: "Prison NHBlack Population" },
      { value: "prisonNHBlackPct", label: "Prison NHBlack Percent" },
      { value: "prisonNHOther", label: "Prison NH Other Population" },
      { value: "prisonNHOtherPct", label: "Prison NH Other Percent" },
      {
        value: "incarcerationRateHispanic",
        label: "Incarceration Rate Hispanic",
      },
      { value: "incarcerationRateNHWhite", label: "Incarceration Rate NHWhite" },
      { value: "incarcerationRateNHBlack", label: "Incarceration Rate NHBlack" },
      { value: "incarcerationRateNHOther", label: "Incarceration Rate NHOther" },
      { value: "pctUnemployed", label: "Percent Unemployed Over 16" },
      {
        value: "pctFoodStamps",
        label: "Percent Used Food Stamps in Last 12 months",
      },
      { value: "pctPovertyLine", label: "Percent Below Poverty Line" },
      { value: "pctHighSchool", label: "Percent Over 25 High School Graduate" },
      { value: "pctBachelors", label: "Percent Over 25 Bachelors or Higher" } ];
    return (
      React$1__default.createElement( React$1__default.Fragment, null,
        React$1__default.createElement( 'div', null,
          React$1__default.createElement( 'div', { id: "barchart_menu", className: "menu-container" },
            React$1__default.createElement( 'span', { className: "dropdown-label" }, "X"),
            React$1__default.createElement( ReactDropdown, {
              options: xFields, value: xAttribute, onChange: function (ref) {
                var value = ref.value;
                var label = ref.label;

                return setXAttribute(value);
    } }),
            React$1__default.createElement( 'span', { className: "dropdown-label" }, "Y"),
            React$1__default.createElement( ReactDropdown, {
              options: yFields, value: yAttribute, onChange: function (ref) {
                var value = ref.value;
                var label = ref.label;

                return setYAttribute(value);
    } })
          ),
          React$1__default.createElement( Chart, {
            barData: barData, xAttribute: xAttribute, yAttribute: yAttribute, xFields: xFields, totalPopulation: rawData.length })
        ),

        React$1__default.createElement( 'div', null,
          React$1__default.createElement( 'h1', { id: "map" }, " New York State Map Data"),

          React$1__default.createElement( 'div', { id: "map_menu", className: "menu-container" },
            React$1__default.createElement( 'span', { className: "dropdown-label" }, "Select"),
            React$1__default.createElement( ReactDropdown, {
              options: mapFields, value: mapAttribute, onChange: function (ref) {
                var value = ref.value;
                var label = ref.label;

                return setMapAttribute(value);
    } })
          ),
          React$1__default.createElement( Map, { data: mapData.features, mapAttribute: mapAttribute })
        )
      )
    );
  };

  var rootElement = document.getElementById("root");
  ReactDOM.render(React$1__default.createElement( App, null ), rootElement);

}(React, ReactDOM, ReactDropdown, d3));
//# sourceMappingURL=bundle.js.map
