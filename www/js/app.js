// Global jQuery references
var $html = null;
var $body = null;
var $goButton = null;
var $continueButton = null;
var $audioPlayer = null;
var $playerArtist = null;
var $playerTitle = null;
var $currentTime = null;
var $duration = null;
var $playedSongs = null;
var $skip = null;
var $songs = null;
var $landing = null;
var $fixedHeader = null;
var $landingReturnDeck = null;
var $landingFirstDeck = null;
var $landingCastReceiverDeck = null;
var $player = null;
var $play = null;
var $pause = null;
var $back = null;
var $historyButton = null;
var $skipsRemaining = null;
var $currentSong = null;
var $previousSong = null;
var $fullscreenButton = null;
var $songsWrapper = null;
var $fullList = null;
var $skipIntroButton = null;
var $playFavorites = null;
var $playAll = null;
var $video = null;
var $videoWrapper = null;


// In-app cast buttons
var $castButtons = null;
var $castStart = null;
var $castStop = null;

// Welcome screen cast buttons
var $chromecastDeck = null;
var $isDesktopChrome = null;
var $getCastExtension = null;
var $welcomeCastStartNote = null;
var $welcomeCastStartButton = null;
var $isNotDesktopChrome = null;
var $isTouch = null;
var $isNotChrome = null;

// URL params
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var RESET_STATE = (window.location.search.indexOf('resetstate') >= 0);
var PLAY_LAST = (window.location.search.indexOf('playlast') >= 0);

// Global state
var firstShareLoad = true;
var isPlayingWelcome = true;
var usedSkips = [];
var totalSongsPlayed = 0;
var songHeight = null;
var fixedHeaderHeight = null;
var is_small_screen = false;
var favoritedSongs = [];
var songOrder = null;
var isFirstPlay = true;
var currentSongID = null;
var maxSongIndex = null;
var playFavorites = false;
var numberOfFavorites = null;

var isSenderCasting = false;
var isReceiverCasting = false;
var castSender = null;
var castReceiver = null;

// jPlayer config
$.jPlayer.timeFormat.padMin = false;

// Type of browser
var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
var is_IE = navigator.userAgent.indexOf('MSIE ') > -1 || navigator.userAgent.match(/Trident.*rv\:11\./) > 0;
var is_touch = Modernizr.touch;
/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $html = $('html');
    $body = $('body');
    $goButton = $('.go');
    $continueButton = $('.continue');
    $audioPlayer = $('#audio-player');
    $songs = $('.songs');
    $skip = $('.skip');
    $playerArtist = $('.player .artist');
    $playerTitle = $('.player .song-title');
    $currentTime = $('.current-time');
    $duration = $('.duration');
    $playedSongs = $('.played-songs');
    $landing = $('.landing');
    $fixedHeader = $('.fixed-header');
    $landingReturnDeck = $('.landing-return-deck');
    $landingFirstDeck = $('.landing-firstload-deck');
    $landingCastReceiverDeck = $('.landing-cast-receiver-deck');    
    $player = $('.player-container')
    $play = $('.play');
    $back = $('.back');
    $pause = $('.pause');
    $historyButton = $('.js-show-history');
    $skipsRemaining = $('.skips-remaining');
    $songsWrapper = $('.songs-wrapper');
    $fullList = $('.full-list a');
    $skipIntroButton = $('.skip-intro');
    $playToggle = $('.play-toggle');
    $playFavorites = $('.play-favorites');
    $numberOfFavorites = $('.number-of-favorites');
    $playAll = $('.play-all');
    $video = $('.covervid-video');
    $videoWrapper = $('.covervid-wrapper');

    $fullscreenButtons = $('.fullscreen');
    $fullscreenStart = $('.fullscreen .start');
    $fullscreenStop = $('.fullscreen .stop');

    $castButtons = $('.chromecast');
    $castStart = $('.chromecast .start');
    $castStop = $('.chromecast .stop');

    $chromecastDeck = $('.chromecast-deck');
    $isDesktopChrome = $('.chromecast-deck .is-desktop-chrome');
    $getCastExtension = $('.chromecast-deck .is-desktop-chrome .get-extension');
    $welcomeCastStartNote = $('.chromecast-deck .is-desktop-chrome .start-chromecast');
    $welcomeCastStartButton = $('.chromecast-deck .is-desktop-chrome .start');
    $isNotDesktopChrome = $('.chromecast-deck .is-not-desktop-chrome');
    $isTouch = $('.chromecast-deck .is-not-desktop-chrome .is-touch');
    $isNotChrome = $('.chromecast-deck .is-not-desktop-chrome .is-not-chrome');    

    onWindowResize();
    $landing.show();

    // Bind events
    $goButton.on('click', onGoButtonClick);
    $continueButton.on('click', onContinueButtonClick);
    $skip.on('click', onSkipClick);
    $play.on('click', onPlayClick);
    $back.on('click', onBackClick);
    $pause.on('click', onPauseClick);
    $(window).on('resize', onWindowResize);
    $(document).on('scroll', onDocumentScroll);
    $historyButton.on('click', onShowHistoryClick);
    $songs.on('click', '.song', onSongCardClick);
    $songs.on('click', '.song-tools .amazon', onAmazonClick);
    $songs.on('click', '.song-tools .itunes', oniTunesClick);
    $songs.on('click', '.song-tools .rdio', onRdioClick);
    $songs.on('click', '.song-tools .spotify', onSpotifyClick);
    $songs.on('click', '.song-tools .favorite', onFavoriteClick);
    $songs.on('click', '.play-song-button', onJumpToSongClick);
    $skipIntroButton.on('click', onSkipIntroClick);
    $playFavorites.on('click', onPlayFavoritesClick);
    $playAll.on('click', onPlayAllClick);

    if (!is_IE) {
        $fullscreenButtons.hide();
    };

    $fullscreenStart.on('click',onFullscreenStartClick);
    $fullscreenStop.on('click', onFullscreenStopClick);
    $fullList.on('click', onFullListClick);

    if (screenfull.raw) {
        $(document).on(screenfull.raw.fullscreenchange, onFullscreenChange);
    }

    $castStart.on('click', onCastStartClick);
    $welcomeCastStartButton.on('click', onCastStartClick);
    $castStop.on('click', onCastStopClick);

    SHARE.setup();

    if (RESET_STATE) {
        resetState();
        resetLegalLimits();
    }

    if (APP_CONFIG.ENFORCE_PLAYBACK_LIMITS) {
        $html.addClass('enforce-playback-limits');
        $playFavorites.hide();
    }

    setupChromecastLanding();
    loadState();
    setupAudio();

    $video.coverVid(1280, 720);

    if(!is_touch){
        $video.get(0).play();
    }

    $(document).keydown(onDocumentKeyDown);

    setInterval(checkSkips, 60000);

    new Newscast.Newscast({
        'namespace': APP_CONFIG.CHROMECAST_NAMESPACE,
        'appId': APP_CONFIG.CHROMECAST_APP_ID,
        'onReceiverCreated': onCastReceiverCreated,
        'onReceiverAddSender': onCastReceiverAddSender,
        'onSenderCreated': onCastSenderCreated,
        'onSenderReady': onCastSenderReady,
        'onSenderStarted': onCastSenderStarted,
        'onSenderReconnected': onCastSenderReconnected,
        'onSenderStopped': onCastSenderStopped,
        'debug': true
    });
}

