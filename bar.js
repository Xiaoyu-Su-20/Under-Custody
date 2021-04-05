import ReactDropdown from 'react-dropdown';

import { useState, useEffect } from "react";
import { select, axisBottom, axisLeft } from "d3";
import { transformData } from "./useData";


// bar constants
const WIDTH = 700;
const HEIGHT= 400;
const margin={top: 25, right: 25, bottom: 60, left: 190};
const innerWidth = WIDTH - margin.left - margin.right;
const innerHeight = HEIGHT - margin.top - margin.bottom;

//Styling and format functions:
//Title case function for axis title formatting
function toTitle(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
//Number formatting
function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
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
        .attr("height", HEIGHT)
    }
}


const Bar = (ref_radio, barData, yAttribute, xAttribute, totalPopulation) => {
		const barAdjust = 5 / barData.length // for adjusting the width of bars
    const svg = d3.select("svg")
    // remove everything from svg and rerender objects
    svg.selectAll("*").remove();

    const xScale = d3.scaleBand()
               .domain(barData.map(d => d.key))
               .range([0, innerWidth])
               .paddingInner([.2]);
    const yScale = d3.scaleLinear()
                   .domain([0, d3.max( barData.map(d => d.value[yAttribute]) )] )
                   .range([innerHeight, 0]).nice();


  if(xAttribute == 'age'){
    const lessThan = []
    const greaterThan = []
    for (var i = 0; i < barData.length; i++){
      	var less = []
        var greater = []
        for (var j = 0; j < barData.length; j++){
          if (barData[j].key <= parseInt(barData[i].key)){
            less.push(barData[j].value['amount'])
          }else{
            greater.push(barData[j].value['amount'])
          }
        }
      barData[i].value.younger = d3.sum(less);
      barData[i].value.older = d3.sum(greater);
    }

  }


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
      .style('opacity', 1)
  		.on('mouseover', function (d, i) {
      		if(yAttribute == 'amount' & xAttribute == 'age'){
            tooltip
            .html(
              `<div>${toTitle(xAttribute)}: ${d.key}</div>
              <div>${toTitle(yAttribute)}: ${formatNumber(d.value[yAttribute].toFixed(0))}</div>
              <div>${'Percent'}: ${formatNumber((d.value[yAttribute]/totalPopulation*100).toFixed(2))}%</div>
              <div>There are ${formatNumber(d.value.younger)} people ${d.key} or younger under custody (${formatNumber((d.value.younger/totalPopulation*100).toFixed(1))}%)</div>
              <div>There are ${formatNumber(d.value.older)} people over ${d.key} under custody (${formatNumber((d.value.older/totalPopulation*100).toFixed(1))}%)</div>`

            )
            .style('visibility', 'visible');
          d3.select(this).style("opacity", 0.7);

          }else if(yAttribute == 'amount'){
            tooltip
            .html(
              `<div>${toTitle(xAttribute)}: ${d.key}</div>
              <div>${toTitle(yAttribute)}: ${formatNumber(d.value[yAttribute].toFixed(0))}</div>
              <div>${'Percent'}: ${formatNumber((d.value[yAttribute]/totalPopulation*100).toFixed(2))}%</div>`
            )
            .style('visibility', 'visible');
          d3.select(this).style("opacity", 0.7);
          }else{
            tooltip
            .html(
              `<div>${toTitle(xAttribute)}: ${d.key}</div>
              <div>${toTitle(yAttribute)}: ${formatNumber(d.value[yAttribute].toFixed(0))}</div>
              <div>${'Count'}${d.key}: ${formatNumber(d.value.amount.toFixed(0))}</div>`
            )
            .style('visibility', 'visible');
          d3.select(this).style("opacity", 0.7);
          }
      })
  		.on('mousemove', function () {
          tooltip
            .style('top', d3.event.pageY - 10 + 'px')
            .style('left', d3.event.pageX + 10 + 'px');
      })
  		.on('mouseout', function () {
          tooltip.html(``).style('visibility', 'hidden');
          d3.select(this).style("opacity", 1);
      });


    //moueover tooltip
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
                    .style('color', '#fff');


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
    	.attr('class', 'ylabel')
      .attr('y', 0 + HEIGHT / 2)
      .attr('x', 0 + margin.left / 2)
    	.attr("dx", "-0.95em")
    	.style("text-anchor", "middle")
    	.text(toTitle(yAttribute));
    svg
      .append("text")
      .attr('class', 'axis-label')
      .attr("y", HEIGHT - margin.bottom)
      .attr("x", 0 + WIDTH/2 + margin.left/2)
      .attr("dy", "1.5em")
      .text(toTitle(xAttribute));

 	 	//--------------------------------------------------------------------------------
  	// sorting
  	// radio button calls sort function on click
  	d3.select(ref_radio)
    .selectAll("input")
    .on("click", sort)

    // sort when changing dropdown menu given the sorted button is already selected
    sort(sort_status)


    function change_data(new_data, duration, delay=0) {
      //change the axis generator
      xScale.domain(new_data.map(d => d.key));
      svg.select("#xAxis")
      .transition().duration(duration).ease(d3.easeLinear)
      .call(xAxis);

      // change bars
      const bars = svg.selectAll("rect").data(new_data, d => d.key)
      bars.transition().delay(delay).duration(duration).ease(d3.easeLinear)
            .attr("x", (d, i) => xScale(d.key)+barAdjust)
            .attr("y", d => yScale(d.value[yAttribute]))
            .attr("width", xScale.bandwidth()-barAdjust*2)
            .attr("height", d => innerHeight - yScale(d.value[yAttribute]))
    };

    // argument is optional, used when changing dropdown menu given the sorted button is already selected
    function sort(arg) {

      if (typeof arg == 'string') { // when changing dropdown menu given the sorted button is already selected
        var action = arg
        var duration = 0
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
        change_data(new_data, duration)
        sort_status = 'x';
      }
    };

};

