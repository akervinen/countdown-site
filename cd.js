"use strict";

var rg_time = /^(\d+)$|^((\d+)h)?((\d+)m)?((\d+)s)?$/i
function parseDuration(dur) {
    var match = rg_time.exec(dur);
    var dur = {
        hours: 0, minutes: 0, seconds: 0
    };

    if (match[1]) {
        dur.minutes = parseInt(match[1]);
    } else {
        dur.hours = parseInt(match[3]) || 0;
        dur.minutes = parseInt(match[5]) || 0;
        dur.seconds = parseInt(match[7]) || 0;
    }

    return dur;
}

function formatTimeUnit(time, unit) {
    var pl = time != 1;
    return time + ' ' + unit + (pl ? 's' : '');
}

function formatDuration(dur) {
    var stuff = [];
    if (dur.hours() > 0) {
        stuff.push(formatTimeUnit(dur.hours(), "hour"));
    }
    if (dur.minutes() > 0) {
        stuff.push(formatTimeUnit(dur.minutes(), "minute"));
    }
    // only seconds remaining
    if (stuff.length == 0) {
        stuff.push(dur.seconds() + '.' + Math.floor(dur.milliseconds()/100) + " seconds")
    } else if (dur.seconds() > 0) {
        stuff.push(formatTimeUnit(dur.seconds(), "second"));
    }

    return stuff.join(", ");
}

function formatTitle(dur, late) {
    var stuff = [];
    if (dur.hours() != 0) {
        stuff.push(Math.abs(dur.hours()) + "h");
    }
    if (dur.minutes() != 0) {
        stuff.push(Math.abs(dur.minutes()) + "m");
    }
    // only seconds remaining
    if (stuff.length == 0 || dur.seconds() != 0) {
        stuff.push(Math.abs(dur.seconds()) + "s");
    }

    return stuff.join(", ") + (late ? " late" : "");
}

var Countdown = (function() {
    var cd = function(elements) {
        this.elements = elements;
        this.alarmed = false;
    };

    cd.prototype.start = function start(time, dur) {
        this.startTime = time;
        this.duration = dur;
        this.endTime = moment(time).add(dur);

        var el = this.elements;
        el.startTime.textContent = this.startTime.format('HH:mm:ss');
        el.endTime.textContent = this.endTime.format('HH:mm:ss');
        this.update();
        this.updateTitle();

        window.requestAnimationFrame(this.update.bind(this));
        window.setInterval(this.updateTitle.bind(this), 500);
    };

    cd.prototype.updateTitle = function updateTitle() {
        var el = this.elements;
        var cur = moment();
        var late = cur.isAfter(this.endTime);

        document.title = "cd: " + formatTitle(moment.duration(this.endTime.diff(cur)), late);

        if (late && !this.alarmed) {
            this.alarmed = true;
            el.alarm.play();
        }
    }

    cd.prototype.update = function update() {
        var el = this.elements;
        var cur = moment();

        el.currentTime.textContent = cur.format('HH:mm:ss');

        window.requestAnimationFrame(this.update.bind(this));

        if (cur.isAfter(this.endTime)) {
            el.bar.style.width = "0%";
            document.body.style.background = "#611";
            el.barTime.textContent = formatDuration(this.duration) + " passed";
            return;
        }

        var full = this.endTime.diff(this.startTime);
        var perc = 1 - this.endTime.diff(cur)/full;

        el.bar.style.width = perc*100 + "%";
        el.barTime.textContent = formatDuration(moment.duration(this.endTime.diff(cur)));
    }

    return cd;
})();

window.onload = function load() {
    var durstr = window.location.pathname.substring(1);
    var dur = moment.duration(parseDuration(durstr));

    var elements = {
        startTime: document.getElementById("startTime"),
        endTime: document.getElementById("endTime"),
        currentTime: document.getElementById("currentTime"),
        bar: document.querySelector('.progressBar > .bar'),
        barTime: document.querySelector('.progressBar > .longTime'),
        alarm: document.querySelector('#alarm')
    };

    var cd = new Countdown(elements);
    cd.start(moment(), dur);
}