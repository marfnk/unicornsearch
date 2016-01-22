(function() {
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
        $scope.clear = clear;
        $scope.results = [];
        $scope.setTouched = setTouched;
        $scope.handleSpecialChars = handleSpecialChars;
        $scope.state = {  open: false,
                          loading: false,
                          nothingFound: false, 
                          loadingError: false,
                          tooLessLetters: false,
                          focused: false,
                          maximumReached: false };
                          
        registerClickOutListener();
         
        $scope.$watch('search', function(searchTerm) {
          console.log("hallo");
          if ($scope.state.maximumReached) {
            $scope.search = '';
            return;
          }
          //reset
          resetResults();
          
          if (searchTerm) {
            $scope.state.tooLessLetters = searchTerm.length < $scope.minChars;
            if (searchTerm.length >= $scope.minChars) {
              if (currentTimeout) {
                $timeout.cancel(currentTimeout);
                currentTimeout = undefined;
              }
              currentTimeout = $timeout(function(){
                startLoading();
                $scope.load(searchTerm)
                  .then(addSearchResults, loadingError)
                  .then(stopLoading);
              }, $scope.delay);
            }
          }
        });
        
        $scope.$watchCollection('ngModel.$modelValue', function(n) {
          if (n !== $scope.selectedItems) {
           $scope.selectedItems = n;
          }
        });
        
        //sets the model to undefined if array is empty
        $scope.$watchCollection('selectedItems', function(n) {
          if (angular.isArray(n) && n.length === 0) {
            ngModel.$setViewValue(undefined);
          } else {
            ngModel.$setViewValue($scope.selectedItems);
          }
        });
        
        //observe maximum input
        $scope.$watch('selectedItems.length', function(length) {
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
        
        function addSearchResults(results) {
          $scope.results = results;
          $scope.state.nothingFound = results.length === 0;
          $scope.state.open = true;
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
          $scope.state.open = false;
        }
        
        function removeItem(item) {
          $scope.selectedItems.splice($scope.selectedItems.indexOf(item), 1);
        }
        
        function isAlreadySelected(item) {
          return $scope.selectedItems && $scope.selectedItems.indexOf(item) !== -1;
        }
        
        function activateSearchField() {
          if (!$scope.disabled) {
            element.find('input')[0].focus();
          }
        }
        
        function closeResults() {
          $timeout(function() {
            $scope.state.open = false;
          });
        }
        
        function resetResults() {
          $scope.results = [];
          $scope.state.open = false;
          $scope.nothingFound = false;
          $scope.loadingError = false;
        }
        
        function openResults() {
          $scope.state.open = true;  
        }
        
        function clear() {
          $scope.selectedItems = [];
          $scope.results = [];
          $scope.search = '';
          activateSearchField();
        }
        
        function setTouched() {
          ngModel.$setTouched();
        }
        
        function inputIsEmpty() {
          return (!$scope.search || $scope.search.length === 0);
        }
        
        function registerClickOutListener() {
          angular.element($window).on('click', function (event) {
            if (element[0].contains(event.target)) return;
            closeResults();
            $scope.$apply();
          });
        }
        
        function handleSpecialChars(event) {
          var selectables = element[0].querySelectorAll('.unicorn-search__focusable');
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            $scope.state.open = true;
            $timeout(function() {
              var index = [].indexOf.call(selectables, event.target);
              var nextIndex = event.key === "ArrowDown" ? (index+1) : (index-1);
              var nextElement = selectables[Math.min(selectables.length, nextIndex)];
              if (nextElement) {
                nextElement.focus();  
              }
            });
            event.preventDefault();
          } else if (event.key === "Backspace" && inputIsEmpty()) {
            $scope.selectedItems.pop();
            event.preventDefault();
          } else if (event.key === "Escape") {
            activateSearchField();
            closeResults();
          }
        }
      }
    };
  }
})();