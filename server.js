'use strict';

// PACKAGES
const pg = require('pg');
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();

const PORT = process.env.PORT || 2134;

const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARK_API_KEY= process.env.PARK_API_KEY;

const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);
client.on('error', error => console.log(error));

const app = express();
app.use(cors());

//MAP ROUTE
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

//WEATHER ROUTE
app.get('/weather', getWeather);

function getWeather(request, response){
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${request.query.search_query}&key=${WEATHER_API_KEY}&units=i&days=8`;
  superagent.get(url)
    .then(weatherResults => {
      const output = weatherResults.body.data.map(weatherDay => {
        return new Weather(weatherDay);
      });
      response.send(output);
    });
}

function Weather (object) {
  this.forecast = object.weather.description;
  this.time = object.datetime;
}

//PARK ROUTE
app.get('/parks', getParks);

function getParks(req, res){
  const url = `https://developer.nps.gov/api/v1/parks?q=${req.query.search_query}&sort=&sort=&api_key=${PARK_API_KEY}`;
  superagent.get(url)
    .then(parkAPI => {
      const parkData = parkAPI.body.data.map(newPark => {
        return new Parks(newPark);
      });
      console.log(parkData);
      // const output = new Parks(parkData);
      res.send(parkData);
    });
}

function Parks (object) {
  this.name = object.fullName;
  this.address = `${object.addresses[0].line1} ${object.addresses[0].city} ${object.addresses[0].stateCode} ${object.addresses[0].postalCode}`;
  this.fee = object.entranceFees[0].cost;
  this.description = object.description;
  this.url = object.url;
}

app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));
