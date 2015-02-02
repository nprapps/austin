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
var $allTags = null;
var $playlistLength = null;
var $totalSongs = null;
var $skip = null;
var $songsWrapper = null;
var $songs = null;
var $landing = null;
var $genreFilters = null;
var $filtersPanel = null;
var $fixedHeader = null;
var $landingReturnDeck = null;
var $landingFirstDeck = null;
var $shuffleSongs = null;
var $player = null;
var $play = null;
var $pause = null;
var $filtersButton = null;
var $currentDj = null;
var $fixedControls = null;
var $historyButton = null;
var $fullscreenButton = null;

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
var favoritedSongs = [];
var songOrder = [];
var playlist = [];
var selectedTag = null;
var playlistLength = null;
var onWelcome = true;
var playedsongCount = null;
var curator = null;
var totalSongsPlayed = 0;
var songHistory = {};
var songHeight = null;
var fixedHeaderHeight = null;
var is_small_screen = false
var inPreroll = false;

var isCasting = false;
var castSender = null;
var castReceiver = null;
var IS_CAST_RECEIVER = false;

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
    $songsWrapper = $('.songs-wrapper');
    $songs = $songsWrapper.find('.song');
    $skip = $('.skip');
    $playerArtist = $('.player .artist');
    $playerTitle = $('.player .song-title');
    $allTags = $('.playlist-filters li a');
    $currentTime = $('.current-time');
    $playlistLength = $('.playlist-length');
    $totalSongs = $('.total-songs');
    $tagsWrapper = $('.tags-wrapper');
    $landing = $('.landing');
    $genreFilters = $('.genre li a.genre-btn');
    $filtersPanel = $('.playlist-filters');
    $fixedHeader = $('.fixed-header');
    $landingReturnDeck = $('.landing-return-deck');
    $landingFirstDeck = $('.landing-firstload-deck');
    $shuffleSongs = $('.shuffle-songs');
    $player = $('.player-container')
    $play = $('.play');
    $pause = $('.pause');
    $filtersButton = $('.js-toggle-filters');
    $currentDj = $('.current-dj');
    $fixedControls = $('.fixed-controls');
    $historyButton = $('.js-show-history');

    $fullscreenButtons = $('.fullscreen');
    $fullscreenStart = $('.fullscreen .start');
    $fullscreenStop = $('.fullscreen .stop');

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
    $genreFilters.on('click', onGenreClick);
    $skip.on('click', onSkipClick);
    $play.on('click', onPlayClick);
    $pause.on('click', onPauseClick);
    $filtersButton.on('click', onFiltersButtonClick);
    $(window).on('resize', onWindowResize);
    $(document).on('scroll', onDocumentScroll);
    $shuffleSongs.on('click', onShuffleSongsClick);
    $historyButton.on('click', showHistory);
    $songsWrapper.on('click', '.song.small', onSongCardClick);
    $songsWrapper.on('click', '.song-tools .stars', onStarClick);
    $songsWrapper.on('click', '.song-tools .amazon', onAmazonClick);
    $songsWrapper.on('click', '.song-tools .itunes', oniTunesClick);
    $songsWrapper.on('click', '.song-tools .rdio', onRdioClick);
    $songsWrapper.on('click', '.song-tools .spotify', onSpotifyClick);
    $landing.on('click', '.poster.shrink', onFilterTipClick);

    $castStart.on('click', onCastStartClick);
    $castStop.on('click', onCastStopClick);

    $fullscreenStart.on('click', onFullscreenStartClick);
    $fullscreenStop.on('click', onFullscreenStopClick);

    // configure ZeroClipboard on share panel
    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));

    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    if (RESET_STATE) {
        resetState();
    }

    setupAudio();
    loadState();

    if (songOrder.length == 0) {
        shuffleSongs();
    }

    if (window.location.hash) {
        playSongFromHash();
    }

    /*Newscast({
        'namespace': APP_CONFIG.CHROMECAST_NAMESPACE,
        'appId': APP_CONFIG.CHROMECAST_APP_ID,
        'onReceiverCreated': onCastReceiverCreated,
        'onSenderCreated': onCastSenderCreated,
        'onSenderReady': onCastSenderReady,
        'onSenderStarted': onCastSenderStarted,
        'onSenderStopped': onCastSenderStopped,
        'debug': true
    });*/
}

