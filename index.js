import React from "react";
import ReactDOM from "react-dom";

import { useJSON } from "./useData";
import { Chart } from "./bar";

import { useGeoJson } from "./useGeoJson";
import { Map } from "./map";

const App = () => {
  const rawData = useJSON();
  
  const mapData = useGeoJson();

  if ((!rawData) || (!mapData)) {
    return <h2>Loading...</h2>;
  }

  console.log(mapData);

  return (
    <>
      <Chart rawData={rawData} />
      <Map data={mapData.features}/>
    </>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);