import React, { Component } from 'react';
import './App.css';
import './App.scss';

import Announcement from 'react-announcement';
import Popup from "reactjs-popup";
import SpotifyWebApi from 'spotify-web-api-js';
const spotifyApi = new SpotifyWebApi();

class App extends Component {
  constructor(){
    super();
    const params = this.getHashParams();
    const token = params.access_token;
    if (token) {
      spotifyApi.setAccessToken(token);
    }
    this.state = {
      loggedIn: token ? true : false,
      nowPlaying: { name: 'Not Checked', albumArt: '' },
      allPlaylists: [],
      playlistsToWorkWith: [],
      total: 0,
      onlyOwnPlaylist: false,
      chosenPlaylists: [],
      allChecked: false,
      checkboxesPlaylists: [],
      startDate: '',
      endDate: '',
      playlistFetched: false,
      songsForPlaylist: {},
      playlistsToHide: [],
      songsFetched: false,
      allTracksWithoutKeys: [],
      name: '',
      opacity: '100%',
      opacity2: '100%',
      createdPlaylist: false,
      playlistLink: '',
      finishedFetchingSongs: false,
      randomSongLink: '',
      randomSongURL: '',
      useLinks: false,
      open: false,
      open2: false,
      noTracksFoundState: false,
      id: ''
    }

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openModal2 = this.openModal2.bind(this);
    this.closeModal2 = this.closeModal2.bind(this);

    spotifyApi.getMe()
      .then((response3) => {
        this.setState({
          id: response3.id,
          name: response3.display_name
        });
      })
  
  }

  openModal() {
    this.setState({ open: true });
  }
  closeModal() {
    this.setState({ open: false });
  }

