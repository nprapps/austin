// Global jQuery references
var $html = null;
var $body = null;
var $shareModal = null;
var $goButton = null;
var $continueButton = null;
var $audioPlayer = null;
var $playerArtist = null;
var $playerTitle = null;
var $currentTime = null;
var $playedSongs = null;
var $skip = null;
var $songs = null;
var $landing = null;
var $fixedHeader = null;
var $landingReturnDeck = null;
var $landingFirstDeck = null;
var $shuffleSongs = null;
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

var $castButtons = null;
var $castStart = null;
var $castStop = null;

// URL params
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var RESET_STATE = (window.location.search.indexOf('resetstate') >= 0);
var ALL_HISTORY = (window.location.search.indexOf('allhistory') >= 0);

// Global state
var firstShareLoad = true;
var playedSongs = [];
var isPlayingWelcome = true;
var playedsongCount = null;
var usedSkips = [];
var totalSongsPlayed = 0;
var songHeight = null;
var fixedHeaderHeight = null;
var is_small_screen = false;
var favoritedSongs = [];
var songOrder = null;
var isFirstPlay = true;

var isSenderCasting = false;
var castSender = null;
var castReceiver = null;

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $html = $('html');
    $body = $('body');
    $shareModal = $('#share-modal');
    $goButton = $('.go');
    $continueButton = $('.continue');
    $audioPlayer = $('#audio-player');
    $songs = $('.songs');
    $skip = $('.skip');
    $playerArtist = $('.player .artist');
    $playerTitle = $('.player .song-title');
    $currentTime = $('.current-time');
    $playedSongs = $('.played-songs');
    $landing = $('.landing');
    $fixedHeader = $('.fixed-header');
    $landingReturnDeck = $('.landing-return-deck');
    $landingFirstDeck = $('.landing-firstload-deck');
    $shuffleSongs = $('.shuffle-songs');
    $player = $('.player-container')
    $play = $('.play');
    $back = $('.back');
    $pause = $('.pause');
    $historyButton = $('.js-show-history');
    $skipsRemaining = $('.skips-remaining');
    $songsWrapper = $('.songs-wrapper');

    $fullscreenButtons = $('.fullscreen');
    $fullscreenStart = $('.fullscreen .start');
    $fullscreenStop = $('.fullscreen .stop');    

    $castButtons = $('.chromecast');
    $castStart = $('.chromecast .start');
    $castStop = $('.chromecast .stop');

    onWindowResize();
    $landing.show();

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $goButton.on('click', onGoButtonClick);
    $continueButton.on('click', onContinueButtonClick);
    $skip.on('click', onSkipClick);
    $play.on('click', onPlayClick);
    $back.on('click', onBackClick);
    $pause.on('click', onPauseClick);
    $(window).on('resize', onWindowResize);
    $(document).on('scroll', onDocumentScroll);
    $shuffleSongs.on('click', onShuffleSongsClick);
    $historyButton.on('click', showHistory);
    $songs.on('click', '.song', onSongCardClick);
    $songs.on('click', '.song-tools .amazon', onAmazonClick);
    $songs.on('click', '.song-tools .itunes', oniTunesClick);
    $songs.on('click', '.song-tools .rdio', onRdioClick);
    $songs.on('click', '.song-tools .spotify', onSpotifyClick);
    $songs.on('click', '.song-tools .star', onStarClick);


    $fullscreenStart.on('click',onFullscreenStartClick);
    $fullscreenStop.on('click', onFullscreenStopClick); 
    $(document).on(screenfull.raw.fullscreenchange, onFullscreenChange);

    $castStart.on('click', onCastStartClick);
    $castStop.on('click', onCastStopClick);

    // configure ZeroClipboard on share panel
    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));

    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    if (RESET_STATE) {
        resetState();
        resetLegalLimits();
    }

    setupAudio();
    loadState();

    setInterval(checkSkips, 60000);

    new Newscast.Newscast({
        'namespace': APP_CONFIG.CHROMECAST_NAMESPACE,
        'appId': APP_CONFIG.CHROMECAST_APP_ID,
        'onReceiverCreated': onCastReceiverCreated,
        'onSenderCreated': onCastSenderCreated,
        'onSenderReady': onCastSenderReady,
        'onSenderStarted': onCastSenderStarted,
        'onSenderStopped': onCastSenderStopped,
        'debug': true
    });
}

/*
 * Chromecast receiver mode activated.
 */
