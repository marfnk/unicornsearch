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
                required: '@', //wheather this component is required false when missing
                disabled: '@', //wheather this component should be disabled false when missing
                itemToKey: '=', //function to convert items to keys for comparision (optional)
                itemToString: '=' // function to convert items into strings for presentation (optional)
            },
            link: function($scope, element, attrs, ngModel) {
                var currentTimeout;
                var searchField;
                var touchedPending = false;
                $timeout(function() {
                    searchField = element.find('input')[0];
                });

                //fallback config
                $scope.config = $scope.config || {};
                $scope.config.delay = $scope.config.delay || 400;
                $scope.config.minChars = $scope.config.minChars || 3;
                $scope.itemToKey = $scope.itemToKey || function(item) {return item.id;};
                $scope.itemToString = $scope.itemToString || function(item) {return item.label;};
                //scope setup
                $scope.ngModel = ngModel;
                $scope.selectedItems = ngModel.$viewValue || [];
                $scope.selectItem = selectItem;
                $scope.removeItem = removeItem;
                $scope.isAlreadySelected = isAlreadySelected;
                $scope.activateSearchField = activateSearchField;
                $scope.closeResults = closeResults;
                $scope.openResults = openResults;
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
                                    .then(addSearchResults, loadingError)
                                    .then(function() {
                                        $scope.state.loading = false;
                                    });
                            }, $scope.config.delay);
                        }
                    }
                });

                $scope.$watchCollection('ngModel.$modelValue', function(n) {
                    //initiailize
                    if (n !== $scope.selectedItems) {
                        $scope.selectedItems = n;
                    }
                    //Validation
                    if ($scope.required) {
                        ngModel.$setValidity('required', ngModel.$modelValue.length !== 0);
                    }
                    //maximum
                    $scope.state.maximumReached = $scope.selectedItems.length >= $scope.config.maxItems;
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
                        searchField.focus();
                        searchField.select();
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
                    $scope.nothingFound = false;
                    $scope.loadingError = false;
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

                function onClickOrFocusOutside(event) {
                    if (!(event.target instanceof Node) || element[0].contains(event.target)) return;
                    closeResults();
                    if (!$scope.$$phase) $scope.$apply();
                    setTouchedIfPending();
                }

                function setTouchedIfPending() {
                    if (touchedPending) {
                        ngModel.$setTouched();
                        if (!$scope.$$phase) $scope.$apply();
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
                        if (searchField.selectionStart === 0 && searchField.selectionEnd === 0) {
                            $scope.selectedItems.pop();
                            event.preventDefault();
                        }

                    } else if (pressed === esc) {
                        activateSearchField();
                        closeResults();

                    } else if (pressed === enter && event.currentTarget === searchField) {
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