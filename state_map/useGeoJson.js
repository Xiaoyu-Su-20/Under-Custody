import { useState, useEffect } from "react";
import { mean, json, nest } from "d3";

const jsonURL = "https://gist.githubusercontent.com/aulichney/e39466ea9781fb262b190fb943003738/raw/0d4fe8b4b2a5efe1784915b08eb53910f7fa9ee4/output.geojson"

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
