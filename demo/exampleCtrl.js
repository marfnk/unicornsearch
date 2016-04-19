angular
  .module('myExampleApp', ['unicornsearchModule', 'ngTouch']);
  //'ngTouch' is no requirement - its just to prove that it works

angular
  .module('myExampleApp')
  .controller('exampleCtrl', ExampleCtrl);

function ExampleCtrl($scope, $q, $timeout, $interval) {

  //preselected items
  $scope.model = [
    {id: 42, label: 'unicorn'}
  ];

  //unicornsearch config
  $scope.config = {
    minChars: 4,
    delay: 300,
    maxItems: 5,
    showClearBtn: false,
    clearOnAdd: true
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

  //comparable property of an item (e.g. item.id)
  //compares by id if undefined
  $scope.itemToKey = function(item) {
    return item.id + item.label;
  }

  //function that transforms an item into a string for the chips
  //unicornsearch uses item.label as fallback.
  $scope.itemToString = function(item) {
    return item.label;
  }

  //*****************
  //*   demo code   *
  //*****************

  $scope.noNetwork = false;

  $scope.addItemFromOutside = function() {
    if (!$scope.model) {
      $scope.model = [];
    }
    var id = Math.floor(Math.random() * 100);
    $scope.model.push({id: id, label: "item #" + id});
  };

  $scope.addNew = function(term) {
    return $q(function(resolve, reject) {
      setTimeout(function() {
        resolve({id: Math.floor(Math.random() * 100), label: term});
      });
    });
  }

  //DEMO FUNCTION FOR ASYNC RESULT-LOADING
  $scope.load = function(searchTerm) {
    return $q(function(resolve, reject) {
      setTimeout(function() {
        if ($scope.noNetwork) {
          reject('no network');
        } else if ( Math.random()<0.2 ) {
          resolve([]);
        } else {
          var arr = [];
          var count = Math.floor(Math.random() * 9) + 1;
          for (var i = 0; i < count; i ++) {
            arr.push({id: i, label: searchTerm + "(" +  i + ")", foo: 'bar'});
          }
          resolve(arr);
        }
      }, 1000);
    });
  }
}