var onCastReceiverCreated = function(receiver) {
    castReceiver = receiver;
    castReceiver.onMessage('init', onCastReceiverInit);
    castReceiver.onMessage('play', onCastReceiverPlay);
    castReceiver.onMessage('pause', onCastReceiverPause);
    castReceiver.onMessage('skip', onCastReceiverSkipSong);
    castReceiver.onMessage('back', onCastReceiverBack);
    castReceiver.onMessage('send-played', onCastReceiverPlayed);    
}

/*
 * Chromecast sender mode activated.
 */
var onCastSenderCreated = function(sender) {
    castSender = sender;
}

/*
 * A cast device is available.
 */
var onCastSenderReady = function() {
    $castButtons.show();
    $castStop.hide();
}

/*
 * A cast session started.
 */
var onCastSenderStarted = function() {
    // TODO: stop audio

    $fullscreenStart.hide();
    $castStop.show();
    $castStart.hide();
  
    $audioPlayer.jPlayer('stop');

    isSenderCasting = true;

    castSender.sendMessage('init');
}

/*
 * A cast session stopped.
 */
var onCastSenderStopped = function() {
    $castStart.show();
    $castStop.hide();
    isSenderCasting = false;
}

/*
 * Begin chromecasting.
 */
var onCastStartClick = function(e) {
    e.preventDefault();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'chromecast-start']);

    castSender.startCasting();
}

/*
 * Stop chromecasting.
 */
var onCastStopClick = function(e) {
    e.preventDefault();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'chromecast-stop']);

    castSender.stopCasting();
    $castStop.hide();
    $castStart.show();
}

var onCastReceiverPlay = function() {
    $audioPlayer.jPlayer('play');
    $play.hide();
    $pause.show();
}

var onCastReceiverPause = function() {
    $audioPlayer.jPlayer('pause');
    $pause.hide();
    $play.show();
}

var onCastReceiverSkipSong = function() {
    skipSong();
}

var onCastReceiverBack = function() {
    backSong();
}

var onCastReceiverPlayed = function(message) {
    playedSongs = JSON.parse(message);

    for (i = 0; i < playedSongs.length; i++) {
        playedSongs[i] = parseInt(playedSongs[i]);
    }
    console.log(playedSongs);
}

var onCastReceiverInit = function() {
    $landing.hide();
    $fixedHeader.show();
    $songsWrapper.show();
    _.delay(playNextSong, 1000);
}

/*
 * Configure jPlayer.
 */
var setupAudio = function() {
    $audioPlayer.jPlayer({
        ended: onAudioEnded,
        supplied: 'mp3',
        loop: false,
        timeupdate: onTimeUpdate,
        swfPath: APP_CONFIG.S3_BASE_URL + '/js/lib/jquery.jplayer.swf'
    });
}

var onAudioEnded = function(e) {
    var time = e.jPlayer.status.currentTime;

    if (time != 0 && time != e.jPlayer.status.duration) {
        // End fired prematurely
        console.log(e.jPlayer.status.currentTime);
        console.log(e.jPlayer.status.currentPercentAbsolute);
        console.log(e.jPlayer.status.currentPercentRelative);
        console.log(e.jPlayer.status.duration);

        // Try to restart
        $audioPlayer.jPlayer('play');
    }

    playNextSong();
}

/*
 * Update playback timer display.
 */
var onTimeUpdate = function(e) {
    var time_text = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
    $currentTime.text(time_text);
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

    if (!NO_AUDIO){
        $audioPlayer.jPlayer('play');
    } else {
        playNextSong();
    }
}

/*
 * Play the next song in the playlist.
 */
