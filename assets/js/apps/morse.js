var morse;
function MorseOscillator(audio_ctx, time_gap, indicator) {
    this.audio_ctx = audio_ctx;
    this.time_gap = time_gap || 50;
    this.indicator = indicator || null;

    this.oscillator = audio_ctx.createOscillator();
    this.oscillator.frequency.value = 440;
    this.gain = audio_ctx.createGain();
    this.gain.connect(audio_ctx.destination);
    this.oscillator.connect(this.gain);

    this.volume = 0.05;
    this.openTime = null;
    this.gain.gain.value = 0;
    this.oscillator.start();

    this._currentPattern = "";
    this._letterTimeout = null;
    this._wordTimeout = null;
    this._indicatorTimer = null;
    this.encoding = false;
    this.cancelEncoding = false;
    this.letter = function (x) { console.log(x); };
}

MorseOscillator.prototype.LETTER_LOOKUP = {
      '.-': 'A', '-...': 'B', '-.-.': 'C',  '-..': 'D',
       '.': 'E', '..-.': 'F',  '--.': 'G', '....': 'H',
      '..': 'I', '.---': 'J',  '-.-': 'K', '.-..': 'L',
      '--': 'M',   '-.': 'N',  '---': 'O', '.--.': 'P',
    '--.-': 'Q',  '.-.': 'R',  '...': 'S',    '-': 'T',
     '..-': 'U', '...-': 'V',  '.--': 'W', '-..-': 'X',
    '-.--': 'Y', '--..': 'Z',     '': ' ',    ' ': ' ',
    '.----': '1', '..---': '2', '...--': '3',
    '....-': '4', '.....': '5', '-....': '6',
    '--...': '7', '---..': '8', '----.': '9',
    '-----': '0',
    '.-.-.-': '.',  '--..--': ',',  '..--..': '?',
    '.----.': "'",  '-.-.--': '!',  '-..-.': '/',
     '-.--.': '(',  '-.--.-': ')',  '.-...': '&',
    '---...': ':',  '-.-.-.': ';',  '-...-': '=',
     '.-.-.': '+',  '-....-': '-', '..--.-': '_',
    '.-..-.': '"', '...-..-': '$', '.--.-.': '@'
};
MorseOscillator.prototype.MORSE_LOOKUP = (function (ll) {
    var dict = {};
    for (var prop in ll) if (ll.hasOwnProperty(prop)) {
        dict[ll[prop]] = prop;
    }
    return dict;
})(MorseOscillator.prototype.LETTER_LOOKUP);