/*
 * Configure jPlayer.
 */
var setupAudio = function() {
    $audioPlayer.jPlayer({
        pause: onAudioPaused,
        play: onAudioPlayed,
        ended: onAudioEnded,
        volume: (NO_AUDIO ? 0 : 1),
        supplied: 'mp3',
        loop: false,
        timeupdate: onAudioTimeUpdate,
        swfPath: APP_CONFIG.S3_BASE_URL + '/js/lib/jquery.jplayer.swf'
    });
}

/*
 * Audio began playing.
 */
var onAudioPlayed = function() {
    $pause.show();
    $play.hide();

    if (castReceiver) {
        castReceiver.sendMessage('play');
    }
}

/*
 * Audio is now paused.
 */
var onAudioPaused = function() {
    $play.show();
    $pause.hide();

    if (castReceiver) {
        castReceiver.sendMessage('pause');
    }
}

/*
 * Track finished playing.
 */
var onAudioEnded = function(e) {
    onAudioPaused();
    playNextSong();
}

/*
 * Update playback timer display.
 */
var onAudioTimeUpdate = function(e) {
    var currentTime = e.jPlayer.status.currentTime;
    var currentTimeText = $.jPlayer.convertTime(currentTime);
    var duration = e.jPlayer.status.duration;
    var durationText = $.jPlayer.convertTime(duration);

    $currentTime.text(currentTimeText);

    if (durationText !== "0:00") {
        $duration.text(durationText);
    }
};

/*
 * Start playing the welcome audio.
 */
var playWelcomeAudio = function() {
    $audioPlayer.jPlayer('setMedia', {
        mp3: 'http://podcastdownload.npr.org/anon.npr-mp3' + APP_CONFIG.WELCOME_AUDIO
    });

    $playerArtist.text('');
    $playerTitle.text('');

    if (NO_AUDIO){
        playNextSong();
    } else {
        $audioPlayer.jPlayer('play');
    }
}

/*
 * Play the next song in the playlist.
 */
