CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title varchar(255),
    release_date varchar(255),
    poster_path varchar(255),
    overview TEXT,
    comment varchar(255)
);
