app.controller("ReceiptController", ['$scope', '$routeParams', 'PaymentService', 'OrderService', 'SettingsService', 'HelperService', 'StorageService', '$document', function ($scope, $routeParams, PaymentService, OrderService, SettingsService, HelperService, StorageService, $document) {

    // Define a place to hold your data
    $scope.data = {};

    // Load in some helpers
    $scope.helpers = HelperService;

    $scope.data.params = {};
    $scope.data.params.expand = "payment_method,payment_method.data,customer";
    $scope.data.params.formatted = true;
    $scope.settings = SettingsService.get();

    $scope.data.params.options = true;
    $scope.data.params.formatted = true;

    // A customer object if the user creates an account
    $scope.customer = {};

    // Get the payment, if any.
    PaymentService.get($routeParams.id, $scope.data.params).then(function (payment) {

        // Make the payment available to the view.
        $scope.data.payment = payment;

        // Delete anything in the cache
        StorageService.remove("hpp_payment");

    }, function (error) {
        $scope.data.error = error;
    });

    // Get the payment options to see if you should offer the customer to create an account.
    PaymentService.getOptions().then(function (options) {

        $scope.options = options;

    }, function (error) {
        // Error getting the cart
        $scope.data.error = error;
    });

    // Watch for error to be populated, and if so, scroll to it.
    $scope.$watch("data.error", function (newVal, oldVal) {
        if ($scope.data.error) {
            $document.scrollTop(0, 500);
        }
    });

}]);