MorseOscillator.prototype.dit = function () {
    this._currentPattern += ".";
    console.log("dit");
};
MorseOscillator.prototype.dah = function () {
    this._currentPattern += "-";
    console.log("dat");
};
MorseOscillator.prototype.open = function () {
    this.gain.gain.value = this.volume;
    this.openTime = new Date().getTime();
    clearTimeout(this._letterTimeout);
    clearTimeout(this._wordTimeout);
    if (this.indicator !== null) {
        var self = this;
        clearTimeout(this._indicatorTimer);
        this._indicatorTimer = setInterval(function () {
            var elapsedTime = (new Date().getTime()) - self.openTime;
            self.indicator.style.width = Math.min(100, 100*(elapsedTime/(4*self.time_gap))) + "%";
        }, 1);
    }
};
MorseOscillator.prototype.close = function () {
    this.gain.gain.value = 0;
    this.closeTime = new Date().getTime();
    if (this.indicator !== null) {
        clearTimeout(this._indicatorTimer);
        this.indicator.style.width = "0";
    }
    if (this.openTime != null) {
        var duration = this.closeTime - this.openTime;
        if (duration < this.time_gap)
            this.dit();
        else if (duration < this.time_gap*3)
            this.dah();
    }

    var self = this;
    clearTimeout(this._letterTimeout);
    this._letterTimeout = setTimeout(function () {
        self.letter(self._currentPattern, self.LETTER_LOOKUP[self._currentPattern]);
        self._currentPattern = "";
    }, 3*self.time_gap);

    clearTimeout(this._wordTimeout);
    this._wordTimeout = setTimeout(function () {
        self.letter(" ", " ");
        self._currentPattern = "";
        console.log("space");
    }, 6*self.time_gap);
};
MorseOscillator.prototype.encode = function (message, callback) {
    var self = this;
    message = message.toUpperCase();
    callback = callback || function () {};
    this.encoding = true;
    this.cancelEncoding = false;
    function encodeLetter(message, i, callback) {
        if (i >= message.length) {
            self.encoding = false;
            self.cancelEncoding = false;
            return callback();
        } else {
            var enc = self.MORSE_LOOKUP[message[i]];
            innerEncode(enc, 0, function () {
                encodeLetter(message, i+1, callback);
            });
        }
    }
    function innerEncode(enc, j, callback) {
        if (self.cancelEncoding) return callback();

        else if (isNull(enc) || enc.trim() == "") { // A space
            setTimeout(function () {
                callback();
            }, 6.1 * self.time_gap); // Signal off for >6 time gaps (1 space)
            return;

        } else if (j >= enc.length) { // End of letter
            setTimeout(function () {
                callback();
            }, 2.1 * self.time_gap); // Signal off for >3 time gaps (1 inter-letter)
            // An intra-letter gap has already been elapsed: >2 instead of >3

        } else {
            if (enc[j] == '-' || enc[j] == '.') { // Dah or dit
                self.open(); // Signal on
                var duration = (enc[j] == '-') ? 2.9 : 0.9;
                setTimeout(function () {
                    self.close(); // Signal off
                    setTimeout(function () {
                        innerEncode(enc, j+1, callback);
                    }, 0.9 * self.time_gap); // Signal off for <1 time gap (1 intra-letter)

                }, duration * self.time_gap); // Signal on for either 1 time gap or 3

            } else { // Invalid - just ignore and move on
                innerEncode(enc, j+1, callback);
            }
        }
    }
    encodeLetter(message, 0, callback);
};
MorseOscillator.prototype.encodeInstant = function (message) {
    var map = function (str, func, split, join) {
        if (str.map !== undefined) return str.map(func);
        return str.split(split||"").map(func).join(join||"");
    };

    message = message.trim().toUpperCase();
    var self = this;
    var encode = function (l) { return self.MORSE_LOOKUP[l] || " "; };
    var encoded = map(message, encode, "", " ");
    encoded = encoded.replace(/   /g, "  "); // hack to change 3-space gaps to 2
    return encoded;
};
MorseOscillator.prototype.decodeInstant = function (encoded) {
    var self = this;
    var decode = function (l) { return self.LETTER_LOOKUP[l] || ""; };
    var decoded = "", curr = "";
    for (var i=0;i<encoded.length;i++) {
        var l = encoded[i];
        if (l == " ") {
            if (curr == "") { // space encounted imm. after end of letter = end of word
                decoded += " ";
                curr = " "; // flag to not put other spaces in
            } 
            else if (curr == " ") continue;
            else {
                decoded += decode(curr);
                curr = ""; // end of letter
            }
        } else {
            curr += l;
        }
    }
    decoded += decode(curr);
    return decoded;
};

$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js"
], function () {
    loader.start();

    $(document).on("pageload", function () {
        var audio_ctx = new (window.AudioContext || window.webkitAudioContext);
        morse = new MorseOscillator(audio_ctx, 100, $(".dit-dah-meter-indicator")[0]);
        morse.letter = function (encoded, decoded) {
            var enc_val = $(".encoded-message").val(),
                dec_val = $(".decoded-message").val();
            $(".encoded-message").val((enc_val ? enc_val + " " : "") + (encoded.trim() || ""));
            $(".decoded-message").val(dec_val + (decoded || ""));
        };
        $(".morse-button").mousedown(function () { if (morse.encoding) return; morse.open(); });
        $(".morse-button").on("touchstart", function () { if (morse.encoding) return; morse.open(); });
        $(".morse-button").mouseup(function () { if (morse.encoding) return; morse.close(); });
        $(".morse-button").on("touchend", function () { if (morse.encoding) return; morse.close(); });

        $(".clear-message").click(function () {
            $(".encoded-message").val("");
            $(".decoded-message").val("");
        });
        $(".encode-message").click(function () {
            var message = $(".decoded-message").val();
            $(".encoded-message").val("");
            $(".decoded-message").val("");
            morse.encode(message);
        });
        $(".cancel-encoding").click(function () {
            morse.cancelEncoding = true;
        });
        $(".encode-message-instant").click(function () {
            var message = $(".decoded-message").val();
            var encoded = morse.encodeInstant(message);
            $(".encoded-message").val(encoded);
        });
        $(".decode-message-instant").click(function () {
            var encoded = $(".encoded-message").val();
            var decoded = morse.decodeInstant(encoded);
            $(".decoded-message").val(decoded);
        });

        $(".time-gap").val(morse.time_gap);
        $(".time-gap").change(function () {
            morse.time_gap = parseInt($(".time-gap").val());
        });

        $(".frequency").val(morse.oscillator.frequency.value);
        $(".frequency").change(function () {
            morse.oscillator.frequency.value = parseInt($(".frequency").val());
        });
    });
});
});