//Table
const Table = ({ barData, yAttribute, xAttribute, totalPopulation}) => {

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
  const yTotal = d3.sum(count) //total number individuals
  const xLength = xScale.domain().length //number of categories for the givenn x attribute
  const pct = barData.map((d) => d.value[yAttribute]/yTotal * 100); //percent of total for each category


  let row1 = [];
  let rows = [];

  //Fill first row with table headings
  for (var i = 0; i < 1; i++){
      let rowID = `row${i}`
      let cell = []
      for (var idx = 0; idx < 1; idx++){
        let cellID = `cell${i}-${idx}`
        cell.push(<td key={cellID} id={cellID}>{toTitle(xAttribute)}</td>)
      }
    	if(yAttribute == 'amount'){
        for (var idx = 1; idx < 2; idx++){
        	let cellID = `cell${i}-${idx}`
        	cell.push(<td key={cellID} id={cellID}>Percent</td>)
      	}
      }
     if(yAttribute == 'amount'){
        for (var idx = 2; idx < 3; idx++){
        	let cellID = `cell${i}-${idx}`
        	cell.push(<td key={cellID} id={cellID}>Population</td>)
       }
      }else{
        for (var idx = 2; idx < 3; idx++){
        	let cellID = `cell${i}-${idx}`
      		cell.push(<td key={cellID} id={cellID}>Years</td>)
      	}
      }
      row1.push(<tr key={i} id={rowID}>{cell}</tr>)
    };

    //Fill table by column. Col 1 is each category for the given xattribute. Col 2 is the value for each category.
    //Col 3 is percent of total population for each category
    for (var i = 1; i < xLength + 1; i++){
        let rowID = `row${i}`
        let cell = []
        for (var idx = 0; idx < 1; idx++){
          let cellID = `cell${i}-${idx}`
          let entry = xScale.domain()[i-1]
          cell.push(<td key={cellID} id={cellID}>{entry}</td>)
        }
      	if(yAttribute == 'amount'){
          for (var idx = 1; idx < 2; idx++){
            let cellID = `cell${i}-${idx}`
            let entry = pct[i-1].toFixed(2)
            cell.push(<td key={cellID} id={cellID}>{entry}%</td>)
          }
        }
      	if(yAttribute == 'amount'){
          	for (var idx = 2; idx < 3; idx++){
            let cellID = `cell${i}-${idx}`
          	let entry = count[i-1].toFixed(0)
          	cell.push(<td key={cellID} id={cellID}>{formatNumber(entry)}</td>)
        	}
        }else{
          	for (var idx = 2; idx < 3; idx++){
          	let cellID = `cell${i}-${idx}`
          	let entry = count[i-1].toFixed(2)
          	cell.push(<td key={cellID} id={cellID}>{formatNumber(entry)}</td>)
        	}
        }

        rows.push(<tr key={i} id={rowID}>{cell}</tr>)
      };



  //create table element with rows
  const tableElement = (
            <table id="summary-table">
              <thead>
                 {row1}
               </thead>
               <tbody>
                 {rows}
               </tbody>
               <caption>Total Number Under Custody: {formatNumber(totalPopulation)}</caption>
             </table>
      );


//render table
  ReactDOM.render(tableElement, document.getElementById('table'));



  return <></>;
};

export const Chart = ( {rawData} ) => {

  // create React hooks for controlling the grouped data we want to generate; also, setup the initial value
  const [xAttribute, setXAttribute] = useState('sex');
  const [yAttribute, setYAttribute] = useState('amount');

  // according to the current xAttr ibute, group by that attribute and compute the number of observations and the average age
  const barData = transformData(rawData, xAttribute)

  //count total entries
  const totalPopulation = rawData.length;

  console.log(barData)

  // map each column to { value: col, label: col } to feed into react Dropdown menu
  const xFields = Object.keys(rawData[0]).map(d => ({"value":d, "label":d}));

  console.log(xFields)

  const yFields = Object.keys(barData[0].value).map(d => ({"value":d, "label":d}));

  // return the title, the dropdown menus, and the barplot with axes
	return(
    <>

      <h1 ref={d => SVG(d)}> </h1>

      <div className='menu-container'>
      <span className="dropdown-label">X</span>
      <ReactDropdown
        options={xFields}
        value={xAttribute}
        onChange={({value, label}) => setXAttribute(value)}
      />
      <span className="dropdown-label">Y</span>
      <ReactDropdown
        options={yFields}
        value={yAttribute}
        onChange={({value, label}) => setYAttribute(value)}
      />
      </div>

			<div id='radio_sort' ref={d => Bar(d, barData, yAttribute, xAttribute, totalPopulation)} class="control-group">
        <label class="control control-radio">
            Sort by Height
            <input  className='radio' type="radio" value="height" name="sort" />
            <div class="control_indicator"></div>
        </label>
        <label class="control control-radio">
            Sort by X Value
            <input className='radio' type="radio" value="x" name="sort" />
            <div class="control_indicator"></div>
        </label>
    </div>


    <Table barData={barData} yAttribute={yAttribute} xAttribute = {xAttribute} totalPopulation = {totalPopulation}/>
		</>
	);
};
