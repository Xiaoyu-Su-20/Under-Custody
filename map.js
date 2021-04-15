import ReactDropdown from 'react-dropdown';

import d3 from 'd3';
import { useState, useEffect } from 'react';
import { useGeoJson } from "./useGeoJson";
import { color_scale } from "./color_scale";

export const Map = ( {data} ) => {
    var dropdown_options = [
    { value: "numIncarcerated",
      text: "Number Incarcerated" },
    { value: "numCrimes",
      text: "Number of Crimes" },
    { value: "population",
      text: "County Population" },
    { value: "incarcerationRate",
      text: "Incarceration Rate" },
    ]

	

  // populate drop-down
  d3.select("#dropdown")
    .selectAll("option")
    .data(dropdown_options)
    .enter()
    .append("option")
    .attr("value", function(option) { return option.value; })
    .text(function(option) { return option.text; });

  // initial dataset on load
  var selected_dataset = "numIncarcerated";

  var w = 1000, h = 800;

  var svg = d3.select("svg")
  var projection = d3.geoMercator()
                     .center([-76.6180827, 39.323953])
                     .scale([4500])
                     .translate([400, 700]);
  
  const tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

  const selectedText = d3.select('#dropdown option:checked').text();

  // first of two scales for linear fill; ref [1]
  var fill_gradient = d3.scaleLinear()
                       .domain(d3.range(0, 1, 1.0 / (color_scale.length - 1)))
                       .range(color_scale);

  // second of two scales for linear fill
  var norm_fill = d3.scaleLinear()
                    .range([0,1]);

  // dropdown dataset selection
  var dropDown = d3.select("#dropdown");

  dropDown.on("change", function() {

      selected_dataset = d3.event.target.value;

      plot.call(updateFill, selected_dataset)
  });


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
                `<div> ${d.properties.name} County </div>
                <div> ${d.properties[selected_dataset]}</div>`
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
            tooltip.html(``).style('visibility', 'hidden');
            d3.select(this).style("opacity", 1);
          });
  
  function updateFill(selection, selected_dataset) { //selected_dataset:variable name

    var d_extent = d3.extent(selection.data(), function(d) {
        return parseFloat(d.properties[selected_dataset]);
    });

    rescaleFill(selection, d_extent);
	}


  function rescaleFill(selection, d_extent) {

      norm_fill.domain(d_extent)

      selection.transition()
               .duration(700)
               .attr("fill", function(d) {
                    var countyVal = parseFloat(d.properties[selected_dataset]);
                    return fill_gradient(norm_fill(countyVal));
               });
  }
  

  
  return(<></>)
}

