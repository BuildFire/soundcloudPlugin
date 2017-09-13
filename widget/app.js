(function (angular, buildfire) {
    "use strict";
    //created soundCloudWidget module
    angular
        .module('soundCloudPluginWidget',
        [
            'ngAnimate',
            'ngRoute',
            'ui.bootstrap',
            'soundCloudWidgetEnums',
            'soundCloudPluginWidgetFilters',
            'soundCloudWidgetServices',
            'infinite-scroll',
            'soundCloudModals',
            'ngTouch'
        ])
        //injected ngRoute for routing
        //injected ui.bootstrap for angular bootstrap component
        .config(['$httpProvider','$compileProvider', function ($httpProvider,$compileProvider) {

            /**
             * To make href urls safe on mobile
             */
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|cdvfile|file):/);


            var interceptor = ['$q', function ($q) {
                var counter = 0;

                return {

                    request: function (config) {
                        buildfire.spinner.show();
                        //NProgress.start();

                        counter++;
                        return config;
                    },
                    response: function (response) {
                        counter--;
                        if (counter === 0) {

                            buildfire.spinner.hide();
                        }
                        return response;
                    },
                    responseError: function (rejection) {
                        counter--;
                        if (counter === 0) {

                            buildfire.spinner.hide();
                        }

                        return $q.reject(rejection);
                    }
                };
            }];
            $httpProvider.interceptors.push(interceptor);

        }])
      .directive("loadImage", function () {
        return {
          restrict: 'A',
          link: function (scope, element, attrs) {
             element.attr("src", "../../../styles/media/holder-" + attrs.loadImage + ".gif");

              attrs.$observe('finalSrc', function() {
                  var _img = attrs.finalSrc;

                  if (attrs.cropType == 'resize') {
                      buildfire.imageLib.local.resizeImage(_img, {
                          width: attrs.cropWidth,
                          height: attrs.cropHeight
                      }, function (err, imgUrl) {
                          _img = imgUrl;
                          replaceImg(_img);
                      });
                  } else {
                      buildfire.imageLib.local.cropImage(_img, {
                          width: attrs.cropWidth,
                          height: attrs.cropHeight
                      }, function (err, imgUrl) {
                          _img = imgUrl;
                          replaceImg(_img);
                      });
                  }
              });

              function replaceImg(finalSrc) {
                  var elem = $("<img>");
                  elem[0].onload = function () {
                      element.attr("src", finalSrc);
                      elem.remove();
                  };
                  elem.attr("src", finalSrc);
              }
          }
        };
      }).directive('backImg', ["$rootScope", function ($rootScope) {
        return function (scope, element, attrs) {
          attrs.$observe('backImg', function (value) {
            var img = '';
            if (value) {
              buildfire.imageLib.local.cropImage(value, {
                width: $rootScope.deviceWidth,
                height: $rootScope.deviceHeight
              }, function (err, imgUrl) {
                if (imgUrl) {
                  img = imgUrl;
                  element.attr("style", 'background:url(' + img + ') !important;background-size:cover !important');
                } else {
                  img = '';
                  element.attr("style", 'background-color:white');
                }
                element.css({
                  'background-size': 'cover !important'
                });
              });
              // img = $filter("cropImage")(value, $rootScope.deviceWidth, $rootScope.deviceHeight, true);
            }
            else {
              img = "";
              element.attr("style", 'background-color:white');
              element.css({
                'background-size': 'cover !important'
              });
            }
          });
        };
      }])
        .run(['$location', '$rootScope','$timeout', function ($location, $rootScope,$timeout) {
            buildfire.history.onPop(function(data, err){
                console.log('buildfire.history.onPop----------------------------',data,'Error------------------',err);
                if($rootScope.playTrack){
                    $timeout(function () {
                        if($rootScope.openPlaylist){
                            $rootScope.openPlaylist=false;
                        } else if($rootScope.openSettings) {
                            $rootScope.openSettings = false;
                        } else if($rootScope.openMoreInfo) {
                            $rootScope.openMoreInfo = false;
                        } else {
                            $rootScope.playTrack=false;
                            $rootScope.$broadcast("destroy currentTrack");
                        }
                    }, 100);
                    if($rootScope.$$phase){$rootScope.$digest();}
                }
            });
        }]);
})
(window.angular, window.buildfire);