var playNextSong = function(nextSongID) {
    // Don't transition to new song if already playing
    // Case 1 can happen when sender first communicates with receiver. Case 2 is if the last song is playing so there is no next song
    if (castReceiver === null && currentSongID === nextSongID) {
        return;
    }

    // nextSongID would've only been defined in onBackClick() 
    if (_.isUndefined(nextSongID)) { 
        nextSongID = getNextSongID();

        // If on the last song (there's no next song to play)
        if (nextSongID === null) {
            return;
        }
    }

    isFirstPlay = false;

    var nextSong = SONG_DATA[nextSongID];
    $nextSong = $('#song-' + nextSongID);

    // Render song if not already on page
    if ($nextSong.length == 0) {
        var context = $.extend(
            APP_CONFIG,
            nextSong,
            { 'castReceiver' : castReceiver }
        );
        $nextSong = $(JST.song(context));

        $songs.append($nextSong);
    }

    // Update player display
    $playerArtist.html(nextSong['artist']);
    $playerTitle.html(nextSong['title']);
    document.title = nextSong['artist'] + ' \u2014 \u2018' + nextSong['title'] + '\u2019 | ' + COPY.content['project_name'];

    if (!isSenderCasting) {
        // Start audio playback
        var nextsongURL = 'http://podcastdownload.npr.org/anon.npr-mp3' + nextSong['stream_url'] + '.mp3';

        $audioPlayer.jPlayer('setMedia', {
            mp3: nextsongURL
        }).jPlayer('play');
    }

    // Animate transitions
    if (isPlayingWelcome) {
        setSongHeight($nextSong);
        hideWelcome($nextSong);
    } else {
        if (castReceiver) {
            castReceiverTransitionToNextSong($currentSong, $nextSong);
        } else {
            transitionToNextSong($currentSong, $nextSong);
        }
    }

    // Rotate to new song
    $previousSong = $currentSong||$();
    $currentSong = $nextSong;

    // Add playing class to current song and remove from previous
    $currentSong.addClass('playing');
    $previousSong.removeClass('playing');

    // Collapse any open song cards that are not the current song
    $songs.find('.song').not($currentSong).not($previousSong).addClass('small');

    currentSongID = nextSong['id'];

    var currentSongIndex = getIndexOfCurrentSong();

    if (currentSongIndex > maxSongIndex || maxSongIndex === null) {
        maxSongIndex = currentSongIndex;

        if ((maxSongIndex + 1) % 5 === 0) {
            ANALYTICS.trackEvent('max-song-index', (maxSongIndex + 1).toString());
        }        

        simpleStorage.set('maxSongIndex', maxSongIndex);
    }

    if (castReceiver) {
        castReceiver.sendMessage('now-playing', currentSongID);
    }

    updateBackNextButtons();
    updateTotalSongsPlayed();
    writeSkipsRemaining();
    preloadSongImages();
}

var updateBackNextButtons = function() {
    var songs = getCurrentSongList();

    // Are there songs before this one?
    if (currentSongID == songs[0] || APP_CONFIG.ENFORCE_PLAYBACK_LIMITS){
        $back.addClass('disabled');
    } else {
        $back.removeClass('disabled');
    }

    // Are there songs after this one?
    if (currentSongID == songs[songs.length - 1]) {
        $skip.addClass('disabled');
    } else {
        $skip.removeClass('disabled');
    }
}

/*
 * Update the total songs played
 */
var updateTotalSongsPlayed = function() {
    $playedSongs.text(maxSongIndex + 1);
}

/*
 * Get the next song to rotate into the player.
 */
var getNextSongID = function() {
    var nextSongID = null;
    var songs = getCurrentSongList();

    // If the user has played songs before    
    if (maxSongIndex !== null) {
        // If this is the first play of the session, play the last song that was ever played
        if (isFirstPlay) {
            nextSongID = songs[maxSongIndex];
        
        // If this ISN'T the first play of the session                            
        } else {
            var indexOfCurrentSong = getIndexOfCurrentSong();

            if (indexOfCurrentSong == songs.length - 1) {
                // Loop at the end, otherwise we can get into weird restart scenarios
                return songs[0];
            } else {
                nextSongID = songs[indexOfCurrentSong + 1];
            }
        }

    // If this is the first time the user is playing any song            
    } else {
        nextSongID = songs[0];
    }

    return nextSongID;    
}

/*
 * Animate transition forward or backward to the next song to play.
 */
