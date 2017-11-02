app.controller("PayController", ['$scope', '$location', 'PaymentService', 'GeoService', 'CurrencyService', 'SettingsService', 'HelperService', '$document', function ($scope, $location, PaymentService, GeoService, CurrencyService, SettingsService, HelperService, $document) {

    // Define a place to hold your data
    $scope.data = {};

    // Load in some helpers
    $scope.geoService = GeoService;
    $scope.settings = SettingsService.get();
    $scope.helpers = HelperService;

    // Set default values.
    $scope.data.payment = { customer: { billing_address: { country: null } }, payment_method: {} };
    $scope.data.shipping_is_billing = true; // User can toggle.
    $scope.data.payment_method = {}; // Will be populated from the user's input into the form.

    // Build your payment method models
    $scope.data.card = { "type": "credit_card" };
    $scope.data.paypal = {
        "type": "paypal",
        data: {
            // The following tokens are allowed in the URL: {{payment_id}}, {{order_id}}, {{customer_id}}, {{invoice_id}}. The tokens will be replaced with the actual values upon redirect.
            "success_url": window.location.href.substring(0, window.location.href.indexOf("#")) + "#/review/{{payment_id}}",
            "cancel_url": window.location.href.substring(0, window.location.href.indexOf("#")) + "#/pay"
        }
    }

    // Get the payment options
    PaymentService.getOptions().then(function (options) {

        $scope.data.options = options;

        // Create a list of countries from the customer allowed country codes for the country drop down.
        $scope.data.countries = [];
        _.each(options.allowed_customer_countries, function (country) {
            $scope.data.countries.push(_.findWhere($scope.geoService.getData().countries, { code: country }));
        });

        // Set the default payment currency
        CurrencyService.setCurrency(options.customer_default_currency);
        $scope.data.payment.currency = options.customer_default_currency;

        // Build up the payment from the query string, if provided. This loads in totals, currency and other data (such as customer name, email address) that may have been supplied through the query string. If nothing is provided in the query string, then no values are supplied to the payment.
        $scope.data.payment = PaymentService.fromParams($scope.data.payment, $location);

    }, function (error) {
        // Error getting the cart
        $scope.data.error = error;
    });

    // Handle a successful payment
    $scope.onPaymentSuccess = function (payment) {

        // Handle the payment response, depending on the type.
        switch (payment.payment_method.type) {

            case "paypal":
                // Redirect to PayPal to make the payment.
                window.location = payment.response_data.redirect_url;
                break;

            default:
                // Redirect to the receipt.
                $location.path("/receipt/" + payment.payment_id);
        }

    }

    // Watch for error to be populated, and if so, scroll to it.
    $scope.$watch("data.error", function (newVal, oldVal) {
        if ($scope.data.error) {
            $document.scrollTop(0, 500);
        }
    });

}]);