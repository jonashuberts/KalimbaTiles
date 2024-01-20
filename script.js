var MidiPlayer = MidiPlayer;
var instrument;
var loadFile, loadDataUri, Player;
var AudioContext = window.AudioContext || window.webkitAudioContext || false;
var ac = new AudioContext() || new webkitAudioContext();
var currentTime;
var timeoutId;
var timeoutId2;
var timeoutId3;
var bool1 = 0;
var tempo = 50;

var tempodiv = document.querySelector(".tempo");
var tempoInput = document.getElementById("tempo-input");
var lesson_modediv = document.querySelector("#lesson_mode");
var keydivs = document.querySelectorAll(".key");
var keynoteanimationdiv = document.querySelector("key-note-animation");
var loadingdiv = document.querySelector("#loading");
var selectfilediv = document.querySelector("#select-file");

var playbuttondiv = document.querySelector("#play-button");
var stopbuttondiv = document.querySelector("#stop-button");
var resetbuttondiv = document.querySelector("#reset-button");
var tempobuttondiv = document.querySelector(".tempo");

var shownumbersbuttondiv = document.querySelector("#show_numbers");
var keyboardlayoutbuttondiv = document.querySelector("#keyboard_layout");

window.addEventListener("keydown", function (e) {
  var key = notetonote(keyboardtonote(e.key));
  if (keyboardlayoutbuttondiv.checked) {
    key = keyboardtonote(e.key);
  }
  console.log(key);
  var notediv = document.querySelector('[data-note="' + key + '"]');
  notediv.classList.add("key_active");
  instrument.play(key);
});

window.addEventListener("keyup", function (e) {
  var key = notetonote(keyboardtonote(e.key));
  if (keyboardlayoutbuttondiv.checked) {
    key = keyboardtonote(e.key);
  }
  console.log(key);
  var notediv = document.querySelector('[data-note="' + key + '"]');
  notediv.classList.remove("key_active");
});

var notetonumber = function (note) {
  var notes = [
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "D5",
    "E5",
    "F5",
    "G5",
    "A5",
    "B5",
    "C6",
    "D6",
    "E6",
    "C#4",
    "Db4",
    "D#4",
    "Gb4",
    "Ab4",
    "A#4",
    "Bb4",
    "C#5",
    "D#5",
    "Gb5",
    "Ab5",
    "A#5",
    "Bb5",
    "C#6",
    "D#6",
    "Gb6",
    "Ab6",
    "A#6",
    "Bb6",
  ];
  var notenumbers = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "1",
    "2",
    "3",
    "1",
    "2",
    "2",
    "4",
    "5",
    "6",
    "6",
    "7",
    "2",
    "3",
    "4",
    "5",
    "6",
    "6",
    "2",
    "3",
    "4",
    "5",
    "6",
    "6",
  ];
  return notenumbers[notes.indexOf(note)];
};

var keyboardtonote = function (keyboard) {
  var keyboards = [
    "`",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "-",
    "=",
    "Backspace",
    "Insert",
    "Home",
    "PageUp",
  ];
  var notes = [
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "D5",
    "E5",
    "F5",
    "G5",
    "A5",
    "B5",
    "C6",
    "D6",
    "E6",
  ];
  return notes[keyboards.indexOf(keyboard)];
};

var notetonote = function (note) {
  var notes = [
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "D5",
    "E5",
    "F5",
    "G5",
    "A5",
    "B5",
    "C6",
    "D6",
    "E6",
  ];
  var notes1 = [
    "D6",
    "B5",
    "G5",
    "E5",
    "C5",
    "A4",
    "F4",
    "D4",
    "C4",
    "E4",
    "G4",
    "B4",
    "D5",
    "F5",
    "A5",
    "C6",
    "E6",
  ];
  return notes1[notes.indexOf(note)];
};

