/*
Comecero Cart version: ﻿1.0.0
https://comecero.com
https://github.com/comecero/cart
Copyright Comecero and other contributors. Released under MIT license. See LICENSE for details.
*/

app.controller("MainController", ['$scope', 'SettingsService', 'CurrencyService', function ($scope, SettingsService, CurrencyService) {
 
        $scope.settings = SettingsService.get();
        $scope.currency = CurrencyService.getCurrencyName();

    }]);
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
app.controller("ReceiptController", ['$scope', '$routeParams', 'PaymentService', 'OrderService', 'SettingsService', 'HelperService', '$document', function ($scope, $routeParams, PaymentService, OrderService, SettingsService, HelperService, $document) {

    // Define a place to hold your data
    $scope.data = {};

    // Load in some helpers
    $scope.helpers = HelperService;

    $scope.data.params = {};
    $scope.data.params.expand = "payment_method,payment_method.data,customer";
    $scope.data.params.formatted = true;

    $scope.data.params.options = true;
    $scope.data.params.formatted = true;

    // A customer object if the user creates an account
    $scope.customer = {};

    // Get the payment, if any.
    PaymentService.get($routeParams.id, $scope.data.params).then(function (payment) {

        // Make the payment available to the view.
        $scope.data.payment = payment;

    }, function (error) {
        $scope.exception = error;
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
            
            // If the payment comes back as initiated, it means significant changes to the cart have been done that has changed the payment amount significantly enough that the buyer must re-approve the total through PayPal. Redirect.
            if (payment.status == "initiated") {
                
                // Redirect to the supplied redirect URL.
                window.location.replace(payment.response_data.redirect_url);

            } else {
                
                // The payment is completed. Redirect to the receipt.
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

//# sourceMappingURL=pages.js.map