  openModal2() {
    this.setState({ open2: true });
  }
  closeModal2() {
    this.setState({ open2: false });
  }

  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    e = r.exec(q)
    while (e) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
       e = r.exec(q);
    }
    return hashParams;
  }

  getNowPlaying(){
    spotifyApi.getMyCurrentPlaybackState()
      .then((response) => {
        this.setState({
          nowPlaying: { 
              name: response.item.name, 
              albumArt: response.item.album.images[0].url
            }
        });
      })
  }

  getPlaylists(){
    if (this.state.useLinks){
      this.setState({ playlistsToWorkWith: [] })
      var textareaString = document.getElementById("playlistTextArea").value;
      textareaString = textareaString.replace(/\s+/g, '');
      var links = textareaString.split(',');
      var playlistIDs = [];
      links.forEach(element => {
        var link = element.substring(34, 56);
        playlistIDs.push(link);
      });
      var playlistLinkCount = playlistIDs.length;
      var count = 0;
      var bley = this;
      playlistIDs.forEach(element => {
        spotifyApi.getPlaylist(element)
          .then((response) => {
            var joined = this.state.playlistsToWorkWith.concat(response);
            this.setState({ playlistsToWorkWith: joined })
            count++;
            if (count == playlistLinkCount){
              this.setState({
                playlistFetched: true,
                opacity: "0%"
              });
            }
          }, function(err) {
            //console.error(err);
            bley.setState({ playlistsToWorkWith: [] })
            bley.openModal2();
          });  
      });
    }else{
      this.start();
    }
  }

  start(){
    spotifyApi.getUserPlaylists()
      .then((response) => {
        this.setState({
          total: response.total
        });
        var dataToFetch = Math.ceil(response.total/50);
        var dataFetched = 0;
        var i = 0;
        //var playlists = [];
        while (i < response.total){
          //var playlists = [];
          spotifyApi.getUserPlaylists({"limit":"50", "offset":i})
          .then((response2) => {
            var playlists = response2.items.concat(this.state.allPlaylists);
            this.setState({
              allPlaylists: playlists
            });
            dataFetched++;
            if (dataFetched == dataToFetch) this.checkOwnPlaylists();
          })
          //var allPlaylists2 = oldPlaylists.concat(this.state.allPlaylists);
          i = i + 50;
        }
      })
  }

  checkOwnPlaylists(){
    if (this.state.onlyOwnPlaylist) this.clearPlaylists();
    else this.setState({ playlistsToWorkWith: this.state.allPlaylists })
    this.setState({
      playlistFetched: true,
      opacity: "0%"
    });
  }

  clearPlaylists(){
    //const wrongPlaylists = [];
    //const i = 0;
    this.state.allPlaylists.forEach(element => {
      if(element.owner.id !== this.state.id){
        //wrongPlaylists.push(i);
      }else{
        //this.state.playlistsToWorkWith.push(element);
        var joined = this.state.playlistsToWorkWith.concat(element);
        this.setState({ playlistsToWorkWith: joined })
      }
      //i++;
      //this.state.offset = wrongPlaylists.length;
    });
  }

  setOwnPlaylistsBool() {
    var checkBox = document.getElementById("checkboxOwnPlaylists");
    
    if (checkBox.checked == true){
      this.setState({
        onlyOwnPlaylist: true
      });
    } else {
      this.setState({
        onlyOwnPlaylist: false
      });
    }
  } 

  checkboxesPlaylists(playlist){
    if (this.state.chosenPlaylists.includes(playlist)){
      var playlists = [];
      playlists = playlists.concat(this.state.chosenPlaylists);
      const index = playlists.indexOf(playlist);
      if (index > -1) {
        playlists.splice(index, 1);
        this.setState({
          chosenPlaylists: playlists
        });
      }
    }else{
      var playlists = this.state.chosenPlaylists.concat(playlist);
      this.setState({
        chosenPlaylists: playlists
      });
    }
  }

  checkAllPlaylists(){
    if(this.state.checkboxesPlaylists.length < 1){
      var checkboxes = [];
      this.state.playlistsToWorkWith.forEach(element => {
        var checkBox = document.getElementById(element.id);
        checkboxes.push(checkBox);
      });
      this.setState({
        checkboxesPlaylists: checkboxes
      } , () => { 
        this.checkAllPlaylists2();
    });
    }else{
      this.checkAllPlaylists2();
    }
  }

  checkAllPlaylists2(){
    if(this.state.allChecked == true){
      this.setState({
        chosenPlaylists: [],
        allChecked: false
      });
      this.state.checkboxesPlaylists.forEach(element => {
        element.checked = false;
      });
    }else{
      //console.log("Check all playlists");
      var playlists = [];
      playlists = playlists.concat(this.state.playlistsToWorkWith);
      this.setState({
        chosenPlaylists: playlists,
        allChecked: true
      });
      console.log(this.state.checkboxesPlaylists.length)
      this.state.checkboxesPlaylists.forEach(element => {
        element.checked = true;
      });
    }
  }

  onDateChanged(startEnd){
    if(startEnd == "start"){
      var startDate = document.getElementById("startDate");
      this.setState({
        startDate: startDate.value
      });
    }else{
      var endDate = document.getElementById("endDate");
      this.setState({
        endDate: endDate.value
      });
    }
  }

  startCreatingPlaylist(){
    var numberPlaylists = this.state.chosenPlaylists.length;
   
    if(numberPlaylists < 1 || document.getElementById("startDate").value.length < 2 || document.getElementById("endDate").value.length < 2){
      this.openModal();
    }else{
      var start = 0;
      this.state.chosenPlaylists.forEach(async element => {
        var songs = [];
        console.log(element.tracks);
        var dataToFetch = Math.ceil(element.tracks.total/100);
        var dataFetched = 0;
        var i = 0;
        //var playlists = [];
        while (i < element.tracks.total){
          
          //var playlists = [];
          await this.Sleep(3000);
          spotifyApi.getPlaylistTracks(element.id, {'offset': i})
          .then((response2) => {
            songs = songs.concat(response2.items);
            dataFetched++;
            if (dataFetched == dataToFetch) this.checkTracks(songs, element);
          }, function(err) {
            console.error(err);
          });            
          //var allPlaylists2 = oldPlaylists.concat(this.state.allPlaylists);
          i = i + 100;
        }
        start++;
        if (start == numberPlaylists) {
          this.setState({
            opacity2: "0%",
            finishedFetchingSongs: true
          });
          if (this.state.allTracksWithoutKeys.length < 1){
            this.setState({
              noTracksFoundState: true,
            });
          }
        }
      });
      this.setState({
        songsFetched: true,
      });
      }
  }

  Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
 }

  checkTracks(songs, playlist){
    var songsForPlaylist = [];
    console.log(songs.length);
    songs.forEach(element => {
      if (this.checkDate(element.added_at)) songsForPlaylist.push(element.track);
    });
    console.log(songsForPlaylist.length);
    // songsForPlaylist.forEach(element => {
    //   console.log(element.name);
    // });
    if (songsForPlaylist.length >= 1){
      var songsForP = this.state.songsForPlaylist;
      var bley = playlist.name;
      bley = this.makeUnique(bley);
      //huch = this.makeUnique(huch);
      
      songsForP[`${bley}`] = songsForPlaylist;
      this.setState({
        songsForPlaylist: songsForP
      });

      var allTracksWithoutKeys = this.state.allTracksWithoutKeys;
      allTracksWithoutKeys = allTracksWithoutKeys.concat(songsForPlaylist);
      this.setState({
        allTracksWithoutKeys: allTracksWithoutKeys
      });
    }
  }
  //2020-01-25
  checkDate(trackDate){
    trackDate = trackDate.substring(0, 10);
    var t = new Date(trackDate);
    var s = new Date(this.state.startDate);
    var e = new Date(this.state.endDate);
    if (t >= s && t <= e) return true;
    else return false;
  }

  makeUnique(bley){
    if (typeof this.state.songsForPlaylist[`${bley}`] == 'object') {
      bley = bley + "I";
      
      return this.makeUnique(bley);
    }else{
      console.log("Key: " + bley);
      return bley;
    }
  }

  showPlaylists(key){
    //console.log(this.state.playlistsToHide);
    if (this.state.playlistsToHide.includes(key)){
      var playlists = [];
      playlists = playlists.concat(this.state.playlistsToHide);
      const index = this.state.playlistsToHide.indexOf(key);
      if (index > -1) {
        playlists.splice(index, 1);
        this.setState({
          playlistsToHide: playlists
        });
      }
    }else{
      var playlists = this.state.playlistsToHide;
      playlists.push(key);
      this.setState({
        playlistsToHide: playlists
      });
    }
  }

  _renderObject(){
		return Object.entries(this.state.songsForPlaylist).map(([key, value]) => {
			return (
				<div key={key}> 
          <h1>{key}</h1><button onClick={() => this.showPlaylists(key)}>
            Show/Don't show tracks
          </button>
          { this.state.playlistsToHide.includes(key) &&
            <div>
              {value.map(value =>
              <div>
                {value.name}
              </div>
              )}
            </div>
          }
				</div>
			)
		})
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  makePlaylist(){
    //console.log(this.state.allTrackIDs.length);
    var allSongURIs = [];
    // this.state.allTracksWithoutKeys.forEach(element => {
    //  allSongIDs.push(element.id);
    // });
    var name = "CPC " + this.state.startDate + " to " + this.state.endDate;
    var description = "Songs from the following playlists: ";

    var randomSong = this.getRandomInt(0, this.state.allTracksWithoutKeys.length-1);
    if(this.state.allTracksWithoutKeys[randomSong].id != null && this.state.allTracksWithoutKeys[randomSong].preview_url != null){
      this.setState({
        randomSongLink: this.state.allTracksWithoutKeys[randomSong].preview_url,
        randomSongURL: this.state.allTracksWithoutKeys[randomSong].external_urls['spotify']
      });
    }else{
      randomSong = this.getRandomInt(0, this.state.allTracksWithoutKeys.length-1);
      this.setState({
        randomSongLink: this.state.allTracksWithoutKeys[randomSong].preview_url,
        randomSongURL: this.state.allTracksWithoutKeys[randomSong].external_urls['spotify']
      });
    }
    Object.entries(this.state.songsForPlaylist).map(([key, value]) => {
      description = description + key + ", ";
      value.forEach(element => {
        if(element.id != null){
          allSongURIs.push("spotify:track:" + element.id);
        }
       });
    })
    description = description.substring(0, description.length - 2);
    if (description.length > 300){
      description = description.substring(0,297);
      description = description + "...";
    }
    console.log(description);
    console.log(allSongURIs.length);
    var playlistID = "";
    spotifyApi.createPlaylist(this.state.id, {'name': name, 'public': false, 'description': description})
      .then((response2) => {
      playlistID = response2.id;
      this.setState({
        playlistLink: response2.external_urls['spotify']
      });
      if (allSongURIs.length > 100){
        var i = 0;
        var length = allSongURIs.length;
        while(i < length){
          if (allSongURIs.length > 100){
            var currentSongs = allSongURIs.slice(-100);
            allSongURIs.splice(allSongURIs.length-100);
            console.log("Full " + currentSongs.length);
            spotifyApi.addTracksToPlaylist(playlistID, currentSongs)
              .then((response2) => {
                  console.log("Full add");
                }, function(err) {
                  console.error(err);
              }); 
          }else{
            console.log("Rest " + allSongURIs.length);
            spotifyApi.addTracksToPlaylist(playlistID, allSongURIs)
              .then((response2) => {
                console.log("Rest add");
                this.setState({
                  createdPlaylist: true
                });
                }, function(err) {
                  console.error(err);
              }); 
          }
          i = i + 100;
        }
      }else{
        spotifyApi.addTracksToPlaylist(playlistID, allSongURIs)
        .then((response2) => {
          this.setState({
            createdPlaylist: true
          });
          }, function(err) {
            console.error(err);
        }); 
      }    
    }, function(err) {
      console.error(err);
    }); 
    //console.log(playlistID);
  }

  checkTextArea(){
    if(document.getElementById("playlistTextArea").value == ''){
      this.setState({
        useLinks: false
      });
    }else{
      this.setState({
        useLinks: true
      });
    }
  }

  render() {
    return (
      <div className="App">
        <h1 class="popout">
          <span>C</span>
          <span>P</span>
          <span>C</span> 
          <span>.</span>          
        </h1>
        <h2>Chronical Playlist Creator - revive <span class='otherFont'>your</span> songs</h2>
        { !this.state.loggedIn &&
        <div class="loginList">
          <p style={{fontWeight: "bold"}}>
            With this application you can create playlists that contain all the songs added in a given period to playlists.
          </p>
            <ol>
              <li>Get a selection of playlists (paste in links or load from your profile).</li>
              <li>Choose playlists in which songs are searched for.</li>
              <li>Select the time period.</li>
              <li>Let the application search for songs.</li>
              <li>Create the playlist.</li>
            </ol> 
          </div>
        }
        <Popup defaultOpen modal>
          {close => (
            <div className="modal">
              <a className="close" onClick={close}>
                &times;
              </a>
              <div className="header"> Important Informations </div>
              <div className="content">
                {" "}
                <ul>
                  <li>WIP (work in progress)/development version -> slower -> no mobile support yet, tested primarly with firefox, but chrome is also working. ie and opera not tested, edge does not work yet.</li>
                  <li>i am a poor student. -> i don't want to pay for servers -> my authentification back-end falls asleep after 30 minutes of inactivity. -> there can be long loading times for the spotify login, when it's currently sleeping.</li>
                  <li>i am a poor student. -> i don't want to pay for servers. -> my front-end server has a bandwidth limitation each month. -> you can be unlucky and have to wait for the next month.. ..sorry.</li>
                  <li>i am a poor student. -> i don't want to pay for servers. -> perhaps unknown problems will arise that I cannot foresee at the moment.</li>
                </ul> 
              </div>
              <div class="button_cont" align="center" style={{marginBottom: 10 + "px"}}><a class="example_e_small" target="_blank" rel="nofollow noopener"  onClick={() => {close()}}>Close window</a></div>
            </div>
          )}
        </Popup>
        
        <Popup modal onClose={this.closeModal} open={this.state.open}>
          {close => (
            <div className="modal missingPopup">
              <a className="close" onClick={close}>
                &times;
              </a>
              <div className="header"> Inputs are missing. </div>
              <div className="content">
                {" "}
                <ul>
                  <li>Start date selected?</li>
                  <li>End date selected?</li>
                  <li>Playlists chosen?</li>
                </ul> 
              </div>
              <div class="button_cont" align="center" style={{marginBottom: 10 + "px"}}><a class="example_e_small" target="_blank" rel="nofollow noopener"  onClick={() => {close()}}>Complete Inputs</a></div>
            </div>
          )}
        </Popup>

        <Popup modal onClose={this.closeModal2} open={this.state.open2}>
          {close => (
            <div className="modal missingPopup">
              <a className="close" onClick={close}>
                &times;
              </a>
              <div className="header"> Error with the playlist links. </div>
              <div className="content">
                {" "}
                Check all links, wether they are valid.
              </div>
              <div class="button_cont" align="center" style={{marginBottom: 10 + "px"}}><a class="example_e_small" target="_blank" rel="nofollow noopener"  onClick={() => {close()}}>Re-enter playlist links</a></div>
            </div>
          )}
        </Popup>
        { !this.state.loggedIn &&
       <a href='https://spotify-authentication.herokuapp.com/login'><div class="buttons">
        <button class="blob-btn">
          Login to Spotify
          <span class="blob-btn__inner">
            <span class="blob-btn__blobs">
              <span class="blob-btn__blob"></span>
              <span class="blob-btn__blob"></span>
              <span class="blob-btn__blob"></span>
              <span class="blob-btn__blob"></span>
            </span>
          </span>
        </button>
        <br/>
        </div>
        </a>
      }
      { !this.state.loggedIn &&
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"></feGaussianBlur>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="goo"></feColorMatrix>
            <feBlend in2="goo" in="SourceGraphic" result="mix"></feBlend>
          </filter>
        </defs>
      </svg>
      }
      { this.state.loggedIn &&
        <div class="userText">
         Good to see you {this.state.name}
        </div>
        }
         { this.state.loggedIn && !this.state.playlistFetched &&
         <textarea class="dropZone" cols="50" rows="10" id="playlistTextArea" style={{marginBottom: 15 + "px"}} onChange={() => this.checkTextArea()} placeholder="Copy playlist-links inside here, several seperated with &quot;,&quot;. Not the Spotify URI or the embed code. Example: &quot;https://open.spotify.com/playlist/37i9dQZF1DWWwzidNQX6jx?si=77gRyN81QkqX01Cl0Nkp5w&quot;"></textarea>
         }

        { this.state.playlistFetched && !this.state.songsFetched &&

          <div id="containerOverlay">
            <div id="loadingUp" class="rainbow" style={{opacity: this.state.opacity}}></div>
            <div id="gridDown">
              <div class="containerGRID">
              <div class="box">
                Number of found playlists:  {this.state.playlistsToWorkWith.length}
              </div>
              <div class="box">
                Number of chosen playlists:  {this.state.chosenPlaylists.length}
              </div>
              <div class="box">
                <label>
                Start date:&nbsp;&nbsp;
                <input type="date" id="startDate" class="smaller backgroundTable" onChange={() => this.onDateChanged("start")} ></input>
                </label>
              </div>
              <div class="box">
                <label>
                End date:&nbsp;&nbsp;
                <input type="date" id="endDate" class="smaller backgroundTable" onChange={() => this.onDateChanged("end")} ></input>
                </label>
              </div>
            </div>
            </div>
          </div>
        } 

        { this.state.createdPlaylist &&

            <div class="containerGRIDFinish">
            <div class="box">
              Finished creating the playlist!
            </div>
            <div class="box">
            <div class="button_cont" align="center"><a class="example_e_small" target="_blank" rel="nofollow noopener" href={this.state.playlistLink}>Here is your playlist</a></div>
            </div>
            <div class="box">
              You listened <a target="_blank" rel="noopener noreferrer" href={this.state.randomSongURL} title="mehr Informationen">to</a>:
            </div>
            <div class="box">
            <audio controls="controls">
              <source src={this.state.randomSongLink} type="audio/mpeg"/>
              Your browser doesn't support audio playback.
            </audio>
            </div>
            <div class="box">
              
            </div>
            <div class="box">
            <div class="button_cont" align="center"><a class="example_e_small" target="_blank" rel="nofollow noopener" href="https://cpc-dev.netlify.com/">Create new playlist</a></div>
            </div>
          </div>
        } 

        {this.state.loggedIn && this.state.playlistFetched && !this.state.songsFetched &&
        <div class="box">
            <div class="button_cont" align="center"><a class="example_e_small" target="_blank" rel="nofollow noopener" onClick={() => this.checkAllPlaylists()}>Check/uncheck all playlists</a></div>
            </div>
            }
        {this.state.loggedIn && this.state.playlistFetched && !this.state.songsFetched &&
        <div class="box">
            <div class="button_cont" align="center"><a class="example_e_small" target="_blank" rel="nofollow noopener"  onClick={() => this.startCreatingPlaylist()}>Search for songs!</a></div>
            </div>
            }

        { this.state.loggedIn && !this.state.songsFetched && this.state.playlistFetched &&
          <div class="normalText" id="smaller">
            Choose your playlists:
          </div>
        }

        { this.state.loggedIn && !this.state.playlistFetched && !this.state.useLinks &&
          <div class="normalText" style={{paddingTop: 0 + "px"}}>
            or
          </div>
        }

        { this.state.loggedIn && !this.state.playlistFetched && !this.state.useLinks &&
        <div class="normalText" id="smaller">
          Choose from your playlists:
        </div>
        }
        { this.state.loggedIn && !this.state.playlistFetched && !this.state.useLinks &&
        <div class="center" >
          <label class="container">Only own playlists
          <input type="checkbox" id="checkboxOwnPlaylists" defaultChecked={this.state.onlyOwnPlaylist} onChange={() => this.setOwnPlaylistsBool()} />
          <span class="checkmark"></span>
          </label>
          </div>
        }

        { this.state.loggedIn && !this.state.playlistFetched &&
        <div class="button_cont" align="center"><a class="example_e" target="_blank" rel="nofollow noopener" onClick={() => this.getPlaylists()}>Load playlists!</a></div>
        }        

        { this.state.songsFetched && !this.state.createdPlaylist && !this.state.noTracksFoundState &&
         <div id="containerOverlay2">
          <div id="loadingUp" class="rainbow" style={{opacity: this.state.opacity2}}></div>
          <div id="gridDown">
            <div class="containerGRIDSmall">
              <div class="boxSmall">
                Number of found tracks:  {this.state.allTracksWithoutKeys.length}
              </div>
              <div class="boxSmall">
              { this.state.finishedFetchingSongs &&
              <div class="button_cont" align="center"><a class="example_e_small" target="_blank" rel="nofollow noopener"  onClick={() => this.makePlaylist()}>Make playlist!</a></div>
            }
            </div>
          </div>
          </div>
        </div>
        } 

        { this.state.songsFetched && !this.state.createdPlaylist && this.state.noTracksFoundState &&
         <div id="containerOverlay2">
          <div id="loadingUp" class="rainbow" style={{opacity: this.state.opacity2}}></div>
          <div id="gridDown">
            <div class="containerGRIDSmall">
              <div class="boxSmall">
                No matching tracks found!
              </div>
              <div class="boxSmall">
              </div>
            </div>
          </div>
        </div>
        } 

        { this.state.playlistFetched && this.state.songsFetched && !this.state.createdPlaylist &&
          <div class="containerGRIDLarge">
          {Object.entries(this.state.songsForPlaylist).map(([key, value]) =>
				  <div key={key} class="boxLarge"> 
          <div class="inputGroup2">
             <input id={key} name="option1" defaultChecked={false} onClick={() => this.showPlaylists(key)} type="checkbox"/>
                <label for={key}>{key}</label>
            </div>
            { this.state.playlistsToHide.includes(key) &&
              <div class="songList">
                {value.map(value =>
                <div class="songListItem">
                  {value.name}
                </div>
                )}
              </div>
            }
          </div>
          )}
        </div>
        }
        

        { this.state.playlistFetched && !this.state.songsFetched &&
          <div class="containerGRIDLarge">
            {this.state.playlistsToWorkWith.map(playlistsToWorkWith =>
              <div class="inputGroup boxLarge" key={playlistsToWorkWith.id}>
                <input id={playlistsToWorkWith.id} name="option1" defaultChecked={false}  onChange={() => this.checkboxesPlaylists(playlistsToWorkWith)} type="checkbox"/>
                <label for={playlistsToWorkWith.id}>{playlistsToWorkWith.name}</label>
              </div>
          )}
          </div>
        } 
      </div>
    );
  }
}


export default App;