var playNextSong = function(nextSongID) {
    // nextSongID would've only been defined in onBackClick()  
    if (_.isUndefined(nextSongID)) {  
        nextSongID = getNextSongID();
    }

    isFirstPlay = false;

    var nextSong = SONG_DATA[nextSongID];
    $nextSong = $('#song-' + nextSongID);

    // Render song if not already on page
    if ($nextSong.length == 0) {
        var context = $.extend(APP_CONFIG, nextSong);
        $nextSong = $(JST.song(context));

        $songs.append($nextSong);
    }

    // Update player display
    $playerArtist.html(nextSong['artist']);
    $playerTitle.html(nextSong['title']);
    document.title = nextSong['artist'] + ' \u2014 \u2018' + nextSong['title'] + '\u2019 | ' + COPY.content['project_name'];
    $skipsRemaining.show();

    // Start audio playback
    if (!NO_AUDIO) {
        var nextsongURL = 'http://podcastdownload.npr.org/anon.npr-mp3' + nextSong['media_url'] + '.mp3';

        $audioPlayer.jPlayer('setMedia', {
            mp3: nextsongURL
        }).jPlayer('play');
    }

    $play.hide();
    $pause.show();

    // Animate transitions
    if (isPlayingWelcome) {
        setSongHeight($nextSong);
        hideWelcome($nextSong);
    } else {
        transitionToNextSong($currentSong, $nextSong);
    }

    // Rotate to new song
    $previousSong = $currentSong;    
    $currentSong = $nextSong;

    if (nextSongID == songOrder[0] || APP_CONFIG.ENFORCE_PLAYBACK_LIMITS){
        $back.addClass('disabled');
    } else {
        $back.removeClass('disabled');
    }
    markSongPlayed(nextSong);
    updateTotalSongsPlayed();
    writeSkipsRemaining();
    preloadSongImages();
}

/*
 * Get the next song to rotate into the player.
 */
var getNextSongID = function() {
    var nextSongID = null;

    // If the user has played songs before    
    if (playedSongs.length > 0) {
        // If this is the first play of the session, play the last song that was ever played
        if (isFirstPlay) {
            nextSongID = playedSongs[playedSongs.length-1]; 
        
        // If this ISN'T the first play of the session                            
        } else {
            var currentSongID = getSongIDFromHTML($currentSong);
            var indexOfCurrentSong = _.indexOf(playedSongs, currentSongID);

            // If this song has been played before
            if (indexOfCurrentSong < playedSongs.length - 1) {

                nextSongID = playedSongs[indexOfCurrentSong + 1];

            // If this song has never been played before, draw up an unheard one for the next song                          
            } else {
                nextSongID = _.find(songOrder, function(songID) {
                    return !(_.contains(playedSongs, songID));
                })
            }                
        }

    // If this is the first time the user is playing any song            
    } else {
        nextSongID = songOrder[0];
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

                if (playedSongs.length > 1) {
                    $historyButton.show();
                    $historyButton.removeClass('offscreen');
                }
            }
        });
    // toSong is in history, but further down the list than fromSong
    } else if ($toSong.hasClass('small') && $toSong.attr('id') !== $fromSong.next().attr('id')) {
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
                        if (playedSongs.length > 1) {
                            $historyButton.show();
                            $historyButton.removeClass('offscreen');
                        }
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

                                if (playedSongs.length > 1) {
                                    $historyButton.show();
                                    $historyButton.removeClass('offscreen');
                                }
                            }
                        });
                    }
                });
            }
        });
    }
}

/*
 *  Display a song in the condensed layout
 */
var shrinkSong = function($el) {
    $el.css('min-height', '0').addClass('small');
    $el.find('.container-fluid').css('height', 0);
}

var getSongIDFromHTML = function($song) {
    return $song.attr('id').split('-')[1];
}

var onStarClick = function(e) {
    e.stopPropagation();

    $(this).toggleClass('icon-heart-empty icon-heart');

    var songID = getSongIDFromHTML($(this).parents('.song'));

    if ($(this).hasClass('fa-star')) {
        favoritedSongs.push(songID);
        simpleStorage.set('favoritedSongs', favoritedSongs);
    } else {
        var indexOfSongToUnfavorite = _.indexOf(favoritedSongs, songID);
        favoritedSongs.splice(indexOfSongToUnfavorite, 1);
        simpleStorage.set('favoritedSongs', favoritedSongs);
    }
}

/*
 * Preload song art to make things smoother.
 */
var preloadSongImages = function() {
    var nextSongID = _.find(songOrder, function(songID) {
        return !(_.contains(playedSongs, songID));
    })

    var nextSong = SONG_DATA[nextSongID];    

    if (!nextSong) {
        return;
    }

    var songArt = new Image();
    songArt.src = 'http://npr.org' + nextSong['song_art'];
}

/*
 *  Set the height of the currently playing song to fill the viewport.
 */
var setSongHeight = function($song){
    if (_.isUndefined($song) && $currentSong !== null) {
        $song = $currentSong;
    }
    if ($song !== null) {
        windowHeight = Modernizr.touch ? window.innerHeight || $(window).height() : $(window).height();
        songHeight = windowHeight - $player.height() - $fixedHeader.height();

        $song.find('.container-fluid').css('height', songHeight);
        $song.css('min-height', songHeight);
        $song.removeClass('small');
    }
}

