import React, { useState, useEffect } from "react";

const jsonURL =
  "https://gist.githubusercontent.com/aulichney/d4589c85658f1a2248b143dfd62005b4/raw/1b7c1826210517d3baa7c687de2b21e11ccdb1bf/undercustodymod.json";

let output = true;

// helper function; clean the data
function cleanData(row) {
  return {
    sex: row.sex,
    age: Number(row.age),
    race: row.race,
    ethnicity: row.ethnicGroup,
  };
}

// Given the JSON data and a specified column name,
// group by the column, compute the value counts and the average age
export function transformData(data, col) {
  let transformed = d3
    .nest()
    .key((d) => d[col])
    .rollup((d) => {
      return {
        amount: d.length,
        ageAvg: d3.mean(d.map((correspondent) => correspondent.age)),
      };
    })
    .entries(data);
  return transformed;
}

// main function; retrieve the data from the JSON file
export const useJSON = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
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
