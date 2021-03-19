(function (React$1, ReactDOM$1, ReactDropdown, d3$1) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM$1 = ReactDOM$1 && Object.prototype.hasOwnProperty.call(ReactDOM$1, 'default') ? ReactDOM$1['default'] : ReactDOM$1;
  ReactDropdown = ReactDropdown && Object.prototype.hasOwnProperty.call(ReactDropdown, 'default') ? ReactDropdown['default'] : ReactDropdown;

  const jsonURL =
    "https://gist.githubusercontent.com/aulichney/d4589c85658f1a2248b143dfd62005b4/raw/3b10ecd311754f3c2234d6c880622d33ad7d176f/undercustodymod.json";

  // helper function; clean the data
  function cleanData(row) {
    return {
      sex: row.sex,
      age: Number(row.age),
      raceEthnicity: row.raceEthnicity,
      timeServed: Number(row.timeServed)
    };
  }

  // Given the JSON data and a specified column name,
  // group by the column, compute the value counts and the average age
  function transformData(data, col) {
    let transformed = d3
      .nest()
      .key((d) => d[col])
      .rollup((d) => {
        return {
          amount: d.length,
          ageAvg: d3.mean(d.map((correspondent) => correspondent.age)),
          avgTimeServed: d3.mean(d.map(function (correspondent) {return correspondent.timeServed; }))
        };
      })
      .entries(data);
    return transformed;
  }

  // main function; retrieve the data from the JSON file
  const useJSON = () => {
    const [data, setData] = React$1.useState(null);
    React$1.useEffect(() => {
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
  const WIDTH = 600;
  const HEIGHT= 400;
  const margin={top: 25, right: 25, bottom: 50, left: 80};
  const innerWidth = WIDTH - margin.left - margin.right;
  const innerHeight = HEIGHT - margin.top - margin.bottom;

  //Title case function for axis title formatting
  function toTitle(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


  //sort constant, 'none'; 'height': sort by height descendant; 'x': sort by x value
  let sort_status = 'none'; 
  const SORT_DURATION = 500;

  // determine if the string represents a number
  function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }


  // create the svg object 
  const SVG = (ref) => {
    // the temporary solution is this, prevent react from appending svgs indefinitely
    	if (d3.selectAll("svg").empty()) {
        d3.select(ref)
          .append("svg")
          .attr("width", WIDTH)
          .attr("height", HEIGHT);
      }
  };


  const Bar = (ref_radio, barData, yAttribute, xAttribute) => {

  		const barAdjust = 5 / barData.length; // for adjusting the width of bars
      const svg = d3.select("svg");
      // remove everything from svg and rerender objects
      svg.selectAll("*").remove();  

      const xScale = d3.scaleBand()
                 .domain(barData.map(d => d.key))
                 .range([0, innerWidth])
                 .paddingInner([.2]);
      const yScale = d3.scaleLinear()
                     .domain([0, d3.max( barData.map(d => d.value[yAttribute]) )] )
                     .range([innerHeight, 0]).nice();
  		
      //--------------------------------------------------------------------------------
      // draw initial bars
      const bars = svg.append('g')
                        .attr("transform", `translate (${margin.left}, ${margin.top})`)
                        .selectAll("rect")
                        .data(barData, d => d.key);
      bars.enter().append("rect")
        .attr("x", (d, i) => xScale(d.key)+barAdjust)
        .attr("y", d => yScale(d.value[yAttribute]))
        .attr("width", xScale.bandwidth()-barAdjust*2)
        .attr("height", d => innerHeight - yScale(d.value[yAttribute]))
        .style('opacity', 0.7)
    		.on('mouseover', function (d, i) {
            tooltip
              .html(
                `<div>${toTitle(xAttribute)}: ${d.key}</div>
              <div>${toTitle(yAttribute)}: ${d.value[yAttribute].toFixed(2)}</div>
              <div>Percent: ${(d.value[yAttribute]/totalPop*100).toFixed(2)}%</div>`
              )
              .style('visibility', 'visible');
            d3.select(this).style("opacity", 1);
        })
    		.on('mousemove', function () {
            tooltip
              .style('top', d3.event.pageY - 10 + 'px')
              .style('left', d3.event.pageX + 10 + 'px');
        })
    		.on('mouseout', function () {
            tooltip.html(``).style('visibility', 'hidden');
            d3.select(this).style("opacity", 0.7);
        });
    
    	
      //moueover tooltip
      const totalPop = d3.sum(barData.map((d) => d.value[yAttribute])); //counts number of individuals in custody
      const tooltip = d3
                      .select('body')
                      .append('div')
                      .attr('class', 'd3-tooltip')
                      .style('position', 'absolute')
                      .style('z-index', '10')
                      .style('visibility', 'hidden')
                      .style('padding', '10px')
                      .style('background', 'rgba(0,0,0,0.6)')
                      .style('border-radius', '4px')
                      .style('color', '#fff')
                      .text('a simple tooltip');
    
    
    
    	//--------------------------------------------------------------------------------
      // draw axes


      const xAxis = d3.axisBottom().scale(xScale);
      const yAxis = d3.axisLeft().scale(yScale);

      svg.append("g")
        .attr("class", "axis")
    		.attr("id", "xAxis")
        .attr("transform", `translate (${margin.left}, ${HEIGHT - margin.bottom})`)
        .call(xAxis);
      svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate (${margin.left}, ${margin.top})`)
        .call(yAxis);
    	
    	//--------------------------------------------------------------------------------
      //Axis labels
      svg
        .append("text")
    		.attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", 0 - HEIGHT/2)
        .attr("dy", "1em")
        .text(toTitle(yAttribute));
      svg
        .append("text")
        .attr('class', 'axis-label')
        .attr("y", HEIGHT - margin.bottom)
        .attr("x", 0 + WIDTH/2)
        .attr("dy", "1.5em")
        .text(toTitle(xAttribute));
    	
   	 	//--------------------------------------------------------------------------------
    	// sorting 
    	// radio button calls sort function on click 
    	d3.select(ref_radio)
      .selectAll("input")
      .on("click", sort);
  		
      // sort when changing dropdown menu given the sorted button is already selected
      sort(sort_status);
    	

      function change_data(new_data, duration, delay=0) {
        //change the axis generator
        xScale.domain(new_data.map(d => d.key));
        svg.select("#xAxis")
        .transition().duration(duration).ease(d3.easeLinear)
        .call(xAxis);

        // change bars
        const bars = svg.selectAll("rect").data(new_data, d => d.key);
        bars.transition().delay(delay).duration(duration).ease(d3.easeLinear)
              .attr("x", (d, i) => xScale(d.key)+barAdjust)
              .attr("y", d => yScale(d.value[yAttribute]))
              .attr("width", xScale.bandwidth()-barAdjust*2)
              .attr("height", d => innerHeight - yScale(d.value[yAttribute]));
      }  
      // argument is optional, used when changing dropdown menu given the sorted button is already selected
      function sort(arg) {   

        if (typeof arg == 'string') { // when changing dropdown menu given the sorted button is already selected
          var action = arg;
          var duration = 0;
        } else { // when no argument is passed into sort, get value from the radio button 
          var action = d3.select(this).node().value;
          var duration = SORT_DURATION;  
        }
        	console.log(action);

        if (action == "height"){
          const new_data = barData.slice().sort((a,b) => d3.ascending(b.value[yAttribute], a.value[yAttribute]));
          change_data(new_data, duration);
          sort_status = 'height';
        } else if (action == 'x') {
          // if the str is a number, compare the number, not the strings. If we can process the 
          // data so that the key remains numeric data type in the transform function, we don't need this step       
          if (isNumeric(barData[0].key) == true) {
            var new_data = barData.slice().sort((a,b) => d3.ascending(parseInt(a.key), parseInt(b.key)));
          } else {
            var new_data = barData.slice().sort((a,b) => d3.ascending(a.key, b.key));
          }
          change_data(new_data, duration);
          sort_status = 'x';
        }  
      }  
  };

  //Table
  const Table = ({ barData, yAttribute, xAttribute}) => {
    const xScale = d3
      .scaleBand()
      .domain(barData.map((d) => d.key))
      .range([0, innerWidth])
      .paddingInner([0.2]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(barData.map((d) => d.value[yAttribute]))])
      .range([innerHeight, 0]);

    //create arrays of values that will fill table
    const count = barData.map((d) => d.value[yAttribute]); //count for each category
    const yTotal = d3.sum(count); //total number individuals
    const xLength = xScale.domain().length; //number of categories for the givenn x attribute
    const pct = barData.map((d) => d.value[yAttribute]/yTotal * 100); //percent of total for each category


    let rows = [];

    //Fill first row with table headings
    for (var i = 0; i < 1; i++){
        let rowID = `row${i}`;
        let cell = [];
        for (var idx = 0; idx < 1; idx++){
          let cellID = `cell${i}-${idx}`;
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, toTitle(xAttribute)));
        }
     	 for (var idx = 1; idx < 2; idx++){
          let cellID = `cell${i}-${idx}`;
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, "Count"));
        }
      	for (var idx = 2; idx < 3; idx++){
          let cellID = `cell${i}-${idx}`;
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, "Percent"));
        }
        rows.push(React.createElement( 'tr', { key: i, id: rowID }, cell));
      }
    //Fill table by column. Col 1 is each category for the given xattribute. Col 2 is the value for each category.
    //Col 3 is percent of total population for each category
    for (var i = 1; i < xLength + 1; i++){
        let rowID = `row${i}`;
        let cell = [];
        for (var idx = 0; idx < 1; idx++){
          let cellID = `cell${i}-${idx}`;
          let entry = xScale.domain()[i-1];
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, entry));
        }
      	for (var idx = 1; idx < 2; idx++){
          let cellID = `cell${i}-${idx}`;
          let entry = count[i-1].toFixed(0);
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, entry));
        }
      	for (var idx = 2; idx < 3; idx++){
          let cellID = `cell${i}-${idx}`;
          let entry = pct[i-1].toFixed(2);
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, entry, "%"));
        }
        rows.push(React.createElement( 'tr', { key: i, id: rowID }, cell));
      }


    //create table element with rows
    const tableElement = (
              React.createElement( 'table', { id: "dynamic-table" },
                 React.createElement( 'tbody', null,
                   rows
                 )
               )
        );


  //render table
    ReactDOM.render(tableElement, document.getElementById('table'));
    ReactDOM.render(React.createElement( 'p', null, "Total Number of People Under Custody: 36072" ), document.getElementById('summary'));

    return (React.createElement( React.Fragment, null ));
  };

  const Chart = ( {rawData} ) => {
    
    // create React hooks for controlling the grouped data we want to generate; also, setup the initial value 
    const [xAttribute, setXAttribute] = React$1.useState('sex');
    const [yAttribute, setYAttribute] = React$1.useState('amount');
    
    // according to the current xAttr ibute, group by that attribute and compute the number of observations and the average age
    const barData = transformData(rawData, xAttribute);
    
    console.log(barData);

    // map each column to { value: col, label: col } to feed into react Dropdown menu 
    const xFields = Object.keys(rawData[0]).map(d => ({"value":d, "label":d}));

    const yFields = Object.keys(barData[0].value).map(d => ({"value":d, "label":d}));

    // return the title, the dropdown menus, and the barplot with axes  
  	return(
      React.createElement( React.Fragment, null,
        React.createElement( 'h1', { ref: d => SVG(d) }, " Under Custody Data Visualization with Filters"),
  			
        React.createElement( 'div', { className: 'menu-container' },
        React.createElement( 'span', { className: "dropdown-label" }, "X"),
        React.createElement( ReactDropdown, {
          options: xFields, value: xAttribute, onChange: ({value, label}) => setXAttribute(value) }),
        React.createElement( 'span', { className: "dropdown-label" }, "Y"),
        React.createElement( ReactDropdown, {
          options: yFields, value: yAttribute, onChange: ({value, label}) => setYAttribute(value) })
        ),
        
  			React.createElement( 'div', { id: 'radio_sort', ref: d => Bar(d, barData, yAttribute, xAttribute), class: "control-group" },
          React.createElement( 'label', { class: "control control-radio" }, "Sort by Height ", React.createElement( 'input', {  className: 'radio', type: "radio", value: "height", name: "sort" }),  
              React.createElement( 'div', { class: "control_indicator" })
          ),
          React.createElement( 'label', { class: "control control-radio" }, "Sort by X Value ", React.createElement( 'input', { className: 'radio', type: "radio", value: "x", name: "sort" }),  
              React.createElement( 'div', { class: "control_indicator" })
          )
      ),
        
        
      React.createElement( Table, { barData: barData, yAttribute: yAttribute, xAttribute: xAttribute })
  		)
  	);
  };

  const App = () => {
    const rawData = useJSON();

    if (!rawData) {
      return React$1__default.createElement( 'h2', null, "Loading..." );
    }

    console.log(rawData);

    return (
      React$1__default.createElement( React$1__default.Fragment, null,
        React$1__default.createElement( Chart, { rawData: rawData })
      )
    );
  };

  const rootElement = document.getElementById("root");
  ReactDOM$1.render(React$1__default.createElement( App, null ), rootElement);

}(React, ReactDOM, ReactDropdown, d3));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInVzZURhdGEuanMiLCJiYXIuanMiLCJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuXG5jb25zdCBqc29uVVJMID1cbiAgXCJodHRwczovL2dpc3QuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2F1bGljaG5leS9kNDU4OWM4NTY1OGYxYTIyNDhiMTQzZGZkNjIwMDViNC9yYXcvM2IxMGVjZDMxMTc1NGYzYzIyMzRkNmM4ODA2MjJkMzNhZDdkMTc2Zi91bmRlcmN1c3RvZHltb2QuanNvblwiO1xuXG4vLyBoZWxwZXIgZnVuY3Rpb247IGNsZWFuIHRoZSBkYXRhXG5mdW5jdGlvbiBjbGVhbkRhdGEocm93KSB7XG4gIHJldHVybiB7XG4gICAgc2V4OiByb3cuc2V4LFxuICAgIGFnZTogTnVtYmVyKHJvdy5hZ2UpLFxuICAgIHJhY2VFdGhuaWNpdHk6IHJvdy5yYWNlRXRobmljaXR5LFxuICAgIHRpbWVTZXJ2ZWQ6IE51bWJlcihyb3cudGltZVNlcnZlZClcbiAgfTtcbn1cblxuLy8gR2l2ZW4gdGhlIEpTT04gZGF0YSBhbmQgYSBzcGVjaWZpZWQgY29sdW1uIG5hbWUsXG4vLyBncm91cCBieSB0aGUgY29sdW1uLCBjb21wdXRlIHRoZSB2YWx1ZSBjb3VudHMgYW5kIHRoZSBhdmVyYWdlIGFnZVxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybURhdGEoZGF0YSwgY29sKSB7XG4gIGxldCB0cmFuc2Zvcm1lZCA9IGQzXG4gICAgLm5lc3QoKVxuICAgIC5rZXkoKGQpID0+IGRbY29sXSlcbiAgICAucm9sbHVwKChkKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbW91bnQ6IGQubGVuZ3RoLFxuICAgICAgICBhZ2VBdmc6IGQzLm1lYW4oZC5tYXAoKGNvcnJlc3BvbmRlbnQpID0+IGNvcnJlc3BvbmRlbnQuYWdlKSksXG4gICAgICAgIGF2Z1RpbWVTZXJ2ZWQ6IGQzLm1lYW4oZC5tYXAoZnVuY3Rpb24gKGNvcnJlc3BvbmRlbnQpIHtyZXR1cm4gY29ycmVzcG9uZGVudC50aW1lU2VydmVkOyB9KSlcbiAgICAgIH07XG4gICAgfSlcbiAgICAuZW50cmllcyhkYXRhKTtcbiAgcmV0dXJuIHRyYW5zZm9ybWVkO1xufVxuXG4vLyBtYWluIGZ1bmN0aW9uOyByZXRyaWV2ZSB0aGUgZGF0YSBmcm9tIHRoZSBKU09OIGZpbGVcbmV4cG9ydCBjb25zdCB1c2VKU09OID0gKCkgPT4ge1xuICBjb25zdCBbZGF0YSwgc2V0RGF0YV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBkMy5qc29uKGpzb25VUkwpIC8vIHJldHJpZXZlIGRhdGEgZnJvbSB0aGUgZ2l2ZW4gVVJMXG4gICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAvL3doZW4gZGF0YSBpcyByZXRyaWV2ZWQsIGRvIHRoZSBmb2xsb3dpbmdcbiAgICAgICAgZGF0YSA9IGRhdGEubWFwKGNsZWFuRGF0YSk7IC8vIG1hcCBlYWNoIHJvdyB0byB0aGUgY2xlYW5EYXRhIGZ1bmN0aW9uIHRvIHJldHJpZXZlIHRoZSBkZXNpcmVkIGNvbHVtbnNcbiAgICAgICAgc2V0RGF0YShkYXRhKTtcbiAgICAgICAgLy8gdXNlIHRoZSByZWFjdCBob29rIHRvIHNldCB0aGUgZGF0YVxuICAgICAgfSk7XG4gIH0sIFtdKTtcbiAgcmV0dXJuIGRhdGE7XG59O1xuIiwiaW1wb3J0IFJlYWN0RHJvcGRvd24gZnJvbSAncmVhY3QtZHJvcGRvd24nO1xuXG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBzZWxlY3QsIGF4aXNCb3R0b20sIGF4aXNMZWZ0IH0gZnJvbSBcImQzXCI7XG5pbXBvcnQgeyB0cmFuc2Zvcm1EYXRhIH0gZnJvbSBcIi4vdXNlRGF0YVwiO1xuXG5cbi8vIGJhciBjb25zdGFudHMgXG5jb25zdCBXSURUSCA9IDYwMDtcbmNvbnN0IEhFSUdIVD0gNDAwO1xuY29uc3QgbWFyZ2luPXt0b3A6IDI1LCByaWdodDogMjUsIGJvdHRvbTogNTAsIGxlZnQ6IDgwfTtcbmNvbnN0IGlubmVyV2lkdGggPSBXSURUSCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0O1xuY29uc3QgaW5uZXJIZWlnaHQgPSBIRUlHSFQgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcblxuLy9UaXRsZSBjYXNlIGZ1bmN0aW9uIGZvciBheGlzIHRpdGxlIGZvcm1hdHRpbmdcbmZ1bmN0aW9uIHRvVGl0bGUoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cblxuLy9zb3J0IGNvbnN0YW50LCAnbm9uZSc7ICdoZWlnaHQnOiBzb3J0IGJ5IGhlaWdodCBkZXNjZW5kYW50OyAneCc6IHNvcnQgYnkgeCB2YWx1ZVxubGV0IHNvcnRfc3RhdHVzID0gJ25vbmUnOyBcbmNvbnN0IFNPUlRfRFVSQVRJT04gPSA1MDA7XG5cbi8vIGRldGVybWluZSBpZiB0aGUgc3RyaW5nIHJlcHJlc2VudHMgYSBudW1iZXJcbmZ1bmN0aW9uIGlzTnVtZXJpYyhzdHIpIHtcbiAgaWYgKHR5cGVvZiBzdHIgIT0gXCJzdHJpbmdcIikgcmV0dXJuIGZhbHNlIC8vIHdlIG9ubHkgcHJvY2VzcyBzdHJpbmdzISAgXG4gIHJldHVybiAhaXNOYU4oc3RyKSAmJiAvLyB1c2UgdHlwZSBjb2VyY2lvbiB0byBwYXJzZSB0aGUgX2VudGlyZXR5XyBvZiB0aGUgc3RyaW5nIChgcGFyc2VGbG9hdGAgYWxvbmUgZG9lcyBub3QgZG8gdGhpcykuLi5cbiAgICAgICAgICFpc05hTihwYXJzZUZsb2F0KHN0cikpIC8vIC4uLmFuZCBlbnN1cmUgc3RyaW5ncyBvZiB3aGl0ZXNwYWNlIGZhaWxcbn1cblxuXG4vLyBjcmVhdGUgdGhlIHN2ZyBvYmplY3QgXG5jb25zdCBTVkcgPSAocmVmKSA9PiB7XG4gIC8vIHRoZSB0ZW1wb3Jhcnkgc29sdXRpb24gaXMgdGhpcywgcHJldmVudCByZWFjdCBmcm9tIGFwcGVuZGluZyBzdmdzIGluZGVmaW5pdGVseVxuICBcdGlmIChkMy5zZWxlY3RBbGwoXCJzdmdcIikuZW1wdHkoKSkge1xuICAgICAgZDMuc2VsZWN0KHJlZilcbiAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIFdJRFRIKVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBIRUlHSFQpXG4gICAgfVxufVxuXG5cbmNvbnN0IEJhciA9IChyZWZfcmFkaW8sIGJhckRhdGEsIHlBdHRyaWJ1dGUsIHhBdHRyaWJ1dGUpID0+IHtcblxuXHRcdGNvbnN0IGJhckFkanVzdCA9IDUgLyBiYXJEYXRhLmxlbmd0aCAvLyBmb3IgYWRqdXN0aW5nIHRoZSB3aWR0aCBvZiBiYXJzXG4gICAgY29uc3Qgc3ZnID0gZDMuc2VsZWN0KFwic3ZnXCIpXG4gICAgLy8gcmVtb3ZlIGV2ZXJ5dGhpbmcgZnJvbSBzdmcgYW5kIHJlcmVuZGVyIG9iamVjdHNcbiAgICBzdmcuc2VsZWN0QWxsKFwiKlwiKS5yZW1vdmUoKTsgIFxuXG4gICAgY29uc3QgeFNjYWxlID0gZDMuc2NhbGVCYW5kKClcbiAgICAgICAgICAgICAgIC5kb21haW4oYmFyRGF0YS5tYXAoZCA9PiBkLmtleSkpXG4gICAgICAgICAgICAgICAucmFuZ2UoWzAsIGlubmVyV2lkdGhdKVxuICAgICAgICAgICAgICAgLnBhZGRpbmdJbm5lcihbLjJdKTtcbiAgICBjb25zdCB5U2NhbGUgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgICAgICAgICAgICAgICAgLmRvbWFpbihbMCwgZDMubWF4KCBiYXJEYXRhLm1hcChkID0+IGQudmFsdWVbeUF0dHJpYnV0ZV0pICldIClcbiAgICAgICAgICAgICAgICAgICAucmFuZ2UoW2lubmVySGVpZ2h0LCAwXSkubmljZSgpO1xuXHRcdFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBkcmF3IGluaXRpYWwgYmFyc1xuICAgIGNvbnN0IGJhcnMgPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgICAgICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBgdHJhbnNsYXRlICgke21hcmdpbi5sZWZ0fSwgJHttYXJnaW4udG9wfSlgKVxuICAgICAgICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXG4gICAgICAgICAgICAgICAgICAgICAgLmRhdGEoYmFyRGF0YSwgZCA9PiBkLmtleSk7XG4gICAgYmFycy5lbnRlcigpLmFwcGVuZChcInJlY3RcIilcbiAgICAgIC5hdHRyKFwieFwiLCAoZCwgaSkgPT4geFNjYWxlKGQua2V5KStiYXJBZGp1c3QpXG4gICAgICAuYXR0cihcInlcIiwgZCA9PiB5U2NhbGUoZC52YWx1ZVt5QXR0cmlidXRlXSkpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIHhTY2FsZS5iYW5kd2lkdGgoKS1iYXJBZGp1c3QqMilcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGQgPT4gaW5uZXJIZWlnaHQgLSB5U2NhbGUoZC52YWx1ZVt5QXR0cmlidXRlXSkpXG4gICAgICAuc3R5bGUoJ29wYWNpdHknLCAwLjcpXG4gIFx0XHQub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICAgICAgdG9vbHRpcFxuICAgICAgICAgICAgLmh0bWwoXG4gICAgICAgICAgICAgIGA8ZGl2PiR7dG9UaXRsZSh4QXR0cmlidXRlKX06ICR7ZC5rZXl9PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXY+JHt0b1RpdGxlKHlBdHRyaWJ1dGUpfTogJHtkLnZhbHVlW3lBdHRyaWJ1dGVdLnRvRml4ZWQoMil9PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXY+UGVyY2VudDogJHsoZC52YWx1ZVt5QXR0cmlidXRlXS90b3RhbFBvcCoxMDApLnRvRml4ZWQoMil9JTwvZGl2PmBcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5zdHlsZSgndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG4gICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcbiAgICAgIH0pXG4gIFx0XHQub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0b29sdGlwXG4gICAgICAgICAgICAuc3R5bGUoJ3RvcCcsIGQzLmV2ZW50LnBhZ2VZIC0gMTAgKyAncHgnKVxuICAgICAgICAgICAgLnN0eWxlKCdsZWZ0JywgZDMuZXZlbnQucGFnZVggKyAxMCArICdweCcpO1xuICAgICAgfSlcbiAgXHRcdC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdG9vbHRpcC5odG1sKGBgKS5zdHlsZSgndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJvcGFjaXR5XCIsIDAuNyk7XG4gICAgICB9KTtcbiAgXG4gIFx0XG4gICAgLy9tb3Vlb3ZlciB0b29sdGlwXG4gICAgY29uc3QgdG90YWxQb3AgPSBkMy5zdW0oYmFyRGF0YS5tYXAoKGQpID0+IGQudmFsdWVbeUF0dHJpYnV0ZV0pKTsgLy9jb3VudHMgbnVtYmVyIG9mIGluZGl2aWR1YWxzIGluIGN1c3RvZHlcbiAgICBjb25zdCB0b29sdGlwID0gZDNcbiAgICAgICAgICAgICAgICAgICAgLnNlbGVjdCgnYm9keScpXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdkMy10b29sdGlwJylcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZSgnei1pbmRleCcsICcxMCcpXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZSgndmlzaWJpbGl0eScsICdoaWRkZW4nKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoJ3BhZGRpbmcnLCAnMTBweCcpXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZSgnYmFja2dyb3VuZCcsICdyZ2JhKDAsMCwwLDAuNiknKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoJ2JvcmRlci1yYWRpdXMnLCAnNHB4JylcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKCdjb2xvcicsICcjZmZmJylcbiAgICAgICAgICAgICAgICAgICAgLnRleHQoJ2Egc2ltcGxlIHRvb2x0aXAnKTtcbiAgXG4gIFxuICBcbiAgXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gZHJhdyBheGVzXG5cblxuICAgIGNvbnN0IHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHhTY2FsZSk7XG4gICAgY29uc3QgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHlTY2FsZSk7XG5cbiAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcbiAgXHRcdC5hdHRyKFwiaWRcIiwgXCJ4QXhpc1wiKVxuICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgYHRyYW5zbGF0ZSAoJHttYXJnaW4ubGVmdH0sICR7SEVJR0hUIC0gbWFyZ2luLmJvdHRvbX0pYClcbiAgICAgIC5jYWxsKHhBeGlzKTtcbiAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGB0cmFuc2xhdGUgKCR7bWFyZ2luLmxlZnR9LCAke21hcmdpbi50b3B9KWApXG4gICAgICAuY2FsbCh5QXhpcyk7XG4gIFx0XG4gIFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vQXhpcyBsYWJlbHNcbiAgICBzdmdcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gIFx0XHQuYXR0cihcImNsYXNzXCIsIFwiYXhpcy1sYWJlbFwiKVxuICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxuICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAuYXR0cihcInhcIiwgMCAtIEhFSUdIVC8yKVxuICAgICAgLmF0dHIoXCJkeVwiLCBcIjFlbVwiKVxuICAgICAgLnRleHQodG9UaXRsZSh5QXR0cmlidXRlKSk7XG4gICAgc3ZnXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2F4aXMtbGFiZWwnKVxuICAgICAgLmF0dHIoXCJ5XCIsIEhFSUdIVCAtIG1hcmdpbi5ib3R0b20pXG4gICAgICAuYXR0cihcInhcIiwgMCArIFdJRFRILzIpXG4gICAgICAuYXR0cihcImR5XCIsIFwiMS41ZW1cIilcbiAgICAgIC50ZXh0KHRvVGl0bGUoeEF0dHJpYnV0ZSkpO1xuICBcdFxuIFx0IFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcdC8vIHNvcnRpbmcgXG4gIFx0Ly8gcmFkaW8gYnV0dG9uIGNhbGxzIHNvcnQgZnVuY3Rpb24gb24gY2xpY2sgXG4gIFx0ZDMuc2VsZWN0KHJlZl9yYWRpbylcbiAgICAuc2VsZWN0QWxsKFwiaW5wdXRcIilcbiAgICAub24oXCJjbGlja1wiLCBzb3J0KVxuXHRcdFxuICAgIC8vIHNvcnQgd2hlbiBjaGFuZ2luZyBkcm9wZG93biBtZW51IGdpdmVuIHRoZSBzb3J0ZWQgYnV0dG9uIGlzIGFscmVhZHkgc2VsZWN0ZWRcbiAgICBzb3J0KHNvcnRfc3RhdHVzKVxuICBcdFxuXG4gICAgZnVuY3Rpb24gY2hhbmdlX2RhdGEobmV3X2RhdGEsIGR1cmF0aW9uLCBkZWxheT0wKSB7XG4gICAgICAvL2NoYW5nZSB0aGUgYXhpcyBnZW5lcmF0b3JcbiAgICAgIHhTY2FsZS5kb21haW4obmV3X2RhdGEubWFwKGQgPT4gZC5rZXkpKTtcbiAgICAgIHN2Zy5zZWxlY3QoXCIjeEF4aXNcIilcbiAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oZHVyYXRpb24pLmVhc2UoZDMuZWFzZUxpbmVhcilcbiAgICAgIC5jYWxsKHhBeGlzKTtcblxuICAgICAgLy8gY2hhbmdlIGJhcnNcbiAgICAgIGNvbnN0IGJhcnMgPSBzdmcuc2VsZWN0QWxsKFwicmVjdFwiKS5kYXRhKG5ld19kYXRhLCBkID0+IGQua2V5KVxuICAgICAgYmFycy50cmFuc2l0aW9uKCkuZGVsYXkoZGVsYXkpLmR1cmF0aW9uKGR1cmF0aW9uKS5lYXNlKGQzLmVhc2VMaW5lYXIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsIGkpID0+IHhTY2FsZShkLmtleSkrYmFyQWRqdXN0KVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGQgPT4geVNjYWxlKGQudmFsdWVbeUF0dHJpYnV0ZV0pKVxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB4U2NhbGUuYmFuZHdpZHRoKCktYmFyQWRqdXN0KjIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBkID0+IGlubmVySGVpZ2h0IC0geVNjYWxlKGQudmFsdWVbeUF0dHJpYnV0ZV0pKVxuICAgIH07XG4gIFxuICAgIC8vIGFyZ3VtZW50IGlzIG9wdGlvbmFsLCB1c2VkIHdoZW4gY2hhbmdpbmcgZHJvcGRvd24gbWVudSBnaXZlbiB0aGUgc29ydGVkIGJ1dHRvbiBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gICAgZnVuY3Rpb24gc29ydChhcmcpIHsgICBcblxuICAgICAgaWYgKHR5cGVvZiBhcmcgPT0gJ3N0cmluZycpIHsgLy8gd2hlbiBjaGFuZ2luZyBkcm9wZG93biBtZW51IGdpdmVuIHRoZSBzb3J0ZWQgYnV0dG9uIGlzIGFscmVhZHkgc2VsZWN0ZWRcbiAgICAgICAgdmFyIGFjdGlvbiA9IGFyZ1xuICAgICAgICB2YXIgZHVyYXRpb24gPSAwXG4gICAgICB9IGVsc2UgeyAvLyB3aGVuIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCBpbnRvIHNvcnQsIGdldCB2YWx1ZSBmcm9tIHRoZSByYWRpbyBidXR0b24gXG4gICAgICAgIHZhciBhY3Rpb24gPSBkMy5zZWxlY3QodGhpcykubm9kZSgpLnZhbHVlO1xuICAgICAgICB2YXIgZHVyYXRpb24gPSBTT1JUX0RVUkFUSU9OOyAgXG4gICAgICB9XG4gICAgICBcdGNvbnNvbGUubG9nKGFjdGlvbilcblxuICAgICAgaWYgKGFjdGlvbiA9PSBcImhlaWdodFwiKXtcbiAgICAgICAgY29uc3QgbmV3X2RhdGEgPSBiYXJEYXRhLnNsaWNlKCkuc29ydCgoYSxiKSA9PiBkMy5hc2NlbmRpbmcoYi52YWx1ZVt5QXR0cmlidXRlXSwgYS52YWx1ZVt5QXR0cmlidXRlXSkpO1xuICAgICAgICBjaGFuZ2VfZGF0YShuZXdfZGF0YSwgZHVyYXRpb24pO1xuICAgICAgICBzb3J0X3N0YXR1cyA9ICdoZWlnaHQnO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT0gJ3gnKSB7XG4gICAgICAgIC8vIGlmIHRoZSBzdHIgaXMgYSBudW1iZXIsIGNvbXBhcmUgdGhlIG51bWJlciwgbm90IHRoZSBzdHJpbmdzLiBJZiB3ZSBjYW4gcHJvY2VzcyB0aGUgXG4gICAgICAgIC8vIGRhdGEgc28gdGhhdCB0aGUga2V5IHJlbWFpbnMgbnVtZXJpYyBkYXRhIHR5cGUgaW4gdGhlIHRyYW5zZm9ybSBmdW5jdGlvbiwgd2UgZG9uJ3QgbmVlZCB0aGlzIHN0ZXAgICAgICAgXG4gICAgICAgIGlmIChpc051bWVyaWMoYmFyRGF0YVswXS5rZXkpID09IHRydWUpIHtcbiAgICAgICAgICB2YXIgbmV3X2RhdGEgPSBiYXJEYXRhLnNsaWNlKCkuc29ydCgoYSxiKSA9PiBkMy5hc2NlbmRpbmcocGFyc2VJbnQoYS5rZXkpLCBwYXJzZUludChiLmtleSkpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgbmV3X2RhdGEgPSBiYXJEYXRhLnNsaWNlKCkuc29ydCgoYSxiKSA9PiBkMy5hc2NlbmRpbmcoYS5rZXksIGIua2V5KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2hhbmdlX2RhdGEobmV3X2RhdGEsIGR1cmF0aW9uKVxuICAgICAgICBzb3J0X3N0YXR1cyA9ICd4JztcbiAgICAgIH0gIFxuICAgIH07XG4gIFxufTtcblxuLy9UYWJsZVxuY29uc3QgVGFibGUgPSAoeyBiYXJEYXRhLCB5QXR0cmlidXRlLCB4QXR0cmlidXRlfSkgPT4ge1xuICBjb25zdCB4U2NhbGUgPSBkM1xuICAgIC5zY2FsZUJhbmQoKVxuICAgIC5kb21haW4oYmFyRGF0YS5tYXAoKGQpID0+IGQua2V5KSlcbiAgICAucmFuZ2UoWzAsIGlubmVyV2lkdGhdKVxuICAgIC5wYWRkaW5nSW5uZXIoWzAuMl0pO1xuXG4gIGNvbnN0IHlTY2FsZSA9IGQzXG4gICAgLnNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKFswLCBkMy5tYXgoYmFyRGF0YS5tYXAoKGQpID0+IGQudmFsdWVbeUF0dHJpYnV0ZV0pKV0pXG4gICAgLnJhbmdlKFtpbm5lckhlaWdodCwgMF0pO1xuXG4gIC8vY3JlYXRlIGFycmF5cyBvZiB2YWx1ZXMgdGhhdCB3aWxsIGZpbGwgdGFibGVcbiAgY29uc3QgY291bnQgPSBiYXJEYXRhLm1hcCgoZCkgPT4gZC52YWx1ZVt5QXR0cmlidXRlXSk7IC8vY291bnQgZm9yIGVhY2ggY2F0ZWdvcnlcbiAgY29uc3QgeVRvdGFsID0gZDMuc3VtKGNvdW50KSAvL3RvdGFsIG51bWJlciBpbmRpdmlkdWFsc1xuICBjb25zdCB4TGVuZ3RoID0geFNjYWxlLmRvbWFpbigpLmxlbmd0aCAvL251bWJlciBvZiBjYXRlZ29yaWVzIGZvciB0aGUgZ2l2ZW5uIHggYXR0cmlidXRlXG4gIGNvbnN0IHBjdCA9IGJhckRhdGEubWFwKChkKSA9PiBkLnZhbHVlW3lBdHRyaWJ1dGVdL3lUb3RhbCAqIDEwMCk7IC8vcGVyY2VudCBvZiB0b3RhbCBmb3IgZWFjaCBjYXRlZ29yeVxuXG5cbiAgbGV0IHJvd3MgPSBbXTtcblxuICAvL0ZpbGwgZmlyc3Qgcm93IHdpdGggdGFibGUgaGVhZGluZ3NcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAxOyBpKyspe1xuICAgICAgbGV0IHJvd0lEID0gYHJvdyR7aX1gXG4gICAgICBsZXQgY2VsbCA9IFtdXG4gICAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCAxOyBpZHgrKyl7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICBjZWxsLnB1c2goPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT57dG9UaXRsZSh4QXR0cmlidXRlKX08L3RkPilcbiAgICAgIH1cbiAgIFx0IGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IDI7IGlkeCsrKXtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gXG4gICAgICAgIGNlbGwucHVzaCg8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9PkNvdW50PC90ZD4pXG4gICAgICB9XG4gICAgXHRmb3IgKHZhciBpZHggPSAyOyBpZHggPCAzOyBpZHgrKyl7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICBjZWxsLnB1c2goPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT5QZXJjZW50PC90ZD4pXG4gICAgICB9XG4gICAgICByb3dzLnB1c2goPHRyIGtleT17aX0gaWQ9e3Jvd0lEfT57Y2VsbH08L3RyPilcbiAgICB9O1xuXG4gIC8vRmlsbCB0YWJsZSBieSBjb2x1bW4uIENvbCAxIGlzIGVhY2ggY2F0ZWdvcnkgZm9yIHRoZSBnaXZlbiB4YXR0cmlidXRlLiBDb2wgMiBpcyB0aGUgdmFsdWUgZm9yIGVhY2ggY2F0ZWdvcnkuXG4gIC8vQ29sIDMgaXMgcGVyY2VudCBvZiB0b3RhbCBwb3B1bGF0aW9uIGZvciBlYWNoIGNhdGVnb3J5XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgeExlbmd0aCArIDE7IGkrKyl7XG4gICAgICBsZXQgcm93SUQgPSBgcm93JHtpfWBcbiAgICAgIGxldCBjZWxsID0gW11cbiAgICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IDE7IGlkeCsrKXtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gXG4gICAgICAgIGxldCBlbnRyeSA9IHhTY2FsZS5kb21haW4oKVtpLTFdXG4gICAgICAgIGNlbGwucHVzaCg8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9PntlbnRyeX08L3RkPilcbiAgICAgIH1cbiAgICBcdGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IDI7IGlkeCsrKXtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gXG4gICAgICAgIGxldCBlbnRyeSA9IGNvdW50W2ktMV0udG9GaXhlZCgwKVxuICAgICAgICBjZWxsLnB1c2goPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT57ZW50cnl9PC90ZD4pXG4gICAgICB9XG4gICAgXHRmb3IgKHZhciBpZHggPSAyOyBpZHggPCAzOyBpZHgrKyl7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICBsZXQgZW50cnkgPSBwY3RbaS0xXS50b0ZpeGVkKDIpXG4gICAgICAgIGNlbGwucHVzaCg8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9PntlbnRyeX0lPC90ZD4pXG4gICAgICB9XG4gICAgICByb3dzLnB1c2goPHRyIGtleT17aX0gaWQ9e3Jvd0lEfT57Y2VsbH08L3RyPilcbiAgICB9O1xuXG5cblxuICAvL2NyZWF0ZSB0YWJsZSBlbGVtZW50IHdpdGggcm93c1xuICBjb25zdCB0YWJsZUVsZW1lbnQgPSAoXG4gICAgICAgICAgICA8dGFibGUgaWQ9XCJkeW5hbWljLXRhYmxlXCI+XG4gICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgIHtyb3dzfVxuICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgKTtcblxuXG4vL3JlbmRlciB0YWJsZVxuICBSZWFjdERPTS5yZW5kZXIodGFibGVFbGVtZW50LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFibGUnKSk7XG4gIFJlYWN0RE9NLnJlbmRlcig8cD5Ub3RhbCBOdW1iZXIgb2YgUGVvcGxlIFVuZGVyIEN1c3RvZHk6IDM2MDcyPC9wPiwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N1bW1hcnknKSk7XG5cbiAgcmV0dXJuICg8PjwvPik7XG59O1xuXG5leHBvcnQgY29uc3QgQ2hhcnQgPSAoIHtyYXdEYXRhfSApID0+IHtcbiAgXG4gIC8vIGNyZWF0ZSBSZWFjdCBob29rcyBmb3IgY29udHJvbGxpbmcgdGhlIGdyb3VwZWQgZGF0YSB3ZSB3YW50IHRvIGdlbmVyYXRlOyBhbHNvLCBzZXR1cCB0aGUgaW5pdGlhbCB2YWx1ZSBcbiAgY29uc3QgW3hBdHRyaWJ1dGUsIHNldFhBdHRyaWJ1dGVdID0gdXNlU3RhdGUoJ3NleCcpO1xuICBjb25zdCBbeUF0dHJpYnV0ZSwgc2V0WUF0dHJpYnV0ZV0gPSB1c2VTdGF0ZSgnYW1vdW50Jyk7XG4gIFxuICAvLyBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgeEF0dHIgaWJ1dGUsIGdyb3VwIGJ5IHRoYXQgYXR0cmlidXRlIGFuZCBjb21wdXRlIHRoZSBudW1iZXIgb2Ygb2JzZXJ2YXRpb25zIGFuZCB0aGUgYXZlcmFnZSBhZ2VcbiAgY29uc3QgYmFyRGF0YSA9IHRyYW5zZm9ybURhdGEocmF3RGF0YSwgeEF0dHJpYnV0ZSlcbiAgXG4gIGNvbnNvbGUubG9nKGJhckRhdGEpXG5cbiAgLy8gbWFwIGVhY2ggY29sdW1uIHRvIHsgdmFsdWU6IGNvbCwgbGFiZWw6IGNvbCB9IHRvIGZlZWQgaW50byByZWFjdCBEcm9wZG93biBtZW51IFxuICBjb25zdCB4RmllbGRzID0gT2JqZWN0LmtleXMocmF3RGF0YVswXSkubWFwKGQgPT4gKHtcInZhbHVlXCI6ZCwgXCJsYWJlbFwiOmR9KSk7XG5cbiAgY29uc3QgeUZpZWxkcyA9IE9iamVjdC5rZXlzKGJhckRhdGFbMF0udmFsdWUpLm1hcChkID0+ICh7XCJ2YWx1ZVwiOmQsIFwibGFiZWxcIjpkfSkpO1xuXG4gIC8vIHJldHVybiB0aGUgdGl0bGUsIHRoZSBkcm9wZG93biBtZW51cywgYW5kIHRoZSBiYXJwbG90IHdpdGggYXhlcyAgXG5cdHJldHVybihcbiAgICA8PlxuICAgICAgPGgxIHJlZj17ZCA9PiBTVkcoZCl9PiBVbmRlciBDdXN0b2R5IERhdGEgVmlzdWFsaXphdGlvbiB3aXRoIEZpbHRlcnM8L2gxPlxuXHRcdFx0XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbWVudS1jb250YWluZXInPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZHJvcGRvd24tbGFiZWxcIj5YPC9zcGFuPlxuICAgICAgPFJlYWN0RHJvcGRvd25cbiAgICAgICAgb3B0aW9ucz17eEZpZWxkc31cbiAgICAgICAgdmFsdWU9e3hBdHRyaWJ1dGV9XG4gICAgICAgIG9uQ2hhbmdlPXsoe3ZhbHVlLCBsYWJlbH0pID0+IHNldFhBdHRyaWJ1dGUodmFsdWUpfVxuICAgICAgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImRyb3Bkb3duLWxhYmVsXCI+WTwvc3Bhbj5cbiAgICAgIDxSZWFjdERyb3Bkb3duXG4gICAgICAgIG9wdGlvbnM9e3lGaWVsZHN9XG4gICAgICAgIHZhbHVlPXt5QXR0cmlidXRlfVxuICAgICAgICBvbkNoYW5nZT17KHt2YWx1ZSwgbGFiZWx9KSA9PiBzZXRZQXR0cmlidXRlKHZhbHVlKX1cbiAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIFxuXHRcdFx0PGRpdiBpZD0ncmFkaW9fc29ydCcgcmVmPXtkID0+IEJhcihkLCBiYXJEYXRhLCB5QXR0cmlidXRlLCB4QXR0cmlidXRlKX0gY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImNvbnRyb2wgY29udHJvbC1yYWRpb1wiPlxuICAgICAgICAgICAgU29ydCBieSBIZWlnaHRcbiAgICAgICAgICAgIDxpbnB1dCAgY2xhc3NOYW1lPSdyYWRpbycgdHlwZT1cInJhZGlvXCIgdmFsdWU9XCJoZWlnaHRcIiBuYW1lPVwic29ydFwiIC8+IFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xfaW5kaWNhdG9yXCI+PC9kaXY+XG4gICAgICAgIDwvbGFiZWw+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImNvbnRyb2wgY29udHJvbC1yYWRpb1wiPlxuICAgICAgICAgICAgU29ydCBieSBYIFZhbHVlIFxuICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0ncmFkaW8nIHR5cGU9XCJyYWRpb1wiIHZhbHVlPVwieFwiIG5hbWU9XCJzb3J0XCIgLz4gXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbF9pbmRpY2F0b3JcIj48L2Rpdj5cbiAgICAgICAgPC9sYWJlbD5cbiAgICA8L2Rpdj5cbiAgICAgIFxuICAgICAgXG4gICAgPFRhYmxlIGJhckRhdGE9e2JhckRhdGF9IHlBdHRyaWJ1dGU9e3lBdHRyaWJ1dGV9IHhBdHRyaWJ1dGUgPSB7eEF0dHJpYnV0ZX0vPlxuXHRcdDwvPlxuXHQpO1xufTtcbiIsImltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBSZWFjdERPTSBmcm9tIFwicmVhY3QtZG9tXCI7XG5cbmltcG9ydCB7IHVzZUpTT04gfSBmcm9tIFwiLi91c2VEYXRhXCI7XG5pbXBvcnQgeyBDaGFydCB9IGZyb20gXCIuL2JhclwiO1xuXG5jb25zdCBBcHAgPSAoKSA9PiB7XG4gIGNvbnN0IHJhd0RhdGEgPSB1c2VKU09OKCk7XG5cbiAgaWYgKCFyYXdEYXRhKSB7XG4gICAgcmV0dXJuIDxoMj5Mb2FkaW5nLi4uPC9oMj47XG4gIH1cblxuICBjb25zb2xlLmxvZyhyYXdEYXRhKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8Q2hhcnQgcmF3RGF0YT17cmF3RGF0YX0gLz5cbiAgICA8Lz5cbiAgKTtcbn07XG5cbmNvbnN0IHJvb3RFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyb290XCIpO1xuUmVhY3RET00ucmVuZGVyKDxBcHAgLz4sIHJvb3RFbGVtZW50KTsiXSwibmFtZXMiOlsidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJSZWFjdCIsIlJlYWN0RE9NIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0VBRUEsTUFBTSxPQUFPO0VBQ2IsRUFBRSxpSkFBaUosQ0FBQztBQUNwSjtFQUNBO0VBQ0EsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFO0VBQ3hCLEVBQUUsT0FBTztFQUNULElBQUksR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHO0VBQ2hCLElBQUksR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO0VBQ3hCLElBQUksYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhO0VBQ3BDLElBQUksVUFBVSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0VBQ3RDLEdBQUcsQ0FBQztFQUNKLENBQUM7QUFDRDtFQUNBO0VBQ0E7RUFDTyxTQUFTLGFBQWEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO0VBQ3pDLEVBQUUsSUFBSSxXQUFXLEdBQUcsRUFBRTtFQUN0QixLQUFLLElBQUksRUFBRTtFQUNYLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUN2QixLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSztFQUNuQixNQUFNLE9BQU87RUFDYixRQUFRLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBTTtFQUN4QixRQUFRLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLEtBQUssYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3BFLFFBQVEsYUFB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Q0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0VBQ3RDLFFBQVEsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBQztFQUN0QyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQUksS0FBSyxNQUFPLEVBQUMsSUFBSSxVQUFRLE9BQUssQ0FBSyxFQUFDO0VBQzFELE9BQU87RUFDUCxLQUFLLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7RUFDdEMsUUFBUSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFDO0VBQ3RDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBSSxLQUFLLE1BQU8sRUFBQyxJQUFJLFVBQVEsU0FBTyxDQUFLLEVBQUM7RUFDNUQsT0FBTztFQUNQLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBSSxLQUFLLENBQUUsRUFBQyxJQUFJLFNBQVEsSUFBSyxDQUFLLEVBQUM7RUFDbkQsS0FDQTtFQUNBO0VBQ0E7RUFDQSxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0VBQ3ZDLE1BQU0sSUFBSSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUM7RUFDM0IsTUFBTSxJQUFJLElBQUksR0FBRyxHQUFFO0VBQ25CLE1BQU0sS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztFQUN2QyxRQUFRLElBQUksTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUM7RUFDdEMsUUFBUSxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMs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