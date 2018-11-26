'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// API Routes
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
})

app.get('/weather', getWeather);
app.get('/yelp', getYelp);
app.get('/movies', getMovies);
app.get('/meetups', getMeetups);
app.get('/trails', getTrails);

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Error handler
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// Models
function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function Yelp(business) {
  this.name = business.name;
  this.rating = business.rating;
  this.price = business.price;
  this.image_url = business.image_url;
  this.url = business.url;
}

function Movies(movie) {
  this.title = movie.title;
  this.released_on = movie.release_date;
  this.total_votes = movie.vote_count;
  this.average_votes = movie.vote_average;
  this.popularity = movie.popularity;
  this.image_url = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`;
  this.overview = movie.overview;
}

function Trails(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.conditions = trail.conditionStatus;
  this.condition_date = trail.conditionDate.split(' ')[0];
  this.condition_time = trail.conditionDate.split(' ')[1];
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
}

// Helper Functions
function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(res => {
      return new Location(query, res);
    })
    .catch(error => handleError(error));
}

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
      });

      response.send(weatherSummaries);
    })
    .catch(error => handleError(error, response));
}

function getYelp(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?term=restaurant&latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;

  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(result => {
      const businessSummaries = result.body.businesses.map(business => {
        return new Yelp(business);
      })
      response.send(businessSummaries);
    })
    .catch(error => handleError(error, response));
}

function getMovies(request, response) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${request.query.data.search_query}&page=1&include_adult=true`;

  superagent.get(url)
    .then(result => {
      const movieSummaries = result.body.results.map(movie => {
        return new Movies(movie);
      })
      response.send(movieSummaries);
    })
    .catch(error => handleError(error, response));
}

function getTrails(request, response) {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&key=${process.env.TRAILS_API_KEY}`;

  superagent.get(url)
    .then(result => {
      const trailSummaries = result.body.trails.map(trail => {
        return new Trails(trail);
      })
      response.send(trailSummaries);
    }).catch(error => handleError(error, response));
}

function getMeetups(request, response) {
}
