(function () {
    angular
        .module('unicornsearchModule', ['ngSanitize']);

    angular
        .module('unicornsearchModule')
        .directive('unicornSearch', SearchDirective);

    function SearchDirective($q, $timeout, $window) {

        return {
            restrict: 'E',
            templateUrl: 'unicornsearch.tpl.html',
            require: 'ngModel',
            replace: true,
            scope: {
                load: '=',
                delay: '=',
                minChars: '=',
                maxItems: '=',
                showClearBtn: '=',
                disabled: '@'
            },
            link: function ($scope, element, attrs, ngModel) {
                var currentTimeout;
                var searchField;
                var touchedPending = false;
                $timeout(function () {
                    searchField = element.find('input')[0];
                });

                $scope.delay = $scope.delay || 400;
                $scope.minChars = $scope.minChars || 3;
                $scope.maxItems = $scope.maxItems;
                $scope.ngModel = ngModel;
                $scope.selectedItems = ngModel.$viewValue;
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
                $scope.state = {
                    open: false,
                    loading: false,
                    nothingFound: false,
                    loadingError: false,
                    tooLessLetters: false,
                    focused: false,
                    maximumReached: false
                };

                $scope.$watch('search', function (searchTerm) {
                    if ($scope.state.maximumReached) {
                        $scope.search = '';
                        return;
                    }
                    resetResults();

                    if (searchTerm) {
                        $scope.state.tooLessLetters = searchTerm.length < $scope.minChars;
                        if (searchTerm.length >= $scope.minChars) {
                            if (currentTimeout) {
                                $timeout.cancel(currentTimeout);
                                currentTimeout = undefined;
                            }
                            currentTimeout = $timeout(function () {
                                startLoading();
                                $scope.load(searchTerm)
                                    .then(addSearchResults, loadingError)
                                    .then(stopLoading);
                            }, $scope.delay);
                        }
                    }
                });

                $scope.$watchCollection('ngModel.$modelValue', function (n) {
                    if (n !== $scope.selectedItems) {
                        $scope.selectedItems = n;
                    }
                });

                //sets the model to undefined if array is empty
                $scope.$watchCollection('selectedItems', function (n) {
                    if (angular.isArray(n) && n.length === 0) {
                        ngModel.$setViewValue(undefined);
                    } else {
                        ngModel.$setViewValue($scope.selectedItems);
                    }
                });

                //observe maximum input
                $scope.$watch('selectedItems.length', function (length) {
                    if (typeof $scope.selectedItems === 'undefined') {
                        $scope.state.maximumReached = false;
                    } else {
                        $scope.state.maximumReached = $scope.selectedItems.length >= $scope.maxItems;
                        if ($scope.state.maximumReached) {
                            $scope.search = '';
                            resetResults();
                        }
                    }
                });

                $window.addEventListener('focus', onFocusOutside, true);

                function addSearchResults(results) {
                    $scope.results = results;
                    $scope.state.nothingFound = results.length === 0;
                    openResults();
                }

                function loadingError(err) {
                    $scope.state.loadingError = true;
                    stopLoading();
                }

                function stopLoading() {
                    $scope.state.loading = false;
                }

                function startLoading() {
                    $scope.state.loading = true;
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
                    return $scope.selectedItems && $scope.selectedItems.indexOf(item) !== -1;
                }

                function activateSearchField() {
                    if (!$scope.disabled) {
                        searchField.focus();
                        searchField.select();
                    }
                }

                function openResults() {
                    $scope.state.open = true;
                    $window.addEventListener("click", onClickOutside);
                }

                function closeResults() {
                    $timeout(function () {
                        $scope.state.open = false;
                    });
                    $window.removeEventListener("click", onClickOutside);
                }

                function resetResults() {
                    $scope.results = [];
                    closeResults();
                    $scope.nothingFound = false;
                    $scope.loadingError = false;
                }

                function clear() {
                    $scope.selectedItems = [];
                    $scope.results = [];
                    $scope.search = '';
                    activateSearchField();
                }

                function requestTouched() {
                    touchedPending = true;
                }

                function onClickOutside(event) {
                    if (element[0].contains(event.target)) return;
                    closeResults();
                    $scope.$apply();
                    setTouchedIfPending();
                }

                function onFocusOutside(event) {
                    if (element[0].contains(event.target)) return;
                    setTouchedIfPending();
                }

                function setTouchedIfPending() {
                    if (touchedPending) {
                        ngModel.$setTouched();
                        $scope.$apply();
                        $window.removeEventListener("focus", onFocusOutside);
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
                        $timeout(function () {
                            var index = [].indexOf.call(selectables, event.target);
                            var nextIndex = (pressed === down) ? (index + 1) : (index - 1);
                            var nextElement = selectables[Math.min(selectables.length, nextIndex)];
                            if (nextElement) {
                                nextElement.focus();
                            } //else focus first element?
                        });
                        event.preventDefault();
                    } else if (pressed === backspace) {
                        var inputIsEmpty = (!$scope.search || $scope.search.length === 0);
                        if (inputIsEmpty) {
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