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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/layout/BorderContainer",
    "dijit/layout/ContentPane",
    "dijit/layout/TabContainer",
    "dojo/text!./templates/OWMInfoWidget.html",
    "dojo/_base/declare",
    "dojo/_base/Deferred",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/date/locale",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "contentviewer/GridContent",
    "ct/_when",
    "ct/_Connect",
    "ct/request",
    "dojox/charting/Chart",
    "dojox/charting/themes/MiamiNice",
    "dojox/charting/plot2d/Areas",
    "dojox/charting/axis2d/Default",
    "dojox/charting/widget/Legend",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/action2d/MoveSlice",
    "dojox/charting/action2d/Magnify",
    "dojox/charting/action2d/Highlight",
    "dijit/form/FilteringSelect",
    "dojo/store/Memory",
    "d3",
    "c3"
], function (_WidgetBase,
             _TemplatedMixin,
             _WidgetsInTemplateMixin,
             BorderContainer,
             ContentPane,
             TabContainer,
             templateStringContent,
             declare,
             Deferred,
             d_array,
             d_lang,
             locale,
             domAttr,
             domConstruct,
             GridContent,
             ct_when,
             _Connect,
             ct_request,
             Chart,
             theme,
             Areas,
             Default,
             Legend,
             Tooltip,
             MoveSlice,
             Magnify,
             Highlight,
             FilteringSelect,
             Memory,
             d3,
             c3) {
    return declare([_WidgetBase, _TemplatedMixin,
        _WidgetsInTemplateMixin], {
        templateString: templateStringContent,
        constructor: function (args) {
            this.inherited(arguments);
        },
        postCreate: function () {
            this.inherited(arguments);
            var i18n = this.i18n;
            var content = this.content;
            var context = this.context;

            this.set("title", i18n.widget.conditions + content.name);
            var icon = content.icon;
            var url = "http://openweathermap.org/img/w/" + icon + ".png";
            //domAttr.set(this._icon, "src", url);
            var data = content;
            delete data["id"];
            var grid = new GridContent({
                content: data,
                context: context
            });
            /*append the new grid to the div*/
            this._grid.set("content", grid);

            // c3 charts
            var tempChart = c3.generate({
                data: {
                    columns: [
                        ['data', content.temp]
                    ],
                    type: 'gauge'
                },
                tooltip: {show: false},
                gauge: {
                    label: {
                        format: function (value, ratio) {
                            return value;
                        },
                        show: true
                    },
                    min: -50,
                    max: 50,
                    units: 'Temperature [°C]'
                },
                color: {
                    pattern: ['#0000FF', '#0080FF', '#00FFFF', '#00FF80', '#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
                    threshold: {
                        unit: '°C',
                        values: [-50, -10, 0, 10, 20, 30, 40, 50]
                    }
                },
                size: {height: 100, width: 160}
            });
            var humidityChart = c3.generate({
                data: {
                    columns: [
                        ['data', content.humidity]
                    ],
                    type: 'gauge'
                },
                tooltip: {show: false},
                gauge: {
                    label: {
                        format: function (value, ratio) {
                            return value;
                        },
                        show: true
                    },
                    units: 'Humidity [%]'
                },
                color: {
                    pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
                    threshold: {
                        values: [30, 60, 90, 100]
                    }
                },
                size: {height: 100, width: 160}
            });
            var cloudsChart = c3.generate({
                data: {
                    columns: [
                        ['data', content.clouds]
                    ],
                    type: 'gauge'
                },
                tooltip: {show: false},
                gauge: {
                    label: {
                        format: function (value, ratio) {
                            return value;
                        },
                        show: true
                    },
                    units: 'Clouds [%]'
                },
                color: {
                    pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
                    threshold: {values: [30, 60, 90, 100]}
                },
                size: {height: 100, width: 160}
            });
            domConstruct.place(tempChart.element, this._top, "last");
            domConstruct.place(humidityChart.element, this._top, "last");
            domConstruct.place(cloudsChart.element, this._top, "last");

            this._chart5Days = new Chart(this._chartNode5Days);
            this._chart16Days = new Chart(this._chartNode16Days);
            var store5Days = new Memory({
                data: [
                    {name: "Temperature", id: "temp"},
                    {name: "Pressure", id: "pressure"},
                    {name: "Humidity", id: "humidity"},
                    {name: "Clouds", id: "clouds"},
                    {name: "Windspeed", id: "windspeed"}
                ]
            });
            var store16Days = new Memory({
                data: [
                    {name: "Temperature", id: "temp"},
                    {name: "Pressure", id: "pressure"},
                    {name: "Humidity", id: "humidity"},
                    {name: "Clouds", id: "clouds"},
                    {name: "Windspeed", id: "windspeed"},
                    {name: "Rain", id: "rain"}
                ]
            });
            var seriesSelect5Days = this._seriesSelect5Days = new FilteringSelect({
                name: "series",
                value: "temp",
                store: store5Days,
                searchAttr: "name",
                style: "width: 200px;"
            }, this._seriesNode5Days);
            var seriesSelect16Days = this._seriesSelect16Days = new FilteringSelect({
                name: "series",
                value: "temp",
                store: store16Days,
                searchAttr: "name",
                style: "width: 200px;"
            }, this._seriesNode16Days);
            seriesSelect5Days.startup();
            seriesSelect16Days.startup();
            ct_when(this._get5DayForecast(), function (data) {
                this._data5Days = data;
                this._renderChart(this._data5Days, seriesSelect5Days.value, "5");
                this.connect(seriesSelect5Days, "onChange", function () {
                    this._renderChart(this._data5Days, seriesSelect5Days.value, "5");
                });
            }, this);
            ct_when(this._get16DayForecast(), function (data) {
                this._data16Days = data;
                this._renderChart(this._data16Days, seriesSelect16Days.value, "16");
                this.connect(seriesSelect16Days, "onChange", function () {
                    this._renderChart(this._data16Days, seriesSelect16Days.value, "16");
                });
            }, this);
        },
        _renderChart: function (data, value, type) {
            var chart, chartContainer, legendNode;
            if (type === "5") {
                chart = this._chart5Days;
                chartContainer = this._chartContainer5Days;
                legendNode = this._legendNode5Days;
            } else if (type === "16") {
                chart = this._chart16Days;
                chartContainer = this._chartContainer16Days;
                legendNode = this._legendNode16Days;
            }
            chart.removePlot("default");
            chart.setTheme(theme);
            var labels = [];
            d_array.forEach(data, function (item, index) {
                var date = new Date(item.dt * 1000);
                var d = locale.format(date, "MMM d, yyyy");
                labels.push({
                    value: index,
                    text: d
                });
            });
            chart.addAxis("x", {
                labels: labels,
                majorLabels: true,
                minorTicks: true,
                minorLabels: false,
                microTicks: false,
                majorTickStep: 5,
                minorTickStep: 1
            });
            if (value === "temp") {
                chart.addAxis("y", {
                    vertical: true,
                    title: "°C",
                    fixLower: "major",
                    fixUpper: "major",
                    majorLabels: true,
                    minorTicks: true,
                    minorLabels: false,
                    microTicks: false,
                    majorTickStep: 5,
                    minorTickStep: 1
                });
                var tempMinArray = [];
                var tempMaxArray = [];
                d_array.forEach(data, function (item, index) {
                    tempMinArray.push({
                        x: index,
                        y: item.temp_min
                    });
                    tempMaxArray.push({
                        x: index,
                        y: item.temp_max
                    });
                });
                chart.addSeries("Min Temperature", tempMinArray, {stroke: "black", fill: "blue"});
                chart.addSeries("Max Temperature", tempMaxArray, {stroke: "black", fill: "red"});
            } else if (value === "pressure") {
                chart.addAxis("y", {
                    vertical: true,
                    title: "hPa",
                    fixLower: "major",
                    fixUpper: "major",
                    majorLabels: true,
                    minorTicks: true,
                    minorLabels: false,
                    microTicks: false,
                    majorTickStep: 5,
                    minorTickStep: 1
                });
                var pressureArray = [];
                d_array.forEach(data, function (item, index) {
                    pressureArray.push({
                        x: index,
                        y: item.pressure
                    });
                });
                chart.addSeries("Pressure", pressureArray, {stroke: "black", fill: "red"});
            } else if (value === "humidity") {
                chart.addAxis("y", {
                    vertical: true,
                    title: "%",
                    fixLower: "major",
                    fixUpper: "major",
                    majorLabels: true,
                    minorTicks: true,
                    minorLabels: false,
                    microTicks: false,
                    majorTickStep: 5,
                    minorTickStep: 1
                });
                var humidityArray = [];
                d_array.forEach(data, function (item, index) {
                    humidityArray.push({
                        x: index,
                        y: item.humidity
                    });
                });
                chart.addSeries("Humidity", humidityArray, {stroke: "black", fill: "blue"});
            } else if (value === "clouds") {
                chart.addAxis("y", {
                    vertical: true,
                    title: "%",
                    fixLower: "major",
                    fixUpper: "major",
                    majorLabels: true,
                    minorTicks: true,
                    minorLabels: false,
                    microTicks: false,
                    majorTickStep: 5,
                    minorTickStep: 1
                });
                var cloudsArray = [];
                d_array.forEach(data, function (item, index) {
                    cloudsArray.push({
                        x: index,
                        y: item.clouds
                    });
                });
                chart.addSeries("Clouds", cloudsArray, {stroke: "black", fill: "grey"});
            } else if (value === "windspeed") {
                chart.addAxis("y", {
                    vertical: true,
                    title: "m/s",
                    fixLower: "major",
                    fixUpper: "major",
                    majorLabels: true,
                    minorTicks: true,
                    minorLabels: false,
                    microTicks: false,
                    majorTickStep: 5,
                    minorTickStep: 1
                });
                var windspeedArray = [];
                d_array.forEach(data, function (item, index) {
                    windspeedArray.push({
                        x: index,
                        y: item.windspeed
                    });
                });
                chart.addSeries("Windspeed", windspeedArray, {stroke: "black", fill: "yellow"});
            } else if (value === "rain") {
                chart.addAxis("y", {
                    vertical: true,
                    title: "mm",
                    fixLower: "major",
                    fixUpper: "major",
                    majorLabels: true,
                    minorTicks: true,
                    minorLabels: false,
                    microTicks: false,
                    majorTickStep: 5,
                    minorTickStep: 1
                });
                var rainArray = [];
                d_array.forEach(data, function (item, index) {
                    rainArray.push({
                        x: index,
                        y: item.rain
                    });
                });
                chart.addSeries("Rain", rainArray, {stroke: "black", fill: "blue"});
            }

            chart.addPlot("default", {type: Areas, lines: true, areas: true, markers: true, tension: "X"});
            new Tooltip(chart, "default");
            chart.render();

            if (type === "5") {
                var legend = this._legend5Days;
                if (legend === undefined) {
                    legend = this._legend5Days = new Legend({chart: chart}, legendNode);
                } else {
                    legend.set("chart", chart);
                    legend.refresh();
                }
            } else if (type === "16") {
                var legend = this._legend16Days;
                if (legend === undefined) {
                    legend = this._legend16Days = new Legend({chart: chart}, legendNode);
                } else {
                    legend.set("chart", chart);
                    legend.refresh();
                }
            }

            this.connect(chartContainer, "resize", function (dims) {
                var width = dims.w - 2;
                var height = dims.h - 2;
                chart.resize(width, height);
            });
        },
        _get5DayForecast: function () {
            var id = this.content.id;
            var apikey = this.properties.apikey;
            var url = "http://api.openweathermap.org/data/2.5/forecast?units=metric&APPID=" + apikey + "&id=" + id;
            var list;
            return ct_when(ct_request({
                url: url,
                timeout: 10000
            }), function (response) {
                list = response.list;
                var data = [];
                d_array.forEach(list, function (item) {
                    var dt = item.dt;
                    var tempMin = item.main.temp_min;
                    var tempMax = item.main.temp_max;
                    var pressure = item.main.pressure;
                    var humidity = item.main.humidity;
                    var clouds = item.clouds.all;
                    if (item.wind)
                        var windspeed = item.wind.speed;
                    var obj = {
                        dt: dt,
                        temp_min: tempMin,
                        temp_max: tempMax,
                        pressure: pressure,
                        humidity: humidity,
                        clouds: clouds,
                        windspeed: windspeed
                    };
                    data.push(obj);
                });
                return data;
            }, this);
        },
        _get16DayForecast: function () {
            var id = this.content.id;
            var apikey = this.properties.apikey;
            var url = "http://api.openweathermap.org/data/2.5/forecast/daily?cnt=16&units=metric&APPID=" + apikey + "&id=" + id;
            var list;
            return ct_when(ct_request({
                url: url,
                timeout: 10000
            }), function (response) {
                list = response.list;
                var data = [];
                d_array.forEach(list, function (item) {
                    var dt = item.dt;
                    var temp = item.temp;
                    var pressure = item.pressure;
                    var humidity = item.humidity;
                    var clouds = item.clouds;
                    var windspeed = item.speed;
                    var rain = 0;
                    if (item.rain)
                        rain = item.rain;
                    var obj = {
                        dt: dt,
                        temp_min: temp.min,
                        temp_max: temp.max,
                        pressure: pressure,
                        humidity: humidity,
                        clouds: clouds,
                        windspeed: windspeed,
                        rain: rain
                    };
                    data.push(obj);
                });
                return data;
            }, this);
        },
        resize: function (dim) {
            if (dim && dim.h > 0) {
                this._containerNode.resize({
                    w: dim.w,
                    h: dim.h
                });
            }
        }
    });
});