/*
 * Update the total songs played
 */
var updateTotalSongsPlayed = function() {

    $playedSongs.text(playedSongs.length);

    // if (totalSongsPlayed % 5 === 0) {
    //     _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'songs-played', '', totalSongsPlayed]);
    // }
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

    $play.hide();
    $pause.show();
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

    $pause.hide();
    $play.show();
}

/*
 * Handle clicks on the skip button.
 */
var onSkipClick = function(e) {
    e.preventDefault();

    if (isSenderCasting) {
        castSender.sendMessage('skip');
    } else {
        skipSong();
    }
}

var onBackClick = function(e) {
    e.preventDefault();

    if (isSenderCasting) {
        castSender.sendMessage('back')
    } else {
        backSong();      
    }
}

/*
 * Skip to the next song
 */
var skipSong = function() {
    if (APP_CONFIG.ENFORCE_PLAYBACK_LIMITS) {
        if (usedSkips.length < APP_CONFIG.SKIP_LIMIT) {
            usedSkips.push(moment.utc());
            _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'song-skip', $playerArtist.text() + ' - ' + $playerTitle.text(), usedSkips.length]);

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

var backSong = function() {
    var songID = getSongIDFromHTML($currentSong);
    var playedIndex = _.indexOf(playedSongs, songID);
    var previousSongID = playedSongs[playedIndex - 1];

    playNextSong(previousSongID);         
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
        if (usedSkips.length == APP_CONFIG.SKIP_LIMIT - 1) {
            $skipsRemaining.text(APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skip available')
            $skip.removeClass('disabled');
        }
        else if (usedSkips.length == APP_CONFIG.SKIP_LIMIT) {
            var text = 'Skipping available in ';
                text += moment(usedSkips[usedSkips.length - 1]).add(1, 'hour').fromNow(true);
            $skipsRemaining.text(text);
            $skip.addClass('disabled');
        }
        else {
            $skipsRemaining.text(APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skips available')
            $skip.removeClass('disabled');
        }
    } else {
        return null;
    }
}

/*
 * Load state from browser storage
 */
var loadState = function() {
    favoritedSongs = simpleStorage.get('favoritedSongs') || [];
    playedSongs = simpleStorage.get('playedSongs') || [];
    usedSkips = simpleStorage.get('usedSkips') || [];
    totalSongsPlayed = simpleStorage.get('totalSongsPlayed') || 0;
    songOrder = simpleStorage.get('songOrder') || null;

    if (ALL_HISTORY) {
        for (var i=1; i < SONG_DATA.length; i++) {
            markSongPlayed(SONG_DATA[i]);
        }
    }

    if (playedSongs.length > 0) {
        buildListeningHistory();
        $landingReturnDeck.show();        
    } else {
        $landingFirstDeck.show();       
    }

    if (songOrder === null) {
        shuffleSongs();
    } 

    if (favoritedSongs.length > 0) {
        for (var i = 0; i < favoritedSongs.length; i++) {
            var $favoritedSongs = $('#' + favoritedSongs[i]);

            var $songsFavoriteStars = $favoritedSongs.find('.star');
            
            $songsFavoriteStars.removeClass('fa-star-o');
            $songsFavoriteStars.addClass('fa-star');
        }
    }

    checkSkips();
}

/*
 * Reset everything we can legally reset
 */
var resetState = function() {
    playedSongs = [];
    favoritedSongs = [];

    simpleStorage.set('playedSongs', playedSongs);
    simpleStorage.set('favoritedSongs', favoritedSongs);
}

/*
 * Reset the legal limitations. For development only.
 */
var resetLegalLimits = function() {
    usedSkips = [];
    simpleStorage.set('usedSkips', usedSkips);
}

/*
 * Mark the current song as played and save state.
 */
var markSongPlayed = function(song) {
    if (!_.contains(playedSongs, song['id'])) {
        playedSongs.push(song['id']);  
        simpleStorage.set('playedSongs', playedSongs);      
    }
}

/*
 * Reconstruct listening history from stashed id's.
 */
var buildListeningHistory = function() {
    // Remove last played song so we can continue playing the song where we left off.   
    for (var i = 0; i < playedSongs.length - 1; i++) {
        var songID = playedSongs[i];

        var song = SONG_DATA[songID];

        var context = $.extend(APP_CONFIG, song);
        var html = JST.song(context);
        $songs.append(html);
    };
    $songs.find('.song').addClass('small');
}

/*
 * Shuffle the entire list of songs.
 */
var shuffleSongs = function() {
    songOrder = _.shuffle(_.keys(SONG_DATA));
    simpleStorage.set('songOrder', songOrder);
}

/*
 * Shuffle all the songs.
 */
var onShuffleSongsClick = function(e) {
    e.preventDefault();

    shuffleSongs();
    resetState();
}

/*
 * Hide the welcome screen and show the playing song
 */
var hideWelcome  = function($song) {
    if (isSenderCasting) {
        $songsWrapper.hide();
    }

    $('.songs, .player-container').show();
    $fixedHeader.show();

    $song.velocity("scroll", { duration: 750, offset: -fixedHeaderHeight });
    $('.landing-wrapper').hide().css('height', '');
    $landing.velocity('fadeOut', {
        delay: 4000,
        duration: 1000,
        complete: function() {
            $('.poster').removeClass('shrink').attr('style','');
        }
    });

    isPlayingWelcome = false;

    $(document).keydown(onDocumentKeyDown);
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
 * Begin shuffled playback from the landing screen.
 */
var onGoButtonClick = function(e) {
    e.preventDefault();
    swapTapeDeck();
    $songs.find('.song').remove();
    playedSongs = [];
    simpleStorage.set('playedSongs', playedSongs);
    playWelcomeAudio();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'shuffle']);
}

/*
 * Resume listening from the landing screen.
 */
var onContinueButtonClick = function(e) {
    e.preventDefault();
    $landing.velocity('fadeOut');
    playNextSong();
}

/*
 * Toggle played song card size
 */
var onSongCardClick = function(e) {
    if (getSongIDFromHTML($(this)) !== getSongIDFromHTML($currentSong)) {
        var song = getSongIDFromHTML($(this));
        playNextSong(song);
    }
}

/*
 * Handle keyboard navigation.
 */
var onDocumentKeyDown = function(e) {
    switch (e.which) {
        //right
        case 39:
            if (!(e.altKey)) {
                skipSong();
            }
            break;
        // space
        case 32:
            e.preventDefault();
            if ($audioPlayer.data('jPlayer').status.paused) {
                $audioPlayer.jPlayer('play');
                $pause.show();
                $play.hide();
            } else {
                $audioPlayer.jPlayer('pause');
                $pause.hide();
                $play.show();
            }
            break;
    }
    return true;
}

/*
 * Track Amazon clicks on songs.
 */
var onAmazonClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'amazon-click', thisSong]);

    e.stopPropagation();
}

