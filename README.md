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

### Define the mapapps remote base
Before you can run the project you have to define the mapapps.remote.base property in the pom.xml-file:
`<mapapps.remote.base>http://%YOURSERVER%/ct-mapapps-webapp-%VERSION%</mapapps.remote.base>`

##### Other methods to to define the mapapps.remote.base property.
1. Goal parameters
`mvn install -Dmapapps.remote.base=http://%YOURSERVER%/ct-mapapps-webapp-%VERSION%`

2. Build properties
Change the mapapps.remote.base in the build.properties file and run:
`mvn install -Denv=dev -Dlocal.configfile=%ABSOLUTEPATHTOPROJECTROOT%/build.properties`

Installation Guide
------------------

1. Register a free OpenWeatherMap account or sign in to get your own api key: http://home.openweathermap.org/users/sign_in
2. Add the bundles "dn_openweathermapdatastore" and "c3" to your app.
3. Add the api key to the configuration and add it to your app.json.
4. Now you can use the OpenWeatherMap Datastore in your app.

Configuration:
```
"bundles" {
  "dn_openweathermapdatastore": {
    "OpenWeatherMapStoreFactory": {
      // bounding boxes + zoom value to get data
      // from cities within the defined rectangle
      // specified by the geographic coordinates
      "bboxes": [
        // whole world
        "-180,90,180,-90,6",
        // Germany
        "6,55,15,47,8"
      ]
      "apikey": "*your api key*"
    },
    "OWMInfoWidgetFactory": {
      "apikey": "*your api key*"
    }
  },
  ...
}
```
