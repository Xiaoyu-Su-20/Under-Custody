import { useState, useEffect } from "react";
import { select, axisBottom, axisLeft } from "d3";
import { transformData } from "./useData";
import { Dropdown } from "./Dropdown";

//Title case function for axis title formatting
function toTitle(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// bar constant
const WIDTH = 600;
const HEIGHT = 400;
const margin = { top: 25, right: 25, bottom: 75, left: 75 };
const innerWidth = WIDTH - margin.left - margin.right;
const innerHeight = HEIGHT - margin.top - margin.bottom;
const barAdjust = 5; // for adjusting the width of bars

const Bar = ({ barData, yAttribute, xAttribute}) => {
  const svg = select("svg");

  // remove everything from svg and rerender objects
  svg.selectAll("*").remove();

  // draw axes
  const xScale = d3
    .scaleBand()
    .domain(barData.map((d) => d.key))
    .range([0, innerWidth])
    .paddingInner([0.2]);
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(barData.map((d) => d.value[yAttribute]))])
    .range([innerHeight, 0]);

  const xAxis = axisBottom().scale(xScale);
  const yAxis = axisLeft().scale(yScale);

  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate (${margin.left}, ${HEIGHT - margin.bottom})`)
    .call(xAxis);
  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate (${margin.left}, ${margin.top})`)
    .call(yAxis);

  // draw bars
  const bars = svg
    .append("g")
    .attr("transform", `translate (${margin.left}, ${margin.top})`)
    .selectAll("rect")
    .data(barData, (d) => d.key);
  bars
    .enter()
    .append("rect")
    .attr("x", (d, i) => xScale(d.key) + barAdjust)
    .attr("y", (d) => yScale(d.value[yAttribute]))
    .attr("width", xScale.bandwidth() - barAdjust * 2)
    .attr("height", (d) => innerHeight - yScale(d.value[yAttribute]))
    .style("opacity", 0.7)
    .on("mouseover", function (d) {
      // add mouseover event
      select(this).style("opacity", 1);
    })
    .on("mouseout", function (d) {
      select(this).style("opacity", 0.7);
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

  return <></>; //d3 draws the graph, thus return nothing
};

export const Chart = ({ rawData }) => {
  // create React hooks for controlling the grouped data we want to generate; also, setup the initial value
  const [xAttribute, setXAttribute] = useState("sex");
  const [yAttribute, setYAttribute] = useState("amount");

  // according to the current xAttr ibute, group by that attribute and compute the number of observations and the average age
  const barData = transformData(rawData, xAttribute);

  // map each column to { value: col, label: col } to feed into react Dropdown menu
  const xFields = Object.keys(rawData[0]).map((d) => ({ value: d, label: d }));
  const yFields = Object.keys(barData[0].value).map((d) => ({
    value: d,
    label: d,
  }));

  // return the title, the dropdown menus, and the barplot with axes
  return (
    <>
      <h1> Under Custody Data Visualization with Filters</h1>

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

      <Bar barData={barData} yAttribute={yAttribute} xAttribute = {xAttribute}/>
    </>
  );
};
