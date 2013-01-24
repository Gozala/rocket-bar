/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Imports
// ----------------------------------------------------------------------------

var filter = require('reducers/filter');
var map = require('reducers/map');
var merge = require('reducers/merge');
var fold = require('reducers/fold');
var open = require('dom-reduce/event');
var print = require('reducers/debug/print');
var zip = require('zip-reduce');
var grep = require('grep-reduce');
var kicks = require('./kicks.js'),
    apply = kicks.apply,
    compose = kicks.compose,
    slice = kicks.slice,
    reverse = kicks.reverse,
    lambda = kicks.lambda,
    fill = kicks.fill,
    extend = kicks.extend;

// Supporting functions
// ----------------------------------------------------------------------------

function getSearchSerialization(noun) {
  // Return the searchable field of the object. This function is used to
  // map nouns before grepping. It's also a useful abstraction in case we
  // change the searchable field mechanism in future.
  return noun.searchable;
}

// FakeDB
// ----------------------------------------------------------------------------

var CONTACTS = map([
  'Matt Helm',
  'Hal Ambler',
  'Ali Imran',
  'Jane Blonde',
  'Basil Argyros',
  'Modesty Blaise',
  'Sir Alan Blunt',
  'James Bond',
  'Felix Leiter',
  'Nancy Drew',
  'Sherlock Holmes',
  'Jason Bourne',
  'Tim Donohue',
  'Sam Fisher',
  'Stephen Metcalfe',
  'Jack Ryan',
  'Nick Fury',
  'Ada Wong',
  'Jack Bauer',
  'Sydney Bristow',
  'Ethan Hunt',
  'Wyman Ford',
  'Nick Carter-Killmaster',
  'Johnny Fedora',
  'Tamara Knight',
  'Mitch Rapp',
  'Michael Jagger',
  'George Smiley',
  'Simon Templar',
  'Philip Quest',
  'Mortadelo Pi',
  'Filemón Pi',
  'Maria Hill'
], function(name) {
  // Generate mock contact structure...
  return {
    fn: name,
    app: 'contacts.gaiamobile.org',
    org: '',
    tel: '',
    url: '',
    adr: {
      street_address: '',
      locality: '',
      region: '',
      postal_code: '',
      country_name: ''
    },
    note: ''
  }
});

var ARTISTS = map([
  'The Album Leaf',
  'Ali Farka Toure',
  'Amiina',
  'Anni Rossi',
  'Arcade Fire',
  'Arthur & Yu',
  'Au',
  'Band of Horses',
  'Beirut',
  'Billie Holiday',
  'Burial',
  'Wilco',
  'Justice',
  'Bishop Allen',
  'Sigur Ros',
  'Bjork',
  'The Black Keys',
  'Bob Dylan',
  'Bodies of Water',
  'Bon Iver',
  'Counting Crows',
  'Death Cab for Cutie',
  'Fleet Foxes',
  'Fleetwood Mac',
  'The Innocence Mission'
], function (artistName) {
  return {
    fn: artistName,
    type: 'artist',
    app: 'music.gaiamobile.org'
  }
});

// "Direct Objects" in the sense of "direct object of a verb", not in the
// compsci sense.
// <http://www.grammar-monster.com/lessons/verbs.htm>
var VERBS = [
  { 
    verb: 'play',
    noun: 'music.gaiamobile.org' 
  },
  {
    verb: 'search',
    noun: '*'
  },
  {
    verb: 'web',
    noun: '*'
  },
  {
    verb: 'date',
    noun: 'calendar.gaiamobile.org'
  },
  {
    verb: 'txt',
    noun: 'contacts.gaiamobile.org'
  },
  {
    verb: 'msg',
    noun: 'contacts.gaiamobile.org'
  },
  {
    verb: 'sms',
    noun: 'contacts.gaiamobile.org'
  },
  {
    verb: 'call',
    noun: 'contacts.gaiamobile.org'
  }
];

// Action bar token index setup
// ----------------------------------------------------------------------------
//
// Extend data structures with a "searchable" field that contains
// the data relevant to search context.

// Extend contacts with "search" field. This is the field that will be matched
// against text in the action bar.
var contactsWithSearchableField = map(CONTACTS, function (contact) {
  return extend({}, contact, {
    searchable: contact.fn
  });
});

var artistsWithSearchableField = map(ARTISTS, function (artist) {
  return extend({}, artist, {
    searchable: artist.fn
  });
});

var verbsWithSearchableField = map(VERBS, function (verb) {
  return extend({}, verb, {
    searchable: verb.verb
  });
});

var allNouns = merge([
  contactsWithSearchableField,
  artistsWithSearchableField,
  verbsWithSearchableField
]);

// Control flow logic
// ----------------------------------------------------------------------------

var doc = document.documentElement;

// Catch all bubbled keypress events.
var keypressesOverTime = open(doc, 'keyup');

// Catch all bubbled click events.
var clicksOverTime = open(doc, 'click');

// We're only interested in events on the action bar.
var actionBarPressesOverTime = filter(keypressesOverTime, function(event) {
  return event.target.id === 'action-bar';
});

// Get the list of values in the action bar over time.
var actionBarValuesOverTime = map(actionBarPressesOverTime, function(event) {
  return event.target.value;
});

// Grep list of strings.
var scoredNounListsOverTime = map(actionBarValuesOverTime, function (value) {
  return grep(value, allNouns, getSearchSerialization);
});

// Find the matches container.
var matchesContainerEl = document.getElementById('matches');

// Begin folding the value... kicks off processing.
fold(scoredNounListsOverTime, function(matches) {
  var eventualHtmlString = fold(matches, function (pair, html) {
    var noun = pair[0];
    return html + '<li>' + noun.searchable + '</li>';
  }, '');

  fold(eventualHtmlString, function (htmlString) {
    return matchesContainerEl.innerHTML = htmlString;
  });
});

fold(scoredNounListsOverTime, function (nouns) {
  print(nouns);
});

