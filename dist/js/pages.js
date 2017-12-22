/*
Comecero Hosted Payment Page version: ﻿1.0.0
https://comecero.com
https://github.com/comecero/cart
Copyright Comecero and other contributors. Released under MIT license. See LICENSE for details.
*/

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
app.controller("MainController", ['$scope', 'SettingsService', 'CurrencyService', function ($scope, SettingsService, CurrencyService) {
 
        $scope.settings = SettingsService.get();
        $scope.currency = CurrencyService.getCurrencyName();

    }]);
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

    // Watch for error to be populated, and if so, scroll to it.
    $scope.$watch("data.error", function (newVal, oldVal) {
        if ($scope.data.error) {
            $document.scrollTop(0, 500);
        }
    });

}]);
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
app.controller("PaymentController", ['$scope', '$location', '$routeParams', 'CartService', 'PaymentService', 'SettingsService', 'HelperService', 'GeoService', '$document', function ($scope, $location, $routeParams, CartService, PaymentService, SettingsService, HelperService, GeoService, $document) {

    // Define a place to hold your data
    $scope.data = {};
    $scope.options = {};

    // Parse the query parameters
    var query = $location.search();

    // Define the payment_id
    $scope.data.payment_id = $routeParams.id;

    // If no payment_id is supplied, redirect back to the cart.
    if (!$scope.data.payment_id) {
        // Redirect back to the cart
        $location.path("/cart");
    }

    // Load in some helpers
    $scope.settings = SettingsService.get();
    $scope.helpers = HelperService;
    $scope.geoService = GeoService;

    // Set the cart parameters
    $scope.data.params = {};

    // The payment will have a cart or an invoice, we don't know which. Expand both and we'll use whatever one comes back as not null.
    $scope.data.params.expand = "payment_method,payment_method.data,customer";

    PaymentService.get($scope.data.payment_id, $scope.data.params).then(function (payment) {

        $scope.data.payment = payment;
        $scope.data.paymentOrig = angular.copy(payment);

        if (payment.status == "completed") {
            // The payment was previously completed, redirect to receipt.
            $location.path("/receipt/" + payment.payment_id);
        }

        // Get the payment options
        PaymentService.getOptions().then(function (options) {

            // Set flags to indicate if we need to request the company name and phone number fields, which happens when they're required and not already populated.
            if (HelperService.isRequiredCustomerField('company_name', options) && $scope.data.sale.customer.company_name == null) {
                $scope.options.showCompanyName = true;
            }

            if (HelperService.isRequiredCustomerField('phone', options) && $scope.data.sale.customer.phone == null) {
                $scope.options.showPhone = true;
            }

        }, function (error) {
            // Error getting the cart
            $scope.data.error = error;
        });

    }, function (error) {
        $scope.data.error = error;
    });

    // Handle a successful payment
    $scope.onPaymentSuccess = function (payment) {

        var redirect = function (payment) {

            // If the payment comes back as initiated, it means significant changes have been done that has changed the payment amount significantly enough that the buyer must re-approve the total through PayPal. Redirect.
            if (payment.status == "initiated") {

                // Redirect to the supplied redirect URL.
                window.location.replace(payment.response_data.redirect_url);

            } else {

                // The payment is completed. Redirect to the receipt.
                $location.path("/receipt/" + payment.payment_id);

            }
        };

        // Update the meta, reference and description with whatever the user has supplied.
        PaymentService.update($scope.data.payment).then(function (payment) {
            redirect(payment);
        }, function (error) {
            // Failed to update. Just carry on.
            redirect(payment);
        });

    };

    // Watch for error to be populated, and if so, scroll to it.
    $scope.$watch("data.error", function (newVal, oldVal) {
        if ($scope.data.error) {
            $document.scrollTop(0, 500);
        }
    });

}]);

//# sourceMappingURL=pages.js.map
