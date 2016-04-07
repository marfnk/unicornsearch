# Unicornsearch
so pure but still WIP

[Example on Plunker](https://plnkr.co/edit/8SlSxsnbFx6QMxRvbzJY?p=preview)

## Description
This is yet another AngularJS select2-style component. But it is minimal and super clean, focusses on usability and only depends on Angular.
It has only ca. 0,5% LOC of select2.

## Features
- keyboard support (tab, backspace, arrow keys, enter, ESC)
- uses `ng-model` like a common input element
- validates the ng-model and sets the `$touched` attribute
- you inject your own search result loading method
- optional "clear"-btn
- disabled state just like in common input elements
- configurable (minium chars for search, typing delay, maximum entries)
- still focusable when maximum elements selected
- last but not least: beautiful like a unicorn 🦄
 
## Setup

### load dependency
#### using bower
    
    'unicornsearch': 'https://github.com/marfnk/unicornsearch.git'

#### manually
	<script type="text/javascript" src="path/to/unicornsearch/dist/unicornsearch.min.js"></script>
	<link rel="stylesheet" href="path/to/unicornsearch/dist/unicornsearch.css" />

### Inject AngularJS dependency

	angular
		.module('myExampleApp',
			['unicornsearchModule'], //inject unicornsearch module
			... //more dependencies
		);


## Usage

### HTML
    <form name="yourForm">

    	<unicorn-search
          ng-model="model"
          name="q_id_foo"
          load="load"
          item-to-key="itemToKey"
          item-to-string="itemToString"
          config="config"
          translations="translations"
          required
          ng-disabled="disabled"></unicorn-search>
    </form>

### JS (configuration)

    //preselected items
    $scope.model = [
      {id: 42, label: 'unicorn'}
    ];

    //unicornsearch config
    $scope.config = {
      minChars: 4,			//mininum characters before search is triggered
      delay: 300,			//duration in ms between the 'keyup' event and the search
      maxItems: 5,			//maximum number of selected items
      showClearBtn: false,	//whether the appended clear button should be shown
      clearOnAdd: false		//whether the search input and results should be cleared when a search result is added
    }

    //i18n
    $scope.translations = {
      maximumReached: 'maximale Anzahl erreicht',
      nothingFound: 'Nichts gefunden',
      tooLessChars: 'Suchanfrage zu kurz',
      errorFetchingResults: 'Konnte Ergebnisse nicht laden.',
      resultSingular: 'Ergebnis',
      resultPlural: 'Ergebnisse',
      alreadySelected: '(bereits ausgewählt)'
    }

    //comparable property of an item (e.g. item.id), compares by id if undefined
    $scope.itemToKey = function(item) {
      return item.id + item.label;
    }

    //function that transforms an item into a string for the chips, uses item.label if undefined
    $scope.itemToString = function(item) {
      return item.label + " :) ";
    }

    //loading the results - has to return a $q (promise)
    $scope.load = function(searchTerm) {
    	 return $q(function(resolve, reject) {
    	    var results = loadYourResultsFromSomewhere(searchTerm);
    	    resolve(results);
    	    //or if error: reject(errorMsg);
    	 }
    }

### SASS (styling)

    //set your bootstrap variables
    @import "path/to/your/bootstrap-sass-official";
    @import "path/to/unicornsearch/src/unicornsearch.scss";