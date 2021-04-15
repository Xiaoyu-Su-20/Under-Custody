(function (React$1, ReactDOM$1, d3$1, ReactDropdown) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM$1 = ReactDOM$1 && Object.prototype.hasOwnProperty.call(ReactDOM$1, 'default') ? ReactDOM$1['default'] : ReactDOM$1;
  var d3$1__default = 'default' in d3$1 ? d3$1['default'] : d3$1;
  ReactDropdown = ReactDropdown && Object.prototype.hasOwnProperty.call(ReactDropdown, 'default') ? ReactDropdown['default'] : ReactDropdown;

  const jsonURL =
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
    let transformed = d3$1.nest()
      .key((d) => d[col])
      .rollup((d) => {
        return {
          amount: d.length,
          ageAvg: d3$1.mean(d.map((correspondent) => correspondent.age)),
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
  const useJSON = () => {
    const [data, setData] = React$1.useState(null);
    React$1.useEffect(() => {
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

  // bar constants
  const WIDTH = 900;
  const HEIGHT = 400;
  const margin = {
    top: 25,
    right: 25,
    bottom: 60,
    left: 190,
  };
  const innerWidth = WIDTH - margin.left - margin.right;
  const innerHeight = HEIGHT - margin.top - margin.bottom;

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

  //sort constant, 'none'; 'height': sort by height descendant; 'x': sort by x value
  let sort_status = 'none';
  const SORT_DURATION = 500;

  // create the svg object
  const SVG = (ref) => {
    // the temporary solution is this, prevent react from appending svgs indefinitely
    if (d3.selectAll('h1').selectAll('svg').empty()) {
      d3.select(ref)
        .append('svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);
    }
  };

  const Bar = (
    ref_radio,
    barData,
    yAttribute,
    xAttribute,
    totalPopulation
  ) => {
    const barAdjust = 100 / barData.length ** 1.5; // for adjusting the width of bars

    // remove everything from svg and rerender all objects
    const svg = d3.select('svg');
    svg.selectAll('*').remove();
    
    //-------------------------------------------------------------------------------
    // xScale, yScale

    const xScale = d3
      .scaleBand()
      .domain(barData.map((d) => d.key))
      .range([0, innerWidth])
      .paddingInner([0.2]);
    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(barData.map((d) => d.value[yAttribute])),
      ])
      .range([innerHeight, 0])
      .nice();

    //--------------------------------------------------------------------------------
    // bars and tooltip
    
    // if age is selected as x-attributes, compute integral  
    if (xAttribute == 'age') {
      barData = add_integral(barData);
    }
  	
    // components of the bar: bar locations, mouseover opacity change, mouseover tooltip 
    const bars = svg
      .append('g')
      .attr(
        'transform',
        `translate (${margin.left}, ${margin.top})`
      )
      .selectAll('rect')
      .data(barData, (d) => d.key);
    bars
      .enter()
      .append('rect')
      .attr('x', (d, i) => xScale(d.key) + barAdjust)
      .attr('y', (d) => yScale(d.value[yAttribute]))
      .attr('width', xScale.bandwidth() - barAdjust * 2)
      .attr(
        'height',
        (d) => innerHeight - yScale(d.value[yAttribute])
      )
      .style('opacity', 1)
      .on('mouseover', function (d, i) {
        if (
          (yAttribute == 'amount') &
          (xAttribute == 'age')
        ) {
          tooltip
            .html(
              `<div>${toTitle(xAttribute)}: ${d.key}</div>
                  <div>${toTitle(
                    yAttribute
                  )}: ${formatNumber(
              d.value[yAttribute].toFixed(0)
            )}</div>
                  <div>${'Percent'}: ${formatNumber(
              (
                (d.value[yAttribute] / totalPopulation) *
                100
              ).toFixed(2)
            )}%</div>
                  <div>There are ${formatNumber(
                    d.value.younger
                  )} people ${
              d.key
            } or younger under custody (${formatNumber(
              (
                (d.value.younger / totalPopulation) *
                100
              ).toFixed(1)
            )}%)</div>
                  <div>There are ${formatNumber(
                    d.value.older
                  )} people over ${
              d.key
            } under custody (${formatNumber(
              (
                (d.value.older / totalPopulation) *
                100
              ).toFixed(1)
            )}%)</div>`
            )
            .style('visibility', 'visible');
          d3.select(this).style('opacity', 0.7);
        } else if (yAttribute == 'amount') {
          tooltip
            .html(
              `<div>${toTitle(xAttribute)}: ${d.key}</div>
                  <div>${toTitle(
                    yAttribute
                  )}: ${formatNumber(
              d.value[yAttribute].toFixed(0)
            )}</div>
                  <div>${'Percent'}: ${formatNumber(
              (
                (d.value[yAttribute] / totalPopulation) *
                100
              ).toFixed(2)
            )}%</div>`
            )
            .style('visibility', 'visible');
          d3.select(this).style('opacity', 0.7);
        } else {
          tooltip
            .html(
              `<div>${toTitle(xAttribute)}: ${d.key}</div>
                  <div>${toTitle(
                    yAttribute
                  )}: ${formatNumber(
              d.value[yAttribute].toFixed(0)
            )}</div>
                  <div>${'Count'}${d.key}: ${formatNumber(
              d.value.amount.toFixed(0)
            )}</div>`
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
        tooltip.html(``).style('visibility', 'hidden');
        d3.select(this).style('opacity', 1);
      });

    //moueover tooltip
    const tooltip = d3$1.select('body')
      .append('div')
      .attr('class', 'd3-tooltip');

    //--------------------------------------------------------------------------------
    // xAxis, yAxis
  	
    // initialize axis 

    var xAxis = d3.axisBottom()
    								.scale(xScale);
  	
    // if xaxis contains too many numbers, consider show every other axis tick 
    if ((barData.length > 40) & !isNaN(barData[0].key)) {  
      xAxis = xAxis.tickFormat((interval,i) => {
                      return i%2 !== 0 ? " ": interval;});
    }
    
    const yAxis = d3.axisLeft().scale(yScale);
  	
    // show axis 
    svg
      .append('g')
      .attr('class', 'axis')
      .attr('id', 'xAxis')
      .attr(
        'transform',
        `translate (${margin.left}, ${
        HEIGHT - margin.bottom
      })`
      )
      .call(xAxis);
    
    
    let rotate = 0; // for rotating x axis text when text is too long
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
        .attr('transform', `rotate(${rotate})`);
    }

    svg
      .append('g')
      .attr('class', 'axis')
      .attr(
        'transform',
        `translate (${margin.left}, ${margin.top})`
      )
      .call(yAxis);

    //--------------------------------------------------------------------------------
    //Axis labels
    svg
      .append('text')
      .attr('class', 'axis-label')
      .attr('y', 0 + HEIGHT / 2)
      .attr('x', 0 + margin.left / 2)
      .attr('dx', '0em')
      .text(toTitle(yAttribute));

    if (rotate == 90) ; else {
      svg
        .append('text')
        .attr('class', 'axis-label')
        .attr('y', HEIGHT - margin.bottom)
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

    function change_data(new_data, duration, delay = 0) {
      //change the axis generator
      xScale.domain(new_data.map((d) => d.key));
      svg
        .select('#xAxis')
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .call(xAxis);

      // change bars
      const bars = svg
        .selectAll('rect')
        .data(new_data, (d) => d.key);
      bars
        .transition()
        .delay(delay)
        .duration(duration)
        .ease(d3.easeLinear)
        .attr('x', (d, i) => xScale(d.key) + barAdjust)
        .attr('y', (d) => yScale(d.value[yAttribute]))
        .attr('width', xScale.bandwidth() - barAdjust * 2)
        .attr(
          'height',
          (d) => innerHeight - yScale(d.value[yAttribute])
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
      // console.log(action)

      if (action == 'height') {
        const new_data = barData
          .slice()
          .sort((a, b) =>
            d3.ascending(
              b.value[yAttribute],
              a.value[yAttribute]
            )
          );
        change_data(new_data, duration);
        sort_status = 'height';
      } else if (action == 'x') {
        // if the str is a number, compare the number, not the strings. If we can process the
        // data so that the key remains numeric data type in the transform function, we don't need this step
        if (barData[0].key.match('\\d+')) {
          var new_data = barData
            .slice()
            .sort((a, b) =>
              d3.ascending(parseInt(a.key), parseInt(b.key))
            );
        } else {
          var new_data = barData
            .slice()
            .sort((a, b) => d3.ascending(a.key, b.key));
        }
        change_data(new_data, duration);
        sort_status = 'x';
      }
    }
  };

  //Table
  const Table = ({
    barData,
    yAttribute,
    xAttribute,
    totalPopulation,
  }) => {
    const xScale = d3
      .scaleBand()
      .domain(barData.map((d) => d.key))
      .range([0, innerWidth])
      .paddingInner([0.2]);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(barData.map((d) => d.value[yAttribute])),
      ])
      .range([innerHeight, 0]);

    //create arrays of values that will fill table
    const count = barData.map((d) => d.value[yAttribute]); //count for each category
    const yTotal = d3.sum(count); //total number individuals
    const xLength = xScale.domain().length; //number of categories for the givenn x attribute
    const pct = barData.map(
      (d) => (d.value[yAttribute] / yTotal) * 100
    ); //percent of total for each category

    let row1 = [];
    let rows = [];

    //Fill first row with table headings
    for (var i = 0; i < 1; i++) {
      let rowID = `row${i}`;
      let cell = [];
      for (var idx = 0; idx < 1; idx++) {
        let cellID = `cell${i}-${idx}`;
        cell.push(
          React.createElement( 'td', { key: cellID, id: cellID },
            toTitle(xAttribute)
          )
        );
      }
      if (yAttribute == 'amount') {
        for (var idx = 1; idx < 2; idx++) {
          let cellID = `cell${i}-${idx}`;
          cell.push(
            React.createElement( 'td', { key: cellID, id: cellID }, "Percent")
          );
        }
      }
      if (yAttribute == 'amount') {
        for (var idx = 2; idx < 3; idx++) {
          let cellID = `cell${i}-${idx}`;
          cell.push(
            React.createElement( 'td', { key: cellID, id: cellID }, "Population")
          );
        }
      } else {
        for (var idx = 2; idx < 3; idx++) {
          let cellID = `cell${i}-${idx}`;
          cell.push(
            React.createElement( 'td', { key: cellID, id: cellID }, "Years")
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
      let rowID = `row${i}`;
      let cell = [];
      for (var idx = 0; idx < 1; idx++) {
        let cellID = `cell${i}-${idx}`;
        let entry = xScale.domain()[i - 1];
        cell.push(
          React.createElement( 'td', { key: cellID, id: cellID },
            entry
          )
        );
      }
      if (yAttribute == 'amount') {
        for (var idx = 1; idx < 2; idx++) {
          let cellID = `cell${i}-${idx}`;
          let entry = pct[i - 1].toFixed(2);
          cell.push(
            React.createElement( 'td', { key: cellID, id: cellID },
              entry, "%")
          );
        }
      }
      if (yAttribute == 'amount') {
        for (var idx = 2; idx < 3; idx++) {
          let cellID = `cell${i}-${idx}`;
          let entry = count[i - 1].toFixed(0);
          cell.push(
            React.createElement( 'td', { key: cellID, id: cellID },
              formatNumber(entry)
            )
          );
        }
      } else {
        for (var idx = 2; idx < 3; idx++) {
          let cellID = `cell${i}-${idx}`;
          let entry = count[i - 1].toFixed(2);
          cell.push(
            React.createElement( 'td', { key: cellID, id: cellID },
              formatNumber(entry)
            )
          );
        }
      }

      rows.push(
        React.createElement( 'tr', { key: i, id: rowID },
          cell
        )
      );
    }

    //create table element with rows
    const tableElement = (
      React.createElement( 'table', { id: "summary-table" },
        React.createElement( 'thead', null, row1 ),
        React.createElement( 'tbody', null, rows ),
        React.createElement( 'caption', null, "Total Number Under Custody:", ' ',
          formatNumber(totalPopulation)
        )
      )
    );

    //render table
    ReactDOM.render(
      tableElement,
      document.getElementById('table')
    );
    return React.createElement( React.Fragment, null );
  };

  const Chart = ({ rawData }) => {
    // create React hooks for controlling the grouped data we want to generate; also, setup the initial value
    const [xAttribute, setXAttribute] = React$1.useState('sex');
    const [yAttribute, setYAttribute] = React$1.useState('amount');

    // according to the current xAttr ibute, group by that attribute and compute the number of observations and the average age
    const barData = transformData(rawData, xAttribute);

    //count total entries
    const totalPopulation = rawData.length;
    
    // map each column to { value: col, label: col } to feed into react Dropdown menu
    const xFields = Object.keys(rawData[0]).map((d) => ({
      value: d,
      label: d,
    }));
    
    console.log(xAttribute);

    const yFields = Object.keys(
      barData[0].value
    ).map((d) => ({ value: d, label: d }));

    // return the title, the dropdown menus, the barplot with axes, and the table
    return (
      React.createElement( React.Fragment, null,
        React.createElement( 'h1', { ref: (d) => SVG(d) }, " "),

        React.createElement( 'div', { className: "menu-container" },
          React.createElement( 'span', { className: "dropdown-label" }, "X"),
          React.createElement( ReactDropdown, {
            options: xFields, value: xAttribute, onChange: ({ value, label }) =>
              setXAttribute(value) }),
          React.createElement( 'span', { className: "dropdown-label" }, "Y"),
          React.createElement( ReactDropdown, {
            options: yFields, value: yAttribute, onChange: ({ value, label }) =>
              setYAttribute(value) })
        ),

        React.createElement( 'div', {
          id: "radio_sort", ref: (d) =>
            Bar(
              d,
              barData,
              yAttribute,
              xAttribute,
              totalPopulation
            ), class: "control-group" },
          React.createElement( 'label', { class: "control control-radio" }, "Sort by Height ", React.createElement( 'input', {
              className: "radio", type: "radio", value: "height", name: "sort" }),
            React.createElement( 'div', { class: "control_indicator" })
          ),
          React.createElement( 'label', { class: "control control-radio" }, "Sort by X Value ", React.createElement( 'input', {
              className: "radio", type: "radio", value: "x", name: "sort" }),
            React.createElement( 'div', { class: "control_indicator" })
          )
        ),

        React.createElement( Table, {
          barData: barData, yAttribute: yAttribute, xAttribute: xAttribute, totalPopulation: totalPopulation })
      )
    );
  };

  const jsonURL$1 = "https://gist.githubusercontent.com/aulichney/60c2c3b62487f2bee1b19e3b6b777daf/raw/48aa22fec79033aeb9a2974a0f9d65e797650110/new%2520counties.json";

  const useGeoJson = () => {
    const [data, setData] = React$1.useState(null);
    React$1.useEffect(() => {
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
  const color_scale= ["#008aa2","#018aa1","#0189a1","#0289a1","#0289a0","#0289a0","#0389a0","#03899f","#04889f","#04889f","#05889e","#05889e","#05889e","#06889d","#06879d","#07879d","#07879d","#07879c","#08879c","#08879c","#09869b","#09869b","#09869b","#0a869a","#0a869a","#0b859a","#0b8599","#0b8599","#0c8599","#0c8598","#0d8598","#0d8498","#0e8497","#0e8497","#0e8497","#0f8496","#0f8496","#108396","#108395","#108395","#118395","#118394","#128394","#128294","#128293","#138293","#138293","#148292","#148192","#148192","#158192","#158191","#168191","#168191","#178090","#178090","#178090","#18808f","#18808f","#19808f","#197f8e","#197f8e","#1a7f8e","#1a7f8d","#1b7f8d","#1b7f8d","#1b7e8c","#1c7e8c","#1c7e8c","#1d7e8b","#1d7e8b","#1d7d8b","#1e7d8a","#1e7d8a","#1f7d8a","#1f7d89","#207d89","#207c89","#207c88","#217c88","#217c88","#227c87","#227c87","#227b87","#237b87","#237b86","#247b86","#247b86","#247b85","#257a85","#257a85","#267a84","#267a84","#267a84","#277a83","#277983","#287983","#287982","#297982","#297982","#297881","#2a7881","#2a7881","#2b7880","#2b7880","#2b7880","#2c777f","#2c777f","#2d777f","#2d777e","#2d777e","#2e777e","#2e767d","#2f767d","#2f767d","#2f767c","#30767c","#30767c","#31757c","#31757b","#32757b","#32757b","#32757a","#33747a","#33747a","#347479","#347479","#347479","#357478","#357378","#367378","#367377","#367377","#377377","#377376","#387276","#387276","#387275","#397275","#397275","#3a7274","#3a7174","#3b7174","#3b7173","#3b7173","#3c7173","#3c7072","#3d7072","#3d7072","#3d7071","#3e7071","#3e7071","#3f6f71","#3f6f70","#3f6f70","#406f70","#406f6f","#416f6f","#416e6f","#416e6e","#426e6e","#426e6e","#436e6d","#436e6d","#446d6d","#446d6c","#446d6c","#456d6c","#456d6b","#466c6b","#466c6b","#466c6a","#476c6a","#476c6a","#486c69","#486b69","#486b69","#496b68","#496b68","#4a6b68","#4a6b67","#4a6a67","#4b6a67","#4b6a67","#4c6a66","#4c6a66","#4d6a66","#4d6965","#4d6965","#4e6965","#4e6964","#4f6964","#4f6864","#4f6863","#506863","#506863","#516862","#516862","#516762","#526761","#526761","#536761","#536760","#536760","#546660","#54665f","#55665f","#55665f","#56665e","#56665e","#56655e","#57655d","#57655d","#58655d","#58655c","#58645c","#59645c","#59645c","#5a645b","#5a645b","#5a645b","#5b635a","#5b635a","#5c635a","#5c6359","#5c6359","#5d6359","#5d6258","#5e6258","#5e6258","#5f6257","#5f6257","#5f6257","#606156","#606156","#616156","#616155","#616155","#626055","#626054","#636054","#636054","#636053","#646053","#645f53","#655f52","#655f52","#655f52","#665f51","#665f51","#675e51","#675e51","#685e50","#685e50","#685e50","#695e4f","#695d4f","#6a5d4f","#6a5d4e","#6a5d4e","#6b5d4e","#6b5d4d","#6c5c4d","#6c5c4d","#6c5c4c","#6d5c4c","#6d5c4c","#6e5b4b","#6e5b4b","#6e5b4b","#6f5b4a","#6f5b4a","#705b4a","#705a49","#715a49","#715a49","#715a48","#725a48","#725a48","#735947","#735947","#735947","#745946","#745946","#755946","#755846","#755845","#765845","#765845","#775844","#775744","#775744","#785743","#785743","#795743","#795742","#7a5642","#7a5642","#7a5641","#7b5641","#7b5641","#7c5640","#7c5540","#7c5540","#7d553f","#7d553f","#7e553f","#7e553e","#7e543e","#7f543e","#7f543d","#80543d","#80543d","#80533c","#81533c","#81533c","#82533b","#82533b","#83533b","#83523b","#83523a","#84523a","#84523a","#855239","#855239","#855139","#865138","#865138","#875138","#875137","#875137","#885037","#885036","#895036","#895036","#895035","#8a4f35","#8a4f35","#8b4f34","#8b4f34","#8c4f34","#8c4f33","#8c4e33","#8d4e33","#8d4e32","#8e4e32","#8e4e32","#8e4e31","#8f4d31","#8f4d31","#904d31","#904d30","#904d30","#914d30","#914c2f","#924c2f","#924c2f","#924c2e","#934c2e","#934b2e","#944b2d","#944b2d","#954b2d","#954b2c","#954b2c","#964a2c","#964a2b","#974a2b","#974a2b","#974a2a","#984a2a","#98492a","#994929","#994929","#994929","#9a4928","#9a4928","#9b4828","#9b4827","#9b4827","#9c4827","#9c4826","#9d4726","#9d4726","#9e4726","#9e4725","#9e4725","#9f4725","#9f4624","#a04624","#a04624","#a04623","#a14623","#a14623","#a24522","#a24522","#a24522","#a34521","#a34521","#a44521","#a44420","#a44420","#a54420","#a5441f","#a6441f","#a6431f","#a7431e","#a7431e","#a7431e","#a8431d","#a8431d","#a9421d","#a9421c","#a9421c","#aa421c","#aa421b","#ab421b","#ab411b","#ab411b","#ac411a","#ac411a","#ad411a","#ad4119","#ad4019","#ae4019","#ae4018","#af4018","#af4018","#b04017","#b03f17","#b03f17","#b13f16","#b13f16","#b23f16","#b23e15","#b23e15","#b33e15","#b33e14","#b43e14","#b43e14","#b43d13","#b53d13","#b53d13","#b63d12","#b63d12","#b63d12","#b73c11","#b73c11","#b83c11","#b83c10","#b93c10","#b93c10","#b93b10","#ba3b0f","#ba3b0f","#bb3b0f","#bb3b0e","#bb3a0e","#bc3a0e","#bc3a0d","#bd3a0d","#bd3a0d","#bd3a0c","#be390c","#be390c","#bf390b","#bf390b","#bf390b","#c0390a","#c0380a","#c1380a","#c13809","#c23809","#c23809","#c23808","#c33708","#c33708","#c43707","#c43707","#c43707","#c53606","#c53606","#c63606","#c63605","#c63605","#c73605","#c73505","#c83504","#c83504","#c83504","#c93503","#c93503","#ca3403","#ca3402","#cb3402","#cb3402","#cb3401","#cc3401","#cc3301","#cd3300"];

  const Map = ( {data} ) => {
      var dropdown_options = [
      { value: "numIncarcerated",
        text: "Number Incarcerated" },
      { value: "numCrimes",
        text: "Number of Crimes" },
      { value: "population",
        text: "County Population" },
      { value: "incarcerationRate",
        text: "Incarceration Rate" },
      ];

  	

    // populate drop-down
    d3$1__default.select("#dropdown")
      .selectAll("option")
      .data(dropdown_options)
      .enter()
      .append("option")
      .attr("value", function(option) { return option.value; })
      .text(function(option) { return option.text; });

    // initial dataset on load
    var selected_dataset = "numIncarcerated";

    var svg = d3$1__default.select("svg");
    var projection = d3$1__default.geoMercator()
                       .center([-76.6180827, 39.323953])
                       .scale([4500])
                       .translate([400, 700]);
    
    const tooltip = d3$1__default.select("body").append("div").attr("class", "d3-tooltip");

    const selectedText = d3$1__default.select('#dropdown option:checked').text();

    // first of two scales for linear fill; ref [1]
    var fill_gradient = d3$1__default.scaleLinear()
                         .domain(d3$1__default.range(0, 1, 1.0 / (color_scale.length - 1)))
                         .range(color_scale);

    // second of two scales for linear fill
    var norm_fill = d3$1__default.scaleLinear()
                      .range([0,1]);

    // dropdown dataset selection
    var dropDown = d3$1__default.select("#dropdown");

    dropDown.on("change", function() {

        selected_dataset = d3$1__default.event.target.value;

        plot.call(updateFill, selected_dataset);
    });


    var path = d3$1__default.geoPath()
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
                  `<div> ${d.properties.name} County </div>
                <div> ${d.properties[selected_dataset]}</div>`
              )
                .style('visibility', 'visible');
                d3$1__default.select(this).style("opacity", 0.7);

            })
            .on('mousemove', function () {
              tooltip
              .style('top', d3$1__default.event.pageY - 10 + 'px')
              .style('left', d3$1__default.event.pageX + 10 + 'px');
            })
            .on('mouseout', function () {
              tooltip.html(``).style('visibility', 'hidden');
              d3$1__default.select(this).style("opacity", 1);
            });
    
    function updateFill(selection, selected_dataset) { //selected_dataset:variable name

      var d_extent = d3$1__default.extent(selection.data(), function(d) {
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
    
  	const [Attribute, setAttribute] = React$1.useState('numIncarcerated');
    
    const Fields = [
      { value: "numIncarcerated",
        text: "Number Incarcerated" },
      { value: "numCrimes",
        text: "Number of Crimes" },
      { value: "population",
        text: "County Population" },
      { value: "incarcerationRate",
        text: "Incarceration Rate" },
      ];
    
    return(React.createElement( React.Fragment, null,
              React.createElement( ReactDropdown, {
            options: Fields, value: Attribute, onChange: ({ value, text }) =>
              setAttribute(value) })
      ))
  };

  const App = () => {
    const rawData = useJSON();
    
    const mapData = useGeoJson();

    if ((!rawData) || (!mapData)) {
      return React$1__default.createElement( 'h2', null, "Loading..." );
    }

    console.log(mapData);

    return (
      React$1__default.createElement( React$1__default.Fragment, null,
        React$1__default.createElement( Chart, { rawData: rawData }),
        React$1__default.createElement( Map, { data: mapData.features })
      )
    );
  };

  const rootElement = document.getElementById("root");
  ReactDOM$1.render(React$1__default.createElement( App, null ), rootElement);

}(React, ReactDOM, d3, ReactDropdown));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInVzZURhdGEuanMiLCJiYXIuanMiLCJ1c2VHZW9Kc29uLmpzIiwiY29sb3Jfc2NhbGUuanMiLCJtYXAuanMiLCJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgbWVhbiwganNvbiwgbmVzdCB9IGZyb20gXCJkM1wiO1xuXG5jb25zdCBqc29uVVJMID1cbiAgLy8gIFwiaHR0cHM6Ly9naXN0LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hdWxpY2huZXkvMmJkZjEzY2UwN2FiY2MzMjA2YzU3MzViNGMzOTU0MDAvcmF3LzViZWQ0MmZmOGNkNmQyZWJiOGMzMDIwYTAzOGZiM2IwYzU3YjAwYTgvdW5kZXJjdXN0b2R5Z2VvLmpzb25cIjtcbiAgXCJodHRwczovL2dpc3QuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0V2YW5NaXNzaHVsYS8wMTlmMWY5ZTRlNTJjNjMyYmY3NjdiZGExOGRkNGY1NS9yYXcvMzYyMjNjNzlkODNlOGU2NjA2ZjlkZjM5NDFmOTJjNmMyODIxMzNjOC9uZXN0Lmpzb25cIjtcblxuLy8gaGVscGVyIGZ1bmN0aW9uOyBjbGVhbiB0aGUgZGF0YVxuZnVuY3Rpb24gY2xlYW5EYXRhKHJvdykge1xuICByZXR1cm4ge1xuICAgIHNleDogcm93LnNleCxcbiAgICBhZ2U6IE1hdGgucm91bmQocm93LmFnZSksXG4gICAgcmFjZUV0aG5pY2l0eTogcm93Lm1vZEV0aFJhY2UsXG4gICAgdGltZVNlcnZlZDogTWF0aC5yb3VuZChyb3cudGltZVNlcnZlZCksXG4gICAgdGltZVNlcnZlZEJpbm5lZDogcm93LnRpbWVTZXJ2ZWRCaW5uZWQsXG4gICAgYWdlQmlubmVkOiByb3cuYWdlQmlubmVkLFxuICAgIGNyaW1lQ291bnR5OiByb3cuY3JpbWVDb3VudHksXG4gICAgZG93bnN0YXRlUmVzaWRlbnQ6IHJvdy5kb3duc3RhdGVSZXNpZGVudCxcbiAgICBueWNSZXNpZGVudDogcm93Lm55Y1Jlc2lkZW50LFxuICAgIHByaXNvblNlY0xldmVsOiByb3cucHJpc29uU2VjTGV2ZWwsXG4gICAgcHJpc29uOiByb3cucHJpc29uLFxuICB9O1xufVxuXG4vLyBHaXZlbiB0aGUgSlNPTiBkYXRhIGFuZCBhIHNwZWNpZmllZCBjb2x1bW4gbmFtZSxcbi8vIGdyb3VwIGJ5IHRoZSBjb2x1bW4sIGNvbXB1dGUgdGhlIHZhbHVlIGNvdW50cyBhbmQgdGhlIGF2ZXJhZ2UgYWdlXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtRGF0YShkYXRhLCBjb2wpIHtcbiAgbGV0IHRyYW5zZm9ybWVkID0gbmVzdCgpXG4gICAgLmtleSgoZCkgPT4gZFtjb2xdKVxuICAgIC5yb2xsdXAoKGQpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFtb3VudDogZC5sZW5ndGgsXG4gICAgICAgIGFnZUF2ZzogbWVhbihkLm1hcCgoY29ycmVzcG9uZGVudCkgPT4gY29ycmVzcG9uZGVudC5hZ2UpKSxcbiAgICAgICAgYXZnVGltZVNlcnZlZDogbWVhbihcbiAgICAgICAgICBkLm1hcChmdW5jdGlvbiAoY29ycmVzcG9uZGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvcnJlc3BvbmRlbnQudGltZVNlcnZlZDtcbiAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgICAgfTtcbiAgICB9KVxuICAgIC5lbnRyaWVzKGRhdGEpO1xuICByZXR1cm4gdHJhbnNmb3JtZWQ7XG59XG5cbi8vIG1haW4gZnVuY3Rpb247IHJldHJpZXZlIHRoZSBkYXRhIGZyb20gdGhlIEpTT04gZmlsZVxuZXhwb3J0IGNvbnN0IHVzZUpTT04gPSAoKSA9PiB7XG4gIGNvbnN0IFtkYXRhLCBzZXREYXRhXSA9IHVzZVN0YXRlKG51bGwpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGpzb24oanNvblVSTCkgLy8gcmV0cmlldmUgZGF0YSBmcm9tIHRoZSBnaXZlbiBVUkxcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIC8vd2hlbiBkYXRhIGlzIHJldHJpZXZlZCwgZG8gdGhlIGZvbGxvd2luZ1xuICAgICAgICBkYXRhID0gZGF0YS5tYXAoY2xlYW5EYXRhKTsgLy8gbWFwIGVhY2ggcm93IHRvIHRoZSBjbGVhbkRhdGEgZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIGRlc2lyZWQgY29sdW1uc1xuICAgICAgICBzZXREYXRhKGRhdGEpO1xuICAgICAgICAvLyB1c2UgdGhlIHJlYWN0IGhvb2sgdG8gc2V0IHRoZSBkYXRhXG4gICAgICB9KTtcbiAgfSwgW10pO1xuICByZXR1cm4gZGF0YTtcbn07IiwiaW1wb3J0IFJlYWN0RHJvcGRvd24gZnJvbSAncmVhY3QtZHJvcGRvd24nO1xuXG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgc2VsZWN0LCBheGlzQm90dG9tLCBheGlzTGVmdCB9IGZyb20gJ2QzJztcbmltcG9ydCB7IHRyYW5zZm9ybURhdGEgfSBmcm9tICcuL3VzZURhdGEnO1xuXG4vLyBiYXIgY29uc3RhbnRzXG5jb25zdCBXSURUSCA9IDkwMDtcbmNvbnN0IEhFSUdIVCA9IDQwMDtcbmNvbnN0IG1hcmdpbiA9IHtcbiAgdG9wOiAyNSxcbiAgcmlnaHQ6IDI1LFxuICBib3R0b206IDYwLFxuICBsZWZ0OiAxOTAsXG59O1xuY29uc3QgaW5uZXJXaWR0aCA9IFdJRFRIIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQ7XG5jb25zdCBpbm5lckhlaWdodCA9IEhFSUdIVCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xuXG4vL1N0eWxpbmcgYW5kIGZvcm1hdCBmdW5jdGlvbnM6XG4vL1RpdGxlIGNhc2UgZnVuY3Rpb24gZm9yIGF4aXMgdGl0bGUgZm9ybWF0dGluZ1xuZnVuY3Rpb24gdG9UaXRsZShzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTtcbn1cblxuLy9OdW1iZXIgZm9ybWF0dGluZ1xuZnVuY3Rpb24gZm9ybWF0TnVtYmVyKG51bSkge1xuICByZXR1cm4gbnVtXG4gICAgLnRvU3RyaW5nKClcbiAgICAucmVwbGFjZSgvKFxcZCkoPz0oXFxkezN9KSsoPyFcXGQpKS9nLCAnJDEsJyk7XG59XG5cbi8vIGNvbXB1dGUgdGhlIG1heCBsZW5ndGggZm9yIHhBdHRyaWJ1dGVcbmZ1bmN0aW9uIG1heF9rZXlfbGVuZ3RoKGRhdGEpIHtcbiAgdmFyIG1heCA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChkYXRhW2ldLmtleS5sZW5ndGggPiBtYXgpIHtcbiAgICAgIG1heCA9IGRhdGFbaV0ua2V5Lmxlbmd0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1heDtcbn1cblxuLy8gY29tcHV0ZSB0aGUgc3VtIG9mIGFsbCBiYXJzIHdpdGggYW4geC12YWx1ZSBncmVhdGVyL3NtYWxsZXIgdGhhbiBjZXJ0YWluIGJhciBcbmZ1bmN0aW9uIGFkZF9pbnRlZ3JhbChiYXJEYXRhKSB7XG4gIGNvbnN0IGxlc3NUaGFuID0gW107XG4gIGNvbnN0IGdyZWF0ZXJUaGFuID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYmFyRGF0YS5sZW5ndGg7IGkrKykge1xuICAgIHZhciBsZXNzID0gW107XG4gICAgdmFyIGdyZWF0ZXIgPSBbXTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGJhckRhdGEubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChiYXJEYXRhW2pdLmtleSA8PSBwYXJzZUludChiYXJEYXRhW2ldLmtleSkpIHtcbiAgICAgICAgbGVzcy5wdXNoKGJhckRhdGFbal0udmFsdWVbJ2Ftb3VudCddKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdyZWF0ZXIucHVzaChiYXJEYXRhW2pdLnZhbHVlWydhbW91bnQnXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGJhckRhdGFbaV0udmFsdWUueW91bmdlciA9IGQzLnN1bShsZXNzKTtcbiAgICBiYXJEYXRhW2ldLnZhbHVlLm9sZGVyID0gZDMuc3VtKGdyZWF0ZXIpO1xuICB9XG4gIHJldHVybiBiYXJEYXRhO1xufVxuXG4vL3NvcnQgY29uc3RhbnQsICdub25lJzsgJ2hlaWdodCc6IHNvcnQgYnkgaGVpZ2h0IGRlc2NlbmRhbnQ7ICd4Jzogc29ydCBieSB4IHZhbHVlXG5sZXQgc29ydF9zdGF0dXMgPSAnbm9uZSc7XG5jb25zdCBTT1JUX0RVUkFUSU9OID0gNTAwO1xuXG4vLyBjcmVhdGUgdGhlIHN2ZyBvYmplY3RcbmNvbnN0IFNWRyA9IChyZWYpID0+IHtcbiAgLy8gdGhlIHRlbXBvcmFyeSBzb2x1dGlvbiBpcyB0aGlzLCBwcmV2ZW50IHJlYWN0IGZyb20gYXBwZW5kaW5nIHN2Z3MgaW5kZWZpbml0ZWx5XG4gIGlmIChkMy5zZWxlY3RBbGwoJ2gxJykuc2VsZWN0QWxsKCdzdmcnKS5lbXB0eSgpKSB7XG4gICAgZDMuc2VsZWN0KHJlZilcbiAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCBXSURUSClcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBIRUlHSFQpO1xuICB9XG59O1xuXG5jb25zdCBCYXIgPSAoXG4gIHJlZl9yYWRpbyxcbiAgYmFyRGF0YSxcbiAgeUF0dHJpYnV0ZSxcbiAgeEF0dHJpYnV0ZSxcbiAgdG90YWxQb3B1bGF0aW9uXG4pID0+IHtcbiAgY29uc3QgYmFyQWRqdXN0ID0gMTAwIC8gYmFyRGF0YS5sZW5ndGggKiogMS41OyAvLyBmb3IgYWRqdXN0aW5nIHRoZSB3aWR0aCBvZiBiYXJzXG5cbiAgLy8gcmVtb3ZlIGV2ZXJ5dGhpbmcgZnJvbSBzdmcgYW5kIHJlcmVuZGVyIGFsbCBvYmplY3RzXG4gIGNvbnN0IHN2ZyA9IGQzLnNlbGVjdCgnc3ZnJyk7XG4gIHN2Zy5zZWxlY3RBbGwoJyonKS5yZW1vdmUoKTtcbiAgXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyB4U2NhbGUsIHlTY2FsZVxuXG4gIGNvbnN0IHhTY2FsZSA9IGQzXG4gICAgLnNjYWxlQmFuZCgpXG4gICAgLmRvbWFpbihiYXJEYXRhLm1hcCgoZCkgPT4gZC5rZXkpKVxuICAgIC5yYW5nZShbMCwgaW5uZXJXaWR0aF0pXG4gICAgLnBhZGRpbmdJbm5lcihbMC4yXSk7XG4gIGNvbnN0IHlTY2FsZSA9IGQzXG4gICAgLnNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKFtcbiAgICAgIDAsXG4gICAgICBkMy5tYXgoYmFyRGF0YS5tYXAoKGQpID0+IGQudmFsdWVbeUF0dHJpYnV0ZV0pKSxcbiAgICBdKVxuICAgIC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKVxuICAgIC5uaWNlKCk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBiYXJzIGFuZCB0b29sdGlwXG4gIFxuICAvLyBpZiBhZ2UgaXMgc2VsZWN0ZWQgYXMgeC1hdHRyaWJ1dGVzLCBjb21wdXRlIGludGVncmFsICBcbiAgaWYgKHhBdHRyaWJ1dGUgPT0gJ2FnZScpIHtcbiAgICBiYXJEYXRhID0gYWRkX2ludGVncmFsKGJhckRhdGEpO1xuICB9XG5cdFxuICAvLyBjb21wb25lbnRzIG9mIHRoZSBiYXI6IGJhciBsb2NhdGlvbnMsIG1vdXNlb3ZlciBvcGFjaXR5IGNoYW5nZSwgbW91c2VvdmVyIHRvb2x0aXAgXG4gIGNvbnN0IGJhcnMgPSBzdmdcbiAgICAuYXBwZW5kKCdnJylcbiAgICAuYXR0cihcbiAgICAgICd0cmFuc2Zvcm0nLFxuICAgICAgYHRyYW5zbGF0ZSAoJHttYXJnaW4ubGVmdH0sICR7bWFyZ2luLnRvcH0pYFxuICAgIClcbiAgICAuc2VsZWN0QWxsKCdyZWN0JylcbiAgICAuZGF0YShiYXJEYXRhLCAoZCkgPT4gZC5rZXkpO1xuICBiYXJzXG4gICAgLmVudGVyKClcbiAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAuYXR0cigneCcsIChkLCBpKSA9PiB4U2NhbGUoZC5rZXkpICsgYmFyQWRqdXN0KVxuICAgIC5hdHRyKCd5JywgKGQpID0+IHlTY2FsZShkLnZhbHVlW3lBdHRyaWJ1dGVdKSlcbiAgICAuYXR0cignd2lkdGgnLCB4U2NhbGUuYmFuZHdpZHRoKCkgLSBiYXJBZGp1c3QgKiAyKVxuICAgIC5hdHRyKFxuICAgICAgJ2hlaWdodCcsXG4gICAgICAoZCkgPT4gaW5uZXJIZWlnaHQgLSB5U2NhbGUoZC52YWx1ZVt5QXR0cmlidXRlXSlcbiAgICApXG4gICAgLnN0eWxlKCdvcGFjaXR5JywgMSlcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICBpZiAoXG4gICAgICAgICh5QXR0cmlidXRlID09ICdhbW91bnQnKSAmXG4gICAgICAgICh4QXR0cmlidXRlID09ICdhZ2UnKVxuICAgICAgKSB7XG4gICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAuaHRtbChcbiAgICAgICAgICAgIGA8ZGl2PiR7dG9UaXRsZSh4QXR0cmlidXRlKX06ICR7ZC5rZXl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2PiR7dG9UaXRsZShcbiAgICAgICAgICAgICAgICAgICAgeUF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgKX06ICR7Zm9ybWF0TnVtYmVyKFxuICAgICAgICAgICAgICBkLnZhbHVlW3lBdHRyaWJ1dGVdLnRvRml4ZWQoMClcbiAgICAgICAgICAgICl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2PiR7J1BlcmNlbnQnfTogJHtmb3JtYXROdW1iZXIoXG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAoZC52YWx1ZVt5QXR0cmlidXRlXSAvIHRvdGFsUG9wdWxhdGlvbikgKlxuICAgICAgICAgICAgICAgIDEwMFxuICAgICAgICAgICAgICApLnRvRml4ZWQoMilcbiAgICAgICAgICAgICl9JTwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdj5UaGVyZSBhcmUgJHtmb3JtYXROdW1iZXIoXG4gICAgICAgICAgICAgICAgICAgIGQudmFsdWUueW91bmdlclxuICAgICAgICAgICAgICAgICAgKX0gcGVvcGxlICR7XG4gICAgICAgICAgICAgIGQua2V5XG4gICAgICAgICAgICB9IG9yIHlvdW5nZXIgdW5kZXIgY3VzdG9keSAoJHtmb3JtYXROdW1iZXIoXG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAoZC52YWx1ZS55b3VuZ2VyIC8gdG90YWxQb3B1bGF0aW9uKSAqXG4gICAgICAgICAgICAgICAgMTAwXG4gICAgICAgICAgICAgICkudG9GaXhlZCgxKVxuICAgICAgICAgICAgKX0lKTwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdj5UaGVyZSBhcmUgJHtmb3JtYXROdW1iZXIoXG4gICAgICAgICAgICAgICAgICAgIGQudmFsdWUub2xkZXJcbiAgICAgICAgICAgICAgICAgICl9IHBlb3BsZSBvdmVyICR7XG4gICAgICAgICAgICAgIGQua2V5XG4gICAgICAgICAgICB9IHVuZGVyIGN1c3RvZHkgKCR7Zm9ybWF0TnVtYmVyKFxuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgKGQudmFsdWUub2xkZXIgLyB0b3RhbFBvcHVsYXRpb24pICpcbiAgICAgICAgICAgICAgICAxMDBcbiAgICAgICAgICAgICAgKS50b0ZpeGVkKDEpXG4gICAgICAgICAgICApfSUpPC9kaXY+YFxuICAgICAgICAgIClcbiAgICAgICAgICAuc3R5bGUoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoJ29wYWNpdHknLCAwLjcpO1xuICAgICAgfSBlbHNlIGlmICh5QXR0cmlidXRlID09ICdhbW91bnQnKSB7XG4gICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAuaHRtbChcbiAgICAgICAgICAgIGA8ZGl2PiR7dG9UaXRsZSh4QXR0cmlidXRlKX06ICR7ZC5rZXl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2PiR7dG9UaXRsZShcbiAgICAgICAgICAgICAgICAgICAgeUF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgKX06ICR7Zm9ybWF0TnVtYmVyKFxuICAgICAgICAgICAgICBkLnZhbHVlW3lBdHRyaWJ1dGVdLnRvRml4ZWQoMClcbiAgICAgICAgICAgICl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2PiR7J1BlcmNlbnQnfTogJHtmb3JtYXROdW1iZXIoXG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAoZC52YWx1ZVt5QXR0cmlidXRlXSAvIHRvdGFsUG9wdWxhdGlvbikgKlxuICAgICAgICAgICAgICAgIDEwMFxuICAgICAgICAgICAgICApLnRvRml4ZWQoMilcbiAgICAgICAgICAgICl9JTwvZGl2PmBcbiAgICAgICAgICApXG4gICAgICAgICAgLnN0eWxlKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcbiAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKCdvcGFjaXR5JywgMC43KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAuaHRtbChcbiAgICAgICAgICAgIGA8ZGl2PiR7dG9UaXRsZSh4QXR0cmlidXRlKX06ICR7ZC5rZXl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2PiR7dG9UaXRsZShcbiAgICAgICAgICAgICAgICAgICAgeUF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgKX06ICR7Zm9ybWF0TnVtYmVyKFxuICAgICAgICAgICAgICBkLnZhbHVlW3lBdHRyaWJ1dGVdLnRvRml4ZWQoMClcbiAgICAgICAgICAgICl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2PiR7J0NvdW50J30ke2Qua2V5fTogJHtmb3JtYXROdW1iZXIoXG4gICAgICAgICAgICAgIGQudmFsdWUuYW1vdW50LnRvRml4ZWQoMClcbiAgICAgICAgICAgICl9PC9kaXY+YFxuICAgICAgICAgIClcbiAgICAgICAgICAuc3R5bGUoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoJ29wYWNpdHknLCAwLjcpO1xuICAgICAgfVxuICAgIH0pXG4gICAgLm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0b29sdGlwXG4gICAgICAgIC5zdHlsZSgndG9wJywgZDMuZXZlbnQucGFnZVkgLSAxMCArICdweCcpXG4gICAgICAgIC5zdHlsZSgnbGVmdCcsIGQzLmV2ZW50LnBhZ2VYICsgMTAgKyAncHgnKTtcbiAgICB9KVxuICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0b29sdGlwLmh0bWwoYGApLnN0eWxlKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKCdvcGFjaXR5JywgMSk7XG4gICAgfSk7XG5cbiAgLy9tb3Vlb3ZlciB0b29sdGlwXG4gIGNvbnN0IHRvb2x0aXAgPSBzZWxlY3QoJ2JvZHknKVxuICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2QzLXRvb2x0aXAnKTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIHhBeGlzLCB5QXhpc1xuXHRcbiAgLy8gaW5pdGlhbGl6ZSBheGlzIFxuXG4gIHZhciB4QXhpcyA9IGQzLmF4aXNCb3R0b20oKVxuICBcdFx0XHRcdFx0XHRcdFx0LnNjYWxlKHhTY2FsZSlcblx0XG4gIC8vIGlmIHhheGlzIGNvbnRhaW5zIHRvbyBtYW55IG51bWJlcnMsIGNvbnNpZGVyIHNob3cgZXZlcnkgb3RoZXIgYXhpcyB0aWNrIFxuICBpZiAoKGJhckRhdGEubGVuZ3RoID4gNDApICYgIWlzTmFOKGJhckRhdGFbMF0ua2V5KSkgeyAgXG4gICAgeEF4aXMgPSB4QXhpcy50aWNrRm9ybWF0KChpbnRlcnZhbCxpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpJTIgIT09IDAgPyBcIiBcIjogaW50ZXJ2YWw7fSlcbiAgfVxuICBcbiAgY29uc3QgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHlTY2FsZSk7XG5cdFxuICAvLyBzaG93IGF4aXMgXG4gIHN2Z1xuICAgIC5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdheGlzJylcbiAgICAuYXR0cignaWQnLCAneEF4aXMnKVxuICAgIC5hdHRyKFxuICAgICAgJ3RyYW5zZm9ybScsXG4gICAgICBgdHJhbnNsYXRlICgke21hcmdpbi5sZWZ0fSwgJHtcbiAgICAgICAgSEVJR0hUIC0gbWFyZ2luLmJvdHRvbVxuICAgICAgfSlgXG4gICAgKVxuICAgIC5jYWxsKHhBeGlzKTtcbiAgXG4gIFxuICBsZXQgcm90YXRlID0gMDsgLy8gZm9yIHJvdGF0aW5nIHggYXhpcyB0ZXh0IHdoZW4gdGV4dCBpcyB0b28gbG9uZ1xuICBpZiAoXG4gICAgKG1heF9rZXlfbGVuZ3RoKGJhckRhdGEpID49IDEwKSAmXG4gICAgKGJhckRhdGEubGVuZ3RoID49IDEwKVxuICApIHtcbiAgICByb3RhdGUgPSA5MDtcbiAgfVxuXG4gIC8vIGlmIHRoZSB4YXhpcyBsYWJlbCBuZWVkIGEgcm90YXRpb24sIGRvIHRoaXNcbiAgaWYgKHJvdGF0ZSA+IDApIHtcbiAgICBzdmdcbiAgICAgIC5zZWxlY3QoJyN4QXhpcycpXG4gICAgICAuc2VsZWN0QWxsKCd0ZXh0JylcbiAgICAgIC5hdHRyKCdkeCcsICcwLjZlbScpXG4gICAgICAuYXR0cignZHknLCAnLTAuNmVtJylcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdzdGFydCcpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgYHJvdGF0ZSgke3JvdGF0ZX0pYCk7XG4gIH1cblxuICBzdmdcbiAgICAuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAnYXhpcycpXG4gICAgLmF0dHIoXG4gICAgICAndHJhbnNmb3JtJyxcbiAgICAgIGB0cmFuc2xhdGUgKCR7bWFyZ2luLmxlZnR9LCAke21hcmdpbi50b3B9KWBcbiAgICApXG4gICAgLmNhbGwoeUF4aXMpO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy9BeGlzIGxhYmVsc1xuICBzdmdcbiAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAuYXR0cignY2xhc3MnLCAnYXhpcy1sYWJlbCcpXG4gICAgLmF0dHIoJ3knLCAwICsgSEVJR0hUIC8gMilcbiAgICAuYXR0cigneCcsIDAgKyBtYXJnaW4ubGVmdCAvIDIpXG4gICAgLmF0dHIoJ2R4JywgJzBlbScpXG4gICAgLnRleHQodG9UaXRsZSh5QXR0cmlidXRlKSk7XG5cbiAgaWYgKHJvdGF0ZSA9PSA5MCkge1xuICAgIG51bGw7IC8vZG8gbm90aGluZ1xuICB9IGVsc2Uge1xuICAgIHN2Z1xuICAgICAgLmFwcGVuZCgndGV4dCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYXhpcy1sYWJlbCcpXG4gICAgICAuYXR0cigneScsIEhFSUdIVCAtIG1hcmdpbi5ib3R0b20pXG4gICAgICAuYXR0cigneCcsIDAgKyBXSURUSCAvIDIgKyBtYXJnaW4ubGVmdCAvIDIpXG4gICAgICAuYXR0cignZHknLCAnMS41ZW0nKVxuICAgICAgLnRleHQodG9UaXRsZSh4QXR0cmlidXRlKSk7XG4gIH1cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBzb3J0aW5nXG4gIC8vIHJhZGlvIGJ1dHRvbiBjYWxscyBzb3J0IGZ1bmN0aW9uIG9uIGNsaWNrXG4gIGQzLnNlbGVjdChyZWZfcmFkaW8pLnNlbGVjdEFsbCgnaW5wdXQnKS5vbignY2xpY2snLCBzb3J0KTtcblxuICAvLyBzb3J0IHdoZW4gY2hhbmdpbmcgZHJvcGRvd24gbWVudSBnaXZlbiB0aGUgc29ydGVkIGJ1dHRvbiBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gIHNvcnQoc29ydF9zdGF0dXMpO1xuXG4gIGZ1bmN0aW9uIGNoYW5nZV9kYXRhKG5ld19kYXRhLCBkdXJhdGlvbiwgZGVsYXkgPSAwKSB7XG4gICAgLy9jaGFuZ2UgdGhlIGF4aXMgZ2VuZXJhdG9yXG4gICAgeFNjYWxlLmRvbWFpbihuZXdfZGF0YS5tYXAoKGQpID0+IGQua2V5KSk7XG4gICAgc3ZnXG4gICAgICAuc2VsZWN0KCcjeEF4aXMnKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxuICAgICAgLmVhc2UoZDMuZWFzZUxpbmVhcilcbiAgICAgIC5jYWxsKHhBeGlzKTtcblxuICAgIC8vIGNoYW5nZSBiYXJzXG4gICAgY29uc3QgYmFycyA9IHN2Z1xuICAgICAgLnNlbGVjdEFsbCgncmVjdCcpXG4gICAgICAuZGF0YShuZXdfZGF0YSwgKGQpID0+IGQua2V5KTtcbiAgICBiYXJzXG4gICAgICAudHJhbnNpdGlvbigpXG4gICAgICAuZGVsYXkoZGVsYXkpXG4gICAgICAuZHVyYXRpb24oZHVyYXRpb24pXG4gICAgICAuZWFzZShkMy5lYXNlTGluZWFyKVxuICAgICAgLmF0dHIoJ3gnLCAoZCwgaSkgPT4geFNjYWxlKGQua2V5KSArIGJhckFkanVzdClcbiAgICAgIC5hdHRyKCd5JywgKGQpID0+IHlTY2FsZShkLnZhbHVlW3lBdHRyaWJ1dGVdKSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHhTY2FsZS5iYW5kd2lkdGgoKSAtIGJhckFkanVzdCAqIDIpXG4gICAgICAuYXR0cihcbiAgICAgICAgJ2hlaWdodCcsXG4gICAgICAgIChkKSA9PiBpbm5lckhlaWdodCAtIHlTY2FsZShkLnZhbHVlW3lBdHRyaWJ1dGVdKVxuICAgICAgKTtcbiAgfVxuXG4gIC8vIGFyZ3VtZW50IGlzIG9wdGlvbmFsLCB1c2VkIHdoZW4gY2hhbmdpbmcgZHJvcGRvd24gbWVudSBnaXZlbiB0aGUgc29ydGVkIGJ1dHRvbiBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gIGZ1bmN0aW9uIHNvcnQoYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgPT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIHdoZW4gY2hhbmdpbmcgZHJvcGRvd24gbWVudSBnaXZlbiB0aGUgc29ydGVkIGJ1dHRvbiBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gICAgICB2YXIgYWN0aW9uID0gYXJnO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gd2hlbiBubyBhcmd1bWVudCBpcyBwYXNzZWQgaW50byBzb3J0LCBnZXQgdmFsdWUgZnJvbSB0aGUgcmFkaW8gYnV0dG9uXG4gICAgICB2YXIgYWN0aW9uID0gZDMuc2VsZWN0KHRoaXMpLm5vZGUoKS52YWx1ZTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IFNPUlRfRFVSQVRJT047XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGFjdGlvbilcblxuICAgIGlmIChhY3Rpb24gPT0gJ2hlaWdodCcpIHtcbiAgICAgIGNvbnN0IG5ld19kYXRhID0gYmFyRGF0YVxuICAgICAgICAuc2xpY2UoKVxuICAgICAgICAuc29ydCgoYSwgYikgPT5cbiAgICAgICAgICBkMy5hc2NlbmRpbmcoXG4gICAgICAgICAgICBiLnZhbHVlW3lBdHRyaWJ1dGVdLFxuICAgICAgICAgICAgYS52YWx1ZVt5QXR0cmlidXRlXVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIGNoYW5nZV9kYXRhKG5ld19kYXRhLCBkdXJhdGlvbik7XG4gICAgICBzb3J0X3N0YXR1cyA9ICdoZWlnaHQnO1xuICAgIH0gZWxzZSBpZiAoYWN0aW9uID09ICd4Jykge1xuICAgICAgLy8gaWYgdGhlIHN0ciBpcyBhIG51bWJlciwgY29tcGFyZSB0aGUgbnVtYmVyLCBub3QgdGhlIHN0cmluZ3MuIElmIHdlIGNhbiBwcm9jZXNzIHRoZVxuICAgICAgLy8gZGF0YSBzbyB0aGF0IHRoZSBrZXkgcmVtYWlucyBudW1lcmljIGRhdGEgdHlwZSBpbiB0aGUgdHJhbnNmb3JtIGZ1bmN0aW9uLCB3ZSBkb24ndCBuZWVkIHRoaXMgc3RlcFxuICAgICAgaWYgKGJhckRhdGFbMF0ua2V5Lm1hdGNoKCdcXFxcZCsnKSkge1xuICAgICAgICB2YXIgbmV3X2RhdGEgPSBiYXJEYXRhXG4gICAgICAgICAgLnNsaWNlKClcbiAgICAgICAgICAuc29ydCgoYSwgYikgPT5cbiAgICAgICAgICAgIGQzLmFzY2VuZGluZyhwYXJzZUludChhLmtleSksIHBhcnNlSW50KGIua2V5KSlcbiAgICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG5ld19kYXRhID0gYmFyRGF0YVxuICAgICAgICAgIC5zbGljZSgpXG4gICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGQzLmFzY2VuZGluZyhhLmtleSwgYi5rZXkpKTtcbiAgICAgIH1cbiAgICAgIGNoYW5nZV9kYXRhKG5ld19kYXRhLCBkdXJhdGlvbik7XG4gICAgICBzb3J0X3N0YXR1cyA9ICd4JztcbiAgICB9XG4gIH1cbn07XG5cbi8vVGFibGVcbmNvbnN0IFRhYmxlID0gKHtcbiAgYmFyRGF0YSxcbiAgeUF0dHJpYnV0ZSxcbiAgeEF0dHJpYnV0ZSxcbiAgdG90YWxQb3B1bGF0aW9uLFxufSkgPT4ge1xuICBjb25zdCB4U2NhbGUgPSBkM1xuICAgIC5zY2FsZUJhbmQoKVxuICAgIC5kb21haW4oYmFyRGF0YS5tYXAoKGQpID0+IGQua2V5KSlcbiAgICAucmFuZ2UoWzAsIGlubmVyV2lkdGhdKVxuICAgIC5wYWRkaW5nSW5uZXIoWzAuMl0pO1xuXG4gIGNvbnN0IHlTY2FsZSA9IGQzXG4gICAgLnNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKFtcbiAgICAgIDAsXG4gICAgICBkMy5tYXgoYmFyRGF0YS5tYXAoKGQpID0+IGQudmFsdWVbeUF0dHJpYnV0ZV0pKSxcbiAgICBdKVxuICAgIC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKTtcblxuICAvL2NyZWF0ZSBhcnJheXMgb2YgdmFsdWVzIHRoYXQgd2lsbCBmaWxsIHRhYmxlXG4gIGNvbnN0IGNvdW50ID0gYmFyRGF0YS5tYXAoKGQpID0+IGQudmFsdWVbeUF0dHJpYnV0ZV0pOyAvL2NvdW50IGZvciBlYWNoIGNhdGVnb3J5XG4gIGNvbnN0IHlUb3RhbCA9IGQzLnN1bShjb3VudCk7IC8vdG90YWwgbnVtYmVyIGluZGl2aWR1YWxzXG4gIGNvbnN0IHhMZW5ndGggPSB4U2NhbGUuZG9tYWluKCkubGVuZ3RoOyAvL251bWJlciBvZiBjYXRlZ29yaWVzIGZvciB0aGUgZ2l2ZW5uIHggYXR0cmlidXRlXG4gIGNvbnN0IHBjdCA9IGJhckRhdGEubWFwKFxuICAgIChkKSA9PiAoZC52YWx1ZVt5QXR0cmlidXRlXSAvIHlUb3RhbCkgKiAxMDBcbiAgKTsgLy9wZXJjZW50IG9mIHRvdGFsIGZvciBlYWNoIGNhdGVnb3J5XG5cbiAgbGV0IHJvdzEgPSBbXTtcbiAgbGV0IHJvd3MgPSBbXTtcblxuICAvL0ZpbGwgZmlyc3Qgcm93IHdpdGggdGFibGUgaGVhZGluZ3NcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAxOyBpKyspIHtcbiAgICBsZXQgcm93SUQgPSBgcm93JHtpfWA7XG4gICAgbGV0IGNlbGwgPSBbXTtcbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCAxOyBpZHgrKykge1xuICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gO1xuICAgICAgY2VsbC5wdXNoKFxuICAgICAgICA8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9PlxuICAgICAgICAgIHt0b1RpdGxlKHhBdHRyaWJ1dGUpfVxuICAgICAgICA8L3RkPlxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKHlBdHRyaWJ1dGUgPT0gJ2Ftb3VudCcpIHtcbiAgICAgIGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IDI7IGlkeCsrKSB7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YDtcbiAgICAgICAgY2VsbC5wdXNoKFxuICAgICAgICAgIDx0ZCBrZXk9e2NlbGxJRH0gaWQ9e2NlbGxJRH0+XG4gICAgICAgICAgICBQZXJjZW50XG4gICAgICAgICAgPC90ZD5cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHlBdHRyaWJ1dGUgPT0gJ2Ftb3VudCcpIHtcbiAgICAgIGZvciAodmFyIGlkeCA9IDI7IGlkeCA8IDM7IGlkeCsrKSB7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YDtcbiAgICAgICAgY2VsbC5wdXNoKFxuICAgICAgICAgIDx0ZCBrZXk9e2NlbGxJRH0gaWQ9e2NlbGxJRH0+XG4gICAgICAgICAgICBQb3B1bGF0aW9uXG4gICAgICAgICAgPC90ZD5cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaWR4ID0gMjsgaWR4IDwgMzsgaWR4KyspIHtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gO1xuICAgICAgICBjZWxsLnB1c2goXG4gICAgICAgICAgPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT5cbiAgICAgICAgICAgIFllYXJzXG4gICAgICAgICAgPC90ZD5cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcm93MS5wdXNoKFxuICAgICAgPHRyIGtleT17aX0gaWQ9e3Jvd0lEfT5cbiAgICAgICAge2NlbGx9XG4gICAgICA8L3RyPlxuICAgICk7XG4gIH1cblxuICAvL0ZpbGwgdGFibGUgYnkgY29sdW1uLiBDb2wgMSBpcyBlYWNoIGNhdGVnb3J5IGZvciB0aGUgZ2l2ZW4geGF0dHJpYnV0ZS4gQ29sIDIgaXMgdGhlIHZhbHVlIGZvciBlYWNoIGNhdGVnb3J5LlxuICAvL0NvbCAzIGlzIHBlcmNlbnQgb2YgdG90YWwgcG9wdWxhdGlvbiBmb3IgZWFjaCBjYXRlZ29yeVxuICBmb3IgKHZhciBpID0gMTsgaSA8IHhMZW5ndGggKyAxOyBpKyspIHtcbiAgICBsZXQgcm93SUQgPSBgcm93JHtpfWA7XG4gICAgbGV0IGNlbGwgPSBbXTtcbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCAxOyBpZHgrKykge1xuICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gO1xuICAgICAgbGV0IGVudHJ5ID0geFNjYWxlLmRvbWFpbigpW2kgLSAxXTtcbiAgICAgIGNlbGwucHVzaChcbiAgICAgICAgPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT5cbiAgICAgICAgICB7ZW50cnl9XG4gICAgICAgIDwvdGQ+XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoeUF0dHJpYnV0ZSA9PSAnYW1vdW50Jykge1xuICAgICAgZm9yICh2YXIgaWR4ID0gMTsgaWR4IDwgMjsgaWR4KyspIHtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gO1xuICAgICAgICBsZXQgZW50cnkgPSBwY3RbaSAtIDFdLnRvRml4ZWQoMik7XG4gICAgICAgIGNlbGwucHVzaChcbiAgICAgICAgICA8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9PlxuICAgICAgICAgICAge2VudHJ5fSVcbiAgICAgICAgICA8L3RkPlxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoeUF0dHJpYnV0ZSA9PSAnYW1vdW50Jykge1xuICAgICAgZm9yICh2YXIgaWR4ID0gMjsgaWR4IDwgMzsgaWR4KyspIHtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gO1xuICAgICAgICBsZXQgZW50cnkgPSBjb3VudFtpIC0gMV0udG9GaXhlZCgwKTtcbiAgICAgICAgY2VsbC5wdXNoKFxuICAgICAgICAgIDx0ZCBrZXk9e2NlbGxJRH0gaWQ9e2NlbGxJRH0+XG4gICAgICAgICAgICB7Zm9ybWF0TnVtYmVyKGVudHJ5KX1cbiAgICAgICAgICA8L3RkPlxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpZHggPSAyOyBpZHggPCAzOyBpZHgrKykge1xuICAgICAgICBsZXQgY2VsbElEID0gYGNlbGwke2l9LSR7aWR4fWA7XG4gICAgICAgIGxldCBlbnRyeSA9IGNvdW50W2kgLSAxXS50b0ZpeGVkKDIpO1xuICAgICAgICBjZWxsLnB1c2goXG4gICAgICAgICAgPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT5cbiAgICAgICAgICAgIHtmb3JtYXROdW1iZXIoZW50cnkpfVxuICAgICAgICAgIDwvdGQ+XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcm93cy5wdXNoKFxuICAgICAgPHRyIGtleT17aX0gaWQ9e3Jvd0lEfT5cbiAgICAgICAge2NlbGx9XG4gICAgICA8L3RyPlxuICAgICk7XG4gIH1cblxuICAvL2NyZWF0ZSB0YWJsZSBlbGVtZW50IHdpdGggcm93c1xuICBjb25zdCB0YWJsZUVsZW1lbnQgPSAoXG4gICAgPHRhYmxlIGlkPVwic3VtbWFyeS10YWJsZVwiPlxuICAgICAgPHRoZWFkPntyb3cxfTwvdGhlYWQ+XG4gICAgICA8dGJvZHk+e3Jvd3N9PC90Ym9keT5cbiAgICAgIDxjYXB0aW9uPlxuICAgICAgICBUb3RhbCBOdW1iZXIgVW5kZXIgQ3VzdG9keTp7JyAnfVxuICAgICAgICB7Zm9ybWF0TnVtYmVyKHRvdGFsUG9wdWxhdGlvbil9XG4gICAgICA8L2NhcHRpb24+XG4gICAgPC90YWJsZT5cbiAgKTtcblxuICAvL3JlbmRlciB0YWJsZVxuICBSZWFjdERPTS5yZW5kZXIoXG4gICAgdGFibGVFbGVtZW50LFxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWJsZScpXG4gICk7XG4gIHJldHVybiA8PjwvPjtcbn07XG5cbmV4cG9ydCBjb25zdCBDaGFydCA9ICh7IHJhd0RhdGEgfSkgPT4ge1xuICAvLyBjcmVhdGUgUmVhY3QgaG9va3MgZm9yIGNvbnRyb2xsaW5nIHRoZSBncm91cGVkIGRhdGEgd2Ugd2FudCB0byBnZW5lcmF0ZTsgYWxzbywgc2V0dXAgdGhlIGluaXRpYWwgdmFsdWVcbiAgY29uc3QgW3hBdHRyaWJ1dGUsIHNldFhBdHRyaWJ1dGVdID0gdXNlU3RhdGUoJ3NleCcpO1xuICBjb25zdCBbeUF0dHJpYnV0ZSwgc2V0WUF0dHJpYnV0ZV0gPSB1c2VTdGF0ZSgnYW1vdW50Jyk7XG5cbiAgLy8gYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50IHhBdHRyIGlidXRlLCBncm91cCBieSB0aGF0IGF0dHJpYnV0ZSBhbmQgY29tcHV0ZSB0aGUgbnVtYmVyIG9mIG9ic2VydmF0aW9ucyBhbmQgdGhlIGF2ZXJhZ2UgYWdlXG4gIGNvbnN0IGJhckRhdGEgPSB0cmFuc2Zvcm1EYXRhKHJhd0RhdGEsIHhBdHRyaWJ1dGUpO1xuXG4gIC8vY291bnQgdG90YWwgZW50cmllc1xuICBjb25zdCB0b3RhbFBvcHVsYXRpb24gPSByYXdEYXRhLmxlbmd0aDtcbiAgXG4gIC8vIG1hcCBlYWNoIGNvbHVtbiB0byB7IHZhbHVlOiBjb2wsIGxhYmVsOiBjb2wgfSB0byBmZWVkIGludG8gcmVhY3QgRHJvcGRvd24gbWVudVxuICBjb25zdCB4RmllbGRzID0gT2JqZWN0LmtleXMocmF3RGF0YVswXSkubWFwKChkKSA9PiAoe1xuICAgIHZhbHVlOiBkLFxuICAgIGxhYmVsOiBkLFxuICB9KSk7XG4gIFxuICBjb25zb2xlLmxvZyh4QXR0cmlidXRlKVxuXG4gIGNvbnN0IHlGaWVsZHMgPSBPYmplY3Qua2V5cyhcbiAgICBiYXJEYXRhWzBdLnZhbHVlXG4gICkubWFwKChkKSA9PiAoeyB2YWx1ZTogZCwgbGFiZWw6IGQgfSkpO1xuXG4gIC8vIHJldHVybiB0aGUgdGl0bGUsIHRoZSBkcm9wZG93biBtZW51cywgdGhlIGJhcnBsb3Qgd2l0aCBheGVzLCBhbmQgdGhlIHRhYmxlXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxoMSByZWY9eyhkKSA9PiBTVkcoZCl9PiA8L2gxPlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1lbnUtY29udGFpbmVyXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImRyb3Bkb3duLWxhYmVsXCI+WDwvc3Bhbj5cbiAgICAgICAgPFJlYWN0RHJvcGRvd25cbiAgICAgICAgICBvcHRpb25zPXt4RmllbGRzfVxuICAgICAgICAgIHZhbHVlPXt4QXR0cmlidXRlfVxuICAgICAgICAgIG9uQ2hhbmdlPXsoeyB2YWx1ZSwgbGFiZWwgfSkgPT5cbiAgICAgICAgICAgIHNldFhBdHRyaWJ1dGUodmFsdWUpXG4gICAgICAgICAgfVxuICAgICAgICAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJkcm9wZG93bi1sYWJlbFwiPlk8L3NwYW4+XG4gICAgICAgIDxSZWFjdERyb3Bkb3duXG4gICAgICAgICAgb3B0aW9ucz17eUZpZWxkc31cbiAgICAgICAgICB2YWx1ZT17eUF0dHJpYnV0ZX1cbiAgICAgICAgICBvbkNoYW5nZT17KHsgdmFsdWUsIGxhYmVsIH0pID0+XG4gICAgICAgICAgICBzZXRZQXR0cmlidXRlKHZhbHVlKVxuICAgICAgICAgIH1cbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2XG4gICAgICAgIGlkPVwicmFkaW9fc29ydFwiXG4gICAgICAgIHJlZj17KGQpID0+XG4gICAgICAgICAgQmFyKFxuICAgICAgICAgICAgZCxcbiAgICAgICAgICAgIGJhckRhdGEsXG4gICAgICAgICAgICB5QXR0cmlidXRlLFxuICAgICAgICAgICAgeEF0dHJpYnV0ZSxcbiAgICAgICAgICAgIHRvdGFsUG9wdWxhdGlvblxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIlxuICAgICAgPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJjb250cm9sIGNvbnRyb2wtcmFkaW9cIj5cbiAgICAgICAgICBTb3J0IGJ5IEhlaWdodFxuICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicmFkaW9cIlxuICAgICAgICAgICAgdHlwZT1cInJhZGlvXCJcbiAgICAgICAgICAgIHZhbHVlPVwiaGVpZ2h0XCJcbiAgICAgICAgICAgIG5hbWU9XCJzb3J0XCJcbiAgICAgICAgICAvPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sX2luZGljYXRvclwiPjwvZGl2PlxuICAgICAgICA8L2xhYmVsPlxuICAgICAgICA8bGFiZWwgY2xhc3M9XCJjb250cm9sIGNvbnRyb2wtcmFkaW9cIj5cbiAgICAgICAgICBTb3J0IGJ5IFggVmFsdWVcbiAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInJhZGlvXCJcbiAgICAgICAgICAgIHR5cGU9XCJyYWRpb1wiXG4gICAgICAgICAgICB2YWx1ZT1cInhcIlxuICAgICAgICAgICAgbmFtZT1cInNvcnRcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xfaW5kaWNhdG9yXCI+PC9kaXY+XG4gICAgICAgIDwvbGFiZWw+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPFRhYmxlXG4gICAgICAgIGJhckRhdGE9e2JhckRhdGF9XG4gICAgICAgIHlBdHRyaWJ1dGU9e3lBdHRyaWJ1dGV9XG4gICAgICAgIHhBdHRyaWJ1dGU9e3hBdHRyaWJ1dGV9XG4gICAgICAgIHRvdGFsUG9wdWxhdGlvbj17dG90YWxQb3B1bGF0aW9ufVxuICAgICAgLz5cbiAgICA8Lz5cbiAgKTtcbn07XG4iLCJpbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBtZWFuLCBqc29uLCBuZXN0IH0gZnJvbSBcImQzXCI7XG5cbmNvbnN0IGpzb25VUkwgPSBcImh0dHBzOi8vZ2lzdC5naXRodWJ1c2VyY29udGVudC5jb20vYXVsaWNobmV5LzYwYzJjM2I2MjQ4N2YyYmVlMWIxOWUzYjZiNzc3ZGFmL3Jhdy80OGFhMjJmZWM3OTAzM2FlYjlhMjk3NGEwZjlkNjVlNzk3NjUwMTEwL25ldyUyNTIwY291bnRpZXMuanNvblwiO1xuXG5leHBvcnQgY29uc3QgdXNlR2VvSnNvbiA9ICgpID0+IHtcbiAgY29uc3QgW2RhdGEsIHNldERhdGFdID0gdXNlU3RhdGUobnVsbCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAganNvbihqc29uVVJMKSAvLyByZXRyaWV2ZSBkYXRhIGZyb20gdGhlIGdpdmVuIFVSTFxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgLy93aGVuIGRhdGEgaXMgcmV0cmlldmVkLCBkbyB0aGUgZm9sbG93aW5nXG4gICAgICAgIHNldERhdGEoZGF0YSk7XG4gICAgICAgIC8vIHVzZSB0aGUgcmVhY3QgaG9vayB0byBzZXQgdGhlIGRhdGFcbiAgICAgIH0pO1xuICB9LCBbXSk7XG5cbiAgcmV0dXJuIGRhdGE7XG59OyIsIi8vc2V0IGNvbG9yIHNjYWxlXG5leHBvcnQgY29uc3QgY29sb3Jfc2NhbGU9IFtcIiMwMDhhYTJcIixcIiMwMThhYTFcIixcIiMwMTg5YTFcIixcIiMwMjg5YTFcIixcIiMwMjg5YTBcIixcIiMwMjg5YTBcIixcIiMwMzg5YTBcIixcIiMwMzg5OWZcIixcIiMwNDg4OWZcIixcIiMwNDg4OWZcIixcIiMwNTg4OWVcIixcIiMwNTg4OWVcIixcIiMwNTg4OWVcIixcIiMwNjg4OWRcIixcIiMwNjg3OWRcIixcIiMwNzg3OWRcIixcIiMwNzg3OWRcIixcIiMwNzg3OWNcIixcIiMwODg3OWNcIixcIiMwODg3OWNcIixcIiMwOTg2OWJcIixcIiMwOTg2OWJcIixcIiMwOTg2OWJcIixcIiMwYTg2OWFcIixcIiMwYTg2OWFcIixcIiMwYjg1OWFcIixcIiMwYjg1OTlcIixcIiMwYjg1OTlcIixcIiMwYzg1OTlcIixcIiMwYzg1OThcIixcIiMwZDg1OThcIixcIiMwZDg0OThcIixcIiMwZTg0OTdcIixcIiMwZTg0OTdcIixcIiMwZTg0OTdcIixcIiMwZjg0OTZcIixcIiMwZjg0OTZcIixcIiMxMDgzOTZcIixcIiMxMDgzOTVcIixcIiMxMDgzOTVcIixcIiMxMTgzOTVcIixcIiMxMTgzOTRcIixcIiMxMjgzOTRcIixcIiMxMjgyOTRcIixcIiMxMjgyOTNcIixcIiMxMzgyOTNcIixcIiMxMzgyOTNcIixcIiMxNDgyOTJcIixcIiMxNDgxOTJcIixcIiMxNDgxOTJcIixcIiMxNTgxOTJcIixcIiMxNTgxOTFcIixcIiMxNjgxOTFcIixcIiMxNjgxOTFcIixcIiMxNzgwOTBcIixcIiMxNzgwOTBcIixcIiMxNzgwOTBcIixcIiMxODgwOGZcIixcIiMxODgwOGZcIixcIiMxOTgwOGZcIixcIiMxOTdmOGVcIixcIiMxOTdmOGVcIixcIiMxYTdmOGVcIixcIiMxYTdmOGRcIixcIiMxYjdmOGRcIixcIiMxYjdmOGRcIixcIiMxYjdlOGNcIixcIiMxYzdlOGNcIixcIiMxYzdlOGNcIixcIiMxZDdlOGJcIixcIiMxZDdlOGJcIixcIiMxZDdkOGJcIixcIiMxZTdkOGFcIixcIiMxZTdkOGFcIixcIiMxZjdkOGFcIixcIiMxZjdkODlcIixcIiMyMDdkODlcIixcIiMyMDdjODlcIixcIiMyMDdjODhcIixcIiMyMTdjODhcIixcIiMyMTdjODhcIixcIiMyMjdjODdcIixcIiMyMjdjODdcIixcIiMyMjdiODdcIixcIiMyMzdiODdcIixcIiMyMzdiODZcIixcIiMyNDdiODZcIixcIiMyNDdiODZcIixcIiMyNDdiODVcIixcIiMyNTdhODVcIixcIiMyNTdhODVcIixcIiMyNjdhODRcIixcIiMyNjdhODRcIixcIiMyNjdhODRcIixcIiMyNzdhODNcIixcIiMyNzc5ODNcIixcIiMyODc5ODNcIixcIiMyODc5ODJcIixcIiMyOTc5ODJcIixcIiMyOTc5ODJcIixcIiMyOTc4ODFcIixcIiMyYTc4ODFcIixcIiMyYTc4ODFcIixcIiMyYjc4ODBcIixcIiMyYjc4ODBcIixcIiMyYjc4ODBcIixcIiMyYzc3N2ZcIixcIiMyYzc3N2ZcIixcIiMyZDc3N2ZcIixcIiMyZDc3N2VcIixcIiMyZDc3N2VcIixcIiMyZTc3N2VcIixcIiMyZTc2N2RcIixcIiMyZjc2N2RcIixcIiMyZjc2N2RcIixcIiMyZjc2N2NcIixcIiMzMDc2N2NcIixcIiMzMDc2N2NcIixcIiMzMTc1N2NcIixcIiMzMTc1N2JcIixcIiMzMjc1N2JcIixcIiMzMjc1N2JcIixcIiMzMjc1N2FcIixcIiMzMzc0N2FcIixcIiMzMzc0N2FcIixcIiMzNDc0NzlcIixcIiMzNDc0NzlcIixcIiMzNDc0NzlcIixcIiMzNTc0NzhcIixcIiMzNTczNzhcIixcIiMzNjczNzhcIixcIiMzNjczNzdcIixcIiMzNjczNzdcIixcIiMzNzczNzdcIixcIiMzNzczNzZcIixcIiMzODcyNzZcIixcIiMzODcyNzZcIixcIiMzODcyNzVcIixcIiMzOTcyNzVcIixcIiMzOTcyNzVcIixcIiMzYTcyNzRcIixcIiMzYTcxNzRcIixcIiMzYjcxNzRcIixcIiMzYjcxNzNcIixcIiMzYjcxNzNcIixcIiMzYzcxNzNcIixcIiMzYzcwNzJcIixcIiMzZDcwNzJcIixcIiMzZDcwNzJcIixcIiMzZDcwNzFcIixcIiMzZTcwNzFcIixcIiMzZTcwNzFcIixcIiMzZjZmNzFcIixcIiMzZjZmNzBcIixcIiMzZjZmNzBcIixcIiM0MDZmNzBcIixcIiM0MDZmNmZcIixcIiM0MTZmNmZcIixcIiM0MTZlNmZcIixcIiM0MTZlNmVcIixcIiM0MjZlNmVcIixcIiM0MjZlNmVcIixcIiM0MzZlNmRcIixcIiM0MzZlNmRcIixcIiM0NDZkNmRcIixcIiM0NDZkNmNcIixcIiM0NDZkNmNcIixcIiM0NTZkNmNcIixcIiM0NTZkNmJcIixcIiM0NjZjNmJcIixcIiM0NjZjNmJcIixcIiM0NjZjNmFcIixcIiM0NzZjNmFcIixcIiM0NzZjNmFcIixcIiM0ODZjNjlcIixcIiM0ODZiNjlcIixcIiM0ODZiNjlcIixcIiM0OTZiNjhcIixcIiM0OTZiNjhcIixcIiM0YTZiNjhcIixcIiM0YTZiNjdcIixcIiM0YTZhNjdcIixcIiM0YjZhNjdcIixcIiM0YjZhNjdcIixcIiM0YzZhNjZcIixcIiM0YzZhNjZcIixcIiM0ZDZhNjZcIixcIiM0ZDY5NjVcIixcIiM0ZDY5NjVcIixcIiM0ZTY5NjVcIixcIiM0ZTY5NjRcIixcIiM0ZjY5NjRcIixcIiM0ZjY4NjRcIixcIiM0ZjY4NjNcIixcIiM1MDY4NjNcIixcIiM1MDY4NjNcIixcIiM1MTY4NjJcIixcIiM1MTY4NjJcIixcIiM1MTY3NjJcIixcIiM1MjY3NjFcIixcIiM1MjY3NjFcIixcIiM1MzY3NjFcIixcIiM1MzY3NjBcIixcIiM1MzY3NjBcIixcIiM1NDY2NjBcIixcIiM1NDY2NWZcIixcIiM1NTY2NWZcIixcIiM1NTY2NWZcIixcIiM1NjY2NWVcIixcIiM1NjY2NWVcIixcIiM1NjY1NWVcIixcIiM1NzY1NWRcIixcIiM1NzY1NWRcIixcIiM1ODY1NWRcIixcIiM1ODY1NWNcIixcIiM1ODY0NWNcIixcIiM1OTY0NWNcIixcIiM1OTY0NWNcIixcIiM1YTY0NWJcIixcIiM1YTY0NWJcIixcIiM1YTY0NWJcIixcIiM1YjYzNWFcIixcIiM1YjYzNWFcIixcIiM1YzYzNWFcIixcIiM1YzYzNTlcIixcIiM1YzYzNTlcIixcIiM1ZDYzNTlcIixcIiM1ZDYyNThcIixcIiM1ZTYyNThcIixcIiM1ZTYyNThcIixcIiM1ZjYyNTdcIixcIiM1ZjYyNTdcIixcIiM1ZjYyNTdcIixcIiM2MDYxNTZcIixcIiM2MDYxNTZcIixcIiM2MTYxNTZcIixcIiM2MTYxNTVcIixcIiM2MTYxNTVcIixcIiM2MjYwNTVcIixcIiM2MjYwNTRcIixcIiM2MzYwNTRcIixcIiM2MzYwNTRcIixcIiM2MzYwNTNcIixcIiM2NDYwNTNcIixcIiM2NDVmNTNcIixcIiM2NTVmNTJcIixcIiM2NTVmNTJcIixcIiM2NTVmNTJcIixcIiM2NjVmNTFcIixcIiM2NjVmNTFcIixcIiM2NzVlNTFcIixcIiM2NzVlNTFcIixcIiM2ODVlNTBcIixcIiM2ODVlNTBcIixcIiM2ODVlNTBcIixcIiM2OTVlNGZcIixcIiM2OTVkNGZcIixcIiM2YTVkNGZcIixcIiM2YTVkNGVcIixcIiM2YTVkNGVcIixcIiM2YjVkNGVcIixcIiM2YjVkNGRcIixcIiM2YzVjNGRcIixcIiM2YzVjNGRcIixcIiM2YzVjNGNcIixcIiM2ZDVjNGNcIixcIiM2ZDVjNGNcIixcIiM2ZTViNGJcIixcIiM2ZTViNGJcIixcIiM2ZTViNGJcIixcIiM2ZjViNGFcIixcIiM2ZjViNGFcIixcIiM3MDViNGFcIixcIiM3MDVhNDlcIixcIiM3MTVhNDlcIixcIiM3MTVhNDlcIixcIiM3MTVhNDhcIixcIiM3MjVhNDhcIixcIiM3MjVhNDhcIixcIiM3MzU5NDdcIixcIiM3MzU5NDdcIixcIiM3MzU5NDdcIixcIiM3NDU5NDZcIixcIiM3NDU5NDZcIixcIiM3NTU5NDZcIixcIiM3NTU4NDZcIixcIiM3NTU4NDVcIixcIiM3NjU4NDVcIixcIiM3NjU4NDVcIixcIiM3NzU4NDRcIixcIiM3NzU3NDRcIixcIiM3NzU3NDRcIixcIiM3ODU3NDNcIixcIiM3ODU3NDNcIixcIiM3OTU3NDNcIixcIiM3OTU3NDJcIixcIiM3YTU2NDJcIixcIiM3YTU2NDJcIixcIiM3YTU2NDFcIixcIiM3YjU2NDFcIixcIiM3YjU2NDFcIixcIiM3YzU2NDBcIixcIiM3YzU1NDBcIixcIiM3YzU1NDBcIixcIiM3ZDU1M2ZcIixcIiM3ZDU1M2ZcIixcIiM3ZTU1M2ZcIixcIiM3ZTU1M2VcIixcIiM3ZTU0M2VcIixcIiM3ZjU0M2VcIixcIiM3ZjU0M2RcIixcIiM4MDU0M2RcIixcIiM4MDU0M2RcIixcIiM4MDUzM2NcIixcIiM4MTUzM2NcIixcIiM4MTUzM2NcIixcIiM4MjUzM2JcIixcIiM4MjUzM2JcIixcIiM4MzUzM2JcIixcIiM4MzUyM2JcIixcIiM4MzUyM2FcIixcIiM4NDUyM2FcIixcIiM4NDUyM2FcIixcIiM4NTUyMzlcIixcIiM4NTUyMzlcIixcIiM4NTUxMzlcIixcIiM4NjUxMzhcIixcIiM4NjUxMzhcIixcIiM4NzUxMzhcIixcIiM4NzUxMzdcIixcIiM4NzUxMzdcIixcIiM4ODUwMzdcIixcIiM4ODUwMzZcIixcIiM4OTUwMzZcIixcIiM4OTUwMzZcIixcIiM4OTUwMzVcIixcIiM4YTRmMzVcIixcIiM4YTRmMzVcIixcIiM4YjRmMzRcIixcIiM4YjRmMzRcIixcIiM4YzRmMzRcIixcIiM4YzRmMzNcIixcIiM4YzRlMzNcIixcIiM4ZDRlMzNcIixcIiM4ZDRlMzJcIixcIiM4ZTRlMzJcIixcIiM4ZTRlMzJcIixcIiM4ZTRlMzFcIixcIiM4ZjRkMzFcIixcIiM4ZjRkMzFcIixcIiM5MDRkMzFcIixcIiM5MDRkMzBcIixcIiM5MDRkMzBcIixcIiM5MTRkMzBcIixcIiM5MTRjMmZcIixcIiM5MjRjMmZcIixcIiM5MjRjMmZcIixcIiM5MjRjMmVcIixcIiM5MzRjMmVcIixcIiM5MzRiMmVcIixcIiM5NDRiMmRcIixcIiM5NDRiMmRcIixcIiM5NTRiMmRcIixcIiM5NTRiMmNcIixcIiM5NTRiMmNcIixcIiM5NjRhMmNcIixcIiM5NjRhMmJcIixcIiM5NzRhMmJcIixcIiM5NzRhMmJcIixcIiM5NzRhMmFcIixcIiM5ODRhMmFcIixcIiM5ODQ5MmFcIixcIiM5OTQ5MjlcIixcIiM5OTQ5MjlcIixcIiM5OTQ5MjlcIixcIiM5YTQ5MjhcIixcIiM5YTQ5MjhcIixcIiM5YjQ4MjhcIixcIiM5YjQ4MjdcIixcIiM5YjQ4MjdcIixcIiM5YzQ4MjdcIixcIiM5YzQ4MjZcIixcIiM5ZDQ3MjZcIixcIiM5ZDQ3MjZcIixcIiM5ZTQ3MjZcIixcIiM5ZTQ3MjVcIixcIiM5ZTQ3MjVcIixcIiM5ZjQ3MjVcIixcIiM5ZjQ2MjRcIixcIiNhMDQ2MjRcIixcIiNhMDQ2MjRcIixcIiNhMDQ2MjNcIixcIiNhMTQ2MjNcIixcIiNhMTQ2MjNcIixcIiNhMjQ1MjJcIixcIiNhMjQ1MjJcIixcIiNhMjQ1MjJcIixcIiNhMzQ1MjFcIixcIiNhMzQ1MjFcIixcIiNhNDQ1MjFcIixcIiNhNDQ0MjBcIixcIiNhNDQ0MjBcIixcIiNhNTQ0MjBcIixcIiNhNTQ0MWZcIixcIiNhNjQ0MWZcIixcIiNhNjQzMWZcIixcIiNhNzQzMWVcIixcIiNhNzQzMWVcIixcIiNhNzQzMWVcIixcIiNhODQzMWRcIixcIiNhODQzMWRcIixcIiNhOTQyMWRcIixcIiNhOTQyMWNcIixcIiNhOTQyMWNcIixcIiNhYTQyMWNcIixcIiNhYTQyMWJcIixcIiNhYjQyMWJcIixcIiNhYjQxMWJcIixcIiNhYjQxMWJcIixcIiNhYzQxMWFcIixcIiNhYzQxMWFcIixcIiNhZDQxMWFcIixcIiNhZDQxMTlcIixcIiNhZDQwMTlcIixcIiNhZTQwMTlcIixcIiNhZTQwMThcIixcIiNhZjQwMThcIixcIiNhZjQwMThcIixcIiNiMDQwMTdcIixcIiNiMDNmMTdcIixcIiNiMDNmMTdcIixcIiNiMTNmMTZcIixcIiNiMTNmMTZcIixcIiNiMjNmMTZcIixcIiNiMjNlMTVcIixcIiNiMjNlMTVcIixcIiNiMzNlMTVcIixcIiNiMzNlMTRcIixcIiNiNDNlMTRcIixcIiNiNDNlMTRcIixcIiNiNDNkMTNcIixcIiNiNTNkMTNcIixcIiNiNTNkMTNcIixcIiNiNjNkMTJcIixcIiNiNjNkMTJcIixcIiNiNjNkMTJcIixcIiNiNzNjMTFcIixcIiNiNzNjMTFcIixcIiNiODNjMTFcIixcIiNiODNjMTBcIixcIiNiOTNjMTBcIixcIiNiOTNjMTBcIixcIiNiOTNiMTBcIixcIiNiYTNiMGZcIixcIiNiYTNiMGZcIixcIiNiYjNiMGZcIixcIiNiYjNiMGVcIixcIiNiYjNhMGVcIixcIiNiYzNhMGVcIixcIiNiYzNhMGRcIixcIiNiZDNhMGRcIixcIiNiZDNhMGRcIixcIiNiZDNhMGNcIixcIiNiZTM5MGNcIixcIiNiZTM5MGNcIixcIiNiZjM5MGJcIixcIiNiZjM5MGJcIixcIiNiZjM5MGJcIixcIiNjMDM5MGFcIixcIiNjMDM4MGFcIixcIiNjMTM4MGFcIixcIiNjMTM4MDlcIixcIiNjMjM4MDlcIixcIiNjMjM4MDlcIixcIiNjMjM4MDhcIixcIiNjMzM3MDhcIixcIiNjMzM3MDhcIixcIiNjNDM3MDdcIixcIiNjNDM3MDdcIixcIiNjNDM3MDdcIixcIiNjNTM2MDZcIixcIiNjNTM2MDZcIixcIiNjNjM2MDZcIixcIiNjNjM2MDVcIixcIiNjNjM2MDVcIixcIiNjNzM2MDVcIixcIiNjNzM1MDVcIixcIiNjODM1MDRcIixcIiNjODM1MDRcIixcIiNjODM1MDRcIixcIiNjOTM1MDNcIixcIiNjOTM1MDNcIixcIiNjYTM0MDNcIixcIiNjYTM0MDJcIixcIiNjYjM0MDJcIixcIiNjYjM0MDJcIixcIiNjYjM0MDFcIixcIiNjYzM0MDFcIixcIiNjYzMzMDFcIixcIiNjZDMzMDBcIl07IiwiaW1wb3J0IFJlYWN0RHJvcGRvd24gZnJvbSAncmVhY3QtZHJvcGRvd24nO1xuXG5pbXBvcnQgZDMgZnJvbSAnZDMnO1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZUdlb0pzb24gfSBmcm9tIFwiLi91c2VHZW9Kc29uXCI7XG5pbXBvcnQgeyBjb2xvcl9zY2FsZSB9IGZyb20gXCIuL2NvbG9yX3NjYWxlXCI7XG5cbmV4cG9ydCBjb25zdCBNYXAgPSAoIHtkYXRhfSApID0+IHtcbiAgICB2YXIgZHJvcGRvd25fb3B0aW9ucyA9IFtcbiAgICB7IHZhbHVlOiBcIm51bUluY2FyY2VyYXRlZFwiLFxuICAgICAgdGV4dDogXCJOdW1iZXIgSW5jYXJjZXJhdGVkXCIgfSxcbiAgICB7IHZhbHVlOiBcIm51bUNyaW1lc1wiLFxuICAgICAgdGV4dDogXCJOdW1iZXIgb2YgQ3JpbWVzXCIgfSxcbiAgICB7IHZhbHVlOiBcInBvcHVsYXRpb25cIixcbiAgICAgIHRleHQ6IFwiQ291bnR5IFBvcHVsYXRpb25cIiB9LFxuICAgIHsgdmFsdWU6IFwiaW5jYXJjZXJhdGlvblJhdGVcIixcbiAgICAgIHRleHQ6IFwiSW5jYXJjZXJhdGlvbiBSYXRlXCIgfSxcbiAgICBdXG5cblx0XG5cbiAgLy8gcG9wdWxhdGUgZHJvcC1kb3duXG4gIGQzLnNlbGVjdChcIiNkcm9wZG93blwiKVxuICAgIC5zZWxlY3RBbGwoXCJvcHRpb25cIilcbiAgICAuZGF0YShkcm9wZG93bl9vcHRpb25zKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZChcIm9wdGlvblwiKVxuICAgIC5hdHRyKFwidmFsdWVcIiwgZnVuY3Rpb24ob3B0aW9uKSB7IHJldHVybiBvcHRpb24udmFsdWU7IH0pXG4gICAgLnRleHQoZnVuY3Rpb24ob3B0aW9uKSB7IHJldHVybiBvcHRpb24udGV4dDsgfSk7XG5cbiAgLy8gaW5pdGlhbCBkYXRhc2V0IG9uIGxvYWRcbiAgdmFyIHNlbGVjdGVkX2RhdGFzZXQgPSBcIm51bUluY2FyY2VyYXRlZFwiO1xuXG4gIHZhciB3ID0gMTAwMCwgaCA9IDgwMDtcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwic3ZnXCIpXG4gIHZhciBwcm9qZWN0aW9uID0gZDMuZ2VvTWVyY2F0b3IoKVxuICAgICAgICAgICAgICAgICAgICAgLmNlbnRlcihbLTc2LjYxODA4MjcsIDM5LjMyMzk1M10pXG4gICAgICAgICAgICAgICAgICAgICAuc2NhbGUoWzQ1MDBdKVxuICAgICAgICAgICAgICAgICAgICAgLnRyYW5zbGF0ZShbNDAwLCA3MDBdKTtcbiAgXG4gIGNvbnN0IHRvb2x0aXAgPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcImRpdlwiKS5hdHRyKFwiY2xhc3NcIiwgXCJkMy10b29sdGlwXCIpO1xuXG4gIGNvbnN0IHNlbGVjdGVkVGV4dCA9IGQzLnNlbGVjdCgnI2Ryb3Bkb3duIG9wdGlvbjpjaGVja2VkJykudGV4dCgpO1xuXG4gIC8vIGZpcnN0IG9mIHR3byBzY2FsZXMgZm9yIGxpbmVhciBmaWxsOyByZWYgWzFdXG4gIHZhciBmaWxsX2dyYWRpZW50ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAuZG9tYWluKGQzLnJhbmdlKDAsIDEsIDEuMCAvIChjb2xvcl9zY2FsZS5sZW5ndGggLSAxKSkpXG4gICAgICAgICAgICAgICAgICAgICAgIC5yYW5nZShjb2xvcl9zY2FsZSk7XG5cbiAgLy8gc2Vjb25kIG9mIHR3byBzY2FsZXMgZm9yIGxpbmVhciBmaWxsXG4gIHZhciBub3JtX2ZpbGwgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgICAgICAgICAgICAgICAgIC5yYW5nZShbMCwxXSk7XG5cbiAgLy8gZHJvcGRvd24gZGF0YXNldCBzZWxlY3Rpb25cbiAgdmFyIGRyb3BEb3duID0gZDMuc2VsZWN0KFwiI2Ryb3Bkb3duXCIpO1xuXG4gIGRyb3BEb3duLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuXG4gICAgICBzZWxlY3RlZF9kYXRhc2V0ID0gZDMuZXZlbnQudGFyZ2V0LnZhbHVlO1xuXG4gICAgICBwbG90LmNhbGwodXBkYXRlRmlsbCwgc2VsZWN0ZWRfZGF0YXNldClcbiAgfSk7XG5cblxuICB2YXIgcGF0aCA9IGQzLmdlb1BhdGgoKVxuICAgICAgICAgICAgICAgLnByb2plY3Rpb24ocHJvamVjdGlvbik7XG4gIFxuICB2YXIgcGxvdCA9IHN2Zy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcbiAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiIzgwODA4MFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiI2IzYjNiM1wiKVxuICBcdFx0XHRcdFx0LmNhbGwodXBkYXRlRmlsbCwgc2VsZWN0ZWRfZGF0YXNldClcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICAgICAgdG9vbHRpcFxuICAgICAgICAgICAgICAuaHRtbChcbiAgICAgICAgICAgICAgICBgPGRpdj4gJHtkLnByb3BlcnRpZXMubmFtZX0gQ291bnR5IDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXY+ICR7ZC5wcm9wZXJ0aWVzW3NlbGVjdGVkX2RhdGFzZXRdfTwvZGl2PmBcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgLnN0eWxlKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcbiAgICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwib3BhY2l0eVwiLCAwLjcpO1xuXG4gICAgICAgICAgfSlcbiAgICAgICAgICAub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAgIC5zdHlsZSgndG9wJywgZDMuZXZlbnQucGFnZVkgLSAxMCArICdweCcpXG4gICAgICAgICAgICAuc3R5bGUoJ2xlZnQnLCBkMy5ldmVudC5wYWdlWCArIDEwICsgJ3B4Jyk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdG9vbHRpcC5odG1sKGBgKS5zdHlsZSgndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG4gICAgICAgICAgfSk7XG4gIFxuICBmdW5jdGlvbiB1cGRhdGVGaWxsKHNlbGVjdGlvbiwgc2VsZWN0ZWRfZGF0YXNldCkgeyAvL3NlbGVjdGVkX2RhdGFzZXQ6dmFyaWFibGUgbmFtZVxuXG4gICAgdmFyIGRfZXh0ZW50ID0gZDMuZXh0ZW50KHNlbGVjdGlvbi5kYXRhKCksIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoZC5wcm9wZXJ0aWVzW3NlbGVjdGVkX2RhdGFzZXRdKTtcbiAgICB9KTtcblxuICAgIHJlc2NhbGVGaWxsKHNlbGVjdGlvbiwgZF9leHRlbnQpO1xuXHR9XG5cblxuICBmdW5jdGlvbiByZXNjYWxlRmlsbChzZWxlY3Rpb24sIGRfZXh0ZW50KSB7XG5cbiAgICAgIG5vcm1fZmlsbC5kb21haW4oZF9leHRlbnQpXG5cbiAgICAgIHNlbGVjdGlvbi50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgIC5kdXJhdGlvbig3MDApXG4gICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY291bnR5VmFsID0gcGFyc2VGbG9hdChkLnByb3BlcnRpZXNbc2VsZWN0ZWRfZGF0YXNldF0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsbF9ncmFkaWVudChub3JtX2ZpbGwoY291bnR5VmFsKSk7XG4gICAgICAgICAgICAgICB9KTtcbiAgfVxuICBcblx0Y29uc3QgW0F0dHJpYnV0ZSwgc2V0QXR0cmlidXRlXSA9IHVzZVN0YXRlKCdudW1JbmNhcmNlcmF0ZWQnKTtcbiAgXG4gIGNvbnN0IEZpZWxkcyA9IFtcbiAgICB7IHZhbHVlOiBcIm51bUluY2FyY2VyYXRlZFwiLFxuICAgICAgdGV4dDogXCJOdW1iZXIgSW5jYXJjZXJhdGVkXCIgfSxcbiAgICB7IHZhbHVlOiBcIm51bUNyaW1lc1wiLFxuICAgICAgdGV4dDogXCJOdW1iZXIgb2YgQ3JpbWVzXCIgfSxcbiAgICB7IHZhbHVlOiBcInBvcHVsYXRpb25cIixcbiAgICAgIHRleHQ6IFwiQ291bnR5IFBvcHVsYXRpb25cIiB9LFxuICAgIHsgdmFsdWU6IFwiaW5jYXJjZXJhdGlvblJhdGVcIixcbiAgICAgIHRleHQ6IFwiSW5jYXJjZXJhdGlvbiBSYXRlXCIgfSxcbiAgICBdXG4gIFxuICByZXR1cm4oPD5cbiAgICAgICAgICAgIDxSZWFjdERyb3Bkb3duXG4gICAgICAgICAgb3B0aW9ucz17RmllbGRzfVxuICAgICAgICAgIHZhbHVlPXtBdHRyaWJ1dGV9XG4gICAgICAgICAgb25DaGFuZ2U9eyh7IHZhbHVlLCB0ZXh0IH0pID0+XG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGUodmFsdWUpXG4gICAgICAgICAgfVxuICAgICAgICAvPlxuICAgIDwvPilcbn1cblxuIiwiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gXCJyZWFjdC1kb21cIjtcblxuaW1wb3J0IHsgdXNlSlNPTiB9IGZyb20gXCIuL3VzZURhdGFcIjtcbmltcG9ydCB7IENoYXJ0IH0gZnJvbSBcIi4vYmFyXCI7XG5cbmltcG9ydCB7IHVzZUdlb0pzb24gfSBmcm9tIFwiLi91c2VHZW9Kc29uXCI7XG5pbXBvcnQgeyBNYXAgfSBmcm9tIFwiLi9tYXBcIjtcblxuY29uc3QgQXBwID0gKCkgPT4ge1xuICBjb25zdCByYXdEYXRhID0gdXNlSlNPTigpO1xuICBcbiAgY29uc3QgbWFwRGF0YSA9IHVzZUdlb0pzb24oKTtcblxuICBpZiAoKCFyYXdEYXRhKSB8fCAoIW1hcERhdGEpKSB7XG4gICAgcmV0dXJuIDxoMj5Mb2FkaW5nLi4uPC9oMj47XG4gIH1cblxuICBjb25zb2xlLmxvZyhtYXBEYXRhKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8Q2hhcnQgcmF3RGF0YT17cmF3RGF0YX0gLz5cbiAgICAgIDxNYXAgZGF0YT17bWFwRGF0YS5mZWF0dXJlc30vPlxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3Qgcm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJvb3RcIik7XG5SZWFjdERPTS5yZW5kZXIoPEFwcCAvPiwgcm9vdEVsZW1lbnQpOyJdLCJuYW1lcyI6WyJuZXN0IiwibWVhbiIsInVzZVN0YXRlIiwidXNlRWZmZWN0IiwianNvbiIsInNlbGVjdCIsImpzb25VUkwiLCJkMyIsIlJlYWN0IiwiUmVhY3RET00iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0VBR0EsTUFBTSxPQUFPO0VBQ2I7RUFDQSxFQUFFLHlJQUF5SSxDQUFDO0FBQzVJO0VBQ0E7RUFDQSxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUU7RUFDeEIsRUFBRSxPQUFPO0VBQ1QsSUFBSSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUc7RUFDaEIsSUFBSSxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO0VBQzVCLElBQUksYUFBYSxFQUFFLEdBQUcsQ0FBQyxVQUFVO0VBQ2pDLElBQUksVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztFQUMxQyxJQUFJLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxnQkFBZ0I7RUFDMUMsSUFBSSxTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVM7RUFDNUIsSUFBSSxXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVc7RUFDaEMsSUFBSSxpQkFBaUIsRUFBRSxHQUFHLENBQUMsaUJBQWlCO0VBQzVDLElBQUksV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXO0VBQ2hDLElBQUksY0FBYyxFQUFFLEdBQUcsQ0FBQyxjQUFjO0VBQ3RDLElBQUksTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNO0VBQ3RCLEdBQUcsQ0FBQztFQUNKLENBQUM7QUFDRDtFQUNBO0VBQ0E7RUFDTyxTQUFTLGFBQWEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO0VBQ3pDLEVBQUUsSUFBSSxXQUFXLEdBQUdBLFNBQUksRUFBRTtFQUMxQixLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDdkIsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUs7RUFDbkIsTUFBTSxPQUFPO0VBQ2IsUUFBUSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU07RUFDeEIsUUFBUSxNQUFNLEVBQUVDLFNBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsYUFBYSxLQUFLLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNqRSxRQUFRLGFBQWEsRUFBRUEsU0FBSTtFQUMzQixVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxhQUFhLEVBQUU7RUFDekMsWUFBWSxPQUFPLGFBQWEsQ0FBQyxVQUFVLENBQUM7RUFDNUMsV0FBVyxDQUFDO0VBQ1osU0FBUztFQUNULE9BQU8sQ0FBQztFQUNSLEtBQUssQ0FBQztFQUNOLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQ25CLEVBQUUsT0FBTyxXQUFXLENBQUM7RUFDckIsQ0FBQztBQUNEO0VBQ0E7RUFDTyxNQUFNLE9BQU8sR0FBRyxNQUFNO0VBQzdCLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBR0MsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUN6QyxFQUFFQyxpQkFBUyxDQUFDLE1BQU07RUFDbEIsSUFBSUMsU0FBSSxDQUFDLE9BQU8sQ0FBQztFQUNqQixPQUFPLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRTtFQUM1QjtFQUNBLFFBQVEsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7RUFDbkMsUUFBUSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDdEI7RUFDQSxPQUFPLENBQUMsQ0FBQztFQUNULEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztFQUNULEVBQUUsT0FBTyxJQUFJLENBQUM7RUFDZCxDQUFDOztFQ25ERDtFQUNBLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztFQUNsQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7RUFDbkIsTUFBTSxNQUFNLEdBQUc7RUFDZixFQUFFLEdBQUcsRUFBRSxFQUFFO0VBQ1QsRUFBRSxLQUFLLEVBQUUsRUFBRTtFQUNYLEVBQUUsTUFBTSxFQUFFLEVBQUU7RUFDWixFQUFFLElBQUksRUFBRSxHQUFHO0VBQ1gsQ0FBQyxDQUFDO0VBQ0YsTUFBTSxVQUFVLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztFQUN0RCxNQUFNLFdBQVcsR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ3hEO0VBQ0E7RUFDQTtFQUNBLFNBQVMsT0FBTyxDQUFDLE1BQU0sRUFBRTtFQUN6QixFQUFFLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzFELENBQUM7QUFDRDtFQUNBO0VBQ0EsU0FBUyxZQUFZLENBQUMsR0FBRyxFQUFFO0VBQzNCLEVBQUUsT0FBTyxHQUFHO0VBQ1osS0FBSyxRQUFRLEVBQUU7RUFDZixLQUFLLE9BQU8sQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztFQUMvQyxDQUFDO0FBQ0Q7RUFDQTtFQUNBLFNBQVMsY0FBYyxDQUFDLElBQUksRUFBRTtFQUM5QixFQUFFLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztFQUNkLEVBQUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDeEMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRTtFQUNsQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztFQUMvQixLQUFLO0VBQ0wsR0FBRztFQUNILEVBQUUsT0FBTyxHQUFHLENBQUM7RUFDYixDQUFDO0FBQ0Q7RUFDQTtFQUNBLFNBQVMsWUFBWSxDQUFDLE9BQU8sRUFBRTtFQUcvQixFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzNDLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0VBQ2xCLElBQUksSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0VBQ3JCLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDN0MsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUN0RCxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0VBQzlDLE9BQU8sTUFBTTtFQUNiLFFBQVEsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDakQsT0FBTztFQUNQLEtBQUs7RUFDTCxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDNUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQzdDLEdBQUc7RUFDSCxFQUFFLE9BQU8sT0FBTyxDQUFDO0VBQ2pCLENBQUM7QUFDRDtFQUNBO0VBQ0EsSUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDO0VBQ3pCLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQztBQUMxQjtFQUNBO0VBQ0EsTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEtBQUs7RUFDckI7RUFDQSxFQUFFLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7RUFDbkQsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztFQUNsQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUM7RUFDcEIsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQztFQUMzQixPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7RUFDOUIsR0FBRztFQUNILENBQUMsQ0FBQztBQUNGO0VBQ0EsTUFBTSxHQUFHLEdBQUc7RUFDWixFQUFFLFNBQVM7RUFDWCxFQUFFLE9BQU87RUFDVCxFQUFFLFVBQVU7RUFDWixFQUFFLFVBQVU7RUFDWixFQUFFLGVBQWU7RUFDakIsS0FBSztFQUNMLEVBQUUsTUFBTSxTQUFTLEdBQUcsR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDO0FBQ2hEO0VBQ0E7RUFDQSxFQUFFLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDL0IsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0VBQzlCO0VBQ0E7RUFDQTtBQUNBO0VBQ0EsRUFBRSxNQUFNLE1BQU0sR0FBRyxFQUFFO0VBQ25CLEtBQUssU0FBUyxFQUFFO0VBQ2hCLEtBQUssTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3RDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0VBQzNCLEtBQUssWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN6QixFQUFFLE1BQU0sTUFBTSxHQUFHLEVBQUU7RUFDbkIsS0FBSyxXQUFXLEVBQUU7RUFDbEIsS0FBSyxNQUFNLENBQUM7RUFDWixNQUFNLENBQUM7RUFDUCxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7RUFDckQsS0FBSyxDQUFDO0VBQ04sS0FBSyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDNUIsS0FBSyxJQUFJLEVBQUUsQ0FBQztBQUNaO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxFQUFFLElBQUksVUFBVSxJQUFJLEtBQUssRUFBRTtFQUMzQixJQUFJLE9BQU8sR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7RUFDcEMsR0FBRztFQUNIO0VBQ0E7RUFDQSxFQUFFLE1BQU0sSUFBSSxHQUFHLEdBQUc7RUFDbEIsS0FBSyxNQUFNLENBQUMsR0FBRyxDQUFDO0VBQ2hCLEtBQUssSUFBSTtFQUNULE1BQU0sV0FBVztFQUNqQixNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2pELEtBQUs7RUFDTCxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUM7RUFDdEIsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNqQyxFQUFFLElBQUk7RUFDTixLQUFLLEtBQUssRUFBRTtFQUNaLEtBQUssTUFBTSxDQUFDLE1BQU0sQ0FBQztFQUNuQixLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDO0VBQ25ELEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0VBQ2xELEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsU0FBUyxHQUFHLENBQUMsQ0FBQztFQUN0RCxLQUFLLElBQUk7RUFDVCxNQUFNLFFBQVE7RUFDZCxNQUFNLENBQUMsQ0FBQyxLQUFLLFdBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztFQUN0RCxLQUFLO0VBQ0wsS0FBSyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztFQUN4QixLQUFLLEVBQUUsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ3JDLE1BQU07RUFDTixRQUFRLENBQUMsVUFBVSxJQUFJLFFBQVE7RUFDL0IsU0FBUyxVQUFVLElBQUksS0FBSyxDQUFDO0VBQzdCLFFBQVE7RUFDUixRQUFRLE9BQU87RUFDZixXQUFXLElBQUk7RUFDZixZQUFZLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNsRCx1QkFBdUIsRUFBRSxPQUFPO0FBQ2hDLG9CQUFvQixVQUFVO0FBQzlCLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxZQUFZO0FBQ3BDLGNBQWMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzVDLGFBQWEsQ0FBQztBQUNkLHVCQUF1QixFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsWUFBWTtBQUNuRCxjQUFjO0FBQ2QsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxlQUFlO0FBQ3RELGdCQUFnQixHQUFHO0FBQ25CLGdCQUFnQixPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzFCLGFBQWEsQ0FBQztBQUNkLGlDQUFpQyxFQUFFLFlBQVk7QUFDL0Msb0JBQW9CLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTztBQUNuQyxtQkFBbUIsQ0FBQyxRQUFRO0FBQzVCLGNBQWMsQ0FBQyxDQUFDLEdBQUc7QUFDbkIsYUFBYSwyQkFBMkIsRUFBRSxZQUFZO0FBQ3RELGNBQWM7QUFDZCxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxlQUFlO0FBQ2xELGdCQUFnQixHQUFHO0FBQ25CLGdCQUFnQixPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzFCLGFBQWEsQ0FBQztBQUNkLGlDQUFpQyxFQUFFLFlBQVk7QUFDL0Msb0JBQW9CLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSztBQUNqQyxtQkFBbUIsQ0FBQyxhQUFhO0FBQ2pDLGNBQWMsQ0FBQyxDQUFDLEdBQUc7QUFDbkIsYUFBYSxnQkFBZ0IsRUFBRSxZQUFZO0FBQzNDLGNBQWM7QUFDZCxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxlQUFlO0FBQ2hELGdCQUFnQixHQUFHO0FBQ25CLGdCQUFnQixPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzFCLGFBQWEsQ0FBQyxRQUFRLENBQUM7RUFDdkIsV0FBVztFQUNYLFdBQVcsS0FBSyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztFQUMxQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztFQUM5QyxPQUFPLE1BQU0sSUFBSSxVQUFVLElBQUksUUFBUSxFQUFFO0VBQ3pDLFFBQVEsT0FBTztFQUNmLFdBQVcsSUFBSTtFQUNmLFlBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ2xELHVCQUF1QixFQUFFLE9BQU87QUFDaEMsb0JBQW9CLFVBQVU7QUFDOUIsbUJBQW1CLENBQUMsRUFBRSxFQUFFLFlBQVk7QUFDcEMsY0FBYyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDNUMsYUFBYSxDQUFDO0FBQ2QsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxZQUFZO0FBQ25ELGNBQWM7QUFDZCxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLGVBQWU7QUFDdEQsZ0JBQWdCLEdBQUc7QUFDbkIsZ0JBQWdCLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDMUIsYUFBYSxDQUFDLE9BQU8sQ0FBQztFQUN0QixXQUFXO0VBQ1gsV0FBVyxLQUFLLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0VBQzFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQzlDLE9BQU8sTUFBTTtFQUNiLFFBQVEsT0FBTztFQUNmLFdBQVcsSUFBSTtFQUNmLFlBQVksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ2xELHVCQUF1QixFQUFFLE9BQU87QUFDaEMsb0JBQW9CLFVBQVU7QUFDOUIsbUJBQW1CLENBQUMsRUFBRSxFQUFFLFlBQVk7QUFDcEMsY0FBYyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDNUMsYUFBYSxDQUFDO0FBQ2QsdUJBQXVCLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsWUFBWTtBQUN6RCxjQUFjLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDdkMsYUFBYSxDQUFDLE1BQU0sQ0FBQztFQUNyQixXQUFXO0VBQ1gsV0FBVyxLQUFLLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0VBQzFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQzlDLE9BQU87RUFDUCxLQUFLLENBQUM7RUFDTixLQUFLLEVBQUUsQ0FBQyxXQUFXLEVBQUUsWUFBWTtFQUNqQyxNQUFNLE9BQU87RUFDYixTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztFQUNqRCxTQUFTLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0VBQ25ELEtBQUssQ0FBQztFQUNOLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRSxZQUFZO0VBQ2hDLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7RUFDckQsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDMUMsS0FBSyxDQUFDLENBQUM7QUFDUDtFQUNBO0VBQ0EsRUFBRSxNQUFNLE9BQU8sR0FBR0MsV0FBTSxDQUFDLE1BQU0sQ0FBQztFQUNoQyxLQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUM7RUFDbEIsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ2pDO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7QUFDQTtFQUNBLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRTtFQUM3QixXQUFXLEtBQUssQ0FBQyxNQUFNLEVBQUM7RUFDeEI7RUFDQTtFQUNBLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUN0RCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSztFQUM3QyxvQkFBb0IsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBQztFQUN2RCxHQUFHO0VBQ0g7RUFDQSxFQUFFLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDNUM7RUFDQTtFQUNBLEVBQUUsR0FBRztFQUNMLEtBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQztFQUNoQixLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO0VBQzFCLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUM7RUFDeEIsS0FBSyxJQUFJO0VBQ1QsTUFBTSxXQUFXO0VBQ2pCLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xDLFFBQVEsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNO0FBQzlCLE9BQU8sQ0FBQyxDQUFDO0VBQ1QsS0FBSztFQUNMLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ2pCO0VBQ0E7RUFDQSxFQUFFLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztFQUNqQixFQUFFO0VBQ0YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFO0VBQ2xDLEtBQUssT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7RUFDMUIsSUFBSTtFQUNKLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztFQUNoQixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFO0VBQ2xCLElBQUksR0FBRztFQUNQLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQztFQUN2QixPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUM7RUFDeEIsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztFQUMxQixPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO0VBQzNCLE9BQU8sSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUM7RUFDbkMsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzlDLEdBQUc7QUFDSDtFQUNBLEVBQUUsR0FBRztFQUNMLEtBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQztFQUNoQixLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO0VBQzFCLEtBQUssSUFBSTtFQUNULE1BQU0sV0FBVztFQUNqQixNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ2pELEtBQUs7RUFDTCxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQjtFQUNBO0VBQ0E7RUFDQSxFQUFFLEdBQUc7RUFDTCxLQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUM7RUFDbkIsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztFQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7RUFDOUIsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztFQUNuQyxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDO0VBQ3RCLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQy9CO0VBQ0EsRUFBRSxJQUFJLE1BQU0sSUFBSSxFQUFFLEVBQUUsQ0FFakIsTUFBTTtFQUNULElBQUksR0FBRztFQUNQLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztFQUNyQixPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO0VBQ2xDLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztFQUN4QyxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7RUFDakQsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztFQUMxQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztFQUNqQyxHQUFHO0VBQ0g7RUFDQTtFQUNBO0VBQ0EsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzVEO0VBQ0E7RUFDQSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwQjtFQUNBLEVBQUUsU0FBUyxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFO0VBQ3REO0VBQ0EsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDOUMsSUFBSSxHQUFHO0VBQ1AsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDO0VBQ3ZCLE9BQU8sVUFBVSxFQUFFO0VBQ25CLE9BQU8sUUFBUSxDQUFDLFFBQVEsQ0FBQztFQUN6QixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDO0VBQzFCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ25CO0VBQ0E7RUFDQSxJQUFJLE1BQU0sSUFBSSxHQUFHLEdBQUc7RUFDcEIsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDO0VBQ3hCLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDcEMsSUFBSSxJQUFJO0VBQ1IsT0FBTyxVQUFVLEVBQUU7RUFDbkIsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDO0VBQ25CLE9BQU8sUUFBUSxDQUFDLFFBQVEsQ0FBQztFQUN6QixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDO0VBQzFCLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUM7RUFDckQsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7RUFDcEQsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0VBQ3hELE9BQU8sSUFBSTtFQUNYLFFBQVEsUUFBUTtFQUNoQixRQUFRLENBQUMsQ0FBQyxLQUFLLFdBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztFQUN4RCxPQUFPLENBQUM7RUFDUixHQUFHO0FBQ0g7RUFDQTtFQUNBLEVBQUUsU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFO0VBQ3JCLElBQUksSUFBSSxPQUFPLEdBQUcsSUFBSSxRQUFRLEVBQUU7RUFDaEM7RUFDQSxNQUFNLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQztFQUN2QixNQUFNLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztFQUN2QixLQUFLLE1BQU07RUFDWDtFQUNBLE1BQU0sSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUM7RUFDaEQsTUFBTSxJQUFJLFFBQVEsR0FBRyxhQUFhLENBQUM7RUFDbkMsS0FBSztFQUNMO0FBQ0E7RUFDQSxJQUFJLElBQUksTUFBTSxJQUFJLFFBQVEsRUFBRTtFQUM1QixNQUFNLE1BQU0sUUFBUSxHQUFHLE9BQU87RUFDOUIsU0FBUyxLQUFLLEVBQUU7RUFDaEIsU0FBUyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztFQUNuQixVQUFVLEVBQUUsQ0FBQyxTQUFTO0VBQ3RCLFlBQVksQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7RUFDL0IsWUFBWSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztFQUMvQixXQUFXO0VBQ1gsU0FBUyxDQUFDO0VBQ1YsTUFBTSxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0VBQ3RDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztFQUM3QixLQUFLLE1BQU0sSUFBSSxNQUFNLElBQUksR0FBRyxFQUFFO0VBQzlCO0VBQ0E7RUFDQSxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7RUFDeEMsUUFBUSxJQUFJLFFBQVEsR0FBRyxPQUFPO0VBQzlCLFdBQVcsS0FBSyxFQUFFO0VBQ2xCLFdBQVcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7RUFDckIsWUFBWSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUMxRCxXQUFXLENBQUM7RUFDWixPQUFPLE1BQU07RUFDYixRQUFRLElBQUksUUFBUSxHQUFHLE9BQU87RUFDOUIsV0FBVyxLQUFLLEVBQUU7RUFDbEIsV0FBVyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN0RCxPQUFPO0VBQ1AsTUFBTSxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0VBQ3RDLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztFQUN4QixLQUFLO0VBQ0wsR0FBRztFQUNILENBQUMsQ0FBQztBQUNGO0VBQ0E7RUFDQSxNQUFNLEtBQUssR0FBRyxDQUFDO0VBQ2YsRUFBRSxPQUFPO0VBQ1QsRUFBRSxVQUFVO0VBQ1osRUFBRSxVQUFVO0VBQ1osRUFBRSxlQUFlO0VBQ2pCLENBQUMsS0FBSztFQUNOLEVBQUUsTUFBTSxNQUFNLEdBQUcsRUFBRTtFQUNuQixLQUFLLFNBQVMsRUFBRTtFQUNoQixLQUFLLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUN0QyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztFQUMzQixLQUFLLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekI7RUFDQSxFQUFFLE1BQU0sTUFBTSxHQUFHLEVBQUU7RUFDbkIsS0FBSyxXQUFXLEVBQUU7RUFDbEIsS0FBSyxNQUFNLENBQUM7RUFDWixNQUFNLENBQUM7RUFDUCxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7RUFDckQsS0FBSyxDQUFDO0VBQ04sS0FBSyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QjtFQUNBO0VBQ0EsRUFBRSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztFQUN4RCxFQUFFLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDL0IsRUFBRSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDO0VBQ3pDLEVBQUUsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUc7RUFDekIsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxJQUFJLEdBQUc7RUFDL0MsR0FBRyxDQUFDO0FBQ0o7RUFDQSxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztFQUNoQixFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNoQjtFQUNBO0VBQ0EsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzlCLElBQUksSUFBSSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMxQixJQUFJLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztFQUNsQixJQUFJLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUU7RUFDdEMsTUFBTSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDckMsTUFBTSxJQUFJLENBQUMsSUFBSTtFQUNmLFFBQVEsNkJBQUksS0FBSyxNQUFPLEVBQUMsSUFBSTtFQUM3QixVQUFXLE9BQU8sQ0FBQyxVQUFVLENBQUU7RUFDL0IsU0FBYTtFQUNiLE9BQU8sQ0FBQztFQUNSLEtBQUs7RUFDTCxJQUFJLElBQUksVUFBVSxJQUFJLFFBQVEsRUFBRTtFQUNoQyxNQUFNLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUU7RUFDeEMsUUFBUSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdkMsUUFBUSxJQUFJLENBQUMsSUFBSTtFQUNqQixVQUFVLDZCQUFJLEtBQUssTUFBTyxFQUFDLElBQUksVUFBUSxTQUU3QixDQUFLO0VBQ2YsU0FBUyxDQUFDO0VBQ1YsT0FBTztFQUNQLEtBQUs7RUFDTCxJQUFJLElBQUksVUFBVSxJQUFJLFFBQVEsRUFBRTtFQUNoQyxNQUFNLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUU7RUFDeEMsUUFBUSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdkMsUUFBUSxJQUFJLENBQUMsSUFBSTtFQUNqQixVQUFVLDZCQUFJLEtBQUssTUFBTyxFQUFDLElBQUksVUFBUSxZQUU3QixDQUFLO0VBQ2YsU0FBUyxDQUFDO0VBQ1YsT0FBTztFQUNQLEtBQUssTUFBTTtFQUNYLE1BQU0sS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRTtFQUN4QyxRQUFRLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUN2QyxRQUFRLElBQUksQ0FBQyxJQUFJO0VBQ2pCLFVBQVUsNkJBQUksS0FBSyxNQUFPLEVBQUMsSUFBSSxVQUFRLE9BRTdCLENBQUs7RUFDZixTQUFTLENBQUM7RUFDVixPQUFPO0VBQ1AsS0FBSztFQUNMLElBQUksSUFBSSxDQUFDLElBQUk7RUFDYixNQUFNLDZCQUFJLEtBQUssQ0FBRSxFQUFDLElBQUk7RUFDdEIsUUFBUyxJQUFLO0VBQ2QsT0FBVztFQUNYLEtBQUssQ0FBQztFQUNOLEdBQUc7QUFDSDtFQUNBO0VBQ0E7RUFDQSxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQ3hDLElBQUksSUFBSSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMxQixJQUFJLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztFQUNsQixJQUFJLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUU7RUFDdEMsTUFBTSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDckMsTUFBTSxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3pDLE1BQU0sSUFBSSxDQUFDLElBQUk7RUFDZixRQUFRLDZCQUFJLEtBQUssTUFBTyxFQUFDLElBQUk7RUFDN0IsVUFBVyxLQUFNO0VBQ2pCLFNBQWE7RUFDYixPQUFPLENBQUM7RUFDUixLQUFLO0VBQ0wsSUFBSSxJQUFJLFVBQVUsSUFBSSxRQUFRLEVBQUU7RUFDaEMsTUFBTSxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO0VBQ3hDLFFBQVEsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3ZDLFFBQVEsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDMUMsUUFBUSxJQUFJLENBQUMsSUFBSTtFQUNqQixVQUFVLDZCQUFJLEtBQUssTUFBTyxFQUFDLElBQUk7RUFDL0IsWUFBYSxPQUFNLEdBQ1QsQ0FBSztFQUNmLFNBQVMsQ0FBQztFQUNWLE9BQU87RUFDUCxLQUFLO0VBQ0wsSUFBSSxJQUFJLFVBQVUsSUFBSSxRQUFRLEVBQUU7RUFDaEMsTUFBTSxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO0VBQ3hDLFFBQVEsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3ZDLFFBQVEsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDNUMsUUFBUSxJQUFJLENBQUMsSUFBSTtFQUNqQixVQUFVLDZCQUFJLEtBQUssTUFBTyxFQUFDLElBQUk7RUFDL0IsWUFBYSxZQUFZLENBQUMsS0FBSyxDQUFFO0VBQ2pDLFdBQWU7RUFDZixTQUFTLENBQUM7RUFDVixPQUFPO0VBQ1AsS0FBSyxNQUFNO0VBQ1gsTUFBTSxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO0VBQ3hDLFFBQVEsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3ZDLFFBQVEsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDNUMsUUFBUSxJQUFJLENBQUMsSUFBSTtFQUNqQixVQUFVLDZCQUFJLEtBQUssTUFBTyxFQUFDLElBQUk7RUFDL0IsWUFBYSxZQUFZLENBQUMsS0FBSyxDQUFFO0VBQ2pDLFdBQWU7RUFDZixTQUFTLENBQUM7RUFDVixPQUFPO0VBQ1AsS0FBSztBQUNMO0VBQ0EsSUFBSSxJQUFJLENBQUMsSUFBSTtFQUNiLE1BQU0sNkJBQUksS0FBSyxDQUFFLEVBQUMsSUFBSTtFQUN0QixRQUFTLElBQUs7RUFDZCxPQUFXO0VBQ1gsS0FBSyxDQUFDO0VBQ04sR0FBRztBQUNIO0VBQ0E7RUFDQSxFQUFFLE1BQU0sWUFBWTtFQUNwQixJQUFJLGdDQUFPLElBQUc7RUFDZCxNQUFNLG9DQUFRLElBQUs7RUFDbkIsTUFBTSxvQ0FBUSxJQUFLO0VBQ25CLE1BQU0sc0NBQVMsK0JBQ3FCO0VBQ3BDLFFBQVMsWUFBWSxDQUFDLGVBQWUsQ0FBRTtFQUN2QyxPQUFnQjtFQUNoQixLQUFZO0VBQ1osR0FBRyxDQUFDO0FBQ0o7RUFDQTtFQUNBLEVBQUUsUUFBUSxDQUFDLE1BQU07RUFDakIsSUFBSSxZQUFZO0VBQ2hCLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUM7RUFDcEMsR0FBRyxDQUFDO0VBQ0osRUFBRSxPQUFPLHlDQUFFLEVBQUcsQ0FBQztFQUNmLENBQUMsQ0FBQztBQUNGO0VBQ08sTUFBTSxLQUFLLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLO0VBQ3RDO0VBQ0EsRUFBRSxNQUFNLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxHQUFHSCxnQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQ3RELEVBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsR0FBR0EsZ0JBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN6RDtFQUNBO0VBQ0EsRUFBRSxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JEO0VBQ0E7RUFDQSxFQUFFLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7RUFDekM7RUFDQTtFQUNBLEVBQUUsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU07RUFDdEQsSUFBSSxLQUFLLEVBQUUsQ0FBQztFQUNaLElBQUksS0FBSyxFQUFFLENBQUM7RUFDWixHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ047RUFDQSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFDO0FBQ3pCO0VBQ0EsRUFBRSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSTtFQUM3QixJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLO0VBQ3BCLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekM7RUFDQTtFQUNBLEVBQUU7RUFDRixJQUFJO0VBQ0osTUFBTSw2QkFBSSxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUcsR0FBQztBQUMvQjtFQUNBLE1BQU0sOEJBQUssV0FBVTtFQUNyQixRQUFRLCtCQUFNLFdBQVUsb0JBQWlCLEdBQUM7RUFDMUMsUUFBUSxxQkFBQztFQUNULFVBQVUsU0FBUyxPQUFRLEVBQ2pCLE9BQU8sVUFBVyxFQUNsQixVQUFVLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFO0VBQ3JDLFlBQVksYUFBYSxDQUFDLEtBQUssR0FDcEI7RUFFWCxRQUFRLCtCQUFNLFdBQVUsb0JBQWlCLEdBQUM7RUFDMUMsUUFBUSxxQkFBQztFQUNULFVBQVUsU0FBUyxPQUFRLEVBQ2pCLE9BQU8sVUFBVyxFQUNsQixVQUFVLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFO0VBQ3JDLFlBQVksYUFBYSxDQUFDLEtBQUssR0FDcEIsQ0FDRDtFQUNWO0FBQ0E7RUFDQSxNQUFNO0VBQ04sUUFBUSxJQUFHLFlBQVksRUFDZixLQUFLLENBQUMsQ0FBQztFQUNmLFVBQVUsR0FBRztFQUNiLFlBQVksQ0FBQztFQUNiLFlBQVksT0FBTztFQUNuQixZQUFZLFVBQVU7RUFDdEIsWUFBWSxVQUFVO0VBQ3RCLFlBQVksZUFBZTtFQUMzQixXQUNTLEVBQ0QsT0FBTTtFQUVkLFFBQVEsZ0NBQU8sT0FBTSwyQkFBd0IsbUJBRW5DO0VBQ1YsWUFBWSxXQUFVLE9BQU8sRUFDakIsTUFBSyxPQUFPLEVBQ1osT0FBTSxRQUFRLEVBQ2QsTUFBSyxRQUFNO0VBRXZCLFVBQVUsOEJBQUssT0FBTSxxQkFBb0IsQ0FBTTtFQUMvQztFQUNBLFFBQVEsZ0NBQU8sT0FBTSwyQkFBd0Isb0JBRW5DO0VBQ1YsWUFBWSxXQUFVLE9BQU8sRUFDakIsTUFBSyxPQUFPLEVBQ1osT0FBTSxHQUFHLEVBQ1QsTUFBSyxRQUFNO0VBRXZCLFVBQVUsOEJBQUssT0FBTSxxQkFBb0IsQ0FBTTtFQUMvQyxTQUFnQjtFQUNoQjtBQUNBO0VBQ0EsTUFBTSxxQkFBQztFQUNQLFFBQVEsU0FBUyxPQUFRLEVBQ2pCLFlBQVksVUFBVyxFQUN2QixZQUFZLFVBQVcsRUFDdkIsaUJBQWlCLGlCQUFnQixDQUNqQztFQUNSLEtBQU87RUFDUCxJQUFJO0VBQ0osQ0FBQzs7RUNubkJELE1BQU1JLFNBQU8sR0FBRyxrSkFBa0osQ0FBQztBQUNuSztFQUNPLE1BQU0sVUFBVSxHQUFHLE1BQU07RUFDaEMsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHSixnQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQ3pDLEVBQUVDLGlCQUFTLENBQUMsTUFBTTtFQUNsQixJQUFJQyxTQUFJLENBQUNFLFNBQU8sQ0FBQztFQUNqQixPQUFPLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRTtFQUM1QjtFQUNBLFFBQVEsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQ3RCO0VBQ0EsT0FBTyxDQUFDLENBQUM7RUFDVCxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDVDtFQUNBLEVBQUUsT0FBTyxJQUFJLENBQUM7RUFDZCxDQUFDOztFQ2pCRDtFQUNPLE1BQU0sV0FBVyxFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FB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