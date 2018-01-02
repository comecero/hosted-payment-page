app.controller("PayController", ['$scope', '$location', 'PaymentService', 'GeoService', 'CurrencyService', 'SettingsService', 'HelperService', 'StorageService', '$document', function ($scope, $location, PaymentService, GeoService, CurrencyService, SettingsService, HelperService, StorageService, $document) {

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
    $scope.data.referenceEditable = false;
    $scope.data.descriptionEditable = false;

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

    // Fix if the user has applied conflicting settings
    if ($scope.settings.app.reference_required && !$scope.settings.app.show_reference) {
        $scope.settings.app.reference_required = false;
    }

    // Get the payment options
    PaymentService.getOptions().then(function (options) {

        $scope.data.options = options;

        // In the event that page parameters are not present, we'll look in the payment cache to help survive page reloads.
        var paymentCache = $scope.data.payment; // Default if not provided
        if (StorageService.get("hpp_payment")) {
            paymentCache = JSON.parse(StorageService.get("hpp_payment"));
        }

        // Create a list of countries from the customer allowed country codes for the country drop down.
        $scope.data.countries = [];
        _.each(options.allowed_customer_countries, function (country) {
            var find = _.findWhere($scope.geoService.getData().countries, { code: country });
            if (find) {
                $scope.data.countries.push(find);
            }
        });

        // Sort by country name
        $scope.data.countries = _.sortBy($scope.data.countries, "name");

        // Set the default country
        $scope.data.payment.customer.billing_address.country = options.customer_default_country;

        // If the reference and description are not provided in the payment cache, the user can edit them.
        if (!paymentCache.reference) {
            $scope.data.referenceEditable = true;
        }

        if (!paymentCache.description) {
            $scope.data.descriptionEditable = true;
        }

        // Set the payment data
        $scope.data.payment = paymentCache;

        // Set the default currency, if not supplied.
        $scope.data.payment.currency = $scope.data.payment.currency || options.customer_default_currency;
        CurrencyService.setCurrency($scope.data.payment.currency);

        // Format the total since it will be provided in a user-editable input and will not be subject to display filters
        if ($scope.data.payment.total) {
            $scope.data.payment.total = utils.cleanPrice($scope.data.payment.total);
        }

    }, function (error) {
        // Error getting the cart
        $scope.data.error = error;
    });

    $scope.calculateTotal = function (payment) {

        var subtotal = payment.subtotal || 0;
        var shipping = payment.shipping || 0;
        var tax = payment.tax || 0;

        // If subtotal + shipping + tax is zero, return the supplied total instead.
        return Number(subtotal) + Number(shipping) + Number(tax) || payment.total;

    }

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

    $scope.resetPaymentMethod = function (id) {
        // Remove the payment method data such as card number, expiration date, etc. This is used to flush the data when an existing payment method is selected from a logged-in customer.
        $scope.data.card = { payment_method_id: id };
    }

    // If the user logs out
    $scope.onSignOut = function () {
        if ($scope.data.card) {
            $scope.data.card.payment_method_id = null;
            $scope.data.card.type = "credit_card";
        }
    }

    // Watch for error to be populated, and if so, scroll to it.
    $scope.$watch("data.error", function (newVal, oldVal) {
        if ($scope.data.error) {
            $document.scrollTop(0, 500);
        }
    });

}]);