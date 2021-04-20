import { useState, useEffect } from "react";
import { mean, json, nest } from "d3";

const jsonURL = "https://gist.githubusercontent.com/aulichney/60c2c3b62487f2bee1b19e3b6b777daf/raw/48aa22fec79033aeb9a2974a0f9d65e797650110/new%2520counties.json";

export const useGeoJson = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    json(jsonURL) // retrieve data from the given URL
      .then(function (data) {
        //when data is retrieved, do the following
        setData(data);
        // use the react hook to set the data
      });
  }, []);

  return data;
};