# Unicornsearch
so pure but still WIP

[DEMO Plunkr]()

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

### using bower
`'unicornsearch': 'https://github.com/marfnk/unicornsearch.git'`

### oldschool
	<script type="text/javascript" src="path/to/unicornsearch/dist/unicornsearch.min.js"></script>
	<link rel="stylesheet" href="path/to/unicornsearch/dist/unicornsearch.css" />

### build styles with your custom bootstrap variables
	//yourStyles.scss
	@import "path/to/your/bootstrap-src";
	@import "path/to/unicornsearch/src/unicornsearch.scss";


## Usage

    <form name="yourForm">

    <unicorn-search
        ng-model="model"
        name="q_id_foo_2"
        load="yourLoadMethodThatReturnsPromise"
        min-chars="optionalNumberOfMinimumChars"
        delay="typingDelayInMs"
        max-items="maximumCountOfItems"
        show-clear-btn="whetherToShowAClearAllButton"
        ng-disabled="whetherItShouldBeDisabled"></unicorn-search>

    </form>
