-- -- //psql -d database -f schema.sql


-- DROP TABLE database_location; 

CREATE TABLE city (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC,
  longitude NUMERIC
)