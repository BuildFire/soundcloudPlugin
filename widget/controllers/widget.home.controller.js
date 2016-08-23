'use strict';

(function (angular, window) {
    angular
        .module('soundCloudPluginWidget')
        .controller('WidgetHomeCtrl', ['$scope', '$timeout', 'DEFAULT_DATA', 'COLLECTIONS', 'DB', 'soundCloudAPI', 'Buildfire',
            '$rootScope', 'Modals',
            function ($scope, $timeout, DEFAULT_DATA, COLLECTIONS, DB, soundCloudAPI, Buildfire, $rootScope, Modals) {
                console.log('WidgetHomeCtrl Controller Loaded-------------------------------------');
                $rootScope.playTrack = false;
                var WidgetHome = this;
                WidgetHome.swiped = [];
                WidgetHome.view = null;
                WidgetHome.currentTime = 0.0;
                WidgetHome.volume = 1;

                WidgetHome.page = -1;
                WidgetHome.pageSize = 8;
                WidgetHome.noMore = false;
                WidgetHome.isBusy = false;
                //TODO: use scoped window
                /*declare the device width heights*/
                $rootScope.deviceHeight = window.innerHeight;
                $rootScope.deviceWidth = window.innerWidth || 320;

                WidgetHome.SoundCloudInfoContent = new DB(COLLECTIONS.SoundCloudInfo);


                WidgetHome.showDescription = function () {
                    console.log('ShowDescription------function calling in widget section---------', WidgetHome.info);
                    if (WidgetHome.info.data.content.description == '<p>&nbsp;<br></p>' || WidgetHome.info.data.content.description == '<p><br data-mce-bogus="1"></p>' || WidgetHome.info.data.content.description == '')
                        return false;
                    else
                        return true;
                };

                // load items
                WidgetHome.loadItems = function (carouselItems) {
                    // create an instance and pass it the items if you don't have items yet just pass []
                    if (WidgetHome.view)
                        WidgetHome.view.loadItems(carouselItems);
                };

                WidgetHome.initCarousel = function () {
                    if (angular.element('#carousel').hasClass('plugin-slider') == false || WidgetHome.view == null) {
                        WidgetHome.view = new Buildfire.components.carousel.view("#carousel", WidgetHome.info.data.content.images);  ///create new instance of buildfire carousel viewer
                    }
                    else {
                        WidgetHome.loadItems(WidgetHome.info.data.content.images);
                    }
                };

                WidgetHome.SoundCloudInfoContent.get().then(function success(result) {
                        console.log('>>result<<', result);
                        if (result && result.data && result.id) {

                            WidgetHome.info = result;
                            $timeout(function () {
                                WidgetHome.initCarousel();
                            }, 1000);
                            if (WidgetHome.info.data && WidgetHome.info.data.design)
                                $rootScope.bgImage = WidgetHome.info.data.design.bgImage;
                            if (WidgetHome.info.data.content.link && WidgetHome.info.data.content.soundcloudClientID) {
                                soundCloudAPI.connect(WidgetHome.info.data.content.soundcloudClientID);
                                WidgetHome.refreshTracks();
                                WidgetHome.loadMore();
                            }

                        }
                        else {
                            WidgetHome.info = DEFAULT_DATA.SOUND_CLOUD_INFO;
                            soundCloudAPI.connect(WidgetHome.info.data.content.soundcloudClientID);
                            WidgetHome.refreshTracks();
                            WidgetHome.loadMore();
                        }
                    },
                    function fail() {
                        WidgetHome.info = DEFAULT_DATA.SOUND_CLOUD_INFO;
                    }
                );

                WidgetHome.goToTrack = function (track) {
                    WidgetHome.showTrackSlider = false;
                    console.log('Goto Track called---------------------------------------', track);
                    audioPlayer.pause();
                    $timeout(function () {
                        WidgetHome.getSettings(true);
                        WidgetHome.playTrack();
                    }, 1000);
                    $rootScope.playTrack = true;
                    WidgetHome.currentTime = 0;
                    WidgetHome.duration = null;
                    WidgetHome.currentTrack = track;
                    console.log('In track------------------------WidgetHome.currentTime', WidgetHome.currentTime, 'WidgetHome.duration========', WidgetHome.duration);
                    console.log('Goto Track called---------------$rootScope playTrack------------------------', $rootScope.playTrack);
                    if (!$rootScope.$$phase)$rootScope.$digest();
                };

                WidgetHome.loadMore = function () {
                    if (WidgetHome.isBusy || WidgetHome.noMore) {
                        return;
                    }
                    console.log('WidgetHome.page', WidgetHome.page);
                    WidgetHome.isBusy = true;
                    if (WidgetHome.info && WidgetHome.info.data && WidgetHome.info.data.content && WidgetHome.info.data.content.link)
                        soundCloudAPI.getTracks(WidgetHome.info.data.content.link, ++WidgetHome.page, WidgetHome.pageSize)
                            .then(function (data) {
                                WidgetHome.noTracks = false;
                                console.log('Got tracks--------------------------', data);
                                WidgetHome.isBusy = false;
                                var d = data.collection;
                                if (d.length < WidgetHome.pageSize && !data.next_href) {
                                    WidgetHome.noMore = true;

                                    if (WidgetHome.page == 0 && d.length == 0) {
                                        WidgetHome.noTracks = true;
                                    }
                                }
                                WidgetHome.tracks = WidgetHome.tracks.concat(d);
                                console.log('WidgetHome.tracks', WidgetHome.tracks);
                                $scope.$digest();
                                if (d.length < WidgetHome.pageSize && data.next_href && WidgetHome.tracks && WidgetHome.tracks.length < WidgetHome.pageSize)
                                    WidgetHome.loadMore();
                            });
                };

                /**
                 * audioPlayer is Buildfire.services.media.audioPlayer.
                 */
                var audioPlayer = Buildfire.services.media.audioPlayer;

                /**
                 * audioPlayer.onEvent callback calls when audioPlayer event fires.
                 */
                audioPlayer.onEvent(function (e) {
                    console.log('Audio Player On Event callback Method--------------------------------------', e);
                    switch (e.event) {
                        case 'timeUpdate':
                            WidgetHome.currentTime = e.data.currentTime;
                            WidgetHome.duration = e.data.duration;
                            break;
                        case 'audioEnded':
                            WidgetHome.playing = false;
                            WidgetHome.paused = false;
                            break;
                        case 'pause':
                            WidgetHome.playing = false;
                            break;
                        case 'next':
                            WidgetHome.currentTrack = e.data.track;
                            WidgetHome.playing = true;
                            break;
                        case 'removeFromPlaylist':
                            Modals.removeTrackModal();
                            WidgetHome.playList = e.data && e.data.newPlaylist && e.data.newPlaylist.tracks;
                            console.log('WidgetHome.playList---------------------in removeFromPlaylist---', WidgetHome.playList);
                            break;

                    }
                    $scope.$digest();
                });

                /**
                 * Player related method and variables
                 */
                WidgetHome.playTrack = function () {
                    if(WidgetHome.settings){
                        WidgetHome.settings.isPlayingCurrentTrack=true;
                        audioPlayer.settings.set(WidgetHome.settings);
                    }
                    else{
                        audioPlayer.settings.get(function (err, data) {
                            console.log('Got player settings-----------------------', err, data);
                            if (data) {
                                WidgetHome.settings = data;
                                WidgetHome.settings.isPlayingCurrentTrack=true;
                                audioPlayer.settings.set(WidgetHome.settings);
                            }
                        });
                    }
                    WidgetHome.showTrackSlider = true;
                    console.log('Widget HOme url----------------------', WidgetHome.currentTrack.stream_url + '?client_id=' + WidgetHome.info.data.content.soundcloudClientID);
                    WidgetHome.playing = true;
                    WidgetHome.currentTrack.isPlaying = true;
                    WidgetHome.tracks.forEach(function (track) {
                        if (track.id != WidgetHome.currentTrack.id) {
                            track.isPlaying = false;
                        }
                    });
                    if (WidgetHome.paused) {
                        audioPlayer.play();
                    } else {
                        audioPlayer.play({
                            url: WidgetHome.currentTrack.stream_url + '?client_id=' + WidgetHome.info.data.content.soundcloudClientID,
                            title: WidgetHome.currentTrack.title,
                            image: WidgetHome.currentTrack.artwork_url || WidgetHome.currentTrack.image || WidgetHome.currentTrack.user.avatar_url,
                            album: WidgetHome.currentTrack.tag_list,
                            artist: WidgetHome.currentTrack.user.username
                        });
                    }
                };
                WidgetHome.playlistPlay = function (track) {
                    if(WidgetHome.settings){
                        WidgetHome.settings.isPlayingCurrentTrack=true;
                        audioPlayer.settings.set(WidgetHome.settings);
                    }
                    WidgetHome.showTrackSlider = true;
                    WidgetHome.currentTrack = track;
                    console.log('PlayList Play ---------------Track is played', track);
                    WidgetHome.playing = true;
                    if (track) {
                        audioPlayer.play(track);
                        track.playing = true;
                    }
                    WidgetHome.getFromPlaylist();
//                    $scope.$digest();
                };
                WidgetHome.pauseTrack = function () {
                    if(WidgetHome.settings){
                        WidgetHome.settings.isPlayingCurrentTrack=false;
                        audioPlayer.settings.set(WidgetHome.settings);
                    }
                    WidgetHome.playing = false;
                    WidgetHome.paused = true;
                    WidgetHome.currentTrack.isPlaying = false;
                    audioPlayer.pause();
//                    $scope.$digest();
                };
                WidgetHome.playlistPause = function (track) {
                    if(WidgetHome.settings){
                        WidgetHome.settings.isPlayingCurrentTrack=false;
                        audioPlayer.settings.set(WidgetHome.settings);
                    }
                    track.playing = false;
                    WidgetHome.playing = false;
                    WidgetHome.paused = true;
                    audioPlayer.pause();
//                    $scope.$digest();
                };
                WidgetHome.forward = function () {
                    if (WidgetHome.currentTime + 5 >= WidgetHome.currentTrack.duration)
                        audioPlayer.setTime(WidgetHome.currentTrack.duration);
                    else if((WidgetHome.currentTime + 5)<=WidgetHome.currentTrack.duration)
                        audioPlayer.setTime(WidgetHome.currentTime + 5);
                    else
                        audioPlayer.setTime(WidgetHome.currentTrack.duration);
                };

                WidgetHome.backward = function () {
                    if (WidgetHome.currentTime - 5 > 0)
                        audioPlayer.setTime(WidgetHome.currentTime - 5);
                    else
                        audioPlayer.setTime(0);
                };
                WidgetHome.shufflePlaylist = function () {
                    console.log('WidgetHome settings in shuffle---------------------', WidgetHome.settings);
                    if (WidgetHome.settings) {
                        WidgetHome.settings.shufflePlaylist = WidgetHome.settings.shufflePlaylist ? false : true;
                    }
                    audioPlayer.settings.set(WidgetHome.settings);
                };
                WidgetHome.changeVolume = function (volume) {
                    console.log('Volume----------------------', volume);
                    //audioPlayer.setVolume(volume);
                    audioPlayer.settings.get(function (err, setting) {
                        console.log('Settings------------------', setting);
                        if (setting) {
                            setting.volume = volume;
                            audioPlayer.settings.set(setting);
                        }
                        else {
                            audioPlayer.settings.set({volume: volume});
                        }
                    });

                };
                WidgetHome.loopPlaylist = function () {
                    console.log('WidgetHome settings in Loop Playlist---------------------', WidgetHome.settings);
                    if (WidgetHome.settings) {
                        WidgetHome.settings.loopPlaylist = WidgetHome.settings.loopPlaylist ? false : true;
                    }
                    audioPlayer.settings.set(WidgetHome.settings);
                };
                WidgetHome.addToPlaylist = function (track) {
                    console.log('AddToPlaylist called-------------------------------');
                    var playListTrack = new Track(track.title, track.stream_url + '?client_id=' + WidgetHome.info.data.content.soundcloudClientID, (track.artwork_url || track.image || track.user.avatar_url), track.tag_list, track.user.username);
                    console.log(WidgetHome.playList);
                    var found=0;
                    if(WidgetHome.playList){
                        for(var _index=0;_index<WidgetHome.playList.length;_index++){
                            if(track.stream_url + '?client_id=' + WidgetHome.info.data.content.soundcloudClientID === WidgetHome.playList[_index].url ){
                                found=1;
                                break;
                            }
                            else{
                                continue;
                            }
                        }
                    }

                    if(!found)
                    audioPlayer.addToPlaylist(playListTrack);

                };
                WidgetHome.removeFromPlaylist = function (track) {
                    console.log('removeFromPlaylist called-------------------------------');
                    if (WidgetHome.playList) {
                        var trackIndex = 0;
                        WidgetHome.playList.some(function (val, index) {
                            if (((val.url == track.stream_url + '?client_id=' + WidgetHome.info.data.content.soundcloudClientID) || val.url == track.url) && (trackIndex == 0)) {
                                audioPlayer.removeFromPlaylist(index);
                                trackIndex++;
                            }
                            return ((val.url == track.stream_url + '?client_id=' + WidgetHome.info.data.content.soundcloudClientID) || val.url == track.url);

                        });
                        console.log('indexes------------track Index----------------------track==========', trackIndex);
                    }
                    /*if(trackIndex!='undefined'){
                     audioPlayer.removeFromPlaylist(trackIndex);
                     }*/
                };
                WidgetHome.removeTrackFromPlayList = function (index) {
                    audioPlayer.removeFromPlaylist(index);
                    WidgetHome.closeSwipeRemove();
                };
                WidgetHome.getFromPlaylist = function () {
                    var trackIndex = 0,
                        trackIndex1 = 0;
                    /* if(WidgetHome.playList && WidgetHome.playList.length>0){
                     WidgetHome.playList.filter(function(val,index){
                     if(((val.url==WidgetHome.currentTrack.stream_url + '?client_id=' + WidgetHome.info.data.content.soundcloudClientID) || val.url == WidgetHome.currentTrack.url) && (trackIndex == 0)){
                     trackIndex++;
                     val.playing=true;
                     }
                     else{
                     val.playing=false;
                     }

                     });
                     /!*forEach(WidgetHome.playList,function(val){
                     if(val.url==)
                     });*!/
                     }
                     else{*/
                    audioPlayer.getPlaylist(function (err, data) {
                        console.log('Callback---------getList--------------', err, data);
                        if (data && data.tracks) {
                            WidgetHome.playList = data.tracks;
                            if (WidgetHome.playing)
                            WidgetHome.playList.filter(function (val, index) {
                                if (((val.url == WidgetHome.currentTrack.stream_url + '?client_id=' + WidgetHome.info.data.content.soundcloudClientID) || val.url == WidgetHome.currentTrack.url) && (trackIndex1 == 0)) {
                                    trackIndex1++;
                                    val.playing = true;
                                }
                                else {
                                    val.playing = false;
                                }

                            });
                            $scope.$digest();
                        }
                    });
                    // }
                    WidgetHome.openMoreInfo = false;
                    $rootScope.openPlaylist = true;
                };
                WidgetHome.changeTime = function (time) {
                    console.log('Change time method called---------------------------------', time);
                    audioPlayer.setTime(time);
                };
                WidgetHome.getSettings = function (dontOpen) {
                    if (!dontOpen)
                        WidgetHome.openSettings = true;
                    audioPlayer.settings.get(function (err, data) {
                        console.log('Got player settings-----------------------', err, data);
                        if (data) {
                            WidgetHome.settings = data;
                            if (!$scope.$$phase) {
                                $scope.$digest();
                            }
                        }
                    });
                };
                WidgetHome.setSettings = function (settings) {
                    console.log('Set settings called----------------------', settings);
                    console.log('WidgetHome-------------settings------', WidgetHome.settings);
                    var newSettings = new AudioSettings(settings);
                    audioPlayer.settings.set(newSettings);
                };
                WidgetHome.addEvents = function (e, i, toggle, track) {
                    console.log('addEvent class-------------------calles', e, i, toggle, track);
                    toggle ? track.swiped = true : track.swiped = false;
                };
                WidgetHome.openMoreInfoOverlay = function () {
                    WidgetHome.openMoreInfo = true;
                };
                WidgetHome.closeSettingsOverlay = function () {
                    WidgetHome.openSettings = false;
                };
                WidgetHome.closePlayListOverlay = function () {
                    $rootScope.openPlaylist = false;
                    WidgetHome.closeSwipeRemove();
                };
                WidgetHome.closeMoreInfoOverlay = function () {
                    WidgetHome.openMoreInfo = false;
                };
                WidgetHome.closeSwipeRemove = function () {
                    for (var _i = 0; _i < WidgetHome.swiped.length; _i++) {
                        WidgetHome.swiped[_i] = false;
                    }
                };

                WidgetHome.refreshTracks = function () {
                    WidgetHome.tracks = [];
                    WidgetHome.noMore = false;
                    WidgetHome.isBusy = false;
                    WidgetHome.page = -1;
                };

                /*  $scope.$on("Carousel:LOADED", function () {
                 if (!WidgetHome.view) {
                 WidgetHome.view = new window.buildfire.components.carousel.view("#carousel", []);  ///create new instance of buildfire carousel viewer
                 }
                 if (WidgetHome.view && WidgetHome.info && WidgetHome.info.data) {
                 WidgetHome.initCarousel();
                 }
                 else {
                 WidgetHome.view.loadItems([]);
                 }
                 });*/

                $scope.$on("destroy currentTrack", function () {
                    WidgetHome.currentTime = null;
                    WidgetHome.playing = false;
                    WidgetHome.paused = false;
                    WidgetHome.currentTrack = null;
                    WidgetHome.duration = '';
                    WidgetHome.showTrackSlider = false;
                    WidgetHome.openSettings=false;
                    WidgetHome.openMoreInfo = false;

                });

                /**
                 * Track Smaple
                 * @param title
                 * @param url
                 * @param image
                 * @param album
                 * @param artist
                 * @constructor
                 */

                function Track(title, url, image, album, artist) {
                    this.title = title;
                    this.url = url;
                    this.image = image;
                    this.album = album;
                    this.artist = artist;
                    this.startAt = 0; // where to begin playing
                    this.lastPosition = 0; // last played to
                }

                /**
                 * AudioSettings sample
                 * @param autoPlayNext
                 * @param loop
                 * @param autoJumpToLastPosition
                 * @param shufflePlaylist
                 * @constructor
                 */
                function AudioSettings(settings) {
                    this.autoPlayNext = settings.autoPlayNext; // once a track is finished playing go to the next track in the play list and play it
                    this.loopPlaylist = settings.loopPlaylist; // once the end of the playlist has been reached start over again
                    this.autoJumpToLastPosition = settings.autoJumpToLastPosition; //If a track has [lastPosition] use it to start playing the audio from there
                    this.shufflePlaylist = settings.shufflePlaylist;// shuffle the playlist
                    this.isPlayingCurrentTrack=settings.isPlayingCurrentTrack; //tells whether current track is playing or not?
                }


                /**
                 * Buildfire.datastore.onUpdate method calls when Data is changed.
                 */

                WidgetHome.onUpdateCallback = function (event) {
                    if (event.data) {
                        WidgetHome.info = event;
                        if (WidgetHome.info.data && WidgetHome.info.data.design)
                            $rootScope.bgImage = WidgetHome.info.data.design.bgImage;
                        if (WidgetHome.info.data.content.link && WidgetHome.info.data.content.soundcloudClientID) {
                            soundCloudAPI.connect(WidgetHome.info.data.content.soundcloudClientID);
                            WidgetHome.refreshTracks();
                            WidgetHome.loadMore();
                        }
                        else{
                            WidgetHome.clearTracks();
                        }
                        $timeout(function () {
                            WidgetHome.initCarousel();
                        }, 250);
                        $scope.$apply();
                    }

                };

                WidgetHome.clearTracks = function(){
                    WidgetHome.tracks = [];
                };

                WidgetHome.playlistPlayPause = function (track,index) {
                    if (WidgetHome.playing) {
                        if (track.playing) {
                            WidgetHome.playlistPause(track);
                        }
                        else {
                            WidgetHome.playlistPlay(track,index);
                        }
                    }
                    else if (WidgetHome.paused) {
                        if (track.url == WidgetHome.currentTrack.url) {
                            WidgetHome.settings.isPlayingCurrentTrack = true;
                            WidgetHome.playing = true;
                            track.playing = true;
                            audioPlayer.play();
                        }
                        else {
                            WidgetHome.playlistPlay(track,index);
                        }
                    }
                    else {
                        WidgetHome.playlistPlay(track,index);
                    }
                };

                var listener = Buildfire.datastore.onUpdate(WidgetHome.onUpdateCallback);

                buildfire.datastore.onRefresh(function(){
                    WidgetHome.tracks = [];
                    WidgetHome.noMore = false;
                    WidgetHome.isBusy = false;
                    WidgetHome.page = -1;
                    WidgetHome.SoundCloudInfoContent.get().then(function success(result) {
                          console.log('>>result<<', result);
                          if (result && result.data && result.id) {

                              WidgetHome.info = result;
                              $timeout(function () {
                                  WidgetHome.initCarousel();
                              }, 1000);
                              if (WidgetHome.info.data && WidgetHome.info.data.design)
                                  $rootScope.bgImage = WidgetHome.info.data.design.bgImage;
                              if (WidgetHome.info.data.content.link && WidgetHome.info.data.content.soundcloudClientID) {
                                  soundCloudAPI.connect(WidgetHome.info.data.content.soundcloudClientID);
                                  WidgetHome.refreshTracks();
                                  WidgetHome.loadMore();
                              }

                          }
                          else {
                              WidgetHome.info = DEFAULT_DATA.SOUND_CLOUD_INFO;
                              soundCloudAPI.connect(WidgetHome.info.data.content.soundcloudClientID);
                              WidgetHome.refreshTracks();
                              WidgetHome.loadMore();
                          }
                      },
                      function fail() {
                          WidgetHome.info = DEFAULT_DATA.SOUND_CLOUD_INFO;
                      }
                    );
                })
            }]);
})(window.angular, window);