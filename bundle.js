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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbInVzZURhdGEuanMiLCJiYXIuanMiLCJpbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuXG5jb25zdCBqc29uVVJMID1cbiAgXCJodHRwczovL2dpc3QuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2F1bGljaG5leS9kNDU4OWM4NTY1OGYxYTIyNDhiMTQzZGZkNjIwMDViNC9yYXcvM2IxMGVjZDMxMTc1NGYzYzIyMzRkNmM4ODA2MjJkMzNhZDdkMTc2Zi91bmRlcmN1c3RvZHltb2QuanNvblwiO1xuXG4vLyBoZWxwZXIgZnVuY3Rpb247IGNsZWFuIHRoZSBkYXRhXG5mdW5jdGlvbiBjbGVhbkRhdGEocm93KSB7XG4gIHJldHVybiB7XG4gICAgc2V4OiByb3cuc2V4LFxuICAgIGFnZTogTnVtYmVyKHJvdy5hZ2UpLFxuICAgIHJhY2VFdGhuaWNpdHk6IHJvdy5yYWNlRXRobmljaXR5LFxuICAgIHRpbWVTZXJ2ZWQ6IE51bWJlcihyb3cudGltZVNlcnZlZClcbiAgfTtcbn1cblxuLy8gR2l2ZW4gdGhlIEpTT04gZGF0YSBhbmQgYSBzcGVjaWZpZWQgY29sdW1uIG5hbWUsXG4vLyBncm91cCBieSB0aGUgY29sdW1uLCBjb21wdXRlIHRoZSB2YWx1ZSBjb3VudHMgYW5kIHRoZSBhdmVyYWdlIGFnZVxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybURhdGEoZGF0YSwgY29sKSB7XG4gIGxldCB0cmFuc2Zvcm1lZCA9IGQzXG4gICAgLm5lc3QoKVxuICAgIC5rZXkoKGQpID0+IGRbY29sXSlcbiAgICAucm9sbHVwKChkKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbW91bnQ6IGQubGVuZ3RoLFxuICAgICAgICBhZ2VBdmc6IGQzLm1lYW4oZC5tYXAoKGNvcnJlc3BvbmRlbnQpID0+IGNvcnJlc3BvbmRlbnQuYWdlKSksXG4gICAgICAgIGF2Z1RpbWVTZXJ2ZWQ6IGQzLm1lYW4oZC5tYXAoZnVuY3Rpb24gKGNvcnJlc3BvbmRlbnQpIHtyZXR1cm4gY29ycmVzcG9uZGVudC50aW1lU2VydmVkOyB9KSlcbiAgICAgIH07XG4gICAgfSlcbiAgICAuZW50cmllcyhkYXRhKTtcbiAgcmV0dXJuIHRyYW5zZm9ybWVkO1xufVxuXG5cblxuLy8gbWFpbiBmdW5jdGlvbjsgcmV0cmlldmUgdGhlIGRhdGEgZnJvbSB0aGUgSlNPTiBmaWxlXG5leHBvcnQgY29uc3QgdXNlSlNPTiA9ICgpID0+IHtcbiAgY29uc3QgW2RhdGEsIHNldERhdGFdID0gdXNlU3RhdGUobnVsbCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZDMuanNvbihqc29uVVJMKSAvLyByZXRyaWV2ZSBkYXRhIGZyb20gdGhlIGdpdmVuIFVSTFxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgLy93aGVuIGRhdGEgaXMgcmV0cmlldmVkLCBkbyB0aGUgZm9sbG93aW5nXG4gICAgICAgIGRhdGEgPSBkYXRhLm1hcChjbGVhbkRhdGEpOyAvLyBtYXAgZWFjaCByb3cgdG8gdGhlIGNsZWFuRGF0YSBmdW5jdGlvbiB0byByZXRyaWV2ZSB0aGUgZGVzaXJlZCBjb2x1bW5zXG4gICAgICAgIHNldERhdGEoZGF0YSk7XG4gICAgICAgIC8vIHVzZSB0aGUgcmVhY3QgaG9vayB0byBzZXQgdGhlIGRhdGFcbiAgICAgIH0pO1xuICB9LCBbXSk7XG4gIHJldHVybiBkYXRhO1xufTtcbiIsImltcG9ydCBSZWFjdERyb3Bkb3duIGZyb20gJ3JlYWN0LWRyb3Bkb3duJztcblxuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgc2VsZWN0LCBheGlzQm90dG9tLCBheGlzTGVmdCB9IGZyb20gXCJkM1wiO1xuaW1wb3J0IHsgdHJhbnNmb3JtRGF0YSB9IGZyb20gXCIuL3VzZURhdGFcIjtcblxuXG4vLyBiYXIgY29uc3RhbnRzIFxuY29uc3QgV0lEVEggPSA2MDA7XG5jb25zdCBIRUlHSFQ9IDQwMDtcbmNvbnN0IG1hcmdpbj17dG9wOiAyNSwgcmlnaHQ6IDI1LCBib3R0b206IDUwLCBsZWZ0OiA4MH07XG5jb25zdCBpbm5lcldpZHRoID0gV0lEVEggLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodDtcbmNvbnN0IGlubmVySGVpZ2h0ID0gSEVJR0hUIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XG5cbi8vVGl0bGUgY2FzZSBmdW5jdGlvbiBmb3IgYXhpcyB0aXRsZSBmb3JtYXR0aW5nXG5mdW5jdGlvbiB0b1RpdGxlKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpO1xufVxuXG5cbi8vc29ydCBjb25zdGFudCwgJ25vbmUnOyAnaGVpZ2h0Jzogc29ydCBieSBoZWlnaHQgZGVzY2VuZGFudDsgJ3gnOiBzb3J0IGJ5IHggdmFsdWVcbmxldCBzb3J0X3N0YXR1cyA9ICdub25lJzsgXG5jb25zdCBTT1JUX0RVUkFUSU9OID0gNTAwO1xuXG4vLyBkZXRlcm1pbmUgaWYgdGhlIHN0cmluZyByZXByZXNlbnRzIGEgbnVtYmVyXG5mdW5jdGlvbiBpc051bWVyaWMoc3RyKSB7XG4gIGlmICh0eXBlb2Ygc3RyICE9IFwic3RyaW5nXCIpIHJldHVybiBmYWxzZSAvLyB3ZSBvbmx5IHByb2Nlc3Mgc3RyaW5ncyEgIFxuICByZXR1cm4gIWlzTmFOKHN0cikgJiYgLy8gdXNlIHR5cGUgY29lcmNpb24gdG8gcGFyc2UgdGhlIF9lbnRpcmV0eV8gb2YgdGhlIHN0cmluZyAoYHBhcnNlRmxvYXRgIGFsb25lIGRvZXMgbm90IGRvIHRoaXMpLi4uXG4gICAgICAgICAhaXNOYU4ocGFyc2VGbG9hdChzdHIpKSAvLyAuLi5hbmQgZW5zdXJlIHN0cmluZ3Mgb2Ygd2hpdGVzcGFjZSBmYWlsXG59XG5cblxuLy8gY3JlYXRlIHRoZSBzdmcgb2JqZWN0IFxuY29uc3QgU1ZHID0gKHJlZikgPT4ge1xuICAvLyB0aGUgdGVtcG9yYXJ5IHNvbHV0aW9uIGlzIHRoaXMsIHByZXZlbnQgcmVhY3QgZnJvbSBhcHBlbmRpbmcgc3ZncyBpbmRlZmluaXRlbHlcbiAgXHRpZiAoZDMuc2VsZWN0QWxsKFwic3ZnXCIpLmVtcHR5KCkpIHtcbiAgICAgIGQzLnNlbGVjdChyZWYpXG4gICAgICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBXSURUSClcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgSEVJR0hUKVxuICAgIH1cbn1cblxuXG5jb25zdCBCYXIgPSAocmVmX3JhZGlvLCBiYXJEYXRhLCB5QXR0cmlidXRlLCB4QXR0cmlidXRlKSA9PiB7XG5cblx0XHRjb25zdCBiYXJBZGp1c3QgPSA1IC8gYmFyRGF0YS5sZW5ndGggLy8gZm9yIGFkanVzdGluZyB0aGUgd2lkdGggb2YgYmFyc1xuICAgIGNvbnN0IHN2ZyA9IGQzLnNlbGVjdChcInN2Z1wiKVxuICAgIC8vIHJlbW92ZSBldmVyeXRoaW5nIGZyb20gc3ZnIGFuZCByZXJlbmRlciBvYmplY3RzXG4gICAgc3ZnLnNlbGVjdEFsbChcIipcIikucmVtb3ZlKCk7ICBcblxuICAgIGNvbnN0IHhTY2FsZSA9IGQzLnNjYWxlQmFuZCgpXG4gICAgICAgICAgICAgICAuZG9tYWluKGJhckRhdGEubWFwKGQgPT4gZC5rZXkpKVxuICAgICAgICAgICAgICAgLnJhbmdlKFswLCBpbm5lcldpZHRoXSlcbiAgICAgICAgICAgICAgIC5wYWRkaW5nSW5uZXIoWy4yXSk7XG4gICAgY29uc3QgeVNjYWxlID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgICAgICAgICAgICAgICAgIC5kb21haW4oWzAsIGQzLm1heCggYmFyRGF0YS5tYXAoZCA9PiBkLnZhbHVlW3lBdHRyaWJ1dGVdKSApXSApXG4gICAgICAgICAgICAgICAgICAgLnJhbmdlKFtpbm5lckhlaWdodCwgMF0pLm5pY2UoKTtcblx0XHRcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gZHJhdyBpbml0aWFsIGJhcnNcbiAgICBjb25zdCBiYXJzID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgYHRyYW5zbGF0ZSAoJHttYXJnaW4ubGVmdH0sICR7bWFyZ2luLnRvcH0pYClcbiAgICAgICAgICAgICAgICAgICAgICAuc2VsZWN0QWxsKFwicmVjdFwiKVxuICAgICAgICAgICAgICAgICAgICAgIC5kYXRhKGJhckRhdGEsIGQgPT4gZC5rZXkpO1xuICAgIGJhcnMuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAuYXR0cihcInhcIiwgKGQsIGkpID0+IHhTY2FsZShkLmtleSkrYmFyQWRqdXN0KVxuICAgICAgLmF0dHIoXCJ5XCIsIGQgPT4geVNjYWxlKGQudmFsdWVbeUF0dHJpYnV0ZV0pKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB4U2NhbGUuYmFuZHdpZHRoKCktYmFyQWRqdXN0KjIpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBkID0+IGlubmVySGVpZ2h0IC0geVNjYWxlKGQudmFsdWVbeUF0dHJpYnV0ZV0pKVxuICAgICAgLnN0eWxlKCdvcGFjaXR5JywgMC43KVxuICBcdFx0Lm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICAgIHRvb2x0aXBcbiAgICAgICAgICAgIC5odG1sKFxuICAgICAgICAgICAgICBgPGRpdj4ke3RvVGl0bGUoeEF0dHJpYnV0ZSl9OiAke2Qua2V5fTwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2PiR7dG9UaXRsZSh5QXR0cmlidXRlKX06ICR7ZC52YWx1ZVt5QXR0cmlidXRlXS50b0ZpeGVkKDIpfTwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2PlBlcmNlbnQ6ICR7KGQudmFsdWVbeUF0dHJpYnV0ZV0vdG90YWxQb3AqMTAwKS50b0ZpeGVkKDIpfSU8L2Rpdj5gXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuc3R5bGUoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG4gICAgICB9KVxuICBcdFx0Lm9uKCdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdG9vbHRpcFxuICAgICAgICAgICAgLnN0eWxlKCd0b3AnLCBkMy5ldmVudC5wYWdlWSAtIDEwICsgJ3B4JylcbiAgICAgICAgICAgIC5zdHlsZSgnbGVmdCcsIGQzLmV2ZW50LnBhZ2VYICsgMTAgKyAncHgnKTtcbiAgICAgIH0pXG4gIFx0XHQub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRvb2x0aXAuaHRtbChgYCkuc3R5bGUoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG4gICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwib3BhY2l0eVwiLCAwLjcpO1xuICAgICAgfSk7XG4gIFxuICBcdFxuICAgIC8vbW91ZW92ZXIgdG9vbHRpcFxuICAgIGNvbnN0IHRvdGFsUG9wID0gZDMuc3VtKGJhckRhdGEubWFwKChkKSA9PiBkLnZhbHVlW3lBdHRyaWJ1dGVdKSk7IC8vY291bnRzIG51bWJlciBvZiBpbmRpdmlkdWFscyBpbiBjdXN0b2R5XG4gICAgY29uc3QgdG9vbHRpcCA9IGQzXG4gICAgICAgICAgICAgICAgICAgIC5zZWxlY3QoJ2JvZHknKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZDMtdG9vbHRpcCcpXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZSgncG9zaXRpb24nLCAnYWJzb2x1dGUnKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoJ3otaW5kZXgnLCAnMTAnKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJylcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKCdwYWRkaW5nJywgJzEwcHgnKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoJ2JhY2tncm91bmQnLCAncmdiYSgwLDAsMCwwLjYpJylcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKCdib3JkZXItcmFkaXVzJywgJzRweCcpXG4gICAgICAgICAgICAgICAgICAgIC5zdHlsZSgnY29sb3InLCAnI2ZmZicpXG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KCdhIHNpbXBsZSB0b29sdGlwJyk7XG4gIFxuICBcbiAgXG4gIFx0Ly8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIGRyYXcgYXhlc1xuXG5cbiAgICBjb25zdCB4QXhpcyA9IGQzLmF4aXNCb3R0b20oKS5zY2FsZSh4U2NhbGUpO1xuICAgIGNvbnN0IHlBeGlzID0gZDMuYXhpc0xlZnQoKS5zY2FsZSh5U2NhbGUpO1xuXG4gICAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXG4gIFx0XHQuYXR0cihcImlkXCIsIFwieEF4aXNcIilcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGB0cmFuc2xhdGUgKCR7bWFyZ2luLmxlZnR9LCAke0hFSUdIVCAtIG1hcmdpbi5ib3R0b219KWApXG4gICAgICAuY2FsbCh4QXhpcyk7XG4gICAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBgdHJhbnNsYXRlICgke21hcmdpbi5sZWZ0fSwgJHttYXJnaW4udG9wfSlgKVxuICAgICAgLmNhbGwoeUF4aXMpO1xuICBcdFxuICBcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvL0F4aXMgbGFiZWxzXG4gICAgc3ZnXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICBcdFx0LmF0dHIoXCJjbGFzc1wiLCBcImF4aXMtbGFiZWxcIilcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcbiAgICAgIC5hdHRyKFwieVwiLCAwKVxuICAgICAgLmF0dHIoXCJ4XCIsIDAgLSBIRUlHSFQvMilcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIxZW1cIilcbiAgICAgIC50ZXh0KHRvVGl0bGUoeUF0dHJpYnV0ZSkpO1xuICAgIHN2Z1xuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgIC5hdHRyKCdjbGFzcycsICdheGlzLWxhYmVsJylcbiAgICAgIC5hdHRyKFwieVwiLCBIRUlHSFQgLSBtYXJnaW4uYm90dG9tKVxuICAgICAgLmF0dHIoXCJ4XCIsIDAgKyBXSURUSC8yKVxuICAgICAgLmF0dHIoXCJkeVwiLCBcIjEuNWVtXCIpXG4gICAgICAudGV4dCh0b1RpdGxlKHhBdHRyaWJ1dGUpKTtcbiAgXHRcbiBcdCBcdC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXHQvLyBzb3J0aW5nIFxuICBcdC8vIHJhZGlvIGJ1dHRvbiBjYWxscyBzb3J0IGZ1bmN0aW9uIG9uIGNsaWNrIFxuICBcdGQzLnNlbGVjdChyZWZfcmFkaW8pXG4gICAgLnNlbGVjdEFsbChcImlucHV0XCIpXG4gICAgLm9uKFwiY2xpY2tcIiwgc29ydClcblx0XHRcbiAgICAvLyBzb3J0IHdoZW4gY2hhbmdpbmcgZHJvcGRvd24gbWVudSBnaXZlbiB0aGUgc29ydGVkIGJ1dHRvbiBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gICAgc29ydChzb3J0X3N0YXR1cylcbiAgXHRcblxuICAgIGZ1bmN0aW9uIGNoYW5nZV9kYXRhKG5ld19kYXRhLCBkdXJhdGlvbiwgZGVsYXk9MCkge1xuICAgICAgLy9jaGFuZ2UgdGhlIGF4aXMgZ2VuZXJhdG9yXG4gICAgICB4U2NhbGUuZG9tYWluKG5ld19kYXRhLm1hcChkID0+IGQua2V5KSk7XG4gICAgICBzdmcuc2VsZWN0KFwiI3hBeGlzXCIpXG4gICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKGR1cmF0aW9uKS5lYXNlKGQzLmVhc2VMaW5lYXIpXG4gICAgICAuY2FsbCh4QXhpcyk7XG5cbiAgICAgIC8vIGNoYW5nZSBiYXJzXG4gICAgICBjb25zdCBiYXJzID0gc3ZnLnNlbGVjdEFsbChcInJlY3RcIikuZGF0YShuZXdfZGF0YSwgZCA9PiBkLmtleSlcbiAgICAgIGJhcnMudHJhbnNpdGlvbigpLmRlbGF5KGRlbGF5KS5kdXJhdGlvbihkdXJhdGlvbikuZWFzZShkMy5lYXNlTGluZWFyKVxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLCBpKSA9PiB4U2NhbGUoZC5rZXkpK2JhckFkanVzdClcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCBkID0+IHlTY2FsZShkLnZhbHVlW3lBdHRyaWJ1dGVdKSlcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgeFNjYWxlLmJhbmR3aWR0aCgpLWJhckFkanVzdCoyKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgZCA9PiBpbm5lckhlaWdodCAtIHlTY2FsZShkLnZhbHVlW3lBdHRyaWJ1dGVdKSlcbiAgICB9O1xuICBcbiAgICAvLyBhcmd1bWVudCBpcyBvcHRpb25hbCwgdXNlZCB3aGVuIGNoYW5naW5nIGRyb3Bkb3duIG1lbnUgZ2l2ZW4gdGhlIHNvcnRlZCBidXR0b24gaXMgYWxyZWFkeSBzZWxlY3RlZFxuICAgIGZ1bmN0aW9uIHNvcnQoYXJnKSB7ICAgXG5cbiAgICAgIGlmICh0eXBlb2YgYXJnID09ICdzdHJpbmcnKSB7IC8vIHdoZW4gY2hhbmdpbmcgZHJvcGRvd24gbWVudSBnaXZlbiB0aGUgc29ydGVkIGJ1dHRvbiBpcyBhbHJlYWR5IHNlbGVjdGVkXG4gICAgICAgIHZhciBhY3Rpb24gPSBhcmdcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gMFxuICAgICAgfSBlbHNlIHsgLy8gd2hlbiBubyBhcmd1bWVudCBpcyBwYXNzZWQgaW50byBzb3J0LCBnZXQgdmFsdWUgZnJvbSB0aGUgcmFkaW8gYnV0dG9uIFxuICAgICAgICB2YXIgYWN0aW9uID0gZDMuc2VsZWN0KHRoaXMpLm5vZGUoKS52YWx1ZTtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gU09SVF9EVVJBVElPTjsgIFxuICAgICAgfVxuICAgICAgXHRjb25zb2xlLmxvZyhhY3Rpb24pXG5cbiAgICAgIGlmIChhY3Rpb24gPT0gXCJoZWlnaHRcIil7XG4gICAgICAgIGNvbnN0IG5ld19kYXRhID0gYmFyRGF0YS5zbGljZSgpLnNvcnQoKGEsYikgPT4gZDMuYXNjZW5kaW5nKGIudmFsdWVbeUF0dHJpYnV0ZV0sIGEudmFsdWVbeUF0dHJpYnV0ZV0pKTtcbiAgICAgICAgY2hhbmdlX2RhdGEobmV3X2RhdGEsIGR1cmF0aW9uKTtcbiAgICAgICAgc29ydF9zdGF0dXMgPSAnaGVpZ2h0JztcbiAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09ICd4Jykge1xuICAgICAgICAvLyBpZiB0aGUgc3RyIGlzIGEgbnVtYmVyLCBjb21wYXJlIHRoZSBudW1iZXIsIG5vdCB0aGUgc3RyaW5ncy4gSWYgd2UgY2FuIHByb2Nlc3MgdGhlIFxuICAgICAgICAvLyBkYXRhIHNvIHRoYXQgdGhlIGtleSByZW1haW5zIG51bWVyaWMgZGF0YSB0eXBlIGluIHRoZSB0cmFuc2Zvcm0gZnVuY3Rpb24sIHdlIGRvbid0IG5lZWQgdGhpcyBzdGVwICAgICAgIFxuICAgICAgICBpZiAoaXNOdW1lcmljKGJhckRhdGFbMF0ua2V5KSA9PSB0cnVlKSB7XG4gICAgICAgICAgdmFyIG5ld19kYXRhID0gYmFyRGF0YS5zbGljZSgpLnNvcnQoKGEsYikgPT4gZDMuYXNjZW5kaW5nKHBhcnNlSW50KGEua2V5KSwgcGFyc2VJbnQoYi5rZXkpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG5ld19kYXRhID0gYmFyRGF0YS5zbGljZSgpLnNvcnQoKGEsYikgPT4gZDMuYXNjZW5kaW5nKGEua2V5LCBiLmtleSkpO1xuICAgICAgICB9XG4gICAgICAgIGNoYW5nZV9kYXRhKG5ld19kYXRhLCBkdXJhdGlvbilcbiAgICAgICAgc29ydF9zdGF0dXMgPSAneCc7XG4gICAgICB9ICBcbiAgICB9O1xuICBcbn07XG5cbi8vVGFibGVcbmNvbnN0IFRhYmxlID0gKHsgYmFyRGF0YSwgeUF0dHJpYnV0ZSwgeEF0dHJpYnV0ZX0pID0+IHtcbiAgY29uc3QgeFNjYWxlID0gZDNcbiAgICAuc2NhbGVCYW5kKClcbiAgICAuZG9tYWluKGJhckRhdGEubWFwKChkKSA9PiBkLmtleSkpXG4gICAgLnJhbmdlKFswLCBpbm5lcldpZHRoXSlcbiAgICAucGFkZGluZ0lubmVyKFswLjJdKTtcblxuICBjb25zdCB5U2NhbGUgPSBkM1xuICAgIC5zY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihbMCwgZDMubWF4KGJhckRhdGEubWFwKChkKSA9PiBkLnZhbHVlW3lBdHRyaWJ1dGVdKSldKVxuICAgIC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKTtcblxuICAvL2NyZWF0ZSBhcnJheXMgb2YgdmFsdWVzIHRoYXQgd2lsbCBmaWxsIHRhYmxlXG4gIGNvbnN0IGNvdW50ID0gYmFyRGF0YS5tYXAoKGQpID0+IGQudmFsdWVbeUF0dHJpYnV0ZV0pOyAvL2NvdW50IGZvciBlYWNoIGNhdGVnb3J5XG4gIGNvbnN0IHlUb3RhbCA9IGQzLnN1bShjb3VudCkgLy90b3RhbCBudW1iZXIgaW5kaXZpZHVhbHNcbiAgY29uc3QgeExlbmd0aCA9IHhTY2FsZS5kb21haW4oKS5sZW5ndGggLy9udW1iZXIgb2YgY2F0ZWdvcmllcyBmb3IgdGhlIGdpdmVubiB4IGF0dHJpYnV0ZVxuICBjb25zdCBwY3QgPSBiYXJEYXRhLm1hcCgoZCkgPT4gZC52YWx1ZVt5QXR0cmlidXRlXS95VG90YWwgKiAxMDApOyAvL3BlcmNlbnQgb2YgdG90YWwgZm9yIGVhY2ggY2F0ZWdvcnlcblxuXG4gIGxldCByb3cxID0gW107XG4gIGxldCByb3dzID0gW107XG5cbiAgLy9GaWxsIGZpcnN0IHJvdyB3aXRoIHRhYmxlIGhlYWRpbmdzXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMTsgaSsrKXtcbiAgICAgIGxldCByb3dJRCA9IGByb3cke2l9YFxuICAgICAgbGV0IGNlbGwgPSBbXVxuICAgICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgMTsgaWR4Kyspe1xuICAgICAgICBsZXQgY2VsbElEID0gYGNlbGwke2l9LSR7aWR4fWBcbiAgICAgICAgY2VsbC5wdXNoKDx0ZCBrZXk9e2NlbGxJRH0gaWQ9e2NlbGxJRH0+e3RvVGl0bGUoeEF0dHJpYnV0ZSl9PC90ZD4pXG4gICAgICB9XG4gICAgIGlmKHlBdHRyaWJ1dGUgPT0gJ2Ftb3VudCcpe1xuICAgICAgICBmb3IgKHZhciBpZHggPSAxOyBpZHggPCAyOyBpZHgrKyl7XG4gICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICBjZWxsLnB1c2goPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT5Qb3B1bGF0aW9uPC90ZD4pXG4gICAgICAgfVxuICAgICAgfWVsc2V7XG4gICAgICAgIGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IDI7IGlkeCsrKXtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gXG4gICAgICAgIGNlbGwucHVzaCg8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9PlllYXJzPC90ZD4pXG4gICAgICBcdH1cbiAgICAgIH1cbiAgICBcdGlmKHlBdHRyaWJ1dGUgPT0gJ2Ftb3VudCcpe1xuICAgICAgICBmb3IgKHZhciBpZHggPSAyOyBpZHggPCAzOyBpZHgrKyl7XG4gICAgICAgIFx0bGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gXG4gICAgICAgIFx0Y2VsbC5wdXNoKDx0ZCBrZXk9e2NlbGxJRH0gaWQ9e2NlbGxJRH0+UGVyY2VudDwvdGQ+KVxuICAgICAgXHR9XG4gICAgICB9XG4gICAgICByb3cxLnB1c2goPHRyIGtleT17aX0gaWQ9e3Jvd0lEfT57Y2VsbH08L3RyPilcbiAgICB9O1xuXG4gIC8vRmlsbCB0YWJsZSBieSBjb2x1bW4uIENvbCAxIGlzIGVhY2ggY2F0ZWdvcnkgZm9yIHRoZSBnaXZlbiB4YXR0cmlidXRlLiBDb2wgMiBpcyB0aGUgdmFsdWUgZm9yIGVhY2ggY2F0ZWdvcnkuXG4gIC8vQ29sIDMgaXMgcGVyY2VudCBvZiB0b3RhbCBwb3B1bGF0aW9uIGZvciBlYWNoIGNhdGVnb3J5XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgeExlbmd0aCArIDE7IGkrKyl7XG4gICAgICBsZXQgcm93SUQgPSBgcm93JHtpfWBcbiAgICAgIGxldCBjZWxsID0gW11cbiAgICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IDE7IGlkeCsrKXtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gXG4gICAgICAgIGxldCBlbnRyeSA9IHhTY2FsZS5kb21haW4oKVtpLTFdXG4gICAgICAgIGNlbGwucHVzaCg8dGQga2V5PXtjZWxsSUR9IGlkPXtjZWxsSUR9PntlbnRyeX08L3RkPilcbiAgICAgIH1cbiAgICBcdGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IDI7IGlkeCsrKXtcbiAgICAgICAgbGV0IGNlbGxJRCA9IGBjZWxsJHtpfS0ke2lkeH1gXG4gICAgICAgIGxldCBlbnRyeSA9IGNvdW50W2ktMV0udG9GaXhlZCgwKVxuICAgICAgICBjZWxsLnB1c2goPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT57ZW50cnl9PC90ZD4pXG4gICAgICB9XG4gICAgXHRpZih5QXR0cmlidXRlID09ICdhbW91bnQnKXtcbiAgICAgICAgZm9yICh2YXIgaWR4ID0gMjsgaWR4IDwgMzsgaWR4Kyspe1xuICAgICAgICAgIGxldCBjZWxsSUQgPSBgY2VsbCR7aX0tJHtpZHh9YFxuICAgICAgICAgIGxldCBlbnRyeSA9IHBjdFtpLTFdLnRvRml4ZWQoMilcbiAgICAgICAgICBjZWxsLnB1c2goPHRkIGtleT17Y2VsbElEfSBpZD17Y2VsbElEfT57ZW50cnl9JTwvdGQ+KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByb3dzLnB1c2goPHRyIGtleT17aX0gaWQ9e3Jvd0lEfT57Y2VsbH08L3RyPilcbiAgICB9O1xuXG5cblxuICAvL2NyZWF0ZSB0YWJsZSBlbGVtZW50IHdpdGggcm93c1xuICBjb25zdCB0YWJsZUVsZW1lbnQgPSAoXG4gICAgICAgICAgICA8dGFibGUgaWQ9XCJzdW1tYXJ5LXRhYmxlXCI+XG4gICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICAge3JvdzF9XG4gICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICB7cm93c31cbiAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICk7XG5cblxuLy9yZW5kZXIgdGFibGVcbiAgUmVhY3RET00ucmVuZGVyKHRhYmxlRWxlbWVudCwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYmxlJykpO1xuICBSZWFjdERPTS5yZW5kZXIoPHA+VG90YWwgTnVtYmVyIG9mIFBlb3BsZSBVbmRlciBDdXN0b2R5OiAzNjA3MjwvcD4sIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdW1tYXJ5JykpO1xuXG5cblxuICByZXR1cm4gPD48Lz47XG59O1xuXG5leHBvcnQgY29uc3QgQ2hhcnQgPSAoIHtyYXdEYXRhfSApID0+IHtcbiAgXG4gIC8vIGNyZWF0ZSBSZWFjdCBob29rcyBmb3IgY29udHJvbGxpbmcgdGhlIGdyb3VwZWQgZGF0YSB3ZSB3YW50IHRvIGdlbmVyYXRlOyBhbHNvLCBzZXR1cCB0aGUgaW5pdGlhbCB2YWx1ZSBcbiAgY29uc3QgW3hBdHRyaWJ1dGUsIHNldFhBdHRyaWJ1dGVdID0gdXNlU3RhdGUoJ3NleCcpO1xuICBjb25zdCBbeUF0dHJpYnV0ZSwgc2V0WUF0dHJpYnV0ZV0gPSB1c2VTdGF0ZSgnYW1vdW50Jyk7XG4gIFxuICAvLyBhY2NvcmRpbmcgdG8gdGhlIGN1cnJlbnQgeEF0dHIgaWJ1dGUsIGdyb3VwIGJ5IHRoYXQgYXR0cmlidXRlIGFuZCBjb21wdXRlIHRoZSBudW1iZXIgb2Ygb2JzZXJ2YXRpb25zIGFuZCB0aGUgYXZlcmFnZSBhZ2VcbiAgY29uc3QgYmFyRGF0YSA9IHRyYW5zZm9ybURhdGEocmF3RGF0YSwgeEF0dHJpYnV0ZSlcbiAgXG4gIGNvbnNvbGUubG9nKGJhckRhdGEpXG5cbiAgLy8gbWFwIGVhY2ggY29sdW1uIHRvIHsgdmFsdWU6IGNvbCwgbGFiZWw6IGNvbCB9IHRvIGZlZWQgaW50byByZWFjdCBEcm9wZG93biBtZW51IFxuICBjb25zdCB4RmllbGRzID0gT2JqZWN0LmtleXMocmF3RGF0YVswXSkubWFwKGQgPT4gKHtcInZhbHVlXCI6ZCwgXCJsYWJlbFwiOmR9KSk7XG5cbiAgY29uc3QgeUZpZWxkcyA9IE9iamVjdC5rZXlzKGJhckRhdGFbMF0udmFsdWUpLm1hcChkID0+ICh7XCJ2YWx1ZVwiOmQsIFwibGFiZWxcIjpkfSkpO1xuXG4gIC8vIHJldHVybiB0aGUgdGl0bGUsIHRoZSBkcm9wZG93biBtZW51cywgYW5kIHRoZSBiYXJwbG90IHdpdGggYXhlcyAgXG5cdHJldHVybihcbiAgICA8PlxuICAgICAgPGhlYWRlcj5cbiAgICAgIDxkaXYgaWQ9XCJsb2dvXCI+XG4gICAgICAgICAgICA8aW1nIHNyYz1cImh0dHBzOi8vc3RhdGljMS5zcXVhcmVzcGFjZS5jb20vc3RhdGljLzViMmMwN2UyYTllMDI4NTFmYjM4NzQ3Ny90LzVjNDIxZGMyMDNjZTY0MzkzZDM5NWJiOC8xNjE2MTgxOTA5NDA1Lz9mb3JtYXQ9MTUwMHdcIiAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8aDE+IE5ZRE9DQ1MgVW5kZXIgQ3VzdG9keSBEYXRhIDwvaDE+XG5cdFx0XHQ8L2hlYWRlcj5cbiAgICAgIFxuICAgICAgPGgxIHJlZj17ZCA9PiBTVkcoZCl9PiA8L2gxPlxuXHRcdFx0XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbWVudS1jb250YWluZXInPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZHJvcGRvd24tbGFiZWxcIj5YPC9zcGFuPlxuICAgICAgPFJlYWN0RHJvcGRvd25cbiAgICAgICAgb3B0aW9ucz17eEZpZWxkc31cbiAgICAgICAgdmFsdWU9e3hBdHRyaWJ1dGV9XG4gICAgICAgIG9uQ2hhbmdlPXsoe3ZhbHVlLCBsYWJlbH0pID0+IHNldFhBdHRyaWJ1dGUodmFsdWUpfVxuICAgICAgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImRyb3Bkb3duLWxhYmVsXCI+WTwvc3Bhbj5cbiAgICAgIDxSZWFjdERyb3Bkb3duXG4gICAgICAgIG9wdGlvbnM9e3lGaWVsZHN9XG4gICAgICAgIHZhbHVlPXt5QXR0cmlidXRlfVxuICAgICAgICBvbkNoYW5nZT17KHt2YWx1ZSwgbGFiZWx9KSA9PiBzZXRZQXR0cmlidXRlKHZhbHVlKX1cbiAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIFxuXHRcdFx0PGRpdiBpZD0ncmFkaW9fc29ydCcgcmVmPXtkID0+IEJhcihkLCBiYXJEYXRhLCB5QXR0cmlidXRlLCB4QXR0cmlidXRlKX0gY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImNvbnRyb2wgY29udHJvbC1yYWRpb1wiPlxuICAgICAgICAgICAgU29ydCBieSBIZWlnaHRcbiAgICAgICAgICAgIDxpbnB1dCAgY2xhc3NOYW1lPSdyYWRpbycgdHlwZT1cInJhZGlvXCIgdmFsdWU9XCJoZWlnaHRcIiBuYW1lPVwic29ydFwiIC8+IFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xfaW5kaWNhdG9yXCI+PC9kaXY+XG4gICAgICAgIDwvbGFiZWw+XG4gICAgICAgIDxsYWJlbCBjbGFzcz1cImNvbnRyb2wgY29udHJvbC1yYWRpb1wiPlxuICAgICAgICAgICAgU29ydCBieSBYIFZhbHVlIFxuICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0ncmFkaW8nIHR5cGU9XCJyYWRpb1wiIHZhbHVlPVwieFwiIG5hbWU9XCJzb3J0XCIgLz4gXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbF9pbmRpY2F0b3JcIj48L2Rpdj5cbiAgICAgICAgPC9sYWJlbD5cbiAgICA8L2Rpdj5cbiAgICAgIFxuICAgICAgXG4gICAgPFRhYmxlIGJhckRhdGE9e2JhckRhdGF9IHlBdHRyaWJ1dGU9e3lBdHRyaWJ1dGV9IHhBdHRyaWJ1dGUgPSB7eEF0dHJpYnV0ZX0vPlxuXHRcdDwvPlxuXHQpO1xufTtcblxuIiwiaW1wb3J0IFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gXCJyZWFjdC1kb21cIjtcblxuaW1wb3J0IHsgdXNlSlNPTiB9IGZyb20gXCIuL3VzZURhdGFcIjtcbmltcG9ydCB7IENoYXJ0IH0gZnJvbSBcIi4vYmFyXCI7XG5cbmNvbnN0IEFwcCA9ICgpID0+IHtcbiAgY29uc3QgcmF3RGF0YSA9IHVzZUpTT04oKTtcblxuICBpZiAoIXJhd0RhdGEpIHtcbiAgICByZXR1cm4gPGgyPkxvYWRpbmcuLi48L2gyPjtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKHJhd0RhdGEpO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxDaGFydCByYXdEYXRhPXtyYXdEYXRhfSAvPlxuICAgIDwvPlxuICApO1xufTtcblxuY29uc3Qgcm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJvb3RcIik7XG5SZWFjdERPTS5yZW5kZXIoPEFwcCAvPiwgcm9vdEVsZW1lbnQpOyJdLCJuYW1lcyI6WyJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsIlJlYWN0IiwiUmVhY3RET00iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7RUFFQSxNQUFN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