var play = function () {
  playbuttondiv.innerHTML = "Pause";
  // Warte 4 Sekunden, bevor der Player gestartet wird
  setTimeout(function () {
    Player.play();
  }, 4000); // 4000 Millisekunden entsprechen 4 Sekunden
};

var pause = function () {
  Player.pause();
  playbuttondiv.innerHTML = "Play";
};

var stop = function () {
  if (lesson_modediv.checked) {
    lesson_modediv.checked = false;
    clearTimeout(timeoutId);
    clearTimeout(timeoutId2);
    clearTimeout(timeoutId3);
    setTimeout(function () {
      stop();
      keydivs.forEach((key) => {
        key.classList.remove("key_active");
      });
    }, 8000);
  }
  Player.stop();
  playbuttondiv.innerHTML = "Play";
};

var reset = function () {
  keydivs.forEach((key) => {
    key.classList.remove("key_active");
  });
  tempoInput.innerHTML = tempo;
};

playbuttondiv.addEventListener("click", function (e) {
  Player.isPlaying() ? pause() : play();
});

stopbuttondiv.addEventListener("click", function (e) {
  stop();
});

resetbuttondiv.addEventListener("click", function (e) {
  reset();
});

tempobuttondiv.addEventListener("change", function (e) {
  Player.setTempo(this.value);
});

var updateTempoDisplay = function () {
  tempoInput.value = Player.tempo;
};

// Nach dem Laden eines neuen Stücks oder Klicken auf Play-Button
var onPlayButtonClick = function () {
  if (Player.isPlaying()) {
    pause();
  } else {
    play();
  }
  updateTempoDisplay();
};

var onLoadFile = function () {
  Player.stop();
  var fileInput = document.querySelector("input[type=file]");
  var file = fileInput.files[0];
  var reader = new FileReader();
  if (file) reader.readAsArrayBuffer(file);
  reader.addEventListener(
    "load",
    function () {
      bool1 = 0;
      Player = new MidiPlayer.Player(function (event) {
        playmidi(event);
        lesson_mode(event);
        updateTempoDisplay(); // Aktualisiere das Tempo-Eingabefeld während des Abspielens
      });

      Player.loadArrayBuffer(reader.result);

      // Aktualisiere das Tempo-Eingabefeld basierend auf dem Tempo der neuen Datei
      tempoInput.value = Player.tempo;
      document.getElementById("tempo-input").innerHTML = Player.tempo;

      playbuttondiv.removeAttribute("disabled");
    },
    false
  );
};

// Eventlistener für Play-Button und Dateiauswahl
playbuttondiv.addEventListener("click", onPlayButtonClick);
document
  .querySelector("input[type=file]")
  .addEventListener("change", onLoadFile);

var playmidi = function (event) {
  if (bool1 == 0) {
    tempo = Player.tempo;
    bool1 = 1;
  }
  Player.setTempo(tempodiv.value);
  if (event.name == "Note on" && event.velocity > 0) {
    //$('key-note-animation').append('<div data-key-note="' + event.noteName + '"></div>');
    if (shownumbersbuttondiv.checked) {
      keynoteanimationdiv.insertAdjacentHTML(
        "afterbegin",
        `
		<div data-key-note="` +
          event.noteName +
          `"><span class="key-text">` +
          notetonumber(event.noteName) +
          `</span></div>
		`
      );
    } else {
      keynoteanimationdiv.insertAdjacentHTML(
        "afterbegin",
        `
		<div data-key-note="` +
          event.noteName +
          `"></div>
		`
      );
    }
  }
  setTimeout(function () {
    if (event.name == "Note on") {
      instrument.play(event.noteName, ac.currentTime, {
        gain: event.velocity / 100,
      });
      var notediv = document.querySelector(
        '[data-note="' + event.noteName.replace(/C-1/gi, "NO") + '"]'
      );
      notediv.classList.add("key_active");
      console.log(
        "event: " + event.name + ", " + event.noteName.replace(/C-1/gi, "NO")
      );
    }
    if (event.name == "Note off") {
      var notediv = document.querySelector(
        '[data-note="' + event.noteName.replace(/C-1/gi, "NO") + '"]'
      );
      notediv.classList.remove("key_active");
      console.log(
        "event: " + event.name + ", " + event.noteName.replace(/C-1/gi, "NO")
      );
    }
  }, 1800);
  tempoInput.innerHTML = Player.tempo;
};

