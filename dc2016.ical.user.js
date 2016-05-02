// ==UserScript==
// @name        dc2016_ical
// @namespace   com.wayneeaker
// @description DrupalCon 2016 iCal Creator
// @include     https://events.drupal.org/neworleans2016/*
// @version     1
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @require     https://raw.githubusercontent.com/eligrey/FileSaver.js/master/FileSaver.min.js
// @require     https://raw.githubusercontent.com/eligrey/Blob.js/master/Blob.js
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

// Modified ics.js from https://github.com/olafvanzon/ics.js
// Puts everything in Central Time (dirty hack)

/* global saveAs, Blob, BlobBuilder, console */
/* exported ics */
var ics = function() {
    'use strict';

    if (navigator.userAgent.indexOf('MSIE') > -1 && navigator.userAgent.indexOf('MSIE 10') == -1) {
        console.log('Unsupported Browser');
        return;
    }

    var SEPARATOR = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
    var calendarEvents = [];
    var calendarStart = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VTIMEZONE',
        'TZID:US/Central',
        'X-LIC-LOCATION:US/Central',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:-0600',
        'TZOFFSETTO:-0500',
        'TZNAME:CDT',
        'DTSTART:19700308T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:-0500',
        'TZOFFSETTO:-0600',
        'TZNAME:CST',
        'DTSTART:19701101T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'END:STANDARD',
        'END:VTIMEZONE',
    ].join(SEPARATOR);
    var calendarEnd = SEPARATOR + 'END:VCALENDAR';

    return {
        /**
         * Returns events array
         * @return {array} Events
         */
        'events': function() {
            return calendarEvents;
        },

        /**
         * Returns calendar
         * @return {string} Calendar in iCalendar format
         */
        'calendar': function() {
            return calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;
        },

        /**
         * Add event to the calendar
         * @param  {string} subject     Subject/Title of event
         * @param  {string} description Description of event
         * @param  {string} location    Location of event
         * @param  {string} begin       Beginning date of event
         * @param  {string} stop        Ending date of event
         */
        'addEvent': function(subject, description, location, begin, stop) {
            // I'm not in the mood to make these optional... So they are all required
            if (typeof subject === 'undefined' ||
                typeof description === 'undefined' ||
                typeof location === 'undefined' ||
                typeof begin === 'undefined' ||
                typeof stop === 'undefined'
            ) {
                return false;
            };

            //TODO add time and time zone? use moment to format?
            var start_date = new Date(begin);
            var end_date = new Date(stop);

            var start_year = ("0000" + (start_date.getFullYear().toString())).slice(-4);
            var start_month = ("00" + ((start_date.getMonth() + 1).toString())).slice(-2);
            var start_day = ("00" + ((start_date.getDate()).toString())).slice(-2);
            var start_hours = ("00" + (start_date.getHours().toString())).slice(-2);
            var start_minutes = ("00" + (start_date.getMinutes().toString())).slice(-2);
            var start_seconds = ("00" + (start_date.getMinutes().toString())).slice(-2);

            var end_year = ("0000" + (end_date.getFullYear().toString())).slice(-4);
            var end_month = ("00" + ((end_date.getMonth() + 1).toString())).slice(-2);
            var end_day = ("00" + ((end_date.getDate()).toString())).slice(-2);
            var end_hours = ("00" + (end_date.getHours().toString())).slice(-2);
            var end_minutes = ("00" + (end_date.getMinutes().toString())).slice(-2);
            var end_seconds = ("00" + (end_date.getMinutes().toString())).slice(-2);

            var start_time = 'T' + start_hours + start_minutes + start_seconds;
            var end_time = 'T' + end_hours + end_minutes + end_seconds;

            var start = start_year + start_month + start_day + start_time;
            var end = end_year + end_month + end_day + end_time;

            var calendarEvent = [
                'BEGIN:VEVENT',
                'CLASS:PUBLIC',
                'DESCRIPTION:' + description,
                'DTSTART;TZID=US/Central:' + start,
                'DTEND;TZID=US/Central:' + end,
                'LOCATION:' + location,
                'SUMMARY;LANGUAGE=en-us:' + subject,
                'TRANSP:TRANSPARENT',
                'END:VEVENT'
            ].join(SEPARATOR);

            calendarEvents.push(calendarEvent);
            return calendarEvent;
        },

        /**
         * Download calendar using the saveAs function from filesave.js
         * @param  {string} filename Filename
         * @param  {string} ext      Extention
         */
        'download': function(filename, ext) {
            if (calendarEvents.length < 1) {
                return false;
            }

            ext = (typeof ext !== 'undefined') ? ext : '.ics';
            filename = (typeof filename !== 'undefined') ? filename : 'calendar';
            var calendar = calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;

            var blob;
            if (navigator.userAgent.indexOf('MSIE 10') === -1) { // chrome or firefox
                blob = new Blob([calendar], {type: 'text/x-vCalendar;charset=' + document.characterSet});
            } else { // ie
                var bb = new BlobBuilder();
                bb.append(calendar);
                blob = bb.getBlob('text/x-vCalendar;charset=' + document.characterSet);
            }
            saveAs(blob, filename + ext);
            return calendar;
        }
    };
};

// Find data and reformat for ics.js
var container = $('.node-session.node-full, .node-schedule-item.node-full, .node-bof-session.node-full');
if (container.length > 0) {
  $(container).each(function() {
    var time = $(this).find('.field--name-field-session-timeslot .field--name-field-timeslot-time .field__item');
    var loc = $(this).find('.field--name-field-session-timeslot .field--name-field-timeslot-room .field__item');
    var re = new RegExp("(\\d+)\/(\\d+)\/(\\d+) - (\\d+):(\\d+)-(\\d+)\/(\\d+)\/(\\d+) - (\\d+):(\\d+)");
    var timeArray = re.exec(time.text());
    var start = timeArray[3] + '/' + timeArray[1] + '/' + timeArray[2] + ' ' + timeArray[4] + ':' + timeArray[5] + ':00';
    var end = timeArray[8] + '/' + timeArray[6] + '/' + timeArray[7] + ' ' + timeArray[9] + ':' + timeArray[10] + ':00';
    var title = $('h1').text();
    var location = loc.text();

    // Create link and bind ical creator
    var link = $('<a href="#" data-title="' + title + '" data-loc="' + location + '" data-start="' + start +'" data-end="' + end + '">[iCal]</a>');
    link.click(function() {
      var start = $(this).attr('data-start');
      var end = $(this).attr('data-end');
      var title = $(this).attr('data-title');
      var loc = $(this).attr('data-loc');
      var icsObject = ics();
      icsObject.addEvent(title, title, loc, start, end);
      icsObject.download('download');
      return false;
    })
    time.append('&nbsp;');
    time.append(link);
  });
}

