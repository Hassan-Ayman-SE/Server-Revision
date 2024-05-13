"use strict";

const express = require("express");
const cors = require("cors");
const axios = require("axios").default;
require("dotenv").config();

const movieData = require("./Movie Data/data.json");

const apiKey = process.env.API_KEY;
const pgUrl = process.env.DATABASE_URL;
const PORT = process.env.PORT || 5000;

//for query in js file using pg package
const { Client } = require("pg");
const client = new Client(pgUrl);
//OR use this way
// const pg = require("pg");
// const client2 = pg.Client(pgUrl);

const app = express();

//api.themoviedb.org/3/trending/all/week?api_key=37ddc7081e348bf246a42f3be2b3dfd0&language=en-US

//server open for all clients requests
/*The "cors" package is commonly used in web development to enable Cross-Origin Resource Sharing (CORS). 
CORS is a mechanism that allows resources (e.g., fonts, scripts, or APIs) on a web page to be requested 
from another domain outside the domain from which the resource originated. 
It is a security feature implemented by web browsers to protect users from potential cross-site scripting (XSS) attacks.*/
app.use(cors());
//for parsing body
app.use(express.json());
//from data.json
app.get("/", handleHome);
//3rd party Api
app.get("/trending", handleTrending);
app.get("/search", handleSearch);
//CRUD DB
app.post("/addMovie", handleAddMovie);
app.get("/getMovies", handleGetMovies);
app.put("/UPDATE/:id", handleUpdateMovie); //http://localhost:UPDATE/3
app.delete("/DELETE/:id", handleDeleteMovie);

app.use(errorHandler);

/*
req.query --> hhttp://localhost:gitMovie?name = 123 // http method: GET
req.params --> hhttp://localhost:gitMovie/7 // http method: PUT DELETE
req.body --> hhttp://localhost:gitMovie {} // http method: POST 

get ---> sql = select * from 
post ---> sql = insert into
put ---> sql = update movies set
delete ---> sql = delete from mo
*/

//functions
function handleHome(req, res) {
  //get data from data.json file
  let myMovie = new Movie(
    movieData.title,
    movieData.release_date,
    movieData.poster_path,
    movieData.overview
  );
  res.json(myMovie);
}

function handleTrending(req, res) {
  //from 3rd party api
  const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=en-US`;

  axios
    .get(url)
    .then((response) => {
      let movies = response.data.results.map((movie) => {
        return new Movie(
          movie.id,
          movie.title,
          movie.release_date,
          movie.poster_path,
          movie.overview
        );
      });
      res.json(movies);
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
}

//hhttp://localhost:gitMovie?
function handleSearch(req, res) {
  //from 3rd party api
  let query = req.query.name; //http://localhost:search?name=the
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=en-US&query=${query}&page=2`;

  axios
    .get(url)
    .then((response) => {
      res.json(response.data.results);
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
}
/*
{
"title": "Test",
"release_date": "release_date",...
...
}
*/
function handleAddMovie(req, res) {
  const { title, release_date, poster_path, overview, comment } = req.body;
  //OR
  // const title2 = req.body.title;
  // const release_date2 = req.body.release_date;...

  const sql = `INSERT INTO movies (title, release_date, poster_path, overview, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
  const values = [title, release_date, poster_path, overview, comment];

  client
    .query(sql, values)
    .then((response) => {
      console.log(response);
      return res.status(201).json(response.rows[0]);
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
}

function handleGetMovies(req, res) {
  const sql = `SELECT * FROM movies;`;
  client
    .query(sql)
    .then((response) => {
      res.json(response.rows);
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
}

function handleUpdateMovie(req, res) {
  const id = req.params.id; //  /7

  const { title, release_date, poster_path, overview, comment } = req.body;

  const sql = `UPDATE movies SET title = $1, release_date = $2, poster_path = $3, overview = $4, comment = $5 WHERE id = ${id} RETURNING *;`;
  const values = [title, release_date, poster_path, overview, comment];
  client
    .query(sql, values)
    .then((response) => {
      console.log(response);
      return res.status(200).json(response.rows[0]);
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
}

function handleDeleteMovie(req, res) {
  const id = req.params.id; //  /5
  const sql = `DELETE FROM movies WHERE id = ${id} RETURNING *;`;
  client
    .query(sql)
    .then((response) => {
      res.json(response.rows[0]);
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
}
function errorHandler(err, req, res) {
  const message = {
    status: 500,
    message: err,
  };
  res.status(500).json(message);
}
class Movie {
  constructor(id, title, release_date, poster_path, overview) {
    this.id = id;
    this.title = title;
    this.release_date = release_date;
    this.poster_path = poster_path;
    this.overview = overview;
  }
}

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening ${PORT}`);
  });
});