var lesson_mode = function (event) {
  if (lesson_modediv.checked) {
    playmidi(event);
    timeoutId = setTimeout(function () {
      pause();
    }, 1500);
    timeoutId1 = setTimeout(function () {
      playmidi(event);
    }, 3000);
    timeoutId2 = setTimeout(function () {
      play();
    }, 7500);
  }
  if (!lesson_modediv.checked) {
    clearTimeout(timeoutId);
    clearTimeout(timeoutId2);
    clearTimeout(timeoutId3);
  }
};

Soundfont.instrument(ac, "kalimba").then(function (instrumentnow) {
  instrument = instrumentnow;
  loadingdiv.style.display = "none";
  selectfilediv.style.display = "block";

  keydivs.forEach((key) => {
    key.addEventListener("click", function (e) {
      instrument.play(e.target.dataset.note.replace(/C-1/gi, "C4")); //.replace(/C-1/gi, 'C4')
    });
  });

  // Definiere die URL zur externen MIDI-Datei
  var midiFileUrl = "songs/Sad_Song_85.mid";

  loadDataUri = function (dataUri) {
    bool1 = 0;
    Player = new MidiPlayer.Player(function (event) {
      playmidi(event);
      lesson_mode(event);
    });

    // Lade die MIDI-Datei von der externen URL
    fetch(midiFileUrl)
      .then((response) => response.arrayBuffer())
      .then((data) => {
        // Konvertiere die MIDI-Datei in Base64-Data URI
        var binary = "";
        var bytes = new Uint8Array(data);
        for (var i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        var base64DataUri = "data:audio/midi;base64," + window.btoa(binary);

        // Lade die MIDI-Datei in den Player
        Player.loadDataUri(base64DataUri);

        // Aktiviere den Play-Button nach dem Laden der MIDI-Datei
        playbuttondiv.removeAttribute("disabled");
      })
      .catch((error) => {
        console.error("Error loading MIDI file:", error);
      });
  };

  // Rufe die Funktion loadDataUri auf und übergebe die externe MIDI-Datei als Parameter
  loadDataUri();
});

// Event Listener für den Hintergrund
document.addEventListener("click", function (event) {
  var navBar = document.querySelector(".navbar");
  var kalimba = document.querySelector("kalimba_body");
  var clickedElement = event.target;

  // Überprüfen, ob das geklickte Element nicht die Nav Bar oder ein Kindelement davon ist
  if (
    clickedElement !== navBar &&
    !navBar.contains(clickedElement) &&
    !kalimba.contains(clickedElement) &&
    clickedElement !== kalimba
  ) {
    if (navBar.style.display === "none" || navBar.style.display === "") {
      navBar.style.display = "block";
    } else {
      navBar.style.display = "none";
    }
  }
});

function updatePPI() {
  var selectedPPI = document.getElementById("deviceSelector").value;
  document.documentElement.style.setProperty("--ppi", selectedPPI);
  // Füge hier weitere Anpassungen für deine UI hinzu, falls notwendig
}

function filterDevices() {
  var input, filter, select, options, option, i;
  input = document.getElementById("searchInput");
  filter = input.value.toUpperCase();
  select = document.getElementById("deviceSelector");
  options = select.getElementsByTagName("option");

  for (i = 0; i < options.length; i++) {
    option = options[i];
    if (option.innerHTML.toUpperCase().indexOf(filter) > -1) {
      option.style.display = "";
    } else {
      option.style.display = "none";
    }
  }
}