/*
 * Copyright (C) 2015 con terra GmbH (info@conterra.de)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
    "dojo/_base/lang",
    "dojo/_base/declare",
    "ct/mapping/geometry",
    "dojo/_base/array",
    "dojo/DeferredList",
    "dojo/date/locale",
    "ct/_lang",
    "ct/_when",
    "apprt-request",
    "ct/store/ComplexMemory",
    "esri/symbols/PictureMarkerSymbol",
    "esri/graphic"
], function (d_lang,
             declare,
             ct_geometry,
             d_array,
             DeferredList,
             d_locale,
             ct_lang,
             ct_when,
             apprt_request,
             ComplexMemory,
             PictureMarkerSymbol,
             Graphic) {
    /**
     * @fileOverview This file implements the dojo store interface to provide a search store for Open Weather Map search service.
     */
    return declare([], {
        activate: function () {
            var properties = this._properties || {};
            // check mandatory parameters
            ct_lang.hasProp(properties, "url", true);

            // get data
            return this._createStore();
        },
        createInstance: function () {
            return this._cachingStore;
        },
        destroyInstance: function () {
            this._cachingStore = null;
        },
        _createStore: function () {
            var properties = this._properties || {};
            var bboxes = properties.bboxes || [
                    "-180,90,180,-90,5"
                ];
            var requests = d_array.map(bboxes, function (bbox) {
                var params = {};
                params.units = "metric";
                params.cluster = "no";
                params.bbox = bbox;
                if (properties.apikey) {
                    params.APPID = properties.apikey;
                }
                return apprt_request(
                    properties.url,
                    {
                        query: params,
                        timeout: properties.timeout || 60000,
                        handleAs: "json"
                    }
                )
                    ;
            }, this);

            var dl = new DeferredList(requests);
            return ct_when(dl,
                function (responses) {
                    this._cachingStore = new ComplexMemory({
                        id: properties.id,
                        idProperty: "id",
                        metadata: properties.metadata
                    });
                    return d_array.forEach(responses, function (response) {
                        if (response[0] === false) {
                            this._logService.error({
                                id: 0,
                                message: "OWM request failed: " + response[1].response.status
                            });
                        } else {
                            var list = response[1].list;
                            return ct_when(this._transformItemsToGraphics(list), function (items) {
                                d_array.forEach(items, function (item) {
                                    try {
                                        this._cachingStore.add(item);
                                    } catch (e) {
                                        // dublicate item
                                    }
                                }, this);
                            }, this);
                        }
                    }, this);
                },
                this);
        },
        _transformItemsToGraphics: function (list) {
            var items = [];
            d_array.forEach(list, function (obj) {
                var lat = obj.coord.lat;
                var lon = obj.coord.lon;
                var geometry = ct_geometry.createPoint({
                    x: lon,
                    y: lat,
                    wkid: 4326
                });
                var attr = {};
                attr.id = obj.id;
                attr.name = obj.name;
                var time = obj.dt;
                var date = new Date(time * 1000);
                date = attr.date = d_locale.format(date, "MMM d, yyyy");
                attr.weather_id = obj.weather[0].id;
                attr.main = obj.weather[0].main;
                attr.description = obj.weather[0].description;
                attr.temp = obj.main.temp;
                attr.pressure = obj.main.pressure;
                attr.humidity = obj.main.humidity;
                attr.clouds = obj.clouds.all;
                attr.windspeed = obj.wind.speed;
                attr.winddirection = obj.wind.deg;
                var rain1;
                var rain3;
                if (obj.rain) {
                    if (obj.rain["1h"]) {
                        rain1 = obj.rain["1h"];
                    }
                    if (obj.rain["3h"]) {
                        rain3 = obj.rain["3h"];
                    }
                }
                attr.rain1 = rain1;
                attr.rain3 = rain3;
                var icon = attr.icon = obj.weather[0].icon;
                var url = "http://openweathermap.org/img/w/" + icon + ".png";
                var symbol = new PictureMarkerSymbol(url, 30, 30);
                var item = new Graphic(geometry, symbol, attr);
                item.id = obj.id;
                item.name = obj.name;
                item.date = date;
                item.weather_id = obj.weather[0].id;
                item.main = obj.weather[0].main;
                item.description = obj.weather[0].description;
                item.temp = obj.main.temp;
                item.pressure = obj.main.pressure;
                item.humidity = obj.main.humidity;
                item.clouds = obj.clouds.all;
                item.windspeed = obj.wind.speed;
                item.winddirection = obj.wind.deg;
                item.rain1 = rain1;
                item.rain3 = rain3;
                items.push(item);
            });
            var geometries = d_array.map(items, function (item) {
                return item.geometry;
            });
            var wkid = this._mapState.getSpatialReference().wkid;
            return ct_when(this._coordinateTransformer.transform(geometries, wkid), function (transformedGeometries) {
                d_array.forEach(transformedGeometries, function (tg, index) {
                    items[index].geometry = tg;
                });
                return items;
            });
        }
    });
});
