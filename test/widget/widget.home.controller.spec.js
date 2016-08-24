describe("WidgetHomeCtrl", function () {

    var $rootScope,
        $scope,
        controller,
        q,
        $timeout,
        DEFAULT_DATA,
        DB,
        soundCloudAPI = {
            getTracks: function (cb) {
                /*   var deferred = q.defer();
                 deferred.resolve('Remote call result');
                 console.log(0);
                 //cb();
                 return deferred.promise;*/
            }
            ,
            connect: function () {

            }
        },
        BF = {
            services: {
                media: {
                    audioPlayer: {
                        onEvent: function () {
                        },
                        settings: {
                            autoPlayNext: true, set: jasmine.createSpy(),
                            get: function (a) {
                                a(null, {});
                            }
                        },
                        addToPlaylist: jasmine.createSpy(),
                        pause: jasmine.createSpy(),
                        play: jasmine.createSpy(),
                        setTime: jasmine.createSpy(),
                        set: jasmine.createSpy(),
                        getPlaylist: function (b) {
                            b(null, {tracks: []});
                        },
                        removeFromPlaylist: jasmine.createSpy()

                    }
                }
            },
            datastore: {
                onUpdate: function () {

                }
            },
            history: {
                get: function () {

                }
            }
        };


    beforeEach(function () {
        module('soundCloudPluginWidget');
        soundCloudAPI = jasmine.createSpyObj('soundCloudAPI', ['getTracks']);

        inject(function ($injector, $q) {
            $rootScope = $injector.get('$rootScope');
            $timeout = $injector.get('$timeout');
            DEFAULT_DATA = $injector.get('$q');
            q = $injector.get('DEFAULT_DATA');
            $scope = $rootScope.$new();


            controller = $injector.get('$controller')('WidgetHomeCtrl', {
                $scope: $scope,
                COLLECTIONS: $injector.get('COLLECTIONS'),
                DB: $injector.get('DB'),
                $timeout: $timeout,
                DEFAULT_DATA: DEFAULT_DATA,
                soundCloudAPI: soundCloudAPI,
                Buildfire: BF,
                $rootScope: $rootScope
            });
            q = $q;
        });
    });


    describe('WidgetHome.loadMore', function () {
        beforeEach(function () {
            soundCloudAPI.getTracks.and.callFake(function () {
                var deferred = q.defer();
                deferred.resolve({collection: []});
                return deferred.promise;
            });
        });

        it('should populate the WidgetHome.tracks', function () {
            controller.info = {
                data: {
                    content: {link: 'a'},
                    design: {}
                }
            };
            controller.tracks = [];
            $scope.$digest();
            controller.loadMore();
            //controller.loadMore();


            expect(controller.loadMore).toBeDefined();
        });
    });

    describe('WidgetHome.goToTrack', function () {

        it('should set the current track to WidgetHome.currentTrack', function () {
            controller.goToTrack({id: 1});
            expect(controller.currentTrack.id).toEqual(1);
        });
    });

    describe('WidgetHome.showDescription', function () {

        it('should return true if the description is not the default value', function () {
            controller.info = {data: {content: {description: 'a'}}};
            var a = controller.showDescription();
            expect(a).toBeTruthy();
        });

        it('should return false if the description is default value', function () {
            controller.info = {data: {content: {description: '<p><br data-mce-bogus="1"></p>'}}};
            var a = controller.showDescription();
            expect(a).not.toBeTruthy();
        });
    });

    describe('WidgetHome.loadItems', function () {
        it('should set the images to the carousel if the carousel exists', function () {
            controller.view = {
                loadItems: jasmine.createSpy()
            };
            controller.loadItems();
            expect(controller.view.loadItems).toHaveBeenCalled();
        });
    });

    xdescribe('WidgetHome.initCarousel', function () {

        it('should initialise the carousel with images if they exist', function () {
            controller.info = {data: {content: {images: [{id: 1}]}}};
            controller.view = {
                loadItems: jasmine.createSpy()
            };
            controller.initCarousel();
            expect(controller.view.loadItems).toHaveBeenCalled();
        });

        it('should initialise the carousel with empty array if images dont exist', function () {
            controller.info = {data: {content: {images: []}}};
            controller.view = {
                loadItems: jasmine.createSpy()
            };
            controller.initCarousel();
            expect(controller.view.loadItems).toHaveBeenCalledWith([]);
        });
    });

    describe('WidgetHome.refreshTracks', function () {
        it('should set the current page to default value -1', function () {
            controller.refreshTracks();
            expect(controller.page).toEqual(-1);
        });
    });

    describe('WidgetHome.loopPlaylist', function () {
        it('should toggle the value of WidgetHome.settings.loopPlaylist', function () {
            controller.settings = {loopPlaylist: true};
            controller.loopPlaylist();
            expect(controller.settings.loopPlaylist).toBeFalsy();
        });
    });

    describe('WidgetHome.addToPlaylist', function () {

        it('should call the media player method addToPlaylist', function () {
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.addToPlaylist({title: 'p', user: {username: 'a'}});
            expect(BF.services.media.audioPlayer.addToPlaylist).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.pauseTrack', function () {

        it('should call media player pause', function () {
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.currentTrack = {url: 'track1'};
            controller.pauseTrack();
            expect(BF.services.media.audioPlayer.pause).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.playTrack', function () {

        it('should call media player play', function () {
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.currentTrack = {stream_url: '', user: {username: ''}};
            controller.tracks = [];
            controller.playTrack();
            expect(BF.services.media.audioPlayer.play).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.forward', function () {

        it('should call media player setTime', function () {
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.currentTrack = {stream_url: ''};
            controller.forward();
            expect(BF.services.media.audioPlayer.setTime).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.backward', function () {

        it('should call media player setTime', function () {
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.currentTrack = {stream_url: ''};
            controller.backward();
            expect(BF.services.media.audioPlayer.setTime).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.shufflePlaylist', function () {

        it('should call media player setTime', function () {
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.settings = {};
            controller.shufflePlaylist();
            expect(BF.services.media.audioPlayer.settings.set).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.changeVolume', function () {

        it('should call media player settings set', function () {
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.settings = {};
            controller.changeVolume();
            expect(BF.services.media.audioPlayer.settings.set).toHaveBeenCalled();
        });

        it('should call media player settings set', function () {
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.settings = null;
            controller.changeVolume();
            expect(BF.services.media.audioPlayer.settings.set).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.changeTime', function () {

        it('should call media player settings set', function () {
            controller.changeTime();
            expect(BF.services.media.audioPlayer.setTime).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.getFromPlaylist', function () {

        it('should make openPlaylist true', function () {
            controller.getFromPlaylist();
            //expect(controller.openPlaylist).toBeTruthy();
        });
    });

    describe('WidgetHome.getSettings', function () {

        it('should make the settings empty', function () {
            controller.getSettings();
            expect(controller.settings).toEqual({});
        });
    });

    describe('WidgetHome.setSettings', function () {

        it('should call settings set', function () {
            controller.setSettings({autoPlayNext: 0, loopPlaylist: 0, autoJumpToLastPosition: 0, shufflePlaylist: 0});
            expect(BF.services.media.audioPlayer.settings.set).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.openMoreInfoOverlay', function () {

        it('should make openMoreInfo true', function () {
            controller.openMoreInfoOverlay();
            expect($rootScope.openMoreInfo).toBeTruthy();
        });
    });

    describe('WidgetHome.removeTrackFromPlayList', function () {

        it('should make the WidgetHome.swiped index to value of toggle', function () {
            controller.removeTrackFromPlayList(1);
            expect(BF.services.media.audioPlayer.removeFromPlaylist).toHaveBeenCalled();
        });
    });


    describe('WidgetHome.playlistPlay', function () {

        it('should call the play function', function () {
            controller.playlistPlay({url: 'a'});
            expect(BF.services.media.audioPlayer.play).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.playlistPause', function () {

        it('should call the play function', function () {
            controller.playlistPause({url: 'a'});
            expect(BF.services.media.audioPlayer.pause).toHaveBeenCalled();
        });
    });

    describe('WidgetHome.removeFromPlaylist', function () {

        it('should remove from the playlist', function () {
            controller.playList = [{
                url: 'a?client_id=a',
                stream_url: 'a',
                title: '',
                tag_list: '',
                artwork_url: '',
                user: {username: ""}
            }];
            controller.info = {data: {content: {soundcloudClientID: 'a'}}};
            controller.removeFromPlaylist({
                stream_url: 'a',
                title: '',
                tag_list: '',
                artwork_url: '',
                user: {username: ""}
            });
            expect(BF.services.media.audioPlayer.removeFromPlaylist).toHaveBeenCalled();
        });
    });


    describe('$scope.$on("destroy currentTrack"', function () {

        it('should call WidgetHome.duration to empty string', function () {
            $scope.$apply(function () {
                $rootScope.$broadcast('destroy currentTrack');
            });
            expect(controller.duration).toEqual('');
        });
    });

    describe('WidgetHome.onUpdateCallback', function () {

        it('should call WidgetHome.duration to empty string', function () {
            controller.initCarousel = jasmine.createSpy();
            controller.onUpdateCallback({data: {content: {link: '', soundcloudClientID: 'a'}, design: {}}});
            // expect(controller.initCarousel).toHaveBeenCalled();
        });
    });

    xdescribe('$scope.$on("Carousel:LOADED"', function () {

        it('should call initCarousel if thereis images data', function () {
            controller.view = {};
            controller.info = {data: {}};
            controller.initCarousel = jasmine.createSpy('loadItems');
            controller.initCarousel.and.loadItems.callFake(function () {
            });
            $scope.$apply(function () {
                $rootScope.$broadcast('Carousel:LOADED');
            });
            expect(controller.initCarousel.loadItems).toHaveBeenCalled();
        });

        it('should call initCarousel if there is no images data', function () {
            controller.view = {};

            //controller.info = {data:{}};
            controller.view.loadItems = jasmine.createSpy();
            $scope.$apply(function () {
                $rootScope.$broadcast('Carousel:LOADED');
            });
            expect(controller.view.loadItems).toHaveBeenCalled();
        });
    });

    describe('Initial Data fetch', function () {
        it('should set the info to default data in case fetch fails', function () {
            controller.SoundCloudInfoContent = {
                get: function () {
                    var _q = q.defer();
                    _q.resolve('');
                    console.log(156);
                    return _q.promise;
                }
            };
            controller.SoundCloudInfoContent.get();
            $scope.$apply();
            //expect(controller.view.loadItems).toHaveBeenCalled();
        });
    });
})
;