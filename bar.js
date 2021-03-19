import { useState, useEffect } from "react";
import { select, axisBottom, axisLeft } from "d3";
import { transformData } from "./useData";
import { Dropdown } from "./Dropdown";


// bar constants
const WIDTH = 500;
const HEIGHT= 300;
const margin={top: 25, right: 25, bottom: 75, left: 75};
const innerWidth = WIDTH - margin.left - margin.right;
const innerHeight = HEIGHT - margin.top - margin.bottom;


//sort constant, 'none'; 'height': sort by height descendant; 'x': sort by x value
let sorted = 'none';
const SORT_DURATION = 500;

//Title case function for axis title formatting
function toTitle(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const Svg = (ref) => {
  // the temporary solution is this, prevent react from appending svgs indefinitely
  	if (d3.selectAll("svg").empty()) {
      d3.select(ref)
        .append("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
    }
}


const Bar = (ref_radio, barData, yAttribute, xAttribute) => {
  	console.log(barData.length)
		const barAdjust = 5 / barData.length // for adjusting the width of bars

    const svg = d3.select("svg")

    // remove everything from svg and rerender objects
    svg.selectAll("*").remove();

    // draw axes
    const xScale = d3.scaleBand()
                   .domain(barData.map(d => d.key))
                   .range([0, innerWidth])
                   .paddingInner([.2]);
    const yScale = d3.scaleLinear()
                   .domain([0, d3.max( barData.map(d => d.value[yAttribute]) )] )
                   .range([innerHeight, 0])

    const xAxis = d3.axisBottom().scale(xScale);
    const yAxis = d3.axisLeft().scale(yScale);
    const totalPop = d3.sum(barData.map((d) => d.value[yAttribute])); //counts number of individuals in custody



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
                    .style('color', '#fff')
                    .text('a simple tooltip');


    svg.append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate (${margin.left}, ${HEIGHT - margin.bottom})`)
      .call(xAxis);
    svg.append("g")
      .attr("class", "yAxis")
      .attr("transform", `translate (${margin.left}, ${margin.top})`)
      .call(yAxis);

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
    .on("click", sort)

    //if sorted=='height'
    if (sorted == 'height') {
    const new_data = barData.slice()
                  .sort((a,b) => d3.ascending(b.value[yAttribute], a.value[yAttribute]));
    change_data(new_data, 0);
    } else if (sorted == 'x') { //if sorted=='x'
    const new_data = barData.slice().sort((a,b) => d3.ascending(a.key, b.key));
    change_data(new_data, 0);
    }


  function change_data(new_data, duration, delay=0) {
    //change the axis generator
    xScale.domain(new_data.map(d => d.key));
    svg.select(".xAxis")
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

  function sort() {
    let action = d3.select(this).node().value

    if (action == "height"){
      const new_data = barData.slice().sort((a,b) => d3.ascending(b.value[yAttribute], a.value[yAttribute]));
      change_data(new_data, SORT_DURATION);
      sorted = 'height';
    } else {
      const new_data = barData.slice().sort((a,b) => d3.ascending(a.key, b.key));
      change_data(new_data, SORT_DURATION);
      sorted = 'x';
    }
  };
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
  const yTotal = d3.sum(count) //total number individuals
  const xLength = xScale.domain().length //number of categories for the givenn x attribute
  const pct = barData.map((d) => d.value[yAttribute]/yTotal * 100); //percent of total for each category


  let rows = [];

  //Fill first row with table headings
  for (var i = 0; i < 1; i++){
      let rowID = `row${i}`
      let cell = []
      for (var idx = 0; idx < 1; idx++){
        let cellID = `cell${i}-${idx}`
        cell.push(<td key={cellID} id={cellID}>{toTitle(xAttribute)}</td>)
      }
   	 for (var idx = 1; idx < 2; idx++){
        let cellID = `cell${i}-${idx}`
        cell.push(<td key={cellID} id={cellID}>Count</td>)
      }
    	for (var idx = 2; idx < 3; idx++){
        let cellID = `cell${i}-${idx}`
        cell.push(<td key={cellID} id={cellID}>Percent</td>)
      }
      rows.push(<tr key={i} id={rowID}>{cell}</tr>)
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
    	for (var idx = 1; idx < 2; idx++){
        let cellID = `cell${i}-${idx}`
        let entry = count[i-1].toFixed(0)
        cell.push(<td key={cellID} id={cellID}>{entry}</td>)
      }
    	for (var idx = 2; idx < 3; idx++){
        let cellID = `cell${i}-${idx}`
        let entry = pct[i-1].toFixed(2)
        cell.push(<td key={cellID} id={cellID}>{entry}%</td>)
      }
      rows.push(<tr key={i} id={rowID}>{cell}</tr>)
    };



  //create table element with rows
  const tableElement = (
            <table id="dynamic-table">
               <tbody>
                 {rows}
               </tbody>
             </table>
      );


//render table
  ReactDOM.render(tableElement, document.getElementById('table'));
  ReactDOM.render(<p>Total Number of People Under Custody: 36072</p>, document.getElementById('summary'));



  return <></>;
};

export const Chart = ( {rawData} ) => {

  // create React hooks for controlling the grouped data we want to generate; also, setup the initial value
  const [xAttribute, setXAttribute] = useState('sex');
  const [yAttribute, setYAttribute] = useState('amount');

  // according to the current xAttr ibute, group by that attribute and compute the number of observations and the average age
  const barData = transformData(rawData, xAttribute)

  // console.log(barData)

  // map each column to { value: col, label: col } to feed into react Dropdown menu
  const xFields = Object.keys(rawData[0]).map(d => ({"value":d, "label":d}));

  const yFields = Object.keys(barData[0].value).map(d => ({"value":d, "label":d}));

  // return the title, the dropdown menus, and the barplot with axes
	return(
    <>
      <h1 ref={d => Svg(d)}> Under Custody Data Visualization with Filters</h1>

      <label for="x-select">X:</label>
      <Dropdown
        options={xFields}
        id="x-select"
        selectedValue={xAttribute}
        onSelectedValueChange={setXAttribute}
      />
      <label for="y-select">Y:</label>
      <Dropdown
        options={yFields}
        id="y-select"
        selectedValue={yAttribute}
        onSelectedValueChange={setYAttribute}
      />


      <div id='radio_sort' ref={d => Bar(d, barData, yAttribute, xAttribute)}>
        <input type="radio" value="height" name="sort" /> Sort by Height
        <input type="radio" value="other" name="sort" /> Sort by X Value
      </div>

      <Table barData={barData} yAttribute={yAttribute} xAttribute = {xAttribute}/>


		</>
	);
};
