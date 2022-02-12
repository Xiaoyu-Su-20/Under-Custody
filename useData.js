import React, { useState, useEffect } from "react";
import { mean, json, nest } from "d3";

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
    prisonRegion: row.prisonRegion,
    homeRegion: row.homeRegion,
  };
}

// Given the JSON data and a specified column name,
// group by the column, compute the value counts and the average age
export function transformData(data, col) {
  let transformed = nest()
    .key((d) => d[col])
    .rollup((d) => {
      return {
        amount: d.length,
        ageAvg: mean(d.map((correspondent) => correspondent.age)),
        avgTimeServed: mean(
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
export const useJSON = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    json(jsonURL) // retrieve data from the given URL
      .then(function (data) {
        //when data is retrieved, do the following
        data = data.map(cleanData); // map each row to the cleanData function to retrieve the desired columns
        setData(data);
        // use the react hook to set the data
      });
  }, []);
  return data;
};
