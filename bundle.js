(function (React$1, ReactDOM$1, ReactDropdown, d3$1) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM$1 = ReactDOM$1 && Object.prototype.hasOwnProperty.call(ReactDOM$1, 'default') ? ReactDOM$1['default'] : ReactDOM$1;
  ReactDropdown = ReactDropdown && Object.prototype.hasOwnProperty.call(ReactDropdown, 'default') ? ReactDropdown['default'] : ReactDropdown;

  const jsonURL =
    "https://gist.githubusercontent.com/aulichney/a88271247a71ed20ebc90ee5019d724e/raw/0ff23cefd92f06ec25aebcc93a246d2a8e6179f1/undercustodybinned.json";

  // helper function; clean the data
  function cleanData(row) {
    return {
      sex: row.sex,
      raceEthnicity: row.raceEthnicity,
      // timeServed: Number(row.timeServed),
      age_binned: row.ageBinned,
  		timeServedBinned: row.timeServedBinned,
      age: Number(row.age)
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
        // console.log(action)

        if (action == "height"){
          const new_data = barData.slice().sort((a,b) => d3.ascending(b.value[yAttribute], a.value[yAttribute]));
          change_data(new_data, duration);
          sort_status = 'height';
        } else if (action == 'x') {
          // if the str is a number, compare the number, not the strings. If we can process the 
          // data so that the key remains numeric data type in the transform function, we don't need this step       
          if (barData[0].key.match("\\d+")) {
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


    let row1 = [];
    let rows = [];

    //Fill first row with table headings
    for (var i = 0; i < 1; i++){
        let rowID = `row${i}`;
        let cell = [];
        for (var idx = 0; idx < 1; idx++){
          let cellID = `cell${i}-${idx}`;
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, toTitle(xAttribute)));
        }
       if(yAttribute == 'amount'){
          for (var idx = 1; idx < 2; idx++){
          let cellID = `cell${i}-${idx}`;
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, "Population"));
         }
        }else {
          for (var idx = 1; idx < 2; idx++){
          let cellID = `cell${i}-${idx}`;
          cell.push(React.createElement( 'td', { key: cellID, id: cellID }, "Years"));
        	}
        }
      	if(yAttribute == 'amount'){
          for (var idx = 2; idx < 3; idx++){
          	let cellID = `cell${i}-${idx}`;
          	cell.push(React.createElement( 'td', { key: cellID, id: cellID }, "Percent"));
        	}
        }
        row1.push(React.createElement( 'tr', { key: i, id: rowID }, cell));
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
      	if(yAttribute == 'amount'){
          for (var idx = 2; idx < 3; idx++){
            let cellID = `cell${i}-${idx}`;
            let entry = pct[i-1].toFixed(2);
            cell.push(React.createElement( 'td', { key: cellID, id: cellID }, entry, "%"));
          }
        }
        rows.push(React.createElement( 'tr', { key: i, id: rowID }, cell));
      }


    //create table element with rows
    const tableElement = (
              React.createElement( 'table', { id: "summary-table" },
                React.createElement( 'thead', null,
                   row1
                 ),
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

  const Chart = ( {rawData} ) => {
    
    // create React hooks for controlling the grouped data we want to generate; also, setup the initial value 
    const [xAttribute, setXAttribute] = React$1.useState('sex');
    const [yAttribute, setYAttribute] = React$1.useState('amount');
    
    // according to the current xAttr ibute, group by that attribute and compute the number of observations and the average age
    const barData = transformData(rawData, xAttribute);
    
    console.log(barData);

    // map each column to { value: col, label: col } to feed into react Dropdown menu 
    const xFields = Object.keys(rawData[0]).map(d => ({"value":d, "label":d}));
    
    console.log(xFields);

    const yFields = Object.keys(barData[0].value).map(d => ({"value":d, "label":d}));

    // return the title, the dropdown menus, and the barplot with axes  
  	return(
      React.createElement( React.Fragment, null,
        React.createElement( 'header', null,
        React.createElement( 'div', { id: "logo" },
              React.createElement( 'img', { src: "https://static1.squarespace.com/static/5b2c07e2a9e02851fb387477/t/5c421dc203ce64393d395bb8/1616181909405/?format=1500w" })
        ),
        React.createElement( 'h1', null, " NYDOCCS Under Custody Data " )
  			),
        
        React.createElement( 'h1', { ref: d => SVG(d) }, " "),
  			
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInVzZURhdGEuanMiLCJiYXIuanMiLCJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuXG5jb25zdCBqc29uVVJMID1cbiAgXCJodHRwczovL2dpc3QuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2F1bGljaG5leS9hODgyNzEyNDdhNzFlZDIwZWJjOTBlZTUwMTlkNzI0ZS9yYXcvMGZmMjNjZWZkOTJmMDZlYzI1YWViY2M5M2EyNDZkMmE4ZTYxNzlmMS91bmRlcmN1c3RvZHliaW5uZWQuanNvblwiO1xuXG4vLyBoZWxwZXIgZnVuY3Rpb247IGNsZWFuIHRoZSBkYXRhXG5mdW5jdGlvbiBjbGVhbkRhdGEocm93KSB7XG4gIHJldHVybiB7XG4gICAgc2V4OiByb3cuc2V4LFxuICAgIHJhY2VFdGhuaWNpdHk6IHJvdy5yYWNlRXRobmljaXR5LFxuICAgIC8vIHRpbWVTZXJ2ZWQ6IE51bWJlcihyb3cudGltZVNlcnZlZCksXG4gICAgYWdlX2Jpbm5lZDogcm93LmFnZUJpbm5lZCxcblx0XHR0aW1lU2VydmVkQmlubmVkOiByb3cudGltZVNlcnZlZEJpbm5lZCxcbiAgICBhZ2U6IE51bWJlcihyb3cuYWdlKVxuICB9O1xufVxuXG4vLyBHaXZlbiB0aGUgSlNPTiBkYXRhIGFuZCBhIHNwZWNpZmllZCBjb2x1bW4gbmFtZSxcbi8vIGdyb3VwIGJ5IHRoZSBjb2x1bW4sIGNvbXB1dGUgdGhlIHZhbHVlIGNvdW50cyBhbmQgdGhlIGF2ZXJhZ2UgYWdlXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtRGF0YShkYXRhLCBjb2wpIHtcbiAgbGV0IHRyYW5zZm9ybWVkID0gZDNcbiAgICAubmVzdCgpXG4gICAgLmtleSgoZCkgPT4gZFtjb2xdKVxuICAgIC5yb2xsdXAoKGQpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFtb3VudDogZC5sZW5ndGgsXG4gICAgICAgIGFnZUF2ZzogZDMubWVhbihkLm1hcCgoY29ycmVzcG9uZGVudCkgPT4gY29ycmVzcG9uZGVudC5hZ2UpKSxcbiAgICAgICAgYXZnVGltZVNlcnZlZDogZDMubWVhbihkLm1hcChmdW5jdGlvbiAoY29ycmVzcG9uZGVudCkge3JldHVybiBjb3JyZXNwb25kZW50LnRpbWVTZXJ2ZWQ7IH0pKVxuICAgICAgfTtcbiAgICB9KVxuICAgIC5lbnRyaWVzKGRhdGEpO1xuICByZXR1cm4gdHJhbnNmb3JtZWQ7XG59XG5cblxuXG4vLyBtYWluIGZ1bmN0aW9uOyByZXRyaWV2ZSB0aGUgZGF0YSBmcm9tIHRoZSBKU09OIGZpbGVcbmV4cG9ydCBjb25zdCB1c2VKU09OID0gKCkgPT4ge1xuICBjb25zdCBbZGF0YSwgc2V0RGF0YV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBkMy5qc29uKGpzb25VUkwpIC8vIHJldHJpZXZlIGRhdGEgZnJvbSB0aGUgZ2l2ZW4gVVJMXG4gICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAvL3doZW4gZGF0YSBpcyByZXRyaWV2ZWQsIGRvIHRoZSBmb2xsb3dpbmdcbiAgICAgICAgZGF0YSA9IGRhdGEubWFwKGNsZWFuRGF0YSk7IC8vIG1hcCBlYWNoIHJvdyB0byB0aGUgY2xlYW5EYXRhIGZ1bmN0aW9uIHRvIHJldHJpZXZlIHRoZSBkZXNpcmVkIGNvbHVtbnNcbiAgICAgICAgc2V0RGF0YShkYXRhKTtcbiAgICAgICAgLy8gdXNlIHRoZSByZWFjdCBob29rIHRvIHNldCB0aGUgZGF0YVxuICAgICAgfSk7XG4gIH0sIFtdKTtcbiAgcmV0dXJuIGRhdGE7XG59O1xuIiwiaW1wb3J0IFJlYWN0RHJvcGRvd24gZnJvbSAncmVhY3QtZHJvcGRvd24nO1xuXG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBzZWxlY3QsIGF4aXNCb3R0b20sIGF4aXNMZWZ0IH0gZnJvbSBcImQzXCI7XG5pbXBvcnQgeyB0cmFuc2Zvcm1EYXRhIH0gZnJvbSBcIi4vdXNlRGF0YVwiO1xuXG5cbi8vIGJhciBjb25zdGFudHMgXG5jb25zdCBXSURUSCA9IDYwMDtcbmNvbnN0IEhFSUdIVD0gNDAwO1xuY29uc3QgbWFyZ2luPXt0b3A6IDI1LCByaWdodDogMjUsIGJvdHRvbTogNTAsIGxlZnQ6IDgwfTtcbmNvbnN0IGlubmVyV2lkdGggPSBXSURUSCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0O1xuY29uc3QgaW5uZXJIZWlnaHQgPSBIRUlHSFQgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcblxuLy9UaXRsZSBjYXNlIGZ1bmN0aW9uIGZvciBheGlzIHRpdGxlIGZvcm1hdHRpbmdcbmZ1bmN0aW9uIHRvVGl0bGUoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cblxuLy9zb3J0IGNvbnN0YW50LCAnbm9uZSc7ICdoZWlnaHQnOiBzb3J0IGJ5IGhlaWdodCBkZXNjZW5kYW50OyAneCc6IHNvcnQgYnkgeCB2YWx1ZVxubGV0IHNvcnRfc3RhdHVzID0gJ25vbmUnOyBcbmNvbnN0IFNPUlRfRFVSQVRJT04gPSA1MDA7XG5cbi8vIGNyZWF0ZSB0aGUgc3ZnIG9iamVjdCBcbmNvbnN0IFNWRyA9IChyZWYpID0+IHtcbiAgLy8gdGhlIHRlbXBvcmFyeSBzb2x1dGlvbiBpcyB0aGlzLCBwcmV2ZW50IHJlYWN0IGZyb20gYXBwZW5kaW5nIHN2Z3MgaW5kZWZpbml0ZWx5XG4gIFx0aWYgKGQzLnNlbGVjdEFsbChcInN2Z1wiKS5lbXB0eSgpKSB7XG4gICAgICBkMy5zZWxlY3QocmVmKVxuICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgV0lEVEgpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIEhFSUdIVClcbiAgICB9XG59XG5cblxuY29uc3QgQmFyID0gKHJlZl9yYWRpbywgYmFyRGF0YSwgeUF0dHJpYnV0ZSwgeEF0dHJpYnV0ZSkgPT4ge1xuXG5cdFx0Y29uc3QgYmFyQWRqdXN0ID0gNSAvIGJhckRhdGEubGVuZ3RoIC8vIGZvciBhZGp1c3RpbmcgdGhlIHdpZHRoIG9mIGJhcnNcbiAgICBjb25zdCBzdmcgPSBkMy5zZWxlY3QoXCJzdmdcIilcbiAgICAvLyByZW1vdmUgZXZlcnl0aGluZyBmcm9tIHN2ZyBhbmQgcmVyZW5kZXIgb2JqZWN0c1xuICAgIHN2Zy5zZWxlY3RBbGwoXCIqXCIpLnJlbW92ZSgpOyAgXG5cbiAgICBjb25zdCB4U2NhbGUgPSBkMy5zY2FsZUJhbmQoKVxuICAgICAgICAgICAgICAgLmRvbWFpbihiYXJEYXRhLm1hcChkID0+IGQua2V5KSlcbiAgICAgICAgICAgICAgIC5yYW5nZShbMCwgaW5uZXJXaWR0aF0pXG4gICAgICAgICAgICAgICAucGFkZGluZ0lubmVyKFsuMl0pO1xuICAgIGNvbnN0IHlTY2FsZSA9IGQzLnNjYWxlTGluZWFyKClcbiAgICAgICAgICAgICAgICAgICAuZG9tYWluKFswLCBkMy5tYXgoIGJhckRhdGEubWFwKGQgPT4gZC52YWx1ZVt5QXR0cmlidXRlXSkgKV0gKVxuICAgICAgICAgICAgICAgICAgIC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKS5uaWNlKCk7XG5cdFx0XG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIGRyYXcgaW5pdGlhbCBiYXJzXG4gICAgY29uc3QgYmFycyA9IHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGB0cmFuc2xhdGUgKCR7bWFyZ2luLmxlZnR9LCAke21hcmdpbi50b3B9KWApXG4gICAgICAgICAgICAgICAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcbiAgICAgICAgICAgICAgICAgICAgICAuZGF0YShiYXJEYXRhLCBkID0+IGQua2V5KTtcbiAgICBiYXJzLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgLmF0dHIoXCJ4XCIsIChkLCBpKSA9PiB4U2NhbGUoZC5rZXkpK2JhckFkanVzdClcbiAgICAgIC5hdHRyKFwieVwiLCBkID0+IHlTY2FsZShkLnZhbHVlW3lBdHRyaWJ1dGVdKSlcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgeFNjYWxlLmJhbmR3aWR0aCgpLWJhckFkanVzdCoyKVxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgZCA9PiBpbm5lckhlaWdodCAtIHlTY2FsZShkLnZhbHVlW3lBdHRyaWJ1dGVdKSlcbiAgICAgIC5zdHlsZSgnb3BhY2l0eScsIDAuNylcbiAgXHRcdC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgICAgICB0b29sdGlwXG4gICAgICAgICAgICAuaHRtbChcbiAgICAgICAgICAgICAgYDxkaXY+JHt0b1RpdGxlKHhBdHRyaWJ1dGUpfTogJHtkLmtleX08L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj4ke3RvVGl0bGUoeUF0dHJpYnV0ZSl9OiAke2QudmFsdWVbeUF0dHJpYnV0ZV0udG9GaXhlZCgyKX08L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj5QZXJjZW50OiAkeyhkLnZhbHVlW3lBdHRyaWJ1dGVdL3RvdGFsUG9wKjEwMCkudG9GaXhlZCgyKX0lPC9kaXY+YFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLnN0eWxlKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcbiAgICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuICAgICAgfSlcbiAgXHRcdC5vbignbW91c2Vtb3ZlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAgIC5zdHlsZSgndG9wJywgZDMuZXZlbnQucGFnZVkgLSAxMCArICdweCcpXG4gICAgICAgICAgICAuc3R5bGUoJ2xlZnQnLCBkMy5ldmVudC5wYWdlWCArIDEwICsgJ3B4Jyk7XG4gICAgICB9KVxuICBcdFx0Lm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0b29sdGlwLmh0bWwoYGApLnN0eWxlKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcIm9wYWNpdHlcIiwgMC43KTtcbiAgICAgIH0pO1xuICBcbiAgXHRcbiAgICAvL21vdWVvdmVyIHRvb2x0aXBcbiAgICBjb25zdCB0b3RhbFBvcCA9IGQzLnN1bShiYXJEYXRhLm1hcCgoZCkgPT4gZC52YWx1ZVt5QXR0cmlidXRlXSkpOyAvL2NvdW50cyBudW1iZXIgb2YgaW5kaXZpZHVhbHMgaW4gY3VzdG9keVxuICAgIGNvbnN0IHRvb2x0aXAgPSBkM1xuICAgICAgICAgICAgICAgICAgICAuc2VsZWN0KCdib2R5JylcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2QzLXRvb2x0aXAnKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJylcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKCd6LWluZGV4JywgJzEwJylcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZSgncGFkZGluZycsICcxMHB4JylcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgJ3JnYmEoMCwwLDAsMC42KScpXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZSgnYm9yZGVyLXJhZGl1cycsICc0cHgnKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoJ2NvbG9yJywgJyNmZmYnKVxuICAgICAgICAgICAgICAgICAgICAudGV4dCgnYSBzaW1wbGUgdG9vbHRpcCcpO1xuICBcbiAgXG4gIFxuICBcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBkcmF3IGF4ZXNcblxuXG4gICAgY29uc3QgeEF4aXMgPSBkMy5heGlzQm90dG9tKCkuc2NhbGUoeFNjYWxlKTtcbiAgICBjb25zdCB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeVNjYWxlKTtcblxuICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxuICBcdFx0LmF0dHIoXCJpZFwiLCBcInhBeGlzXCIpXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBgdHJhbnNsYXRlICgke21hcmdpbi5sZWZ0fSwgJHtIRUlHSFQgLSBtYXJnaW4uYm90dG9tfSlgKVxuICAgICAgLmNhbGwoeEF4aXMpO1xuICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxuICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgYHRyYW5zbGF0ZSAoJHttYXJnaW4ubGVmdH0sICR7bWFyZ2luLnRvcH0pYClcbiAgICAgIC5jYWxsKHlBeGlzKTtcbiAgXHRcbiAgXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy9BeGlzIGxhYmVsc1xuICAgIHN2Z1xuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzLWxhYmVsXCIpXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgICAuYXR0cihcInlcIiwgMClcbiAgICAgIC5hdHRyKFwieFwiLCAwIC0gSEVJR0hULzIpXG4gICAgICAuYXR0cihcImR5XCIsIFwiMWVtXCIpXG4gICAgICAudGV4dCh0b1RpdGxlKHlBdHRyaWJ1dGUpKTtcbiAgICBzdmdcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYXhpcy1sYWJlbCcpXG4gICAgICAuYXR0cihcInlcIiwgSEVJR0hUIC0gbWFyZ2luLmJvdHRvbSlcbiAgICAgIC5hdHRyKFwieFwiLCAwICsgV0lEVEgvMilcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIxLjVlbVwiKVxuICAgICAgLnRleHQodG9UaXRsZSh4QXR0cmlidXRlKSk7XG4gIFx0XG4gXHQgXHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFx0Ly8gc29ydGluZyBcbiAgXHQvLyByYWRpbyBidXR0b24gY2FsbHMgc29ydCBmdW5jdGlvbiBvbiBjbGljayBcbiAgXHRkMy5zZWxlY3QocmVmX3JhZGlvKVxuICAgIC5zZWxlY3RBbGwoXCJpbnB1dFwiKVxuICAgIC5vbihcImNsaWNrXCIsIHNvcnQpXG5cdFx0XG4gICAgLy8gc29ydCB3aGVuIGNoYW5naW5nIGRyb3Bkb3duIG1lbnUgZ2l2ZW4gdGhlIHNvcnRlZCBidXR0b24gaXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgIHNvcnQoc29ydF9zdGF0dXMpXG4gIFx0XG5cbiAgICBmdW5jdGlvbiBjaGFuZ2VfZGF0YShuZXdfZGF0YSwgZHVyYXRpb24sIGRlbGF5PTApIHtcbiAgICAgIC8vY2hhbmdlIHRoZSBheGlzIGdlbmVyYXRvclxuICAgICAgeFNjYWxlLmRvbWFpbihuZXdfZGF0YS5tYXAoZCA9PiBkLmtleSkpO1xuICAgICAgc3ZnLnNlbGVjdChcIiN4QXhpc1wiKVxuICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbihkdXJhdGlvbikuZWFzZShkMy5lYXNlTGluZWFyKVxuICAgICAgLmNhbGwoeEF4aXMpO1xuXG4gICAgICAvLyBjaGFuZ2UgYmFyc1xuICAgICAgY29uc3QgYmFycyA9IHN2Zy5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEobmV3X2RhdGEsIGQgPT4gZC5rZXkpXG4gICAgICBiYXJzLnRyYW5zaXRpb24oKS5kZWxheShkZWxheSkuZHVyYXRpb24oZHVyYXRpb24pLmVhc2UoZDMuZWFzZUxpbmVhcilcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCwgaSkgPT4geFNjYWxlKGQua2V5KStiYXJBZGp1c3QpXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZCA9PiB5U2NhbGUoZC52YWx1ZVt5QXR0cmlidXRlXSkpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHhTY2FsZS5iYW5kd2lkdGgoKS1iYXJBZGp1c3QqMilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGQgPT4gaW5uZXJIZWlnaHQgLSB5U2NhbGUoZC52YWx1ZVt5QXR0cmlidXRlXSkpXG4gICAgfTtcbiAgXG4gICAgLy8gYXJndW1lbnQgaXMgb3B0aW9uYWwsIHVzZWQgd2hlbiBjaGFuZ2luZyBkcm9wZG93biBtZW51IGdpdmVuIHRoZSBzb3J0ZWQgYnV0dG9uIGlzIGFscmVhZHkgc2VsZWN0ZWRcbiAgICBmdW5jdGlvbiBzb3J0KGFyZykgeyAgIFxuXG4gICAgICBpZiAodHlwZW9mIGFyZyA9PSAnc3RyaW5nJykgeyAvLyB3aGVuIGNoYW5naW5nIGRyb3Bkb3duIG1lbnUgZ2l2ZW4gdGhlIHNvcnRlZCBidXR0b24gaXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgICAgICB2YXIgYWN0aW9uID0gYXJnXG4gICAgICAgIHZhciBkdXJhdGlvbiA9IDBcbiAgICAgIH0gZWxzZSB7IC8vIHdoZW4gbm8gYXJndW1lbnQgaXMgcGFzc2VkIGludG8gc29ydCwgZ2V0IHZhbHVlIGZyb20gdGhlIHJhZGlvIGJ1dHRvbiBcbiAgICAgICAgdmFyIGFjdGlvbiA9IGQzLnNlbGVjdCh0aGlzKS5ub2RlKCkudmFsdWU7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IFNPUlRfRFVSQVRJT047ICBcbiAgICAgIH1cbiAgICAgIC8vIGNvbnNvbGUubG9nKGFjdGlvbilcblxuICAgICAgaWYgKGFjdGlvbiA9PSBcImhlaWdodFwiKXtcbiAgICAgICAgY29uc3QgbmV3X2RhdGEgPSBiYXJEYXRhLnNsaWNlKCkuc29ydCgoYSxiKSA9PiBkMy5hc2NlbmRpbmcoYi52YWx1ZVt5QXR0cmlidXRlXSwgYS52YWx1ZVt5QXR0cmlidXRlXSkpO1xuICAgICAgICBjaGFuZ2VfZGF0YShuZXdfZGF0YSwgZHVyYXRpb24pO1xuICAgICAgICBzb3J0X3N0YXR1cyA9ICdoZWlnaHQnO1xuICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT0gJ3gnKSB7XG4gICAgICAgIC8vIGlmIHRoZSBzdHIgaXMgYSBudW1iZXIsIGNvbXBhcmUgdGhlIG51bWJlciwgbm90IHRoZSBzdHJpbmdzLiBJZiB3ZSBjYW4gcHJvY2VzcyB0aGUgXG4gICAgICAgIC8vIGRhdGEgc28gdGhhdCB0aGUga2V5IHJlbWFpbnMgbnVtZXJpYyBkYXRhIHR5cGUgaW4gdGhlIHRyYW5zZm9ybSBmdW5jdGlvbiwgd2UgZG9uJ3QgbmVlZCB0aGlzIHN0ZXAgICAgICAgXG4gICAgICAgIGlmIChiYXJEYXRhWzBdLmtleS5tYXRjaChcIlxcXFxkK1wiKSkge1xuICAgICAgICAgIHZhciBuZXdfZGF0YSA9IGJhckRhdGEuc2xpY2UoKS5zb3J0KChhLGIpID0+IGQzLmFzY2VuZGluZyhwYXJzZUludChhLmtleSksIHBhcnNlSW50KGIua2V5KSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBuZXdfZGF0YSA9IGJhckRhdGEuc2xpY2UoKS5zb3J0KChhLGIpID0+IGQzLmFzY2VuZGluZyhhLmtleSwgYi5rZXkpKTtcbiAgICAgICAgfVxuICAgICAgICBjaGFuZ2VfZGF0YShuZXdfZGF0YSwgZHVyYXRpb24pXG4gICAgICAgIHNvcnRfc3RhdHVzID0gJ3gnO1xuICAgICAgfSAgXG4gICAgfTtcbiAgXG59O1xuXG4vL1RhYmxlXG5jb25zdCBUYWJsZSA9ICh7IGJhckRhdGEsIHlBdHRyaWJ1dGUsIHhBdHRyaWJ1dGV9KSA9PiB7XG4gIGNvbnN0IHhTY2FsZSA9IGQzXG4gICAgLnNjYWxlQmFuZCgpXG4gICAgLmRvbWFpbihiYXJEYXRhLm1hcCgoZCkgPT4gZC5rZXkpKVxuICAgIC5yYW5nZShbMCwgaW5uZXJXaWR0aF0pXG4gICAgLnBhZGRpbmdJbm5lcihbMC4yXSk7XG5cbiAgY29uc3QgeVNjYWxlID0gZDNcbiAgICAuc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oWzAsIGQzLm1heChiYXJEYXRhLm1hcCgoZCkgPT4gZC52YWx1ZVt5QXR0cmlidXRlXSkpXSlcbiAgICAucmFuZ2UoW2lubmVySGVpZ2h0LCAwXSk7XG5cbiAgLy9jcmVhdGUgYXJyYXlzIG9mIHZhbHVlcyB0aGF0IHdpbGwgZmlsbCB0YWJsZVxuICBjb25zdCBjb3VudCA9IGJhckRhdGEubWFwKChkKSA9PiBkLnZhbHVlW3lBdHRyaWJ1dGVdKTsgLy9jb3VudCBmb3IgZWFjaCBjYXRlZ29yeVxuICBjb25zdCB5VG90YWwgPSBkMy5zdW0oY291bnQpIC8vdG90YWwgbnVtYmVyIGluZGl2aWR1YWxzXG4gIGNvbnN0IHhMZW5ndGggPSB4U2NhbGUuZG9tYWluKCkubGVuZ3RoIC8vbnVtYmVyIG9mIGNhdGVnb3JpZXMgZm9yIHRoZSBnaXZlbm4geCBhdHRyaWJ1dGVcbiAgY29uc3QgcGN0ID0gYmFyRGF0YS5tYXAoKGQpID0+IGQudmFsdWVbeUF0dHJpYnV0ZV0veVRvdGFsICogMTAwKTsgLy9wZXJjZW50IG9mIHRvdGFsIGZvciBlYWNoIGNhdGVnb3J5XG5cblxuICBsZXQgcm93MSA9IFtdO1xuICBsZXQgcm93cyA9IFtdO1xuXG4gIC8vRmlsbCBmaXJzdCByb3cgd2l0aCB0YWJsZSBoZWFkaW5nc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDE7IGkrKyl7XG4gICAgICBsZXQgcm93SUQgPSBgcm93JHtpfWBcbiAgICAgIGxldCBjZWxsID0gW11cbiAgICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IDE7IGlkeCsrKXtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gXG4gICAgICAgIGNlbGwucHVzaCg8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9Pnt0b1RpdGxlKHhBdHRyaWJ1dGUpfTwvdGQ+KVxuICAgICAgfVxuICAgICBpZih5QXR0cmlidXRlID09ICdhbW91bnQnKXtcbiAgICAgICAgZm9yICh2YXIgaWR4ID0gMTsgaWR4IDwgMjsgaWR4Kyspe1xuICAgICAgICBsZXQgY2VsbElEID0gYGNlbGwke2l9LSR7aWR4fWBcbiAgICAgICAgY2VsbC5wdXNoKDx0ZCBrZXk9e2NlbGxJRH0gaWQ9e2NlbGxJRH0+UG9wdWxhdGlvbjwvdGQ+KVxuICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICBmb3IgKHZhciBpZHggPSAxOyBpZHggPCAyOyBpZHgrKyl7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICBjZWxsLnB1c2goPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT5ZZWFyczwvdGQ+KVxuICAgICAgXHR9XG4gICAgICB9XG4gICAgXHRpZih5QXR0cmlidXRlID09ICdhbW91bnQnKXtcbiAgICAgICAgZm9yICh2YXIgaWR4ID0gMjsgaWR4IDwgMzsgaWR4Kyspe1xuICAgICAgICBcdGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICBcdGNlbGwucHVzaCg8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9PlBlcmNlbnQ8L3RkPilcbiAgICAgIFx0fVxuICAgICAgfVxuICAgICAgcm93MS5wdXNoKDx0ciBrZXk9e2l9IGlkPXtyb3dJRH0+e2NlbGx9PC90cj4pXG4gICAgfTtcblxuICAvL0ZpbGwgdGFibGUgYnkgY29sdW1uLiBDb2wgMSBpcyBlYWNoIGNhdGVnb3J5IGZvciB0aGUgZ2l2ZW4geGF0dHJpYnV0ZS4gQ29sIDIgaXMgdGhlIHZhbHVlIGZvciBlYWNoIGNhdGVnb3J5LlxuICAvL0NvbCAzIGlzIHBlcmNlbnQgb2YgdG90YWwgcG9wdWxhdGlvbiBmb3IgZWFjaCBjYXRlZ29yeVxuICBmb3IgKHZhciBpID0gMTsgaSA8IHhMZW5ndGggKyAxOyBpKyspe1xuICAgICAgbGV0IHJvd0lEID0gYHJvdyR7aX1gXG4gICAgICBsZXQgY2VsbCA9IFtdXG4gICAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCAxOyBpZHgrKyl7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICBsZXQgZW50cnkgPSB4U2NhbGUuZG9tYWluKClbaS0xXVxuICAgICAgICBjZWxsLnB1c2goPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT57ZW50cnl9PC90ZD4pXG4gICAgICB9XG4gICAgXHRmb3IgKHZhciBpZHggPSAxOyBpZHggPCAyOyBpZHgrKyl7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICBsZXQgZW50cnkgPSBjb3VudFtpLTFdLnRvRml4ZWQoMClcbiAgICAgICAgY2VsbC5wdXNoKDx0ZCBrZXk9e2NlbGxJRH0gaWQ9e2NlbGxJRH0+e2VudHJ5fTwvdGQ+KVxuICAgICAgfVxuICAgIFx0aWYoeUF0dHJpYnV0ZSA9PSAnYW1vdW50Jyl7XG4gICAgICAgIGZvciAodmFyIGlkeCA9IDI7IGlkeCA8IDM7IGlkeCsrKXtcbiAgICAgICAgICBsZXQgY2VsbElEID0gYGNlbGwke2l9LSR7aWR4fWBcbiAgICAgICAgICBsZXQgZW50cnkgPSBwY3RbaS0xXS50b0ZpeGVkKDIpXG4gICAgICAgICAgY2VsbC5wdXNoKDx0ZCBrZXk9e2NlbGxJRH0gaWQ9e2NlbGxJRH0+e2VudHJ5fSU8L3RkPilcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcm93cy5wdXNoKDx0ciBrZXk9e2l9IGlkPXtyb3dJRH0+e2NlbGx9PC90cj4pXG4gICAgfTtcblxuXG5cbiAgLy9jcmVhdGUgdGFibGUgZWxlbWVudCB3aXRoIHJvd3NcbiAgY29uc3QgdGFibGVFbGVtZW50ID0gKFxuICAgICAgICAgICAgPHRhYmxlIGlkPVwic3VtbWFyeS10YWJsZVwiPlxuICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgIHtyb3cxfVxuICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAge3Jvd3N9XG4gICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICApO1xuXG5cbi8vcmVuZGVyIHRhYmxlXG4gIFJlYWN0RE9NLnJlbmRlcih0YWJsZUVsZW1lbnQsIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0YWJsZScpKTtcbiAgUmVhY3RET00ucmVuZGVyKDxwPlRvdGFsIE51bWJlciBvZiBQZW9wbGUgVW5kZXIgQ3VzdG9keTogMzYwNzI8L3A+LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3VtbWFyeScpKTtcblxuXG5cbiAgcmV0dXJuIDw+PC8+O1xufTtcblxuZXhwb3J0IGNvbnN0IENoYXJ0ID0gKCB7cmF3RGF0YX0gKSA9PiB7XG4gIFxuICAvLyBjcmVhdGUgUmVhY3QgaG9va3MgZm9yIGNvbnRyb2xsaW5nIHRoZSBncm91cGVkIGRhdGEgd2Ugd2FudCB0byBnZW5lcmF0ZTsgYWxzbywgc2V0dXAgdGhlIGluaXRpYWwgdmFsdWUgXG4gIGNvbnN0IFt4QXR0cmlidXRlLCBzZXRYQXR0cmlidXRlXSA9IHVzZVN0YXRlKCdzZXgnKTtcbiAgY29uc3QgW3lBdHRyaWJ1dGUsIHNldFlBdHRyaWJ1dGVdID0gdXNlU3RhdGUoJ2Ftb3VudCcpO1xuICBcbiAgLy8gYWNjb3JkaW5nIHRvIHRoZSBjdXJyZW50IHhBdHRyIGlidXRlLCBncm91cCBieSB0aGF0IGF0dHJpYnV0ZSBhbmQgY29tcHV0ZSB0aGUgbnVtYmVyIG9mIG9ic2VydmF0aW9ucyBhbmQgdGhlIGF2ZXJhZ2UgYWdlXG4gIGNvbnN0IGJhckRhdGEgPSB0cmFuc2Zvcm1EYXRhKHJhd0RhdGEsIHhBdHRyaWJ1dGUpXG4gIFxuICBjb25zb2xlLmxvZyhiYXJEYXRhKVxuXG4gIC8vIG1hcCBlYWNoIGNvbHVtbiB0byB7IHZhbHVlOiBjb2wsIGxhYmVsOiBjb2wgfSB0byBmZWVkIGludG8gcmVhY3QgRHJvcGRvd24gbWVudSBcbiAgY29uc3QgeEZpZWxkcyA9IE9iamVjdC5rZXlzKHJhd0RhdGFbMF0pLm1hcChkID0+ICh7XCJ2YWx1ZVwiOmQsIFwibGFiZWxcIjpkfSkpO1xuICBcbiAgY29uc29sZS5sb2coeEZpZWxkcylcblxuICBjb25zdCB5RmllbGRzID0gT2JqZWN0LmtleXMoYmFyRGF0YVswXS52YWx1ZSkubWFwKGQgPT4gKHtcInZhbHVlXCI6ZCwgXCJsYWJlbFwiOmR9KSk7XG5cbiAgLy8gcmV0dXJuIHRoZSB0aXRsZSwgdGhlIGRyb3Bkb3duIG1lbnVzLCBhbmQgdGhlIGJhcnBsb3Qgd2l0aCBheGVzICBcblx0cmV0dXJuKFxuICAgIDw+XG4gICAgICA8aGVhZGVyPlxuICAgICAgPGRpdiBpZD1cImxvZ29cIj5cbiAgICAgICAgICAgIDxpbWcgc3JjPVwiaHR0cHM6Ly9zdGF0aWMxLnNxdWFyZXNwYWNlLmNvbS9zdGF0aWMvNWIyYzA3ZTJhOWUwMjg1MWZiMzg3NDc3L3QvNWM0MjFkYzIwM2NlNjQzOTNkMzk1YmI4LzE2MTYxODE5MDk0MDUvP2Zvcm1hdD0xNTAwd1wiIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxoMT4gTllET0NDUyBVbmRlciBDdXN0b2R5IERhdGEgPC9oMT5cblx0XHRcdDwvaGVhZGVyPlxuICAgICAgXG4gICAgICA8aDEgcmVmPXtkID0+IFNWRyhkKX0+IDwvaDE+XG5cdFx0XHRcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdtZW51LWNvbnRhaW5lcic+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9XCJkcm9wZG93bi1sYWJlbFwiPlg8L3NwYW4+XG4gICAgICA8UmVhY3REcm9wZG93blxuICAgICAgICBvcHRpb25zPXt4RmllbGRzfVxuICAgICAgICB2YWx1ZT17eEF0dHJpYnV0ZX1cbiAgICAgICAgb25DaGFuZ2U9eyh7dmFsdWUsIGxhYmVsfSkgPT4gc2V0WEF0dHJpYnV0ZSh2YWx1ZSl9XG4gICAgICAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZHJvcGRvd24tbGFiZWxcIj5ZPC9zcGFuPlxuICAgICAgPFJlYWN0RHJvcGRvd25cbiAgICAgICAgb3B0aW9ucz17eUZpZWxkc31cbiAgICAgICAgdmFsdWU9e3lBdHRyaWJ1dGV9XG4gICAgICAgIG9uQ2hhbmdlPXsoe3ZhbHVlLCBsYWJlbH0pID0+IHNldFlBdHRyaWJ1dGUodmFsdWUpfVxuICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgXG5cdFx0XHQ8ZGl2IGlkPSdyYWRpb19zb3J0JyByZWY9e2QgPT4gQmFyKGQsIGJhckRhdGEsIHlBdHRyaWJ1dGUsIHhBdHRyaWJ1dGUpfSBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiY29udHJvbCBjb250cm9sLXJhZGlvXCI+XG4gICAgICAgICAgICBTb3J0IGJ5IEhlaWdodFxuICAgICAgICAgICAgPGlucHV0ICBjbGFzc05hbWU9J3JhZGlvJyB0eXBlPVwicmFkaW9cIiB2YWx1ZT1cImhlaWdodFwiIG5hbWU9XCJzb3J0XCIgLz4gXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbF9pbmRpY2F0b3JcIj48L2Rpdj5cbiAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwiY29udHJvbCBjb250cm9sLXJhZGlvXCI+XG4gICAgICAgICAgICBTb3J0IGJ5IFggVmFsdWUgXG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdyYWRpbycgdHlwZT1cInJhZGlvXCIgdmFsdWU9XCJ4XCIgbmFtZT1cInNvcnRcIiAvPiBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sX2luZGljYXRvclwiPjwvZGl2PlxuICAgICAgICA8L2xhYmVsPlxuICAgIDwvZGl2PlxuICAgICAgXG4gICAgICBcbiAgICA8VGFibGUgYmFyRGF0YT17YmFyRGF0YX0geUF0dHJpYnV0ZT17eUF0dHJpYnV0ZX0geEF0dHJpYnV0ZSA9IHt4QXR0cmlidXRlfS8+XG5cdFx0PC8+XG5cdCk7XG59O1xuXG4iLCJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgUmVhY3RET00gZnJvbSBcInJlYWN0LWRvbVwiO1xuXG5pbXBvcnQgeyB1c2VKU09OIH0gZnJvbSBcIi4vdXNlRGF0YVwiO1xuaW1wb3J0IHsgQ2hhcnQgfSBmcm9tIFwiLi9iYXJcIjtcblxuY29uc3QgQXBwID0gKCkgPT4ge1xuICBjb25zdCByYXdEYXRhID0gdXNlSlNPTigpO1xuXG4gIGlmICghcmF3RGF0YSkge1xuICAgIHJldHVybiA8aDI+TG9hZGluZy4uLjwvaDI+O1xuICB9XG5cbiAgY29uc29sZS5sb2cocmF3RGF0YSk7XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPENoYXJ0IHJhd0RhdGE9e3Jhd0RhdGF9IC8+XG4gICAgPC8+XG4gICk7XG59O1xuXG5jb25zdCByb290RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicm9vdFwiKTtcblJlYWN0RE9NLnJlbmRlcig8QXBwIC8+LCByb290RWxlbWVudCk7Il0sIm5hbWVzIjpbInVzZVN0YXRlIiwidXNlRWZmZWN0IiwiUmVhY3QiLCJSZWFjdERPTSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztFQUVBLE1BQU0sT0FBTztFQUNiLEVBQUUsb0pBQW9KLENBQUM7QUFDdko7RUFDQTtFQUNBLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRTtFQUN4QixFQUFFLE9BQU87RUFDVCxJQUFJLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRztFQUNoQixJQUFJLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYTtFQUNwQztFQUNBLElBQUksVUFBVSxFQUFFLEdBQUcsQ0FBQyxTQUFTO0VBQzdCLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLGdCQUFnQjtFQUN4QyxJQUFJLEdB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