var transitionToNextSong = function($fromSong, $toSong) {
    // toSong is in the history
    if ($toSong.offset().top < $fromSong.offset().top) {
        $toSong.velocity("scroll", {
            duration: 350,
            offset: -fixedHeaderHeight,
            begin: function() {
                $(document).off('scroll');
            },
            complete: function() {
                setSongHeight($toSong);
                shrinkSong($fromSong);
                $(document).on('scroll', onDocumentScroll);
                toggleHistoryButton();
            }
        });
    // toSong is in history, but further down the list than fromSong
    } else if ($toSong.attr('id') !== $songs.children().last().attr('id') && $toSong.attr('id') !== $fromSong.next().attr('id')) {
        var shrinkOffset = $fromSong.outerHeight() - $toSong.outerHeight();
        $("html").velocity('scroll', {
            duration: 300,
            offset: $(document).scrollTop() + shrinkOffset,
            begin: function() {
                shrinkSong($fromSong);
            },
            complete: function() {
                setSongHeight($toSong);

                $toSong.velocity("scroll", {
                    duration: 500,
                    offset: -(fixedHeaderHeight),
                    delay: 300,
                    begin: function() {
                        $(document).off('scroll');
                    },
                    complete: function() {
                        $(document).on('scroll', onDocumentScroll);
                        toggleHistoryButton();
                    }
                });
            }
        });
    // toSong is newly added to the list
    } else {
        setSongHeight($toSong);
        $fromSong.velocity("scroll", {
            duration: 350,
            offset: -fixedHeaderHeight,
            begin: function() {
                $(document).off('scroll');
            },
            complete: function() {
                shrinkSong($fromSong);
                $toSong.velocity('fadeIn', {
                    duration: 300,
                    complete: function(){
                        $(this).velocity("scroll", {
                            duration: 500,
                            offset: -fixedHeaderHeight,
                            delay: 300,
                            complete: function() {
                                $(document).on('scroll', onDocumentScroll);

                                toggleHistoryButton();
                            }
                        });
                    }
                });
            }
        });
    }
}

/*
 * Transition to next song on Chromecast receiver.
 */
var castReceiverTransitionToNextSong = function($fromSong, $toSong) {
    $songs.find('.song').hide();
    setSongHeight($toSong);
    $toSong.show();
}

/*
 *  Display a song in the condensed layout
 */
var shrinkSong = function($el) {
    $el.find('.container-fluid').css('height', 0);
    $el.css('min-height', '0');
    $el.addClass('small');
}

/*
 *  Set the height of the currently playing song to fill the viewport.
 */
var setSongHeight = function($song){
    windowHeight = is_touch ? window.innerHeight || $(window).height() : $(window).height();
    songHeight = windowHeight - $player.height() - $fixedHeader.height();

    $songs.css('min-height', windowHeight - $player.height());

    if (_.isUndefined($song) && $currentSong !== null) {
        $song = $currentSong;
    }

    if ($song !== null) {
        $song.find('.container-fluid').css('height', songHeight);
        $song.css('min-height', songHeight);
        $song.removeClass('small');
    }
}

/*
 * Parse the id of a song from the song HTML.
 */
var getSongIDFromHTML = function($song) {
    return $song.attr('id').split('-')[1];
}

/*
 * Get the index of the current song in the list of songs to play.
 */
var getIndexOfCurrentSong = function() {
    var songs = getCurrentSongList();

    return _.indexOf(songs, currentSongID);
}

/*
 * Preload song art to make things smoother.
 */
var preloadSongImages = function() {
    if (currentSongID == songOrder[songOrder.length - 1]) {
        return;
    }

    // Include previous song. Case: castReceiver loads all songs at once so starting at a random point and clicking back would mean the song art was not pre-loaded.
    var nextSongIDs = [songOrder[getIndexOfCurrentSong() + 1], songOrder[getIndexOfCurrentSong() - 1]];

    _.each(nextSongIDs, function(nextSongID) {
        var nextSong = SONG_DATA[nextSongID]

        if (!nextSong) {
            return;
        }

        if (checkSongArtCached('http://npr.org' + nextSong['song_art']) == false) {
            var songArt = new Image();
            songArt.src = 'http://npr.org' + nextSong['song_art'];
        } else {
            return;
        }
    });      
}

var checkSongArtCached = function(src) {
    var songArt = new Image();
    songArt.src = src;

    return songArt.complete;
}

/*
 * User clicked to skip to the next song
 */
var skipSong = function() {
    if (APP_CONFIG.ENFORCE_PLAYBACK_LIMITS) {
        if (usedSkips.length < APP_CONFIG.SKIP_LIMIT) {
            usedSkips.push(moment.utc());

            playNextSong();
            simpleStorage.set('usedSkips', usedSkips);
            writeSkipsRemaining();
        } else {
            $skip.addClass('disabled');
        }
    } else {
        playNextSong();
    }
}

/*
 * Return to previous song in the list.
 */
var backSong = function() {
    var songs = getCurrentSongList();
    var playedIndex = getIndexOfCurrentSong();
    var previousSongID = songs[playedIndex - 1];

    playNextSong(previousSongID);         
}

/*
 * Show only favorite songs in the list.
 */
var showFavoriteSongs = function() {
    var $favoritedSongs = [];

    for (var i = 0; i < favoritedSongs.length; i++) {
        var songId = favoritedSongs[i];

        $favoritedSongs.push($('#song-' + songId)[0]);
    }

    $songs.find('.song').not($favoritedSongs).hide();
}

