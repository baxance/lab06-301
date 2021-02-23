const fileData = require('./data/location.json');
const weatherData = require('./data/weather.json');


const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 2134;

app.get('/location', getRequest);

function getRequest(request, response){
  const output = new Location(fileData, request.query.city);
  response.send(output);
  // const xyz = {search_query: request.query.city, formatted_query: location[0].display_name, latitude: location[0].lat, longitude: location[0].lon};
  // console.log(request.query);
  // response.send(xyz);
}
function Location (fileData, cityName) {
  this.search_query = cityName;
  this.formatted_query = fileData[0].display_name;
  this.latitude = fileData[0].lat;
  this.longitude = fileData[0].lon;
  this.icon = fileData[0].icon;
}

/////////////////////////WEATHER/////////////////////////

app.get('/weather', seaWeather);

const results = [];
function seaWeather(request, response){
  console.log('stuff');
  weatherData.data.forEach(forecast => {
    results.push(new Weather(forecast));
    console.log(results);
  });
  response.send(results);
}

function Weather (day) {
  this.forecast = day.weather.description;
  this.time = day.valid_date;
}

app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));
