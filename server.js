'use strict';

// PACKAGES
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();

const PORT = process.env.PORT || 2134;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const app = express();
app.use(cors());

//APP
app.get('/location', getRequest);

function getRequest(request, response){
  const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${request.query.city}&format=json`;
  superagent.get(url)
    .then(resultsFromAPI => {
      const apiData = resultsFromAPI.body;
      const output = new Location(apiData, request.query.city);
      response.send(output);
    });
}

function Location (fileData, cityName) {
  this.search_query = cityName;
  this.formatted_query = fileData[0].display_name;
  this.latitude = fileData[0].lat;
  this.longitude = fileData[0].lon;
  this.icon = fileData[0].icon;
}

//WEATHER APP
app.get('/weather', getWeather);

function getWeather(request, response){
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${request.query.search_query}&key=${WEATHER_API_KEY}&units=i&days=8`;
  superagent.get(url)
    .then(weatherResults => {
      // console.log(`!!!!!!!!!!!!!!!!!!`, weatherResults.body.data[0]);
      const output = weatherResults.body.data.map(weatherDay => {
        console.log(weatherDay);
        return new Weather(weatherDay);
      });
      // console.log(output[0]);
      // const description = weatherResults.body.data[0].weather.description;
      // const date = weatherResults.body.data[0].datetime;
      // const output = new Weather(description, date);
      response.send(output);
    });
}

function Weather (object) {
  this.forecast = object.weather.description;
  this.time = object.datetime;
}

app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));