/*
 * Show all songs in the list.
 */
var showAllSongs = function() {
    $songs.find('.song').show();
}

/*
 * Load state from browser storage
 */
var loadState = function() {
    favoritedSongs = simpleStorage.get('favoritedSongs') || [];
    maxSongIndex = simpleStorage.get('maxSongIndex') || null;
    usedSkips = simpleStorage.get('usedSkips') || [];
    totalSongsPlayed = simpleStorage.get('totalSongsPlayed') || 0;
    songOrder = simpleStorage.get('songOrder') || null;

    if (songOrder === null) {
        songOrder = _.shuffle(_.keys(SONG_DATA));
        simpleStorage.set('songOrder', songOrder);
    } 

    if (isReceiverCasting) {
        $landingFirstDeck.hide();
        $landingReturnDeck.hide();
        $landingCastReceiverDeck.show();       
    } else {
        if (maxSongIndex !== null) {
            buildListeningHistory();
            $landingReturnDeck.show();        
        } else {
            $landingFirstDeck.show();       
        }  
    }      

    if (favoritedSongs.length > 0) {
        for (var i = 0; i < favoritedSongs.length; i++) {
            var $favoritedSong = $('#song-' + favoritedSongs[i]);

            var $songsFavoriteStar = $favoritedSong.find('.favorite .heart');
            
            $songsFavoriteStar.removeClass('icon-heart-empty');
            $songsFavoriteStar.addClass('icon-heart');
        }
    }

    checkSkips();

    if (!APP_CONFIG.ENFORCE_PLAYBACK_LIMITS) {
        checkNumberOfFavorites();        
    }
}

/*
 * Reconstruct listening history from stashed id's.
 */
var buildListeningHistory = function() {
    // Remove last played song so we can continue playing the song where we left off. 
    var lastSongIndex = maxSongIndex; 

    if (castReceiver) {
        lastSongIndex = songOrder.length - 1;
    } 

    for (var i = 0; i <= lastSongIndex; i++) {
        var songID = songOrder[i];
        var song = SONG_DATA[songID];

        var context = $.extend(APP_CONFIG, song);
        var html = JST.song(context);

        $songs.append(html);
    };

    $songs.find('.song').addClass('small');
}

/*
 * Reset everything we can legally reset
 */
var resetState = function() {
    simpleStorage.deleteKey('favoritedSongs');
    simpleStorage.set('maxSongIndex');
    simpleStorage.set('songOrder');
}

/*
 * Reset the legal limitations. For development only.
 */
var resetLegalLimits = function() {
    simpleStorage.set('usedSkips', usedSkips);
}

/*
 * Check to see if some skips are past the skip limit window
 */
var checkSkips = function() {
    var now = moment.utc();
    var skipped = true;

    while (skipped) {
        skipped = false;

        for (i = 0; i < usedSkips.length; i++) {
            if (now.subtract(1, 'hour').isAfter(usedSkips[i])) {
                usedSkips.splice(i, 1);
                skipped = true;
                break;
            }
        }
    }

    simpleStorage.set('usedSkips', usedSkips);
    writeSkipsRemaining();
}

/*
 * Update the skip limit display
 */
var writeSkipsRemaining = function() {
    if (APP_CONFIG.ENFORCE_PLAYBACK_LIMITS) {
        // If there is only one skip left
        if (usedSkips.length == APP_CONFIG.SKIP_LIMIT - 1) {

            var numberOfSkipsAvailable = APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skip available';
            if (!is_touch){
                $skip.tooltip('hide').attr('title', numberOfSkipsAvailable).tooltip('fixTitle').tooltip('show');
            }

            $skipsRemaining.text(numberOfSkipsAvailable);
            $skip.removeClass('disabled');
        }
        // If all skips used
        else if (usedSkips.length == APP_CONFIG.SKIP_LIMIT) {
            var text = 'Skipping available in ';
                text += moment(usedSkips[usedSkips.length - 1]).add(1, 'hour').fromNow(true);
            if (!is_touch){
                $skip.tooltip('hide').attr('title', text).tooltip('fixTitle').tooltip('show');  
            }
            $skipsRemaining.text(text);
            $skip.addClass('disabled');
        }
        // If there is more than one skip left
        else {
            var numberOfSkipsAvailable = APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skips available';

            if (!is_touch){
                $skip.tooltip('hide').attr('title', numberOfSkipsAvailable).tooltip('fixTitle').tooltip('show');
            }

            $skipsRemaining.text(numberOfSkipsAvailable);
            $skip.removeClass('disabled');
        }
    } else {
        return null;
    }
}

/*
 * Hide the welcome screen and show the playing song
 */
