var setupChromecastLanding = function() {
    // Desktop Chrome
    if (is_chrome && !is_touch) {
        $welcomeCastStartNote.hide();
        $welcomeCastStartButton.hide();        
        $isNotDesktopChrome.hide();
        $getCastExtension.show();  
    // Any mobile  
    } else if (is_touch) {
        $isDesktopChrome.hide();
        $isNotChrome.hide();        
        $isTouch.show();
    // Desktop not Chrome
    } else {
        $isDesktopChrome.hide();  
        $isTouch.hide();      
        $isNotChrome.show();
    }
}

/*
 * Chromecast receiver mode activated.
 */
var onCastReceiverCreated = function(receiver) {
    castReceiver = receiver;

    $html.addClass('is-cast-receiver');
    $player.find('.controls').hide();
    $fixedHeader.find('.fixed-header-controls').hide();
    $historyButton.hide();
}

/*
 * Chromecast receiver mode activated.
 */
var onCastReceiverCreated = function(receiver) {
    castReceiver = receiver;

    $html.addClass('is-cast-receiver');
    $player.find('.controls').hide();
    $fixedHeader.find('.fixed-header-controls').hide();
    $historyButton.hide();

    castReceiver.onMessage('init', onCastReceiverInit);
    castReceiver.onMessage('play', onCastReceiverPlay);
    castReceiver.onMessage('pause', onCastReceiverPause);
    castReceiver.onMessage('skip', onCastReceiverSkipSong);
    castReceiver.onMessage('back', onCastReceiverBack);   
    castReceiver.onMessage('start-song', onCastReceiverStartSong); 
    castReceiver.onMessage('play-favorites', onCastReceiverPlayFavorites);
    castReceiver.onMessage('play-all', onCastReceiverPlayAll);
}

/*
 * Sender connected to existing session.
 */
var onCastReceiverAddSender = function() {
    if (currentSongID !== null) {
        castReceiver.sendMessage('now-playing', currentSongID);        

        if (playFavorites) {
            castReceiver.sendMessage('playing-favorites'); 
        }
    }

    if ($audioPlayer.data('jPlayer').status.paused) {
        castReceiver.sendMessage('pause');
    } else {
        castReceiver.sendMessage('play');
    }
}

/*
 * Chromecast sender mode activated.
 */
var onCastSenderCreated = function(sender) {
    $isNotDesktopChrome.hide();
    $getCastExtension.hide();
    $welcomeCastStartNote.show();
    $welcomeCastStartButton.show();

    castSender = sender;

    castSender.onMessage('ready-to-play', onCastSenderReadyToPlay);
    castSender.onMessage('play', onCastSenderPlay);
    castSender.onMessage('pause', onCastSenderPause);
    castSender.onMessage('now-playing', onCastSenderNowPlaying);
    castSender.onMessage('playing-favorites', onCastSenderPlayingFavorites);
}

/*
 * A cast device is available.
 */
var onCastSenderReady = function() {
    ANALYTICS.readyChromecast();

    $castButtons.show();
    $castStop.hide();
}

/*
 * A cast session started.
 */
var onCastSenderStarted = function() {
    ANALYTICS.startChromecast();

    $landingCastReceiverDeck.show();   
    $landingFirstDeck.hide();
    $landingReturnDeck.hide();

    $fullscreenStart.hide();
    $castStop.show();
    $castStart.hide();
    $currentTime.hide();
    $duration.hide();    

    isSenderCasting = true;

    $audioPlayer.jPlayer('stop');

    senderSongOrder = songOrder.join(',');

    castSender.sendMessage('init', senderSongOrder);
}

/*
 * A cast session reconnected.
 */
var onCastSenderReconnected = function() {
    $fullscreenStart.hide();
    $castStop.show();
    $castStart.hide();
    $currentTime.hide();
    $duration.hide();

    $fixedHeader.show();
    $songsWrapper.show();
    $songs.show();
    $landing.hide();        
 
    isSenderCasting = true;

    $audioPlayer.jPlayer('stop');

    senderSongOrder = songOrder.join(',');
}

/*
 * A cast session stopped.
 */
var onCastSenderStopped = function() {
    ANALYTICS.stopChromecast();  
      
    $castStart.show();
    $castStop.hide();
    $currentTime.show();
    $duration.show();
    isSenderCasting = false;

    var song = SONG_DATA[currentSongID];
    var songURL = 'http://podcastdownload.npr.org/anon.npr-mp3' + song['download_url'] + '.mp3';

    $audioPlayer.jPlayer('setMedia', {
        mp3: songURL
    }).jPlayer('play');
}

/*
 * Sender requested receiver prepare for playback.
 */
var onCastReceiverInit = function(senderSongOrder) {
    isReceiverCasting = true;

    $landingCastReceiverDeck.show();      
    $landingFirstDeck.hide();
    $landingReturnDeck.hide();

    senderSongOrder = senderSongOrder.split(',');
    songOrder = senderSongOrder;
    simpleStorage.set('songOrder', songOrder);

    $songs.find('.song').remove();
    buildListeningHistory();

    castReceiver.sendMessage('ready-to-play');
}

/*
 * Sender requested that receiver begin playing.
 */
var onCastReceiverPlay = function(songId) {
    $audioPlayer.jPlayer('play');
}

/*
 * Sender requested that receiver pause.
 */
var onCastReceiverPause = function() {
    $audioPlayer.jPlayer('pause');
}

/*
 * Sender requested that receiver skip to the next song.
 */
var onCastReceiverSkipSong = function() {
    skipSong();
}

/*
 * Sender requested that the receiver go back to the previous song.
 */
var onCastReceiverBack = function() {
    backSong();
}

/*
 * Send requested that the receiver start a particular song.
 */
var onCastReceiverStartSong = function(songId) {
    songId = parseInt(songId);

    $fixedHeader.show();
    $songsWrapper.show();
    $landing.hide();    

    playNextSong(songId);
}

/*
 * Sender requested that the receiver begin playing only favorites.
 */
var onCastReceiverPlayFavorites = function(favorites) {
    favoritedSongs = favorites.split(',');
    playFavorites = true;
    
    // Advance to next track if current track is not in favorites list
    if (_.indexOf(favoritedSongs, currentSongID) < 0) {
        playNextSong();
    }
}

/*
 * Sender requested that the receiver return to playing all tracks.
 */
var onCastReceiverPlayAll = function() {
    playFavorites = false;
}

/*
 * Receiver reported it is ready to begin playing.
 */
var onCastSenderReadyToPlay = function() {
    var songId = currentSongID || getNextSongID();

    if (playFavorites) {
        castSender.sendMessage('play-favorites', favoritedSongs.join(','));
    }
        
    castSender.sendMessage('start-song', songId);
}

/*
 * Receiver reported that it is now playing a song.
 */
var onCastSenderNowPlaying = function(songId) {
    playNextSong(songId);
}

/*
 * Receiver reported it is now playing audio.
 */
var onCastSenderPlay = function() {
    $play.hide();
    $pause.show(); 
}

/*
 * Receiver reported audio is now paused.
 */
var onCastSenderPause = function() {
    $play.show();
    $pause.hide();
}

/*
 * Receiver reported it is now playing favorites.
 */
var onCastSenderPlayingFavorites = function() {
    $playFavorites.hide();
    $playAll.show();
    
    playFavorites = true;
    
    showFavoriteSongs();
    updateBackNextButtons();

    // Refresh favorites list on receiver
    castSender.sendMessage('play-favorites', favoritedSongs.join(','));
}

