app.controller("LinkController", ['$scope', '$location', 'PaymentService', 'StorageService', function ($scope, $location, PaymentService, StorageService) {

    // Build up the payment from the query string, if provided. This loads in totals, currency and other data (such as customer name, email address) that may have been supplied through the query string. If nothing is provided in the query string, then no values are supplied to the payment.
    var payment = PaymentService.fromParams({}, $location);

    // Save in storage for the payment page to reference. Store for 6 hours.
    StorageService.set("hpp_payment", JSON.stringify(payment), 21600);

    // Redirect to the payment page.
    $location.search({});
    $location.path("/pay");
    $location.replace();

}]);