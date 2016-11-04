 var app = angular.module('myApp', ['ngMap']);
      app.controller('mapController', function($interval, $http) {
      var vm = this;
      vm.positions = [];
      var generateMarkers = function() {
      $http.get("data").
      success(function(data) {
      console.log(data);
      console.log("length array" + data.length);
      vm.positions=data;
      console.log("vm.positions", vm.positions);
      }).
      error(function (data) {
      console.log("fallo");
      });
      };
      $interval(generateMarkers, 20000);
      });