/*
 * Track iTunes clicks on songs.
 */
var oniTunesClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'itunes-click', thisSong]);

    e.stopPropagation();
}

/*
 * Track Rdio clicks on songs.
 */
var onRdioClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'rdio-click', thisSong]);

    e.stopPropagation();
}

/*
 * Track Spotify clicks on songs.
 */
var onSpotifyClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'spotify-click', thisSong]);

    e.stopPropagation();
}

/*
 * Helper function for getting the song artist and title.
 * For analytics tracking.
 */
var getSong = function($el) {
    var thisArtist = $el.parents('.song').find('.song-info .artist').text();
    var thisTitle = $el.parents('.song').find('.song-info .song-title').text();

    // cut out the smart quotes
    thisTitle = thisTitle.substring(1, thisTitle.length - 1);

    return thisArtist + ' - ' + thisTitle;
}

/*
 * Scroll to the top of the history
 */
var showHistory = function() {
    $songs.velocity('scroll');
}

/*
 * Check if play history is visible
 */
var toggleHistoryButton = function(e) {
    if (playedSongs.length < 2) {
        return;
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

var onFullscreenChange = function() {
    if (screenfull.isFullscreen) {
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'fullscreen-start']);        
        $fullscreenStop.show();
        $fullscreenStart.hide();         
    } else {
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'fullscreen-stop']);        
        $fullscreenStop.hide();
        $fullscreenStart.show();          
    }
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

/*
 * Share modal opened.
 */
var onShareModalShown = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'open-share-discuss']);
}

/*
 * Share modal closed.
 */
var onShareModalHidden = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'close-share-discuss']);
}

/*
 * Text copied to clipboard.
 */
var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'summary-copied']);
}

$(onDocumentLoad);