var hideWelcome  = function($song) {
    // if (isSenderCasting) {
    //     $songsWrapper.hide();
    // }

    $('.songs, .player-container').show();
    $fixedHeader.show();
    $song.velocity("scroll", {
        duration: 750,
        offset: -fixedHeaderHeight,
        complete: function() {
            $('.landing-wrapper').hide().css('height', '');
            $landing.velocity('fadeOut', {
                duration: 1000,
                complete: function() {
                    $('.poster').removeClass('shrink').attr('style','');
                }
            });
        }
    });

    isPlayingWelcome = false;
}

/*
 * Animate the tape deck after landing click
 */
var swapTapeDeck = function() {
    $landing.find('.poster-static').css('opacity', 0);
    $landing.find('.poster').css('opacity', 1);
    $landing.addClass('start');

    $landing.find('.tip-one').addClass('show');

    _.delay(function() {
        $landing.find('.tip-one').removeClass('show');
    }, 4000);

    _.delay(function() {
        $landing.find('.tip-two').addClass('show');
    }, 5000);

    _.delay(function() {
        $landing.find('.tip-two').removeClass('show');
    }, 9000);

    _.delay(function() {
        $landing.find('.tip-three').addClass('show');
    }, 10000);
}

/*
 * Get the current playing list of songs (songOrder or favoritedSongs).
 */
var getCurrentSongList = function() {
    if (playFavorites) {
        return favoritedSongs;
    }

    return songOrder;
}

/*
 * Helper function for getting the song artist and title.
 * For analytics tracking.
 */
var getSongEventName = function(songId) {
    return SONG_DATA[songId]['artist'] + ' - ' + SONG_DATA[songId]['title'];
}

/*
 * Check if play history is visible
 */
var toggleHistoryButton = function(e) {
    var currentSongIndex = getIndexOfCurrentSong();

    // Hide if there is no history
    if (currentSongIndex == 0) {
        $historyButton.addClass('offscreen');

        return;
    }

    // Hide if not on last song
    if (playFavorites) {
        if (currentSongID !== favoritedSongs[favoritedSongs.length - 1]) {
            $historyButton.addClass('offscreen');
            
            return;
        }
    } else {
        if (currentSongIndex !== maxSongIndex) {
            $historyButton.addClass('offscreen');

            return;
        }
    }

    var currentSongOffset = $currentSong.offset().top - 50;
    var windowScrollTop = $(window).scrollTop();

    if (currentSongOffset < windowScrollTop + fixedHeaderHeight){
        $historyButton.removeClass('offscreen');
    } else {
        $historyButton.addClass('offscreen');
    }
}

/*
 * Begin shuffled playback from the landing screen.
 */
var onGoButtonClick = function(e) {
    e.preventDefault();

    ANALYTICS.begin('go');

    swapTapeDeck();
    $songs.find('.song').remove();
    playWelcomeAudio();

    if (PLAY_LAST) {
        nextSongID = songOrder[songOrder.length - 1];    
    }
}

/*
 * Resume listening from the landing screen.
 */
var onContinueButtonClick = function(e) {
    e.preventDefault();

    ANALYTICS.begin('welcome-back');

    $landing.velocity('fadeOut');

    if (PLAY_LAST) {
        nextSongID = songOrder[songOrder.length - 1];  
        playNextSong(nextSongID);  
    } else {
        playNextSong();
    }
}

/*
 * Skip the welcome audio.
 */
var onSkipIntroClick = function(e) {
    e.stopPropagation();

    playNextSong();
}

/*
 * Play only favorited tracks.
 */
var onPlayFavoritesClick = function(e) {
    e.preventDefault();
    e.stopPropagation();

    if ($(this).hasClass('disabled')) {
        return;
    }

    $playFavorites.addClass('hide');
    $playAll.removeClass('hide');
    
    playFavorites = true;
    $html.addClass('playing-favorites');
    
    showFavoriteSongs();
    updateBackNextButtons();

    if (isSenderCasting) {
        castSender.sendMessage('play-favorites', favoritedSongs.join(','));
    } else {
        // Advance to next track if current track is not in favorites list
        if (_.indexOf(favoritedSongs, currentSongID) < 0) {
            playNextSong();
        } else {
            $currentSong.velocity('scroll', {
                duration: 0,
                offset: -fixedHeaderHeight,
                complete: function() {
                    toggleHistoryButton();
                }
            });
        }
    }
}

/*
 * Play all tracks.
 */
var onPlayAllClick = function(e) {
    e.stopPropagation();

    $playAll.addClass('hide');
    $playFavorites.removeClass('hide');

    playFavorites = false;
    $html.removeClass('playing-favorites');    

    showAllSongs();
    updateBackNextButtons();

    $currentSong.velocity('scroll', {
        duration: 0,
        offset: -fixedHeaderHeight,
        complete: function() {
            toggleHistoryButton();
        }
    });

    if (isSenderCasting) {
        castSender.sendMessage('play-all');
    }
}


