(function() {
    angular
        .module('unicornsearchModule', ['ngSanitize']);

    angular
        .module('unicornsearchModule')
        .directive('unicornSearch', SearchDirective);

    function SearchDirective($timeout, $window) {

        return {
            restrict: 'E',
            templateUrl: 'unicornsearch.tpl.html',
            require: 'ngModel',
            scope: {
                load: '=', //function that returns a promise ($q) with the results (required)
                translations: '=', //translation object (optional)
                config: '=', //configuration object (options)
                disabled: '@', //wheather this component should be disabled false when missing
                itemToKey: '=', //function to convert items to keys for comparision (optional)
                itemToString: '=' // function to convert items into strings for presentation (optional)
            },
            link: function($scope, element, attrs, ngModel) {
                var currentTimeout;
                var searchField; //use getter
                var touchedPending = false;

                //fallback config
                $scope.config = $scope.config || {};
                $scope.config.delay = $scope.config.delay || 400;
                $scope.config.minChars = $scope.config.minChars || 3;
                $scope.itemToKey = $scope.itemToKey || function(item) {return item.id;};
                $scope.itemToString = $scope.itemToString || function(item) {return item.label;};
                //scope setup
                $scope.ngModel = ngModel;
                $scope.selectedItems = [];
                $scope.selectItem = selectItem;
                $scope.removeItem = removeItem;
                $scope.calculateInputSize = calculateInputSize;
                $scope.isAlreadySelected = isAlreadySelected;
                $scope.activateSearchField = activateSearchField;
                $scope.closeResults = closeResults;
                $scope.openResults = openResults;
                $scope.focusResult = focusResult;
                $scope.clear = clear;
                $scope.results = [];
                $scope.requestTouched = requestTouched;
                $scope.handleKeyboardInput = handleKeyboardInput;
                $scope.getFirstSelectableItemFromResults = getFirstSelectableItemFromResults;
                $scope.state = {
                    open: false,
                    loading: false,
                    nothingFound: false,
                    loadingError: false,
                    tooLessLetters: false,
                    focused: false,
                    maximumReached: false
                };

                $scope.$watch('search', function(searchTerm) {
                    if ($scope.state.maximumReached) {
                        $scope.search = '';
                        return;
                    }
                    resetResults();

                    if (searchTerm) {
                        $scope.state.tooLessLetters = searchTerm.length < $scope.config.minChars;
                        if (searchTerm.length >= $scope.config.minChars) {
                            if (currentTimeout) {
                                $timeout.cancel(currentTimeout);
                                currentTimeout = undefined;
                            }
                            currentTimeout = $timeout(function() {
                                $scope.state.loading = true;
                                $scope.load(searchTerm)
                                    .then(addSearchResults)
                                    .then(function() {
                                        $scope.state.loading = false;
                                    }).catch(loadingError);
                            }, $scope.config.delay);
                        }
                    }
                });

                //set from outside
                $scope.$watchCollection('ngModel.$modelValue', function(n) {
                    if (n !== $scope.selectedItems) {
                        $scope.selectedItems = n;
                    }
                });

                $scope.$watchCollection('selectedItems', function(n) {
                    ngModel.$setViewValue(n);

                    var length = $scope.selectedItems ? $scope.selectedItems.length : 0;
                    //Validation
                    if (attrs.required) {
                        ngModel.$setValidity('required', length > 0);
                    }
                    //maximum
                    $scope.state.maximumReached = length >= $scope.config.maxItems;
                    if ($scope.state.maximumReached) {
                        $scope.search = '';
                        resetResults();
                    }
                });

                function addSearchResults(results) {
                    $scope.results = results;
                    $scope.state.nothingFound = results.length === 0;
                    openResults();
                }

                function loadingError(err) {
                    $scope.state.loadingError = true;
                    $scope.state.loading = false;
                }

                function selectItem(item) {
                    if (!$scope.selectedItems) {
                        $scope.selectedItems = [];
                    }
                    $scope.selectedItems.push(item)
                    closeResults();
                    if ($scope.config.clearOnAdd) {
                      $scope.search = '';
                      resetResults();
                    }
                    activateSearchField();
                }

                function removeItem(item) {
                    $scope.selectedItems.splice($scope.selectedItems.indexOf(item), 1);
                }

                function isAlreadySelected(item) {
                    if (!$scope.selectedItems) {
                        return false;
                    }
                    for (var i = 0; i < $scope.selectedItems.length; ++i) {
                        if ($scope.itemToKey($scope.selectedItems[i]) === $scope.itemToKey(item)) {
                            return true;
                        }
                    }
                    return false;
                }

                function activateSearchField() {
                    if (!$scope.disabled) {
                        if (ngModel.$untouched) {
                            $window.addEventListener('focus', onClickOrFocusOutside, true);
                        }
                        getSearchFieldElement().focus();
                        //getSearchFieldElement().select();
                    }
                }

                function openResults() {
                    $scope.state.open = true;
                    $window.addEventListener("click", onClickOrFocusOutside);
                }

                function closeResults() {
                    $timeout(function() {
                        $scope.state.open = false;
                    });
                    $window.removeEventListener("click", onClickOrFocusOutside);
                }

                function resetResults() {
                    $scope.results = [];
                    closeResults();
                    $scope.state.nothingFound = false;
                    $scope.state.loadingError = false;
                }

                function clear() {
                    ngModel.$setViewValue([]);
                    $scope.results = [];
                    $scope.search = '';
                    activateSearchField();
                }

                function requestTouched() {
                    touchedPending = true;
                }

                function calculateInputSize() {
                    if ($scope.state.maximumReached) {
                        return ($scope.translations.maximumReached || 'maximum reached').length * 1.2;
                    } else {
                        return $scope.search ? $scope.search.length * 1.2 : 10;
                    }
                }

                function onClickOrFocusOutside(event) {
                    if (!(event.target instanceof Node) || element[0].contains(event.target)) return;
                    closeResults();
                    if (!$scope.$$phase && !$scope.$root.$$phase) { $scope.$apply(); } //safe apply
                    setTouchedIfPending();
                }

                function setTouchedIfPending() {
                    if (touchedPending) {
                        ngModel.$setTouched();
                        if (!$scope.$$phase && !$scope.$root.$$phase) { $scope.$apply(); } //safe apply
                        $window.removeEventListener("focus", onClickOrFocusOutside);
                    }
                }

                function getFirstSelectableItemFromResults() {
                    for (var i = 0; i < $scope.results.length; i++) {
                        if (!isAlreadySelected($scope.results[i])) {
                            return $scope.results[i];
                        }
                    }
                    return undefined;
                }

                function getSearchFieldElement() {
                  if (!searchField) {
                    searchField = element.find('input')[0];
                  }

                  return searchField;
                }

                function focusResult($event) {
                  if ($event.currentTarget.tagName === "BUTTON") {
                    $event.currentTarget.focus();
                  }
                }

                function handleKeyboardInput(event) {
                    //keys: http://www.quirksmode.org/js/keys.html
                    var backspace = 8,
                        down = 40,
                        up = 38,
                        esc = 27,
                        enter = 13;
                    var pressed = event.keyCode;

                    if (pressed === down || pressed === up) {
                        var selectables = element[0].querySelectorAll('.unicorn-search__focusable');
                        openResults();
                        $timeout(function() {
                            var index = [].indexOf.call(selectables, event.target);
                            var nextIndex = (pressed === down) ? (index + 1) : (index - 1);
                            if (nextIndex >= selectables.length || nextIndex < 0) {
                                nextIndex = (pressed === down) ? 0 : (selectables.length - 1);
                            }
                            selectables[nextIndex].focus();
                        });
                        event.preventDefault();

                    } else if (pressed === backspace) {
                        if (getSearchFieldElement().selectionStart === 0 && getSearchFieldElement().selectionEnd === 0) {
                            $scope.selectedItems.pop();
                            event.preventDefault();
                        }

                    } else if (pressed === esc) {
                        activateSearchField();
                        closeResults();

                    } else if (pressed === enter && event.currentTarget === getSearchFieldElement()) {
                        event.preventDefault();
                        var firstSelectableItem = getFirstSelectableItemFromResults();
                        if ($scope.state.open === true && firstSelectableItem) {
                            selectItem(firstSelectableItem);
                        }
                    }
                }

            }
        };
    }
})();
angular.module('unicornsearchModule').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('unicornsearch.tpl.html',
    "<div class=\"unicorn-search\" ng-class=\"{\n" +
    "      'input-group': config.showClearBtn && !disabled,\n" +
    "      'unicorn-search--disabled': disabled,\n" +
    "      'unicorn-search--active': state.focused || (state.open && results.length > 0)\n" +
    "    }\"><div class=\"unicorn-search__inner form-control\" ng-mouseup=\"activateSearchField()\" ng-class=\"{'unicorn-search__inner--focused': state.focused,\n" +
    "                   'unicorn-search__inner--open': (state.open && results.length > 0)}\"><ul class=\"unicorn-chips\"><li ng-repeat=\"chip in selectedItems\" class=\"unicorn-chips__chip\">{{itemToString(chip)}} <button type=\"button\" ng-click=\"removeItem(chip)\" tabindex=\"-1\" ng-if=\"!disabled\">&times;</button></li></ul><div class=\"unicorn-search__input\" ng-hide=\"disabled\"><i class=\"glyphicon\" ng-class=\"{\n" +
    "            'glyphicon-refresh glyphicon-spin': state.loading,\n" +
    "            'glyphicon-search': !state.loading  && !state.loadingError,\n" +
    "            'glyphicon-exclamation-sign': !state.loading && state.loadingError\n" +
    "          }\"></i> <input tabindex=\"0\" type=\"text\" size=\"{{calculateInputSize()}}\" class=\"unicorn-search__focusable\" placeholder=\"{{state.maximumReached ? (translations.maximumReached || 'maximum reached'): ''}}\" ng-model=\"search\" ng-keydown=\"handleKeyboardInput($event)\" ng-focus=\"requestTouched();openResults();state.focused=true\" ng-blur=\"state.focused=false\"></div><div class=\"unicorn-suggestions\"><ul ng-if=\"state.open && results.length > 0\"><li class=\"unicorn-suggestions__headline\"><strong>{{results.length}} {{results.length > 1 ? translations.resultPlural || 'results' : translations.resultSingular || 'result'}}</strong></li><li ng-repeat=\"result in results\" class=\"unicorn-suggestions__result\"><button type=\"button\" class=\"unicorn-search__focusable\" ng-click=\"selectItem(result)\" ng-if=\"!isAlreadySelected(result)\" tabindex=\"0\" ng-keydown=\"handleKeyboardInput($event)\" ng-mouseover=\"focusResult($event)\" ng-focus=\"focussedResult=result\" ng-blur=\"focussedResult=undefined\" ng-class=\"{'active': (state.focused && getFirstSelectableItemFromResults() === result) || focussedResult === result}\">{{itemToString(result)}}</button> <span class=\"unicorn-suggestions__result--already-selected\" ng-if=\"isAlreadySelected(result)\">{{itemToString(result)}} {{translations.alreadySelected || 'is already selected'}}</span></li></ul></div></div><span class=\"input-group-btn\" ng-if=\"config.showClearBtn && !disabled\"><button type=\"button\" class=\"btn btn-danger unicorn-search__btn-append\" ng-click=\"clear()\"><i class=\"glyphicon glyphicon-trash\"></i></button></span></div><span class=\"help-block unicorn-hints\" ng-if=\"state.nothingFound || state.tooLessLetters || state.loadingError\"><span ng-if=\"state.nothingFound\" class=\"unicorn-hints__hint text-warning\">{{translations.nothingFound || 'Nothing found.'}}</span> <span ng-if=\"state.tooLessLetters\" class=\"unicorn-hints__hint text-muted\">{{translations.tooLessChars || 'Search term too short.'}}</span> <span ng-if=\"state.loadingError\" class=\"unicorn-hints__hint text-danger\">{{translations.errorFetchingResults || 'Could not fetch results.'}}</span></span>"
  );

}]);
