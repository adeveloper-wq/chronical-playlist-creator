import React, { Component } from 'react';
import './App.css';
import './App.scss';

import Modal from "react-responsive-modal";
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
      open3: false,
      openImpressum: false,
      informationWindowOpen: true,
      noTracksFoundState: false,
      modalStyle:{
        modal: {'borderRadius': '5px', 'boxShadow': '-5px 5px #111', 'font-family': 'Open Sans, Helvetica, Arial, sans-serif'},
        overlay: {background: '#fdcb6e'},
      },
      currentDate: '',
      id: '',
      isFirefox: typeof InstallTrigger !== 'undefined',
      isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime)
    }

    this.onOpenModal = this.onOpenModal.bind(this);
    this.onCloseModal = this.onCloseModal.bind(this);

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    this.openModal2 = this.openModal2.bind(this);
    this.closeModal2 = this.closeModal2.bind(this);

    this.openModal3 = this.openModal3.bind(this);
    this.closeModal3 = this.closeModal3.bind(this);

    this.openModalImpressum = this.openModalImpressum.bind(this);
    this.closeModalImpressum = this.closeModalImpressum.bind(this);

    var url = window.location.href;
    console.log(url);
    if(url.includes('#Loggedout') || url.includes('#loggedout')){
      this.state.informationWindowOpen = false;
      this.openModal3();
    }else{
      if(this.state.loggedIn){
        spotifyApi.getMe()
        .then((response3) => {
          this.setState({
            id: response3.id,
            name: response3.display_name
          });
        }, function(err) {
          console.error(err);
          window.location.assign('https://cpc-dev.netlify.com/#loggedout');
        });  
      }
    }
  }

  onOpenModal() {
    this.setState({ informationWindowOpen: true });
  }
  onCloseModal() {
    this.setState({ informationWindowOpen: false });
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

  openModal3() {
    this.state.open3 = true;
  }
  closeModal3() {
    this.setState({ open3: false });
  }

  openModalImpressum() {
    this.setState({ openImpressum: true });
  }
  closeModalImpressum() {
    this.setState({ openImpressum: false });
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

    this.setMaxDate();
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
          }, function(err) {
            console.error(err);
            window.location.assign('https://cpc-dev.netlify.com/#loggedout');
          });  
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
    if(new Date(this.state.startDate) > new Date(this.state.currentDate)){
      this.setState({
        startDate: this.state.currentDate
      });
    }
    if(new Date(this.state.endDate) > new Date(this.state.currentDate)){
      this.setState({
        endDate: this.state.currentDate
      });
    }
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
            window.location.assign('https://cpc-dev.netlify.com/#loggedout');
          });           
          //var allPlaylists2 = oldPlaylists.concat(this.state.allPlaylists);
          i = i + 100;
        }
        start++;
        if (start == numberPlaylists) {
          await this.Sleep(3000);
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
      var playlists2 = this.state.playlistsToHide;
      playlists2.push(key);
      this.setState({
        playlistsToHide: playlists2
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
    var description = "Created with cpc-dev.netlify.com - Songs from the following playlists: ";

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
                  window.location.assign('https://cpc-dev.netlify.com/#loggedout');
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
      window.location.assign('https://cpc-dev.netlify.com/#loggedout');
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

  setMaxDate(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10){
            dd='0'+dd
        } 
        if(mm<10){
            mm='0'+mm
        } 

    today = yyyy+'-'+mm+'-'+dd;
    this.setState({
      currentDate: today
    });
  }

  render() {
    return (
      <div className="App">
        <div className="header">
          <h1 className="popout">
            <span>C</span>
            <span>P</span>
            <span>C</span> 
            <span>.</span>          
          </h1>
          <h2>Chronical Playlist Creator - revive <span style={{'fontStyle': 'italic'}}>your</span> songs</h2>
        </div>

        <div className="body">
          { !this.state.loggedIn &&
          <div className="contentBox">
            <p style={{fontWeight: "bold"}}>
              With this application you can create playlists that contain all the songs added in a given period to playlists. What to do:
            </p>
            <div>
              <p>1.  Get a selection of playlists (paste in links or load from your profile).</p>
              <p>2.  Choose playlists in which songs are searched for.</p>
              <p>3.  Select the time period.</p>  
              <p>4.  Let the application search for songs.</p>
              <p>5.  Create the playlist.</p>
            </div> 
          </div>
          }
          { !this.state.loggedIn &&
            <Modal open={this.state.informationWindowOpen} onClose={this.onCloseModal} center styles={this.state.modalStyle}>
              <h3>Important Informations</h3>
              <div>
                <p>- <b>Development version -></b> Full support currently only on Firefox and Chrome </p>
                <p>- <b>I am a poor student -></b> I don't want to pay for servers. <b>-></b> My authentification back-end falls asleep after 30 minutes of inactivity. <b>-></b> There can be long loading times for the Spotify log in, when it's currently sleeping.</p>
                <p>- <b>I am a poor student -></b> I don't want to pay for servers. <b>-></b> My front-end server has a bandwidth limitation each month. <b>-></b> You can be unlucky and have to wait for the next month.. ..sorry.</p>
                <p>- <b>I am a poor student -></b> I don't want to pay for servers. <b>-></b> Perhaps unknown problems will arise that I cannot foresee at the moment.</p>
                <br></br>
                <p>
                  Bugs/feature requests can be posted on <a target="_blank" className="footLinksUnderline footLinksGithub" rel="noopener noreferrer" href="https://github.com/adeveloper-wq/chronical-playlist-creator-issues" title="Twitter">Github</a>.
                </p>
              </div> 
            </Modal>
          }
          <Modal open={this.state.open} onClose={this.closeModal} center styles={this.state.modalStyle}>
            <h3>Inputs are missing.</h3>
            <ul>
              <li>Start date selected?</li>
              <li>End date selected?</li>
              <li>Playlists chosen?</li>
            </ul> 
          </Modal>
          <Modal open={this.state.open2} onClose={this.closeModal2} center styles={this.state.modalStyle}>
              <h3>Error with the playlist links.</h3>
              <p>
                Check all links, wether they are valid.
              </p>
          </Modal>
          <Modal open={this.state.open3} onClose={this.closeModal3} center styles={this.state.modalStyle}>
              <h3>Logged Out!</h3>
              <p>
                The session expired, please log in again.
              </p>
          </Modal>
          <Modal open={this.state.openImpressum} onClose={this.closeModalImpressum} center styles={this.state.modalStyle}>
              <h3>Impressum</h3>
              <p>
                <b>
                Angaben gemäß § 5 TMG
                </b>
              </p>
              <p>
                Daniel Jeschor,
                Ermischstraße 10,
                01067 Dresden
              </p>
              <p>
                <b>
                Kontakt
                </b>
              </p>
              <p>
                Telefon: +49 (0) 1522 866 0978
                E-Mail: kettenblitz@gmx.net
              </p>
              <p>
                <b>
                Haftung für Inhalte
                </b>
              </p>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
                allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
                verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
                forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p>
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
                Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
                Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
                Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
              <p>
                <b>
                Haftung für Links
                </b>
              </p>
              <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten
              Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte
              waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
              <p>
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer
              Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links
              umgehend entfernen.
              </p>
              <p>
                <b>
                Urheberrecht
                </b>
              </p>
              <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
              Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
              <p>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter
              beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine
              Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei
              Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
              </p>
              <h3>Datenschutzerkl&auml;rung</h3>
              <h4>1. Datenschutz auf einen Blick</h4>
              <h5>Allgemeine Hinweise</h5> <p>Die folgenden Hinweise geben einen einfachen &Uuml;berblick dar&uuml;ber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie pers&ouml;nlich identifiziert werden k&ouml;nnen. Ausf&uuml;hrliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgef&uuml;hrten Datenschutzerkl&auml;rung.</p>
              <h5>Datenerfassung auf dieser Website</h5> <p><strong>Wer ist verantwortlich f&uuml;r die Datenerfassung auf dieser Website?</strong></p> <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten k&ouml;nnen Sie dem Impressum dieser Website entnehmen.</p> <p><strong>Wie erfassen wir Ihre Daten?</strong></p> <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.&nbsp;B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p> <p>Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.&nbsp;B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.</p> <p><strong>Wof&uuml;r nutzen wir Ihre Daten?</strong></p> <p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gew&auml;hrleisten. Andere Daten k&ouml;nnen zur Analyse Ihres Nutzerverhaltens verwendet werden.</p> <p><strong>Welche Rechte haben Sie bez&uuml;glich Ihrer Daten?</strong></p> <p>Sie haben jederzeit das Recht unentgeltlich Auskunft &uuml;ber Herkunft, Empf&auml;nger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben au&szlig;erdem ein Recht, die Berichtigung oder L&ouml;schung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz k&ouml;nnen Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zust&auml;ndigen Aufsichtsbeh&ouml;rde zu.</p> <p>Au&szlig;erdem haben Sie das Recht, unter bestimmten Umst&auml;nden die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Details hierzu entnehmen Sie der Datenschutzerkl&auml;rung unter &bdquo;Recht auf Einschr&auml;nkung der Verarbeitung&ldquo;.</p>
              <h5>Analyse-Tools und Tools von Drittanbietern</h5> <p>Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem mit Cookies und mit sogenannten Analyseprogrammen. Die Analyse Ihres Surf-Verhaltens erfolgt in der Regel anonym; das Surf-Verhalten kann nicht zu Ihnen zur&uuml;ckverfolgt werden.</p> <p>Sie k&ouml;nnen dieser Analyse widersprechen oder sie durch die Nichtbenutzung bestimmter Tools verhindern. Detaillierte Informationen zu diesen Tools und &uuml;ber Ihre Widerspruchsm&ouml;glichkeiten finden Sie in der folgenden Datenschutzerkl&auml;rung.</p>
              <h4>2. Hosting und Content Delivery Networks (CDN)</h4>
              <h5>Externes Hosting</h5> <p>Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Webseitenzugriffe und sonstige Daten, die &uuml;ber eine Website generiert werden, handeln.</p> <p>Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserf&uuml;llung gegen&uuml;ber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).</p> <p>Unser Hoster wird Ihre Daten nur insoweit verarbeiten, wie dies zur Erf&uuml;llung seiner Leistungspflichten erforderlich ist und unsere Weisungen in Bezug auf diese Daten befolgen.</p>
              <h4>3. Allgemeine Hinweise und Pflichtinformationen</h4>
              <h5>Datenschutz</h5> <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer pers&ouml;nlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerkl&auml;rung.</p> <p>Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie pers&ouml;nlich identifiziert werden k&ouml;nnen. Die vorliegende Datenschutzerkl&auml;rung erl&auml;utert, welche Daten wir erheben und wof&uuml;r wir sie nutzen. Sie erl&auml;utert auch, wie und zu welchem Zweck das geschieht.</p> <p>Wir weisen darauf hin, dass die Daten&uuml;bertragung im Internet (z.&nbsp;B. bei der Kommunikation per E-Mail) Sicherheitsl&uuml;cken aufweisen kann. Ein l&uuml;ckenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht m&ouml;glich.</p>
              <h5>Hinweis zur verantwortlichen Stelle</h5> <p>Die verantwortliche Stelle f&uuml;r die Datenverarbeitung auf dieser Website ist:</p> <p>Daniel Jeschor<br />
              Ermischstraße 10<br />
              01067 Dresden</p>

              <p>Telefon: +49 (0) 1522 866 0978<br />
              E-Mail: kettenblitz@gmx.net</p>
              <p>Verantwortliche Stelle ist die nat&uuml;rliche oder juristische Person, die allein oder gemeinsam mit anderen &uuml;ber die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.&nbsp;B. Namen, E-Mail-Adressen o. &Auml;.) entscheidet.</p>
              <h5>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h5> <p>Viele Datenverarbeitungsvorg&auml;nge sind nur mit Ihrer ausdr&uuml;cklichen Einwilligung m&ouml;glich. Sie k&ouml;nnen eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtm&auml;&szlig;igkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unber&uuml;hrt.</p>
              <h5>Widerspruchsrecht gegen die Datenerhebung in besonderen F&auml;llen sowie gegen Direktwerbung (Art. 21 DSGVO)</h5> <p>WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GR&Uuml;NDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH F&Uuml;R EIN AUF DIESE BESTIMMUNGEN GEST&Uuml;TZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNEHMEN SIE DIESER DATENSCHUTZERKL&Auml;RUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR K&Ouml;NNEN ZWINGENDE SCHUTZW&Uuml;RDIGE GR&Uuml;NDE F&Uuml;R DIE VERARBEITUNG NACHWEISEN, DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN &Uuml;BERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUS&Uuml;BUNG ODER VERTEIDIGUNG VON RECHTSANSPR&Uuml;CHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).</p> <p>WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH F&Uuml;R DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).</p>
              <h5>Beschwerderecht bei der zust&auml;ndigen Aufsichtsbeh&ouml;rde</h5> <p>Im Falle von Verst&ouml;&szlig;en gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbeh&ouml;rde, insbesondere in dem Mitgliedstaat ihres gew&ouml;hnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutma&szlig;lichen Versto&szlig;es zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.</p>
              <h5>Recht auf Daten&uuml;bertragbarkeit</h5> <p>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erf&uuml;llung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem g&auml;ngigen, maschinenlesbaren Format aush&auml;ndigen zu lassen. Sofern Sie die direkte &Uuml;bertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.</p>
              <h5>Auskunft, L&ouml;schung und Berichtigung</h5> <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft &uuml;ber Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empf&auml;nger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder L&ouml;schung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten k&ouml;nnen Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.</p>
              <h5>Recht auf Einschr&auml;nkung der Verarbeitung</h5> <p>Sie haben das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu k&ouml;nnen Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden. Das Recht auf Einschr&auml;nkung der Verarbeitung besteht in folgenden F&auml;llen:</p> <ul> <li>Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, ben&ouml;tigen wir in der Regel Zeit, um dies zu &uuml;berpr&uuml;fen. F&uuml;r die Dauer der Pr&uuml;fung haben Sie das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li> <li>Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtm&auml;&szlig;ig geschah/geschieht, k&ouml;nnen Sie statt der L&ouml;schung die Einschr&auml;nkung der Datenverarbeitung verlangen.</li> <li>Wenn wir Ihre personenbezogenen Daten nicht mehr ben&ouml;tigen, Sie sie jedoch zur Aus&uuml;bung, Verteidigung oder Geltendmachung von Rechtsanspr&uuml;chen ben&ouml;tigen, haben Sie das Recht, statt der L&ouml;schung die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li> <li>Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abw&auml;gung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen &uuml;berwiegen, haben Sie das Recht, die Einschr&auml;nkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li> </ul> <p>Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschr&auml;nkt haben, d&uuml;rfen diese Daten &ndash; von ihrer Speicherung abgesehen &ndash; nur mit Ihrer Einwilligung oder zur Geltendmachung, Aus&uuml;bung oder Verteidigung von Rechtsanspr&uuml;chen oder zum Schutz der Rechte einer anderen nat&uuml;rlichen oder juristischen Person oder aus Gr&uuml;nden eines wichtigen &ouml;ffentlichen Interesses der Europ&auml;ischen Union oder eines Mitgliedstaats verarbeitet werden.</p>
              <h4>4. Datenerfassung auf dieser Website</h4>
              <h5>Cookies</h5> <p>Unsere Internetseiten verwenden so genannte &bdquo;Cookies&ldquo;. Cookies sind kleine Textdateien und richten auf Ihrem Endger&auml;t keinen Schaden an. Sie werden entweder vor&uuml;bergehend f&uuml;r die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endger&auml;t gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch gel&ouml;scht. Permanente Cookies bleiben auf Ihrem Endger&auml;t gespeichert bis Sie diese selbst l&ouml;schen&nbsp;oder eine automatische L&ouml;sung durch Ihren Webbrowser erfolgt.</p> <p>Teilweise k&ouml;nnen auch Cookies von Drittunternehmen auf Ihrem Endger&auml;t gespeichert werden, wenn Sie unsere Seite betreten (Third-Party-Cookies). Diese erm&ouml;glichen uns oder Ihnen die Nutzung bestimmter Dienstleistungen des Drittunternehmens (z.B. Cookies zur Abwicklung von Zahlungsdienstleistungen).</p> <p>Cookies haben verschiedene Funktionen. Zahlreiche Cookies sind technisch notwendig, da bestimmte Webseitenfunktionen ohne diese nicht funktionieren w&uuml;rden (z.B. die Warenkorbfunktion oder die Anzeige von Videos). Andere Cookies dienen dazu das Nutzerverhalten auszuwerten&nbsp;oder Werbung anzuzeigen.</p> <p>Cookies, die zur Durchf&uuml;hrung des elektronischen Kommunikationsvorgangs oder zur Bereitstellung bestimmter, von Ihnen erw&uuml;nschter Funktionen (z. B. Warenkorbfunktion) erforderlich sind, werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste. Sofern eine entsprechende Einwilligung abgefragt wurde (z. B. eine Einwilligung zur Speicherung von Cookies), erfolgt die Verarbeitung ausschlie&szlig;lich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO; die Einwilligung ist jederzeit widerrufbar.</p> <p>Sie k&ouml;nnen Ihren Browser so einstellen, dass Sie &uuml;ber das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies f&uuml;r bestimmte F&auml;lle oder generell ausschlie&szlig;en sowie das automatische L&ouml;schen der Cookies beim Schlie&szlig;en des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalit&auml;t dieser Website eingeschr&auml;nkt sein.</p> <p>Soweit Cookies von Drittunternehmen oder zu Analysezwecken eingesetzt werden, werden wir Sie hier&uuml;ber im Rahmen dieser Datenschutzerkl&auml;rung gesondert informieren und ggf. eine Einwilligung abfragen.</p>
              <h5>Anfrage per E-Mail oder Telefon</h5> <p>Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.</p> <p>Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erf&uuml;llung eines Vertrags zusammenh&auml;ngt oder zur Durchf&uuml;hrung vorvertraglicher Ma&szlig;nahmen erforderlich ist. In allen &uuml;brigen F&auml;llen beruht die Verarbeitung auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) und/oder auf unseren berechtigten Interessen (Art. 6 Abs. 1 lit. f DSGVO), da wir ein berechtigtes Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen haben.</p> <p>Die von Ihnen an uns per Kontaktanfragen &uuml;bersandten Daten verbleiben bei uns, bis Sie uns zur L&ouml;schung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck f&uuml;r die Datenspeicherung entf&auml;llt (z.&nbsp;B. nach abgeschlossener Bearbeitung Ihres Anliegens). Zwingende gesetzliche Bestimmungen &ndash; insbesondere gesetzliche Aufbewahrungsfristen &ndash; bleiben unber&uuml;hrt.</p>
              <h4>5. Plugins und Tools</h4>
              <h5>Spotify</h5> <p>Auf dieser Website sind Funktionen des Musik-Dienstes Spotify eingebunden. Anbieter ist die Spotify AB, Birger Jarlsgatan 61, 113 56 Stockholm in Schweden. Eine &Uuml;bersicht &uuml;ber die Spotify-Plugins finden Sie unter: <a href="https://developer.spotify.com" target="_blank" rel="noopener noreferrer">https://developer.spotify.com</a>.</p> <p>Dadurch kann beim Besuch dieser Website &uuml;ber das Plugin eine direkte Verbindung zwischen Ihrem Browser und dem Spotify-Server hergestellt werden. Spotify erh&auml;lt dadurch die Information, dass Sie mit Ihrer IP-Adresse diese Website besucht haben. Wenn Sie den Spotify Button anklicken w&auml;hrend Sie in Ihrem Spotify-Account eingeloggt sind, k&ouml;nnen Sie die Inhalte dieser Website auf Ihrem Spotify Profil verlinken. Dadurch kann Spotify den Besuch dieser Website Ihrem Benutzerkonto zuordnen.</p> <p>Die Speicherung und Analyse der Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Webseitenbetreiber hat ein berechtigtes Interesse an der ansprechenden akustischen Ausgestaltung seiner Webseite. Sofern eine entsprechende Einwilligung abgefragt wurde (z. B. eine Einwilligung zur Speicherung von Cookies), erfolgt die Verarbeitung ausschlie&szlig;lich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO; die Einwilligung ist jederzeit widerrufbar.</p> <p>Weitere Informationen hierzu finden Sie in der Datenschutzerkl&auml;rung von Spotify: <a href="https://www.spotify.com/de/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">https://www.spotify.com/de/legal/privacy-policy/</a>.</p> <p>Wenn Sie nicht w&uuml;nschen, dass Spotify den Besuch dieser Website Ihrem Spotify-Nutzerkonto zuordnen kann, loggen Sie sich bitte aus Ihrem Spotify-Benutzerkonto aus.</p>
              <p>Quelle: <a href="https://www.e-recht24.de">eRecht24</a></p>
          </Modal>

          { !this.state.loggedIn &&
        <a href='https://spotify-authentication.herokuapp.com/login'><div className="buttons">
          <button className="blob-btn">
            Log in to Spotify
            <span className="blob-btn__inner">
              <span className="blob-btn__blobs">
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
              </span>
            </span>
          </button>
          <br/>
          </div>
          </a>
        }
        { !this.state.loggedIn &&
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="0" height="0">
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
          <div className="userText">
          Good to see you {this.state.name}
          </div>
          }
          { this.state.loggedIn && !this.state.playlistFetched &&
          <textarea className="dropZone" rows="10" id="playlistTextArea" style={{marginBottom: 15 + "px"}} onChange={() => this.checkTextArea()} placeholder="Copy playlist-links inside here, several seperated with &quot;,&quot;. Not the Spotify URI or the embed code. Example: &quot;https://open.spotify.com/playlist/37i9dQZF1DWWwzidNQX6jx?si=77gRyN81QkqX01Cl0Nkp5w&quot;"></textarea>
          }

          { this.state.playlistFetched && !this.state.songsFetched &&

            <div id="containerOverlayPlaylistsMenu">
              {(this.state.isChrome || this.state.isFirefox) &&
              <div id="loadingUp" className="rainbow" style={{opacity: this.state.opacity}}></div>
              }
              <div id="gridDown">
                <div className="containerGRIDPlaylistsMenu">
                <div className="boxPlaylistsMenu">
                  Number of found playlists:  {this.state.playlistsToWorkWith.length}
                </div>
                <div className="boxPlaylistsMenu">
                  Number of chosen playlists:  {this.state.chosenPlaylists.length}
                </div>
                <div className="boxPlaylistsMenu">
                  <label>
                  Start date:&nbsp;&nbsp;
                  <input type="date" id="startDate" className="smaller backgroundTable" max={this.state.currentDate} onChange={() => this.onDateChanged("start")} ></input>
                  </label>
                </div>
                <div className="boxPlaylistsMenu">
                  <label>
                  End date:&nbsp;&nbsp;
                  <input type="date" id="endDate" className="smaller backgroundTable" max={this.state.currentDate} onChange={() => this.onDateChanged("end")} ></input>
                  </label>
                </div>
              </div>
              </div>
            </div>
          } 

          { this.state.createdPlaylist &&

              <div className="containerGRIDFinish">
              <div className="boxFinish">
                Finished creating the playlist!
              </div>
              <div className="boxFinish">
              <div className="button_cont" align="center"><a className="example_e_small" target="_blank" rel="nofollow noopener" href={this.state.playlistLink}>Here is your playlist</a></div>
              </div>
              { this.state.randomSongLink !== null && this.state.randomSongLink.length > 3 &&
                <div className="boxFinish">
                  You listened <a target="_blank" rel="noopener noreferrer" href={this.state.randomSongURL} title="mehr Informationen">to</a>:
                </div>
              }
              { this.state.randomSongLink !== null && this.state.randomSongLink.length > 3 &&
                <div className="boxFinish">
                <audio controls="controls">
                  <source src={this.state.randomSongLink} type="audio/mpeg"/>
                  Your browser doesn't support audio playback.
                </audio>
                </div>
              }
              <div className="boxFinish">
                
              </div>
              <div className="boxFinish">
              <div className="button_cont" align="center"><a className="example_e_small" target="_blank" rel="nofollow noopener" onClick={() => window.location.reload(true)}>Create new playlist</a></div>
              </div>
            </div>
          } 

          {this.state.loggedIn && this.state.playlistFetched && !this.state.songsFetched &&
          <div className="box">
              <div className="button_cont" align="center"><button type="button" className="example_e_small" target="_blank" rel="nofollow noopener" style={{marginBottom: '10px'}} onClick={() => this.checkAllPlaylists()}>Check/uncheck all playlists</button></div>
              </div>
              }
          {this.state.loggedIn && this.state.playlistFetched && !this.state.songsFetched &&
          <div className="box">
              <div className="button_cont" align="center"><button type="button"a className="example_e_small" target="_blank" rel="nofollow noopener" onClick={() => this.startCreatingPlaylist()}>Search for songs!</button></div>
              </div>
              }

          { this.state.loggedIn && !this.state.songsFetched && this.state.playlistFetched &&
            <div className="normalText" id="smaller">
              Choose your playlists:
            </div>
          }

          { this.state.loggedIn && !this.state.playlistFetched && !this.state.useLinks &&
            <div className="normalText" style={{paddingTop: 0 + "px"}}>
              or
            </div>
          }

          { this.state.loggedIn && !this.state.playlistFetched && !this.state.useLinks &&
          <div className="normalText" id="smaller">
            Choose from your playlists:
          </div>
          }
          { this.state.loggedIn && !this.state.playlistFetched && !this.state.useLinks &&
          <div className="center" >
            <label className="container">Only own playlists
            <input type="checkbox" id="checkboxOwnPlaylists" defaultChecked={this.state.onlyOwnPlaylist} onChange={() => this.setOwnPlaylistsBool()} />
            <span className="checkmark"></span>
            </label>
            </div>
          }

          { this.state.loggedIn && !this.state.playlistFetched &&
          <div className="button_cont" align="center"><button type="button" className="example_e_small" target="_blank" rel="nofollow noopener" onClick={() => this.getPlaylists()}>Load playlists!</button></div>
          }        

          { this.state.songsFetched && !this.state.createdPlaylist && !this.state.noTracksFoundState &&
          <div id="containerOverlayTracksMenu">
            {(this.state.isChrome || this.state.isFirefox) &&
            <div id="loadingUp" className="rainbow" style={{opacity: this.state.opacity2}}></div>
            }
            <div id="gridDown">
              <div className="containerGRIDTracksMenu">
                <div className="boxTracksMenu">
                  Number of found tracks:  {this.state.allTracksWithoutKeys.length}
                </div>
                <div className="boxTracksMenu">
                { this.state.finishedFetchingSongs &&
                <div className="button_cont" align="center"><button type="button" className="example_e_small" target="_blank" rel="nofollow noopener" onClick={() => this.makePlaylist()}>Make playlist!</button></div>
              }
              { !this.state.finishedFetchingSongs && !(this.state.isChrome || this.state.isFirefox) &&
                <div>Loading...</div>
              }
              </div>
            </div>
            </div>
          </div>
          } 

          { this.state.songsFetched && !this.state.createdPlaylist && this.state.noTracksFoundState &&
          <div id="containerOverlayTracksMenu">
            <div id="loadingUp" className="rainbow" style={{opacity: this.state.opacity2}}></div>
            <div id="gridDown">
              <div className="containerGRIDTracksMenu">
                <div className="boxTracksMenu">
                  No matching tracks found!
                </div>
                <div className="boxTracksMenu">
                <div className="button_cont" align="center"><button type="button" className="example_e_small" target="_blank" rel="nofollow noopener" onClick={() => window.location.reload(true)}>Create new playlist</button></div>
                </div>
              </div>
            </div>
          </div>
          } 

          { this.state.playlistFetched && this.state.songsFetched && !this.state.createdPlaylist &&
            <div className="containerGRIDLarge">
            {Object.entries(this.state.songsForPlaylist).map(([key, value]) =>
            <div key={key} className="boxLarge"> 
            <div className="inputGroup2">
              <input id={key} name="option1" defaultChecked={false} onClick={() => this.showPlaylists(key)} type="checkbox"/>
                  <label for={key}>{key}</label>
              </div>
              { this.state.playlistsToHide.includes(key) &&
                <div className="songList">
                  {value.map(value =>
                  <div className="songListItem">
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
            <div className="containerGRIDLarge">
              {this.state.playlistsToWorkWith.map(playlistsToWorkWith =>
                <div className="inputGroup boxLarge" key={playlistsToWorkWith.id}>
                  <input id={playlistsToWorkWith.id} name="option1" defaultChecked={false}  onChange={() => this.checkboxesPlaylists(playlistsToWorkWith)} type="checkbox"/>
                  <label for={playlistsToWorkWith.id}>{playlistsToWorkWith.name}</label>
                </div>
            )}
            </div>
          }
          <div className="contentBox">
            <div className="containerGRIDFoot">
              <div className="boxFoot impressum" onClick={() => this.openModalImpressum()}>
                Impr./Daten.
              </div>
              <div className="boxFoot twitter">
              <a target="_blank" className="footLinks footLinksTwitter"rel="noopener noreferrer" href="https://twitter.com/maybe_tomorrow5" title="Twitter">Twitter</a>
              </div>
              <div className="boxFoot github">
              <a target="_blank" className="footLinks footLinksGithub" rel="noopener noreferrer" href="https://github.com/adeveloper-wq/chronical-playlist-creator-issues" title="Twitter">Github</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


export default App;