/*
 * Chromecast receiver mode activated.
 */
var onCastReceiverCreated = function(receiver) {
    castReceiver = receiver;

    castReceiver.onMessage('toggle-audio', onCastReceiverToggleAudio);
    castReceiver.onMessage('skip-song', onCastReceiverSkipSong);
    castReceiver.onMessage('toggle-genre', onCastReceiverToggleGenre);
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
 * Initiate fullscreen
 */
var onFullscreenStartClick = function(e) {
    e.preventDefault();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'fullscreen-start']);

    screenfull.request();

    $fullscreenStop.show();
    $fullscreenStart.hide();
}

/*
 * Exit fullscreen
 */
var onFullscreenStopClick = function(e) {
    e.preventDefault();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'fullscreen-stop']);

    screenfull.exit();

    $fullscreenStop.hide();
    $fullscreenStart.show();
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
var playNextSong = function($nextSong) {
    if (_.isUndefined($nextSong)) {    
        var $currentSong = getCurrentSong();

        if ($currentSong.length > 0) {
            $nextSong = $currentSong.next();
        }
    }

    if (_.isUndefined($nextSong)) {
        if (playedSongs.length == $songs.length) {
            // if all songs have been played, reset to shuffle
            resetState();
        }

        /*if (IS_CAST_RECEIVER) {
            castReceiver.sendMessage('tag-ended');
        }*/

        //_gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'tag-finish', selectedTag]);

        //switchTag(null);

        $nextSong = $songs.eq(0);
    }

    var slug = $nextSong.attr('id');
    var artist = $nextSong.data('artist');
    var title = $nextSong.data('title');
    var mediaURL = $nextSong.attr('data-media-url');

    $songs.addClass('small');
    $nextSong.removeClass('small');    

    $playerArtist.html(artist);
    $playerTitle.html(title);
    document.title = artist + ' \u2014 \u2018' + title + '\u2019 | ' + COPY.content['project_name'];

    var nextsongURL = 'http://podcastdownload.npr.org/anon.npr-mp3' + mediaURL + '.mp3';

    inPreroll = false;

    if (!NO_AUDIO) {
        $audioPlayer.jPlayer('setMedia', {
            mp3: nextsongURL
        }).jPlayer('play');
    }

    // window.location.hash = '#' + nextSong['id'];
    window.history.replaceState(undefined, undefined, '#' + slug)

    $play.hide();
    $pause.show();

    if (onWelcome) {
        $nextSong.css('min-height', songHeight).show();
        $nextSong.find('.container-fluid').css('height', songHeight);

        hideWelcome();
    } else {
        setCurrentSongHeight();
        $nextSong.find('.container-fluid').css('height', songHeight);
        $nextSong.prev().velocity("scroll", {
            duration: 350,
            offset: -fixedHeaderHeight,
            begin: function() {
                $(document).off('scroll');
            },
            complete: function() {
                $('.stack .poster').velocity('fadeOut', {
                    duration: 500
                });
                $nextSong.prev().find('.container-fluid').css('height', '0');
                $nextSong.prev().find('.song-info').css('min-height', 0);
                $nextSong.prev().css('min-height', '0').addClass('small');
                $nextSong.css('min-height', songHeight)
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

    markSongPlayed(slug);
    updateTotalSongsPlayed();
}

/*
 * Play song specified in hash URL.
 */
var playSongFromHash = function() {
    var slug = window.location.hash.substring(1);

    var $song = $('#' + slug);

    if (!$song) {
        return;
    }

    buildPlaylist();
    updateTagDisplay();
    $landing.velocity('fadeOut');
    playNextSong($song);
}

var playLastSongFromHistory = function() {
    var $song = $('#' + lastSongPlayed);

    if (!$song) {
        return;
    }

    buildPlaylist();
    updateTagDisplay();
    $landing.velocity('fadeOut');
    playNextSong($song);
}

/*
 *  Set the height of the currently playing song to fill the viewport.
 */
var setCurrentSongHeight = function(){
    windowHeight = Modernizr.touch ? window.innerHeight || $(window).height() : $(window).height();
    songHeight = windowHeight - $player.height() - $fixedHeader.height() - $fixedControls.height();

    var $currentSong = getCurrentSong();
    $currentSong.find('.container-fluid').css('height', songHeight);
    $currentSong.css('min-height', songHeight);
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
 * Toggle filter panel
 */
var onFiltersButtonClick = function(e) {
    e.preventDefault();
    toggleFilterPanel();
    $filtersPanel.scrollTop(0);
}

var onFilterTipClick = function(e) {
    e.preventDefault();
    toggleFilterPanel();
    $(this).velocity('fadeOut', {
        duration: 300
    });
}

var toggleFilterPanel = function() {
    if (!$fixedControls.hasClass('expand')) {

        $fixedControls.addClass('expand');
    } else {
        $fixedControls.removeClass('expand');
    }
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

/*
 * Skip to the next song
 */
var skipSong = function() {
    if (!inPreroll) {
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'song-skip', $playerArtist.text() + ' - ' + $playerTitle.text(), 1]);
    }

    playNextSong();
}

/*
 * Load state from browser storage
 */
var loadState = function() {
    favoritedSongs = simpleStorage.get('favoritedSongs') || [];
    playedSongs = simpleStorage.get('playedSongs') || [];
    songOrder = simpleStorage.get('songOrder') || [];
    selectedTag = simpleStorage.get('selectedTag') || null;
    totalSongsPlayed = simpleStorage.get('totalSongsPlayed') || 0;
    lastSongPlayed = simpleStorage.get('lastSongPlayed') || null;

    if (songOrder.length > 0) {
        var orderedPlaylist = [];
        for (var i = 0; i < songOrder.length; i++) {
            var $matchingSong = $songsWrapper.find('#' + songOrder[i]);
            $matchingSong = $matchingSong.detach();
            orderedPlaylist.push($matchingSong);
        }
        $songsWrapper.append(orderedPlaylist);
    }

    if (ALL_HISTORY) {
        $songs.each(function($song) {
            markSongPlayed($song.attr('id'));
        });
    }

    if (playedSongs.length === $songs.length) {
        playedSongs = [];
    }

    if (playedSongs.length > 0 || selectedTag !== null) {
        $landingReturnDeck.show();
    } else {
        $landingFirstDeck.show();
    }

    if (favoritedSongs.length > 0) {
        for (var i = 0; i < favoritedSongs.length; i++) {
            var $favoritedSongs = $('#' + favoritedSongs[i]);

            var $songsFavoriteStars = $favoritedSongs.find('.stars');
            
            $songsFavoriteStars.removeClass('fa-star-o');
            $songsFavoriteStars.addClass('fa-star');
        }
    }
}

/*
 * Reset everything we can legally reset
 */
var resetState = function() {
    songOrder = [];
    playedSongs = [];
    favoritedSongs = [];
    selectedTag = null;
    lastSongPlayed = null;

    simpleStorage.set('favoritedSongs', favoritedSongs);
    simpleStorage.set('lastSongPlayed', lastSongPlayed);
    simpleStorage.set('songOrder', songOrder);
    simpleStorage.set('playedSongs', playedSongs);
    simpleStorage.set('selectedTag', selectedTag);
    simpleStorage.set('playedPreroll', false);
}

/*
 * Mark the current song as played and save state.
 */
var markSongPlayed = function(slug) {
    simpleStorage.set('lastSongPlayed', slug);
    playedSongs.push(slug);
    simpleStorage.set('playedSongs', playedSongs);
}

/*
 * Build a playlist from a set of tags.
 */
var buildPlaylist = function() {
    // TOOD: filter playlist divs
    // if (selectedTag === null) {
    //     playlist = SONG_DATA;
    // } else {
    //     playlist = _.filter(SONG_DATA, function(song) {
    //         var tags = song['genre_tags'];

    //         for (var i = 0; i < tags.length; i++) {
    //             if (selectedTag === tags[i]) {
    //                 return true;
    //             }
    //         }
    //     });
    // }
    updatePlaylistLength();
}


/*
 * Shuffle the entire list of songs.
 */
var shuffleSongs = function() {
    $songs.detach();
    $songs = $(_.shuffle($songs));
    $songsWrapper.append($songs);

    songOrder = [];

    $songs.each(function(i, song) {      
        songOrder.push($(song).attr('id'));

    });

    simpleStorage.set('songOrder', songOrder); 
}

/*
 * Update playlist length display.
 */
var updatePlaylistLength = function() {
    // TODO: how do we filter playlists?
    $playlistLength.text(playlist.length);
    $totalSongs.text($songs.length);
}

/*
 * Handle clicks on genre buttons
 */
var onGenreClick = function(e) {
    e.preventDefault();

    var genre = $(this).data('tag');

    if (isCasting) {
        castSender.sendMessage('toggle-genre', genre);
    } else {
        switchTag(genre);
    }

    toggleFilterPanel();
}

/*
 * Switch the selectedTag, update the display and build the new playlist
 */
var switchTag = function(tag, noAutoplay) {
    if (selectedTag === tag && tag !== null) {
        return;
    } else {
        selectedTag = tag;
        simpleStorage.set('selectedTag', selectedTag);
    }

    updateTagDisplay();
    buildPlaylist();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'switch-tag', selectedTag]);
}

/*
 * Highlight whichever tags are currently selected and clear all other highlights.
 */
var updateTagDisplay = function() {
    $allTags.addClass('disabled');
    $allTags.filter('[data-tag="' + selectedTag + '"]').removeClass('disabled');

    if (selectedTag === null) {
        var allSongsText = 'All our favorite songs'.toUpperCase();
        $currentDj.text(allSongsText);
        $shuffleSongs.removeClass('disabled');
    } else {
        var tag = selectedTag;
        if (selectedTag !== '\\m/ >_< \\m/') {
            tag = tag.toUpperCase();
        }

        $currentDj.text(tag);
    }
}

/*
 * Shuffle all the songs.
 */
var onShuffleSongsClick = function(e) {
    e.preventDefault();

    shuffleSongs();
    resetState();
    toggleFilterPanel();
    updateTagDisplay();
    buildPlaylist();
    playIntroAudio();
}

var getCurrentSong = function() {
    var $currentSong = $songs.not('.small');  
    return $currentSong;  
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
    setCurrentSongHeight();

    var $currentSong = getCurrentSong();

    $currentSong.velocity("scroll", { duration: 750, offset: -fixedHeaderHeight });

    $landing.velocity({
        bottom: '5rem',
        height: '4rem',
    }, {
        duration: 1000,
        timing: 'ease-in-out',
        begin: function() {
            $('.landing-wrapper').hide().css('height', '');
            $(this).find('.tip-three').removeClass('show');
            $(this).find('.done').velocity('fadeIn', {
                delay: 500
            });
            $(this).find('.poster').addClass('shrink');
        },
        complete: function() {
            $landing.velocity('fadeOut', {
                delay: 4000,
                duration: 1000,
                complete: function() {
                    $('.poster').removeClass('shrink').attr('style','');
                }
            });
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
    playedSongs = [];
    simpleStorage.set('playedSongs', playedSongs);
    switchTag(null, true);
    playIntroAudio();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'shuffle']);
}

/*
 * Resume listening from the landing screen.
 */
var onContinueButtonClick = function(e) {
    e.preventDefault();
    buildPlaylist();
    updateTagDisplay();
    $landing.velocity('fadeOut');
    
    if (lastSongPlayed) {
        var $song = $('#' + lastSongPlayed);
        playNextSong($song);        
    } else {
        playNextSong();
    }
}

/*
 * Toggle played song card size
 */
var onSongCardClick = function(e) {

    playNextSong($(this));
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

var onStarClick = function(e) {
    e.stopPropagation();

    $(this).toggleClass('fa-star-o fa-star');        

    var slug = $(this).parents('.song').attr('id');

    if ($(this).hasClass('fa-star')) {
        favoritedSongs.push(slug);
        simpleStorage.set('favoritedSongs', favoritedSongs);
    } else {
        _.find(favoritedSongs, function(songToUnfavorite) {
            if (songToUnfavorite == slug) {
                favoritedSongs.splice($.inArray(songToUnfavorite, favoritedSongs), 1);
                simpleStorage.set('favoritedSongs', favoritedSongs);
            }  
        });
    } 
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
    $songsWrapper.velocity('scroll');
}

/*
 * Check if play history is visible
 */
var toggleHistoryButton = function(e) {
    if (playedSongs.length < 2) {
        return;
    }

    var $currentSong = getCurrentSong();

    var currentSongOffset = $currentSong.offset().top - 50;
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
