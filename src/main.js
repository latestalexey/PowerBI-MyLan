/// <reference path="index.html" />

require.config({
  paths: {
    'adal': 'bower_components/adal-angular/dist/adal.min',
    'adal-angular': 'bower_components/adal-angular/dist/adal-angular.min',
    'angular': 'bower_components/angular/angular.min',
    'angular-route': 'bower_components/angular-route/angular-route.min',
    'css': 'bower_components/require-css/css',
    'domReady': 'bower_components/requirejs-domready/domReady'
  },
  shim: {
    'adal-angular': ['adal', 'angular'],
    'angular': {
      exports: 'angular'
    },
    'angular-route': ['angular']
  },
});

require([
  'domReady!',
  'angular',
  'angular-route',
  'adal-angular',
  'css!bower_components/bootstrap/dist/css/bootstrap',
  'css!bower_components/fontawesome/css/font-awesome',
  'css!main'
], function (doc, angular) {
  //'use strict';

  var app = angular.module('App', ['ngRoute', 'AdalAngular']);

  app.config(['$httpProvider', '$routeProvider', '$sceDelegateProvider', 'adalAuthenticationServiceProvider', function ($httpProvider, $routeProvider, $sceDelegateProvider, adalProvider) {

    adalProvider.init(
      {
          tenant: "51db647d-1b3b-47f0-9706-9a88ca5adae8", // mylanintrinsic.onmicrosoft.com
          clientId: "a9ec1fe3-01ad-498b-82f7-0597e0a9c27b", // 
        endpoints: {
          "https://api.powerbi.com": "https://analysis.windows.net/powerbi/api",
        },
        requireADLogin: true,
        cacheLocation: 'localStorage' // enable this for IE, as sessionStorage does not work for localhost
      },
      $httpProvider
    );

    $routeProvider.when('/', {
      templateUrl: 'main.html',
      controller: 'Main'
    }).otherwise({
      redirectTo: '/'
    });
    
    
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      'https://*.powerbi.com/**'
    ]);

  }]);

  app.controller('Main', ['$scope', '$http','adalAuthenticationService', function ($scope, $http, adal) {

      var iframe = document.getElementById("report");
      iframe.addEventListener("load", function () {
          var token = adal.getCachedToken("https://analysis.windows.net/powerbi/api");
          iframe.contentWindow.postMessage(JSON.stringify({ action: "loadReport", accessToken: token }), "*");
      });

      var printbutton = document.getElementById("printbutton1");
      iframe.addEventListener("load", function () {
          printbutton.onclick = function openURL() {
              var reportURL = null;
              var index;
              for (index = 0; index < $scope.reports.length; ++index) {
                  if ($scope.reports[index].embedUrl == $scope.selectedReport) {
                      reportURL = $scope.reports[index].webUrl;
                      break;
                  }
              }

              window.open(reportURL);

          }
      });


  
    // Get the list of workspaces
      $http.get('https://api.powerbi.com/v1.0/myorg/groups').then(function (response) {
          var ctmsworkspace = null;
          for (var i = 0; i < response.data.value.length; i++) {
              if (response.data.value[i].name == "CTMS Reports") {
                  ctmsworkspace = response.data.value[i];
                  break;
              }
          }

          $scope.workspaces = [{ name: 'My Workspace', id: null }].concat(ctmsworkspace);
          // $scope.workspaces = ctmsworkspace.concat([{ name: 'My Workspace', id: null }]);
          $scope.workspaces.reverse();
          $scope.selectedWorkspace = $scope.workspaces[0].id;
          $scope.$apply();
        
      }, function (error) {
          $scope.workspaceError = error;
      });

    // Update reports when a new workspace is selected
             $scope.$watch('selectedWorkspace', function (selectedWorkspace) {
              $scope.selectedReport = null
              $scope.reports = null;
                 // Get the list of reports
              if (typeof (selectedWorkspace) == "undefined") {

              }
              else {
                  $http.get('https://api.powerbi.com/v1.0/myorg/' + (selectedWorkspace ? 'groups/' + selectedWorkspace + '/reports' : 'reports')).then(function (response) {
                      $scope.reports = response.data.value;
                      $scope.selectedReport = $scope.reports[0].embedUrl;
                  }, function (error) {
                      $scope.reportError = error;
                  });
              }

          });



  }]);

  angular.bootstrap(doc.getElementById('root'), ['App']);
});
