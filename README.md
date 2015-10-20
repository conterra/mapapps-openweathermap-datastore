# OpenWeatherMap Datastore
The OpenWeatherMap Datastore bundle contains a store for OpenWeatherMap Data. It requests the OpenWeatherMap API that returns objects for each bigger city in the world. Each of this objects contains current weather data with the following parameter:
  - city name
  - weather id
  - weather description
  - temperature
  - air pressure
  - humidity
  - cloudage
  - windspeed
  - wind direction
  - rain (optional for 1h/3h)

The bundle also contains a special content viewer with charts for 5 and 16 days forecast.

### Sample App
http://www.mapapps.de/mapapps/resources/apps/downloads_openweathermap/index.html

Installation Guide
------------------

1. Register a free openweathermap account or sign in to get your own api key: http://home.openweathermap.org/users/sign_in
2. Add the bundles "dn_openweathermapdatastore" and "c3" to your app.
3. Add the api key to the configuration and add it to your app.json.
4. Now you can use the OpenWeatherMap Datastore in your app.

Configuration:
```
"bundles" {
  "dn_openweathermapdatastore": {
    "OpenWeatherMapStoreFactory": {
      "mapZoom": 5,
      "apikey": "*your api key*"
    },
    "OWMInfoWidgetFactory": {
      "apikey": "*your api key*"
    }
  },
  ...
}
```
The mapZoom property must be a value between 1 and 8.