/*
 * Initiate fullscreen
 */
var onFullscreenStartClick = function(e) {
    e.preventDefault();

    if (screenfull.enabled) {
        screenfull.request();  
    }
}

/*
 * Exit fullscreen
 */
var onFullscreenStopClick = function(e) {
    e.preventDefault();

    if (screenfull.enabled) {
        screenfull.exit();      
    }
}

/*
 * Fullscreen status changed.
 */
var onFullscreenChange = function() {
    if (screenfull.isFullscreen) {
        ANALYTICS.startFullscreen(); 

        $fullscreenStop.show();
        $fullscreenStart.hide();         
    } else {
        ANALYTICS.stopFullscreen();  

        $fullscreenStop.hide();
        $fullscreenStart.show();          
    }
}

/*
 * Full-list link clicked.
 */
var onFullListClick = function() {
    ANALYTICS.trackEvent('full-list');
}

/*
 * User clicked to begin chromecasting.
 */
var onCastStartClick = function(e) {
    e.preventDefault();

    castSender.startCasting();
}

/*
 * User clicked to stop chromecasting.
 */
var onCastStopClick = function(e) {
    e.preventDefault();

    castSender.stopCasting();
    $castStop.hide();
    $castStart.show();
}



/*
 * Scroll to the top of the history
 */
var onShowHistoryClick = function() {
    $songs.velocity('scroll');
}

/*
 * Play the song, show the pause button
 */
var onPlayClick = function(e) {
    e.preventDefault();

    if (isSenderCasting) {
        castSender.sendMessage('play');
    } else {
        $audioPlayer.jPlayer('play'); 
    }   
}

/*
 * Pause the song, show the play button
 */
var onPauseClick = function(e) {
    e.preventDefault();

    if (isSenderCasting) {
        castSender.sendMessage('pause');
    } else {
        $audioPlayer.jPlayer('pause');
    }
}

/*
 * Handle clicks on the skip button.
 */
var onSkipClick = function(e) {
    e.preventDefault();

    if ($(this).hasClass('disabled')) {
        return;
    }

    var songEventName = getSongEventName(currentSongID);
    ANALYTICS.trackEvent('song-skip', songEventName);

    if (isSenderCasting) {
        castSender.sendMessage('skip');
    } else {
        skipSong();
    }
}

/*
 * User clicked to return to previous song.
 */
var onBackClick = function(e) {
    e.preventDefault();

    if ($(this).hasClass('disabled')) {
        return;
    }

    var songEventName = getSongEventName(songOrder[getIndexOfCurrentSong() - 1]);
    ANALYTICS.trackEvent('song-back', songEventName);

    if (isSenderCasting) {
        castSender.sendMessage('back');
    } else {
        backSong();
    }   
}

/*
 * Toggle played song card size
 */
var onSongCardClick = function(e) {
    var songEventName = getSongEventName(getSongIDFromHTML($(this)));

    if ($(this).hasClass('small')) {
        ANALYTICS.trackEvent('song-show-details', songEventName);
    }

    if ($(this).attr('id') !== $currentSong.attr('id')) {
        $songs.find('.song').not($currentSong).not($(this)).addClass('small');
        $(this).toggleClass('small');
    }
}

/*
 * Track Amazon clicks on songs.
 */
var onAmazonClick = function(e) {
    var songId = getSongIDFromHTML($(this).parents('.song'));
    var songName = getSongEventName(songId);

    ANALYTICS.trackEvent('amazon-click', songName);

    e.stopPropagation();
}

/*
 * Track iTunes clicks on songs.
 */
var oniTunesClick = function(e) {
    var songId = getSongIDFromHTML($(this).parents('.song'));
    var songName = getSongEventName(songId);

    ANALYTICS.trackEvent('itunes-click', songName);

    e.stopPropagation();
}

/*
 * Track Rdio clicks on songs.
 */
var onRdioClick = function(e) {
    var songId = getSongIDFromHTML($(this).parents('.song'));
    var songName = getSongEventName(songId);

    ANALYTICS.trackEvent('rdio-click', songName);

    e.stopPropagation();
}

/*
 * Track Spotify clicks on songs.
 */
var onSpotifyClick = function(e) {
    var songId = getSongIDFromHTML($(this).parents('.song'));
    var songName = getSongEventName(songId);

    ANALYTICS.trackEvent('spotify-click', songName);

    e.stopPropagation();
}

/*
 * Favorite or unfavorite a track.
 */
