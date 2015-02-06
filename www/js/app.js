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
var $totalSongs = null;
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

var $castButtons = null;
var $castStart = null;
var $castStop = null;
var $castScreen = null;

// URL params
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var RESET_STATE = (window.location.search.indexOf('resetstate') >= 0);
var ALL_HISTORY = (window.location.search.indexOf('allhistory') >= 0);

// Global state
var firstShareLoad = true;
var playedSongs = [];
var onWelcome = true;
var playedsongCount = null;
var usedSkips = [];
var totalSongsPlayed = 0;
var songHistory = {};
var songHeight = null;
var fixedHeaderHeight = null;
var is_small_screen = false
var inPreroll = false;
var favoritedSongs = [];
var songOrder = null;
var isFirstPlay = true;

var isCasting = false;
var castSender = null;
var castReceiver = null;

// Change to true to enforce skip limit
ENFORCE_SKIP_LIMIT = false;

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
    $totalSongs = $('.total-songs');
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

    $castButtons = $('.chromecast');
    $castStart = $('.chromecast .start');
    $castStop = $('.chromecast .stop');
    $castScreen = $('.cast-controls');

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
    $songs.on('click', '.song:not(:last-child)', onSongCardClick);
    $songs.on('click', '.song-tools .amazon', onAmazonClick);
    $songs.on('click', '.song-tools .itunes', oniTunesClick);
    $songs.on('click', '.song-tools .rdio', onRdioClick);
    $songs.on('click', '.song-tools .spotify', onSpotifyClick);
    $songs.on('click', '.song-tools .star', onStarClick);

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

    Newscast({
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

    castReceiver.onMessage('toggle-audio', onCastReceiverToggleAudio);
    castReceiver.onMessage('skip-song', onCastReceiverSkipSong);
    castReceiver.onMessage('toggle-genre', onCastReceiverToggleGenre);
    castReceiver.onMessage('toggle-curator', onCastReceiverToggleCurator);
    castReceiver.onMessage('send-playlist', onCastReceiverPlaylist);
    castReceiver.onMessage('send-tags', onCastReceiverTags);
    castReceiver.onMessage('send-history', onCastReceiverHistory);
    castReceiver.onMessage('send-played', onCastReceiverPlayed);
    castReceiver.onMessage('init', onCastReceiverInit);

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

    $stack.hide();
    $fullscreenStart.hide();
    $castStop.show();
    $castStart.hide();
    $audioPlayer.jPlayer('stop');

    isCasting = true;

    if (!IS_FAKE_CASTER) {
        $chromecastScreen.show();
    }

    castSender.sendMessage('send-tags', JSON.stringify(selectedTags));
    castSender.sendMessage('send-playlist', JSON.stringify(playlist));
    castSender.sendMessage('send-history', JSON.stringify(songHistory));
    castSender.sendMessage('send-played', JSON.stringify(playedSongs));
    castSender.sendMessage('init');

    castSender.onMessage('genre-ended', onCastGenreEnded);
}

/*
 * A cast session stopped.
 */
var onCastSenderStopped = function() {
    $castStart.show();
    $castStop.hide();
    isCasting = false;

    $chromecastScreen.hide();
    $stack.show();
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

var onCastGenreEnded = function() {
    console.log('fired');
    resetGenreFilters();
}

var onCastReceiverToggleAudio = function(message) {
    if (message === 'play') {
        $audioPlayer.jPlayer('play');
    } else {
        $audioPlayer.jPlayer('pause');
    }
}

var onCastReceiverSkipSong = function() {
    skipSong();
}

var onCastReceiverToggleGenre = function(message) {
    toggleGenre(message);
}

var onCastReceiverToggleCurator = function(message) {
    toggleCurator(message);
}

var onCastReceiverPlaylist = function(message) {
    playlist = JSON.parse(message);
    console.log(playlist);
}

var onCastReceiverTags = function(message) {
    selectedTags = JSON.parse(message);
    console.log(selectedTags);
}

var onCastReceiverHistory = function(message) {
    songHistory = JSON.parse(message);
    console.log(songHistory);
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
    $('.songs, .player-container, .playlist-filters').show();
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
 * Start playing the preroll audio.
 */
var playIntroAudio = function() {
    var audioFile = null;

    // if on welcome screen, play the intro audio
    if (onWelcome) {
        audioFile = APP_CONFIG.WELCOME_AUDIO;
    }

    // if there is no audio (i.e. genres), just play the next song
    if (!audioFile) {
        playNextSong();
        return;
    }

    inPreroll = true;

    if (!onWelcome) {
        $('.stack .poster').velocity('fadeIn');
        $skipsRemaining.hide();
    }

    $audioPlayer.jPlayer('setMedia', {
        mp3: 'http://podcastdownload.npr.org/anon.npr-mp3' + audioFile
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
    if (_.isUndefined(nextSongID)) {
        if (isFirstPlay && playedSongs.length > 0) {
            nextSongID = playedSongs[playedSongs.length-1];
        } else {
            nextSongID = _.find(songOrder, function(songID) {
                return !(_.contains(playedSongs, songID));
            })
        }
    }

    isFirstPlay = false;

    var nextSong = SONG_DATA[nextSongID];

    // check if we can play the song legally (4 times per 3 hours)
    // if we don't have a song, get a new playlist
    if (ENFORCE_SKIP_LIMIT && nextSong) {
        var canPlaySong = checkSongHistory(nextSong);
        if (!canPlaySong) {
            return;
        } else {
            // TODO: go back and play first song in playedSongs? 
            // nextPlaylist();
            // return;
        }
    }

    $currentSong = $('#song-' + nextSongID);

    if ($currentSong.length == 0) {
        var context = $.extend(APP_CONFIG, nextSong);
        $currentSong = $(JST.song(context));

        if (isCasting) {
            $songs.prepend($currentSong);
        } else {
            $songs.append($currentSong);
        }        
    }

    $songs.find('.song').addClass('small');
    $songs.find('.song .container-fluid').css('height', 0);
    $songs.find('.song').css('min-height', 0);
    $currentSong.removeClass('small');

    $playerArtist.html(nextSong['artist']);
    $playerTitle.html(nextSong['title']);
    document.title = nextSong['artist'] + ' \u2014 \u2018' + nextSong['title'] + '\u2019 | ' + COPY.content['project_name'];
    $skipsRemaining.show();

    var nextsongURL = 'http://podcastdownload.npr.org/anon.npr-mp3' + nextSong['media_url'] + '.mp3';

    inPreroll = false;

    if (!NO_AUDIO) {
        $audioPlayer.jPlayer('setMedia', {
            mp3: nextsongURL
        }).jPlayer('play');
    }
    $play.hide();
    $pause.show();

    if (onWelcome) {
        $currentSong.css('min-height', songHeight).show();
        $currentSong.find('.container-fluid').css('height', songHeight);

        hideWelcome();
    } else {
        setCurrentSongHeight();
        $currentSong.find('.container-fluid').css('height', songHeight);
        $currentSong.prev().velocity("scroll", {
            duration: 350,
            offset: -fixedHeaderHeight,
            begin: function() {
                $(document).off('scroll');
            },
            complete: function() {
                $('.stack .poster').velocity('fadeOut', {
                    duration: 500
                });
                $currentSong.prev().find('.container-fluid').css('height', '0');
                $currentSong.prev().find('.song-info').css('min-height', 0);
                $currentSong.prev().css('min-height', '0').addClass('small');
                $currentSong.css('min-height', songHeight)
                    .velocity('fadeIn', {
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

    markSongPlayed(nextSong);
    updateTotalSongsPlayed();
    writeSkipsRemaining();
    preloadSongImages();
}

var onStarClick = function(e) {
    e.stopPropagation();

    $(this).toggleClass('fa-star-o fa-star'); 

    var songID = $(this).parents('.song').attr('id').split('-')[1];

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
var setCurrentSongHeight = function(){
    if ($currentSong !== null) {
        windowHeight = Modernizr.touch ? window.innerHeight || $(window).height() : $(window).height();
        songHeight = windowHeight - $player.height() - $fixedHeader.height();

        $currentSong.find('.container-fluid').css('height', songHeight);
        $currentSong.css('min-height', songHeight);
    }
}


/*
 * Check the song history to see if you've played it
 * more than 4 times in 3 hours
 */
var checkSongHistory = function(song) {
    if (songHistory[song['id']]) {
        for (var i = 0; i < songHistory[song['id']].length; i++) {
            var now = moment.utc();
            if (now.subtract(3, 'hours').isAfter(songHistory[song['id']][i])) {
                songHistory[song['id']].splice(i,1);
            }
        }

        if (songHistory[song['id']].length >= 4) {
            markSongPlayed(song);
            playNextSong();
            return false;
        }
    } else {
        songHistory[song['id']] = [];
    }

    songHistory[song['id']].push(moment.utc());
    simpleStorage.set('songHistory', songHistory);

    return true;
}

/*
 * Update the total songs played
 */
var updateTotalSongsPlayed = function() {
    totalSongsPlayed++;
    simpleStorage.set('totalSongsPlayed', totalSongsPlayed);

    if (totalSongsPlayed % 5 === 0) {
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'songs-played', '', totalSongsPlayed]);
    }
}

/*
 * Play the song, show the pause button
 */
var onPlayClick = function(e) {
    e.preventDefault();

    if (isCasting) {
        castSender.sendMessage('toggle-audio', 'play');
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

    if (isCasting) {
        castSender.sendMessage('toggle-audio', 'pause');
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

    if (isCasting) {
        castSender.sendMessage('skip-song');
    } else {
        skipSong();
    }
}

var onBackClick = function(e) {
    e.preventDefault();

    var songID = $currentSong.attr('id').split('-')[1];
    var playedIndex = _.indexOf(playedSongs, songID);
    var previousSongID = playedSongs[playedIndex - 1];

    playNextSong(previousSongID);
    console.log('last song played: ' + previousSongID)
}

/*
 * Skip to the next song
 */
var skipSong = function() {
    if (ENFORCE_SKIP_LIMIT) {
        if (inPreroll || usedSkips.length < APP_CONFIG.SKIP_LIMIT) {
            if (!inPreroll) {
                usedSkips.push(moment.utc());
                _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'song-skip', $playerArtist.text() + ' - ' + $playerTitle.text(), usedSkips.length]);
            }

            playNextSong();
            simpleStorage.set('usedSkips', usedSkips);
            writeSkipsRemaining();
        } 
    } else {
        playNextSong();
    }
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
    if (ENFORCE_SKIP_LIMIT) {
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
    songHistory = simpleStorage.get('songHistory') || {};
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
    simpleStorage.set('playedPreroll', false);
}

/*
 * Reset the legal limitations. For development only.
 */
var resetLegalLimits = function() {
    usedSkips = [];
    simpleStorage.set('usedSkips', usedSkips);
    songHistory = {}
    simpleStorage.set('songHistory', songHistory);
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
    playIntroAudio();
}

/*
 * Hide the welcome screen and show the playing song
 */
var hideWelcome  = function() {
    if (isCasting) {
        $chromecastScreen.show();
    }

    $('.songs, .player-container').show();
    $fixedHeader.show();

    var $song = $songs.find('.song').last();

    setCurrentSongHeight();

    $song.velocity("scroll", { duration: 750, offset: -fixedHeaderHeight });
    $('.landing-wrapper').hide().css('height', '');
    $landing.velocity('fadeOut', {
        delay: 4000,
        duration: 1000,
        complete: function() {
            $('.poster').removeClass('shrink').attr('style','');
        }
    });

    onWelcome = false;

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
    playIntroAudio();

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
    $(this).toggleClass('small');
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
    $songs.find('.song:not(:last)').addClass('small');
    $songs.velocity('scroll');
}

/*
 * Check if play history is visible
 */
var toggleHistoryButton = function(e) {
    if (playedSongs.length < 2) {
        return;
    }

    var currentSongOffset = $songs.find('.song').last().offset().top - 50;
    var windowScrollTop = $(window).scrollTop();
    if (currentSongOffset < windowScrollTop + fixedHeaderHeight){
        $historyButton.removeClass('offscreen');
    } else {
        $historyButton.addClass('offscreen');
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
    setCurrentSongHeight();
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
