'use strict';

//psql -d database -f schema.sql

// PACKAGES
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 2134;
const DATABASE_URL = process.env.DATABASE_URL;

const client = new pg.Client(DATABASE_URL);
client.on('error', error => console.log(error));
client.connect()
  .then(console.log('connected'));

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PARK_API_KEY = process.env.PARK_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;

//MAP ROUTE
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/parks', getParks);
app.get('/yelp', getYelp);
app.get('/movies', getMovies);

function getLocation(req, res){

  const sqlSearch = 'SELECT * FROM city WHERE search_query=$1';
  const sqlSearchArray = [req.query.city];

  client.query(sqlSearch, sqlSearchArray) //searches db for city
    .then(cityDatabase => {
      if(cityDatabase.rowCount > 0){
        res.send(cityDatabase.rows[0]);
      } else {
        const url = 'https://us1.locationiq.com/v1/search.php';

        const queryStringParams = {
          key: process.env.GEOCODE_API_KEY,
          city: req.query.city,
          format: 'json',
          limit: 1
        };

        superagent.get(url, queryStringParams)
          .then(dataFromAPI => {
            const newCity = new Location(dataFromAPI.body[0], req.query.city);
            res.send(newCity);

            const sqlSave = 'INSERT INTO city (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4)';
            const sqlSaveArr = [newCity.search_query, newCity.formatted_query, newCity.latitude, newCity.longitude];

            client.query(sqlSave, sqlSaveArr)
              .then(() => console.log('saved'));
          });
      }
    })
    .catch(err => console.log(err));
}

function Location (fileData, cityName) {
  this.search_query = cityName;
  this.formatted_query = fileData.display_name;
  this.latitude = fileData.lat;
  this.longitude = fileData.lon;
}

//WEATHER ROUTE

function getWeather(req, res){
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${req.query.search_query}&key=${WEATHER_API_KEY}&units=i&days=8`;
  superagent.get(url)
    .then(weatherResults => {
      const output = weatherResults.body.data.map(weatherDay => {
        return new Weather(weatherDay);
      });
      res.send(output);
    });
}

function Weather (object) {
  this.forecast = object.weather.description;
  this.time = object.datetime;
}

//PARK ROUTE

function getParks(req, res){
  const url = `https://developer.nps.gov/api/v1/parks?q=${req.query.search_query}&sort=&sort=&api_key=${PARK_API_KEY}`;
  superagent.get(url)
    .then(parkAPI => {
      const parkData = parkAPI.body.data.map(newPark => {
        return new Parks(newPark);
      });
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

//YELP ROUTE

function getYelp(req, res){

  const url = `https://api.yelp.com/v3/businesses/search?term=restaurant&limit=5&latitude=${req.query.latitude}&longitude=${req.query.longitude}`;
  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(data => {
      const output = data.body.businesses.map(yelpSummary => {
        return new Yelp(yelpSummary);
      });
      res.send(output);
    });
}

function Yelp(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url;
  this.created_at = Date.now();
}

//MOVIE ROUTE

function getMovies(req, res){

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&language=en-US&query=${req.query.search_query}&page=1&include_adult=false`;
  superagent.get(url)
    .then(data => {
      const output = data.body.results.map(movieData => {
        return new Movie(movieData);
      });
      res.send(output);
    });
}

function Movie(data){
  this.title = data.original_title;
  this.overview = data.overview;
  this.votes = data.vote_average;
  this.popularity = data.popularity;
  this.released = data.released_on;
}

app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));