var onFavoriteClick = function(e) {
    e.stopPropagation();

    $(this).parents('.song').find('.heart').toggleClass('icon-heart-empty icon-heart');

    var songID = getSongIDFromHTML($(this).parents('.song'));

    if (_.indexOf(favoritedSongs, songID) < 0) {
        ANALYTICS.trackEvent('song-favorite', getSongEventName(songID));

        favoritedSongs.push(songID);
        
        // favoritedSongs must be in the same order as songOrder
        favoritedSongs = _.sortBy(favoritedSongs, function(songId) { 
            return _.indexOf(songOrder, songId); 
        });

        simpleStorage.set('favoritedSongs', favoritedSongs);
    } else {
        ANALYTICS.trackEvent('song-unfavorite', getSongEventName(songID));

        var indexOfSongToUnfavorite = _.indexOf(favoritedSongs, songID);
        favoritedSongs.splice(indexOfSongToUnfavorite, 1);

        // If the unfavorite leaves the favoritedSongs list empty, revert the song count text to 'all songs' mode
        if (favoritedSongs.length === 0) {
            $html.removeClass('playing-favorites');
        };

        // favoritedSongs must be in the same order as songOrder
        favoritedSongs = _.sortBy(favoritedSongs, function(songId) { 
            return _.indexOf(songOrder, songId); 
        });

        simpleStorage.set('favoritedSongs', favoritedSongs);

        if (playFavorites) {
            $(this).parents('.song').hide();
        }
    }

    if (!APP_CONFIG.ENFORCE_PLAYBACK_LIMITS) {
        if (favoritedSongs.length > 0) {
            $playFavorites.removeClass('disabled');

            // Update castReceiver's list of favorites
            if (playFavorites) {
                if (isSenderCasting) {
                    castSender.sendMessage('play-favorites', favoritedSongs.join(','));
                } else {
                    if (_.indexOf(favoritedSongs, songID) < 0) {
                        playNextSong();
                    }
                }
            }
        } else {
            $playAll.addClass('hide');
            $playFavorites.addClass('disabled').show();

            if (playFavorites) {
                playFavorites = false;

                showAllSongs();
                updateBackNextButtons();

                if (isSenderCasting) {
                    castSender.sendMessage('play-all');
                    $currentSong.velocity('scroll', { duration: 750, offset: -fixedHeaderHeight });
                } else {
                    playNextSong();
                }
            }
        }  

        checkNumberOfFavorites();        
    }
}

var checkNumberOfFavorites = function() {
    if (favoritedSongs.length === 0) {
        $playFavorites.addClass('disabled');
    } else {
        $playFavorites.removeClass('disabled');
        updateNumberOfFavorites();
    }
}

var updateNumberOfFavorites = function() {
    $numberOfFavorites.text(favoritedSongs.length);
}

/*
 * Play link on a specific track clicked.
 */
var onJumpToSongClick = function(e) {
    e.stopPropagation();

    var songID = getSongIDFromHTML($(this).parents('.song'));    

    var songEventName = getSongEventName(songID);

    ANALYTICS.trackEvent('song-back', songEventName);

   if (isSenderCasting) {
       castSender.sendMessage('start-song', songID);
   } else {
       playNextSong(songID);            
   }
}

/*
 * Handle keyboard navigation.
 */
var onDocumentKeyDown = function(e) {
    switch (e.which) {
        //left
        case 37:
            if ($back.hasClass('disabled')) {
                break;
            }

            var songEventName = getSongEventName(songOrder[getIndexOfCurrentSong() - 1]);
            ANALYTICS.trackEvent('song-back', songEventName);            

            if (isSenderCasting) {
                castSender.sendMessage('back');
            }
            backSong();  

            break;

        //right
        case 39:
            if ($skip.hasClass('disabled')) {
                break;
            }

            var songEventName = getSongEventName(currentSongID);
            ANALYTICS.trackEvent('song-skip', songEventName);            

            if (isSenderCasting) {
                castSender.sendMessage('skip');
            }        
            if (!(e.altKey)) {                
                skipSong();
            }
            break;

        // space
        case 32:
            e.preventDefault();

            if (isSenderCasting) {
                if ($play.is(':visible')) {
                    castSender.sendMessage('play');
                } else {
                    castSender.sendMessage('pause');
                }
            } else {
                if ($audioPlayer.data('jPlayer').status.paused) {
                    $audioPlayer.jPlayer('play');
                } else {
                    $audioPlayer.jPlayer('pause');       
                }           
            }

            break;
    }
    return true;
}

/*
 * Resize the welcome page to fit perfectly.
 */
var onWindowResize = function(e) {
    var height = $(window).height();
    var width = (height * 3) / 2;
    fixedHeaderHeight = parseInt($html.css('font-size')) * 4;

    is_small_screen = Modernizr.mq('screen and (max-width: 767px)');
    $landing.find('.landing-wrapper').css('height', $(window).height());
    setSongHeight($currentSong);
}

/*
 * Document scrolled
 */
var onDocumentScroll = _.throttle(function(e) {
    toggleHistoryButton();       
}, 200);

$(onDocumentLoad);
