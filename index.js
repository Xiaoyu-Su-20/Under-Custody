import React from "react";
import ReactDOM from "react-dom";
import ReactDropdown from 'react-dropdown';
import { useState, useEffect } from 'react';

import { useJSON, transformData } from "./barchart/useData";
import { Chart } from "./barchart/bar";

import { useGeoJson } from "./state_map/useGeoJson";
import { Map } from "./state_map/map";

const App = () => {
  const rawData = useJSON();
  const mapData = useGeoJson();

  // hooks
  const [xAttribute, setXAttribute] = useState('sex'); // barchart x attribute
  const [yAttribute, setYAttribute] = useState('amount'); // barchart y attribute

  const [mapAttribute, setMapAttribute] = useState('numIncarcerated'); // map attribute

  if (!rawData || !mapData) {
    return <h2>Loading...</h2>;
  }

  // the data comes in ----------------------------------------------------------------------------
  // deal with undercustody data ------------------------------------------------------------------
  const barData = transformData(rawData, xAttribute);
  // map each column to { value: col, label: col } to feed into react Dropdown menu
  const xFields = Object.keys(rawData[0]).map((d) => ({
    value: d, label: d
  }));
  const yFields = Object.keys(barData[0].value).map((d) => ({
    value: d, label: d
  }));

  // deal with new york state county data ---------------------------------------------------------
  var mapFields = [
    { value: "numIncarcerated",
      label: "Number Serving Sentence in Facility Within County" },
    { value: "numIncarceratedMale",
      label: "Number Males Serving Sentence in Facility Within County" },
    { value: "numIncarceratedFemale",
      label: "Number Femalese Serving Sentence in Facility Within County" },
    { value: "numCrimeCommitted",
      label: "Number Incarcerated" },
    { value: "numCrimeCommittedMale",
      label: "Number Males Incarcerated" },
    { value: "numCrimeCommittedFemale",
      label: "Number Females Incarcerated" },
    { value: "population",
      label: "County Population" },
    { value: "populationMale",
      label: "County Male Population" },
    { value: "populationFemale",
      label: "County Female Population" },
    { value: "incarcerationRate",
      label: "Incarceration Rate" },
    { value: "incarcerationRateMale",
      label: "Incarceration Rate Male" },
    { value: "incarcerationRateFemale",
      label: "Incarceration Rate Female" },
    { value: "countyHispanic",
      label: "County Hispanic Population" },
    { value: "countyHispanicPct",
      label: "County Hispanic Percent" },
    { value: "countyNHWhite",
      label: "County NH-White Population" },
    { value: "countyNYWhitePct",
      label: "County NH-White Percent" },
    { value: "countyNHBlackPct",
      label: "County NH-Black Percent" },
    { value: "countyNHOther",
      label: "County NH-Other Population" },
    { value: "countyNHOtherPct",
      label: "County NH-Other Percent" },
    { value: "prisonHispanic",
      label: "Prison Hispanic Population" },
    { value: "prisonHispanicPct",
      label: "Prison Hispanic Percent" },
    { value: "prisonNHWhite",
      label: "Prison NHWhite Population" },
    { value: "prisonNHWhitePct",
      label: "Prison NHWhite Percent" },
    { value: "prisonNHBlack",
      label: "Prison NHBlack Population" },
    { value: "prisonNHBlackPct",
      label: "Prison NHBlack Percent" },
    { value: "prisonNHOther",
      label: "Prison NH Other Population" },
    { value: "prisonNHOtherPct",
      label: "Prison NH Other Percent" },
    { value: "incarcerationRateHispanic",
      label: "Incarceration Rate Hispanic" },
    { value: "incarcerationRateNHWhite",
      label: "Incarceration Rate NHWhite" },
    { value: "incarcerationRateNHBlack",
      label: "Incarceration Rate NHBlack" },
    { value: "incarcerationRateNHOther",
      label: "Incarceration Rate NHOther" },
    { value: "pctUnemployed",
      label: "Percent Unemployed Over 16" },
    { value: "pctFoodStamps",
      label: "Percent Used Food Stamps in Last 12 months" },
    { value: "pctPovertyLine",
      label: "Percent Below Poverty Line" },
    { value: "pctHighSchool",
      label: "Percent Over 25 High School Graduate" },
    { value: "pctBachelors",
      label: "Percent Over 25 Bachelors or Higher" },
    ]
  return (
    <>
    <div>
        <div id='barchart_menu' className="menu-container">
          <span className="dropdown-label">X</span>
          <ReactDropdown
            options={xFields}
            value={xAttribute}
            onChange={({ value, label }) =>
              setXAttribute(value)
            }
          />
          <span className="dropdown-label">Y</span>
          <ReactDropdown
            options={yFields}
            value={yAttribute}
            onChange={({ value, label }) =>
              setYAttribute(value)
            }
          />
        </div>
        <Chart
          barData={barData}
          xAttribute={xAttribute}
          yAttribute={yAttribute}
          xFields={xFields}
          totalPopulation={rawData.length} />
    </div>

    <div>
      <h1 id='map'> New York State Map Data</h1>

      <div id='map_menu' className="menu-container">
      <span className="dropdown-label">Select</span>
        <ReactDropdown
            options={mapFields}
            value={mapAttribute}
            onChange={({ value, label }) =>
              setMapAttribute(value)
            }
        />
      </div>
      <Map data={mapData.features} mapAttribute={mapAttribute}/>
    </div>
    </>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
